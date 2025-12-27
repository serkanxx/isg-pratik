"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
    Building2, ArrowLeft, MapPin, Phone, FileText, Edit2,
    Calendar, Shield, Users, Navigation, ExternalLink,
    BarChart3, TrendingUp, Clock, AlertTriangle, StickyNote,
    Plus, Check, Trash2, X, Info, UserPlus, GraduationCap, Upload, FileSpreadsheet, Loader2
} from 'lucide-react';
import { Company, DANGER_CLASS_LABELS, DangerClass } from '../../types';
import { useTheme } from '@/app/context/ThemeContext';
import * as XLSX from 'xlsx';

// Not tipi
interface Note {
    id: string;
    content: string;
    companyId: string | null;
    dueDate: string | null;
    isCompleted: boolean;
    createdAt: string;
}

// Çalışan tipi
interface Employee {
    id: string;
    companyId: string;
    userId: string;
    fullName: string;
    tcNo: string | null;
    position: string | null;
    trainingDate: string | null;
    trainingTopic: string | null;
    createdAt: string;
}

// Google Maps embed için koordinat tipini tanımla
interface Coordinates {
    lat: number;
    lng: number;
}

export default function FirmaDetayPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const params = useParams();
    const companyId = params?.id as string;

    const { isDark } = useTheme();
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState<any[]>([]);
    const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
    const [mapLoading, setMapLoading] = useState(false);

    // Notlar state
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');
    const [dueDateDay, setDueDateDay] = useState('');
    const [dueDateMonth, setDueDateMonth] = useState('');
    const [dueDateYear, setDueDateYear] = useState('');
    const [showNoteForm, setShowNoteForm] = useState(false);

    // Çalışanlar state
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [showEmployeeForm, setShowEmployeeForm] = useState(false);
    const [newEmployee, setNewEmployee] = useState({ fullName: '', tcNo: '', position: '' });
    const [employeeSaving, setEmployeeSaving] = useState(false);

    // Toplu yükleme state
    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
    const [bulkUploadData, setBulkUploadData] = useState<Array<{ fullName: string; tcNo: string; position: string; isValid: boolean; error?: string }>>([]);
    const [bulkUploading, setBulkUploading] = useState(false);
    const bulkFileInputRef = useRef<HTMLInputElement>(null);

    // Excel şablon indirme
    const downloadEmployeeTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            ['Ad Soyad', 'T.C. No', 'Görev Ünvanı'],
            ['ÖRNEK ÇALIŞAN 1', '12345678900', 'İşçi'],
            ['ÖRNEK ÇALIŞAN 2', '98765432100', 'Formen'],
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Çalışanlar');
        XLSX.writeFile(wb, 'Calisan_Sablonu.xlsx');
    };

    // Excel dosyası işleme
    const handleBulkExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

                const parsedEmployees: Array<{ fullName: string; tcNo: string; position: string; isValid: boolean; error?: string }> = [];

                jsonData.forEach((row: Record<string, unknown>) => {
                    // Esnek sütun isimleri
                    const fullName = (row['Ad Soyad'] || row['Adı Soyadı'] || row['İsim Soyisim'] || row['Ad Soyadı'] || row['İsim'])?.toString().trim() || '';
                    const tcNo = (row['T.C. No'] || row['TC No'] || row['TC'] || row['T.C.'] || row['TC Kimlik No'])?.toString().trim() || '';
                    const position = (row['Görev Ünvanı'] || row['Görev Ünvan'] || row['Görev'] || row['Ünvan'] || row['Pozisyon'])?.toString().trim() || '';

                    if (!fullName) return; // Boş satırları atla

                    // TC doğrulaması
                    let isValid = true;
                    let error: string | undefined;

                    if (tcNo && !validateTC(tcNo)) {
                        isValid = false;
                        error = 'Geçersiz TC No';
                    }

                    parsedEmployees.push({
                        fullName: toUpperCaseTurkish(fullName),
                        tcNo,
                        position,
                        isValid,
                        error
                    });
                });

                if (parsedEmployees.length === 0) {
                    showEmployeeNotification('Excel dosyasında geçerli veri bulunamadı!', 'error');
                    return;
                }

                setBulkUploadData(parsedEmployees);
                setShowBulkUploadModal(true);
            } catch (error) {
                console.error('Excel parse error:', error);
                showEmployeeNotification('Excel dosyası okunamadı!', 'error');
            }
        };
        reader.readAsArrayBuffer(file);

        // Input'u sıfırla
        if (bulkFileInputRef.current) {
            bulkFileInputRef.current.value = '';
        }
    };

    // Toplu çalışan ekleme
    const handleBulkEmployeeUpload = async () => {
        const validEmployees = bulkUploadData.filter(e => e.isValid);
        if (validEmployees.length === 0) {
            showEmployeeNotification('Geçerli çalışan bulunamadı!', 'error');
            return;
        }

        setBulkUploading(true);
        let addedCount = 0;
        let duplicateCount = 0;

        // Mevcut çalışanların TC numaralarını al
        const existingTcNumbers = employees.map(e => e.tcNo).filter(Boolean);

        try {
            for (const emp of validEmployees) {
                // Aynı TC numarası varsa atla
                if (emp.tcNo && existingTcNumbers.includes(emp.tcNo)) {
                    duplicateCount++;
                    continue;
                }

                const res = await fetch('/api/employees', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        companyId,
                        fullName: emp.fullName,
                        tcNo: emp.tcNo || null,
                        position: emp.position || null
                    })
                });
                if (res.ok) {
                    const addedEmployee = await res.json();
                    setEmployees(prev => [addedEmployee, ...prev]);
                    // Yeni eklenen çalışanın TC'sini listeye ekle (sonraki döngülerde tekrar eklenmemesi için)
                    if (addedEmployee.tcNo) {
                        existingTcNumbers.push(addedEmployee.tcNo);
                    }
                    addedCount++;
                }
            }

            // Bildirim mesajı oluştur
            let message = `${addedCount} çalışan başarıyla eklendi!`;
            if (duplicateCount > 0) {
                message += ` (${duplicateCount} aynı TC No kullanan çalışan eklenmedi)`;
            }
            showEmployeeNotification(message, addedCount > 0 ? 'success' : 'error');

            setShowBulkUploadModal(false);
            setBulkUploadData([]);
        } catch (error) {
            console.error('Toplu yükleme hatası:', error);
            showEmployeeNotification('Toplu yükleme sırasında hata oluştu!', 'error');
        } finally {
            setBulkUploading(false);
        }
    };

    // Dropdown değerleri
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = [
        { value: '01', label: 'Ocak' }, { value: '02', label: 'Şubat' },
        { value: '03', label: 'Mart' }, { value: '04', label: 'Nisan' },
        { value: '05', label: 'Mayıs' }, { value: '06', label: 'Haziran' },
        { value: '07', label: 'Temmuz' }, { value: '08', label: 'Ağustos' },
        { value: '09', label: 'Eylül' }, { value: '10', label: 'Ekim' },
        { value: '11', label: 'Kasım' }, { value: '12', label: 'Aralık' }
    ];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

    useEffect(() => {
        if (companyId) {
            fetchCompany();
            fetchReports();
            fetchNotes();
            fetchEmployees();
        }
    }, [companyId]);

    // Çalışanları getir
    const fetchEmployees = async () => {
        try {
            const res = await fetch(`/api/employees?company_id=${companyId}`);
            if (res.ok) {
                const data = await res.json();
                setEmployees(data);
            }
        } catch (error) {
            console.error('Çalışanlar alınamadı:', error);
        }
    };

    // Türkçe karakterleri büyük harfe çeviren fonksiyon
    const toUpperCaseTurkish = (str: string) => {
        return str
            .replace(/i/g, 'İ')
            .replace(/ı/g, 'I')
            .replace(/ğ/g, 'Ğ')
            .replace(/ü/g, 'Ü')
            .replace(/ş/g, 'Ş')
            .replace(/ö/g, 'Ö')
            .replace(/ç/g, 'Ç')
            .toUpperCase();
    };

    // TC No doğrulama fonksiyonu
    const validateTC = (tc: string): boolean => {
        const tcRegex = /^[0-9]{11}$/;
        if (!tcRegex.test(tc)) return false;
        const lastDigit = parseInt(tc[10]);
        return lastDigit % 2 === 0;
    };

    // Çalışan bildirim state
    const [employeeNotification, setEmployeeNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

    const showEmployeeNotification = (message: string, type: 'success' | 'error') => {
        setEmployeeNotification({ show: true, message, type });
        setTimeout(() => setEmployeeNotification({ show: false, message: '', type: 'success' }), 5000);
    };

    // Çalışan ekle
    const handleAddEmployee = async () => {
        if (!newEmployee.fullName.trim()) {
            showEmployeeNotification('Lütfen ad soyad girin!', 'error');
            return;
        }

        // TC No validasyonu (eğer girilmişse)
        if (newEmployee.tcNo && !validateTC(newEmployee.tcNo)) {
            showEmployeeNotification('Geçersiz TC No! (11 haneli ve son hane çift olmalı)', 'error');
            return;
        }

        // Aynı TC numarası kontrolü
        if (newEmployee.tcNo && employees.some(e => e.tcNo === newEmployee.tcNo)) {
            showEmployeeNotification('Bu TC No ile kayıtlı çalışan zaten mevcut!', 'error');
            return;
        }

        setEmployeeSaving(true);
        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyId,
                    fullName: toUpperCaseTurkish(newEmployee.fullName.trim()),
                    tcNo: newEmployee.tcNo || null,
                    position: newEmployee.position || null
                })
            });
            if (res.ok) {
                const addedEmployee = await res.json();
                // Optimistic UI: Yeni çalışanı hemen state'e ekle
                setEmployees(prev => [addedEmployee, ...prev]);
                setNewEmployee({ fullName: '', tcNo: '', position: '' });
                setShowEmployeeForm(false);
                showEmployeeNotification('Çalışan eklendi!', 'success');
            }
        } catch (error) {
            console.error('Çalışan eklenemedi:', error);
            showEmployeeNotification('Çalışan eklenirken hata oluştu!', 'error');
        } finally {
            setEmployeeSaving(false);
        }
    };

    // Çalışan sil (Optimistic UI)
    const handleDeleteEmployee = async (id: string) => {
        if (!confirm('Bu çalışanı silmek istediğinize emin misiniz?')) return;

        // Optimistic UI: Hemen listeden kaldır
        setEmployees(prev => prev.filter(e => e.id !== id));

        try {
            const res = await fetch(`/api/employees?id=${id}`, { method: 'DELETE' });
            if (!res.ok) {
                // Başarısızsa geri yükle
                fetchEmployees();
                showEmployeeNotification('Çalışan silinemedi!', 'error');
            }
        } catch (error) {
            console.error('Çalışan silinemedi:', error);
            fetchEmployees();
            showEmployeeNotification('Çalışan silinemedi!', 'error');
        }
    };

    // Tümünü sil modal state
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [deletingAll, setDeletingAll] = useState(false);

    // Tüm çalışanları sil
    const handleDeleteAllEmployees = async () => {
        setDeletingAll(true);
        try {
            for (const emp of employees) {
                await fetch(`/api/employees?id=${emp.id}`, { method: 'DELETE' });
            }
            setEmployees([]);
            setShowDeleteAllModal(false);
            showEmployeeNotification('Tüm çalışanlar silindi!', 'success');
        } catch (error) {
            console.error('Çalışanlar silinemedi:', error);
            showEmployeeNotification('Silme sırasında hata oluştu!', 'error');
            fetchEmployees();
        } finally {
            setDeletingAll(false);
        }
    };

    const fetchCompany = async () => {
        try {
            const res = await fetch(`/api/companies/${companyId}`);
            if (res.ok) {
                const data = await res.json();
                setCompany(data);
                // Adres varsa geocoding yap
                if (data.address) {
                    geocodeAddress(data.address);
                }
            } else {
                router.push('/firmalar');
            }
        } catch (error) {
            console.error('Firma bilgisi alınamadı:', error);
            router.push('/firmalar');
        } finally {
            setLoading(false);
        }
    };

    const fetchReports = async () => {
        try {
            const res = await fetch(`/api/reports?company_id=${companyId}`);
            if (res.ok) {
                const data = await res.json();
                setReports(data);
            }
        } catch (error) {
            console.error('Raporlar alınamadı:', error);
        }
    };

    // Notları getir
    const fetchNotes = async () => {
        try {
            const res = await fetch(`/api/notes?company_id=${companyId}`);
            if (res.ok) {
                const data = await res.json();
                setNotes(data);
            }
        } catch (error) {
            console.error('Notlar alınamadı:', error);
        }
    };

    // Not ekle
    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        // Tarih oluştur
        let dueDate = null;
        if (dueDateDay && dueDateMonth && dueDateYear) {
            dueDate = `${dueDateYear}-${dueDateMonth.padStart(2, '0')}-${dueDateDay.padStart(2, '0')}`;
        }

        try {
            const res = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newNote,
                    companyId: companyId,
                    dueDate
                })
            });
            if (res.ok) {
                setNewNote('');
                setDueDateDay('');
                setDueDateMonth('');
                setDueDateYear('');
                setShowNoteForm(false);
                fetchNotes();
            }
        } catch (error) {
            console.error('Not eklenemedi:', error);
        }
    };

    // Not tamamla/geri al
    const toggleNoteComplete = async (id: string, currentStatus: boolean) => {
        try {
            await fetch('/api/notes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isCompleted: !currentStatus })
            });
            fetchNotes();
        } catch (error) {
            console.error('Not güncellenemedi:', error);
        }
    };

    // Not sil
    const handleDeleteNote = async (id: string) => {
        if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;
        try {
            await fetch(`/api/notes?id=${id}`, { method: 'DELETE' });
            fetchNotes();
        } catch (error) {
            console.error('Not silinemedi:', error);
        }
    };

    // Tarih yardımcı fonksiyonları
    const isOverdue = (dueDate: string | null) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    // Adres → Koordinat dönüşümü (Nominatim - ücretsiz)
    const geocodeAddress = async (address: string) => {
        setMapLoading(true);
        try {
            const encodedAddress = encodeURIComponent(address + ', Turkey');
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) {
                setCoordinates({
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                });
            }
        } catch (error) {
            console.error('Geocoding hatası:', error);
        } finally {
            setMapLoading(false);
        }
    };

    // Google Maps yol tarifi linki
    const getDirectionsUrl = () => {
        if (coordinates) {
            return `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
        }
        if (company?.address) {
            return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(company.address)}`;
        }
        return '#';
    };

    // Tarih formatlama
    const formatDate = (dateString: string | Date | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="p-8 text-center">
                <p className="text-slate-500">Firma bulunamadı</p>
                <Link href="/firmalar" className="text-indigo-600 hover:underline mt-2 inline-block">
                    Firmalara Dön
                </Link>
            </div>
        );
    }

    const dangerClassColor = company.danger_class === 'az_tehlikeli'
        ? 'from-emerald-500 to-teal-600'
        : company.danger_class === 'tehlikeli'
            ? 'from-amber-500 to-orange-600'
            : 'from-red-500 to-rose-600';

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Geri Butonu */}
            <div className="mb-6">
                <button
                    onClick={() => router.push('/firmalar')}
                    className={`flex items-center gap-2 transition-colors ${isDark ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-600 hover:text-indigo-600'}`}
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Firmalara Dön</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sol Kolon - Firma Bilgileri */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Ana Bilgi Kartı */}
                    <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl border overflow-hidden shadow-sm`}>
                        {/* Header Gradient */}
                        <div className={`h-32 bg-gradient-to-br ${dangerClassColor} relative`}>
                            <div className="absolute -bottom-10 left-6">
                                {company.logo ? (
                                    <img
                                        src={company.logo}
                                        alt={company.title}
                                        className={`w-20 h-20 rounded-2xl object-contain bg-white border-4 ${isDark ? 'border-slate-900' : 'border-white'} shadow-xl`}
                                    />
                                ) : (
                                    <div className={`w-20 h-20 rounded-2xl bg-white border-4 ${isDark ? 'border-slate-900' : 'border-white'} shadow-xl flex items-center justify-center`}>
                                        <Building2 className="w-8 h-8 text-slate-400" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute top-4 right-4">
                                <span className={`${isDark ? 'bg-slate-900/90 text-white' : 'bg-white/90 text-slate-800'} backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold shadow-md`}>
                                    {DANGER_CLASS_LABELS[company.danger_class]}
                                </span>
                            </div>
                        </div>

                        {/* Firma Detayları */}
                        <div className="pt-14 pb-6 px-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>{company.title}</h1>
                                    <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm">{company.address || 'Adres bilgisi yok'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push(`/firmalar?edit=${company.id}`)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                                >
                                    <Edit2 className="w-4 h-4" />
                                    <span className="font-medium">Düzenle</span>
                                </button>
                            </div>

                            {/* Bilgi Grid - SGK Sicil No geniş, Rapor Sayısı küçük */}
                            <div className={`grid grid-cols-12 gap-3 mt-6 pt-6 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} col-span-5 rounded-xl p-4`}>
                                    <p className={`text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>SGK Sicil No</p>
                                    <p className={`font-bold text-sm break-all ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{company.registration_number || '-'}</p>
                                </div>
                                <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} col-span-3 rounded-xl p-4`}>
                                    <p className={`text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Tehlike Sınıfı</p>
                                    <p className={`font-bold text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{DANGER_CLASS_LABELS[company.danger_class]}</p>
                                </div>
                                <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} col-span-1 rounded-xl p-3 flex flex-col items-center justify-center`}>
                                    <p className={`text-[10px] uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Rapor</p>
                                    <p className={`font-bold text-lg ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{reports.length}</p>
                                </div>
                                <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} col-span-3 rounded-xl p-4`}>
                                    <p className={`text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Kayıt Tarihi</p>
                                    <p className={`font-bold text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{formatDate(company.created_at)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Çalışanlar Kartı */}
                    <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl border p-6 shadow-sm`}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                <UserPlus className="w-5 h-5 text-emerald-600" />
                                Çalışanlar
                                <span className={`text-sm font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    ({employees.length})
                                </span>
                            </h2>
                            <div className="flex items-center gap-2">
                                {/* Tümünü Sil Butonu */}
                                {employees.length > 0 && (
                                    <button
                                        onClick={() => setShowDeleteAllModal(true)}
                                        className={`p-2 rounded-lg transition-colors ${isDark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:bg-red-50'}`}
                                        title="Tümünü Sil"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                                {/* Toplu Yükleme Butonu */}
                                <button
                                    onClick={() => setShowBulkUploadModal(true)}
                                    className={`p-2 rounded-lg transition-colors ${isDark ? 'text-blue-400 hover:bg-blue-900/30' : 'text-blue-600 hover:bg-blue-50'}`}
                                    title="Excel ile Toplu Yükle"
                                >
                                    <Upload className="w-5 h-5" />
                                </button>
                                {/* Tek Ekleme Butonu */}
                                <button
                                    onClick={() => setShowEmployeeForm(!showEmployeeForm)}
                                    className={`p-2 rounded-lg transition-colors ${isDark ? 'text-emerald-400 hover:bg-emerald-900/30' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                >
                                    {showEmployeeForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                </button>
                            </div>
                            {/* Hidden File Input */}
                            <input
                                type="file"
                                ref={bulkFileInputRef}
                                onChange={handleBulkExcelUpload}
                                accept=".xlsx,.xls"
                                className="hidden"
                            />
                        </div>

                        {/* Global Bildirim (Toplu yükleme için) */}
                        {employeeNotification.show && !showEmployeeForm && (
                            <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${employeeNotification.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                {employeeNotification.message}
                            </div>
                        )}

                        {/* Çalışan Ekleme Formu */}
                        {showEmployeeForm && (
                            <div className={`mb-4 p-4 rounded-xl ${isDark ? 'bg-emerald-900/20 border border-emerald-900/30' : 'bg-emerald-50 border border-emerald-200'}`}>
                                {/* Bildirim */}
                                {employeeNotification.show && (
                                    <div className={`mb-3 p-2 rounded-lg text-sm font-medium ${employeeNotification.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                        {employeeNotification.message}
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                    <input
                                        type="text"
                                        placeholder="Ad Soyad *"
                                        value={newEmployee.fullName}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, fullName: e.target.value })}
                                        className={`p-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                                    />
                                    <input
                                        type="text"
                                        placeholder="TC No (11 haneli)"
                                        maxLength={11}
                                        value={newEmployee.tcNo}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, tcNo: e.target.value.replace(/[^0-9]/g, '') })}
                                        className={`p-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Görev"
                                        value={newEmployee.position}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                                        className={`p-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                                    />
                                </div>
                                <button
                                    onClick={handleAddEmployee}
                                    disabled={employeeSaving || !newEmployee.fullName.trim()}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                >
                                    {employeeSaving ? 'Ekleniyor...' : 'Çalışan Ekle'}
                                </button>
                            </div>
                        )}

                        {/* Çalışan Listesi */}
                        {employees.length === 0 ? (
                            <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                <UserPlus className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>Henüz çalışan eklenmemiş</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                            <th className={`text-left py-2 px-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ad Soyad</th>
                                            <th className={`text-left py-2 px-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>TC No</th>
                                            <th className={`text-left py-2 px-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Görev</th>
                                            <th className={`text-center py-2 px-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Eğitim Durumu</th>
                                            <th className={`text-right py-2 px-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map((emp) => (
                                            <tr key={emp.id} className={`border-b ${isDark ? 'border-slate-800/50 hover:bg-slate-800/30' : 'border-slate-100 hover:bg-slate-50'}`}>
                                                <td className={`py-2 px-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{emp.fullName}</td>
                                                <td className={`py-2 px-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{emp.tcNo || '-'}</td>
                                                <td className={`py-2 px-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{emp.position || '-'}</td>
                                                <td className="py-2 px-2 text-center">
                                                    {emp.trainingDate ? (
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Check className="w-4 h-4 text-emerald-500" />
                                                            <div className="relative group">
                                                                <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                                                <div className={`absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-700 text-white'}`}>
                                                                    <div className="font-medium">{emp.trainingTopic || 'Eğitim'}</div>
                                                                    <div className="text-slate-300">{formatDate(emp.trainingDate)}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>-</span>
                                                    )}
                                                </td>
                                                <td className="py-2 px-2 text-right">
                                                    <button
                                                        onClick={() => handleDeleteEmployee(emp.id)}
                                                        className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:bg-red-50'}`}
                                                        title="Sil"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Eğitim/Sertifika Butonları */}
                        {employees.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <Link
                                    href={`/egitim-katilim?company=${companyId}`}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                >
                                    <GraduationCap className="w-4 h-4" />
                                    Eğitim Katılım Formu
                                </Link>
                                <Link
                                    href={`/sertifika?company=${companyId}`}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
                                >
                                    <FileText className="w-4 h-4" />
                                    Sertifika Oluştur
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Risk Değerlendirme Ekibi */}
                    <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl border p-6 shadow-sm`}>
                        <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            <Users className="w-5 h-5 text-indigo-600" />
                            Risk Değerlendirme Ekibi
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[
                                { label: 'İşveren / Vekili', value: company.employer },
                                { label: 'İş Güvenliği Uzmanı', value: company.igu },
                                { label: 'İşyeri Hekimi', value: company.doctor },
                                { label: 'Çalışan Temsilcisi', value: company.representative },
                                { label: 'Destek Elemanı', value: company.support }
                            ].map((item, idx) => (
                                <div key={idx} className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-xl p-4`}>
                                    <p className={`text-xs mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</p>
                                    <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.value || '-'}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Rapor İstatistikleri */}
                    <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl border p-6 shadow-sm`}>
                        <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                            Rapor Geçmişi
                        </h2>
                        {reports.length === 0 ? (
                            <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Henüz rapor oluşturulmamış</p>
                                <Link
                                    href={`/risk-degerlendirme?company=${companyId}`}
                                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                                >
                                    <Shield className="w-4 h-4" />
                                    İlk Raporu Oluştur
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {reports.slice(0, 5).map((report, idx) => {
                                    const reportData = report.data as any;
                                    const reportDate = reportData?.headerInfo?.date || report.createdAt;
                                    const riskCount = reportData?.risks?.length || 0;

                                    return (
                                        <Link
                                            key={report.id || idx}
                                            href={`/raporlarim?view=${report.id}`}
                                            className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group ${isDark
                                                ? 'bg-slate-800/50 border-transparent hover:bg-slate-800 hover:border-slate-700'
                                                : 'bg-slate-50 border-transparent hover:bg-indigo-50 hover:border-indigo-200'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-100'} group-hover:bg-indigo-500 group-hover:text-white`}>
                                                    <FileText className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'} group-hover:text-white`} />
                                                </div>
                                                <div>
                                                    <p className={`font-medium transition-colors ${isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-indigo-700'}`}>
                                                        {report.title || 'Risk Değerlendirme Raporu'}
                                                    </p>
                                                    <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                        <span>Rapor: {formatDate(reportDate)}</span>
                                                        <span>•</span>
                                                        <span>Kayıt: {formatDate(report.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className={`${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'} px-3 py-1 rounded-full font-medium`}>
                                                    {riskCount} Risk
                                                </span>
                                                <ExternalLink className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sağ Kolon - Harita ve Hızlı İşlemler */}
                <div className="space-y-6">
                    {/* Konum Haritası */}
                    <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl border overflow-hidden shadow-sm`}>
                        <div className={`p-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                            <h3 className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                <MapPin className="w-5 h-5 text-indigo-600" />
                                Konum
                            </h3>
                        </div>
                        <div className="aspect-square bg-slate-100 relative">
                            {mapLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
                                </div>
                            ) : coordinates ? (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    allowFullScreen
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${coordinates.lat},${coordinates.lng}&zoom=15`}
                                />
                            ) : company.address ? (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    allowFullScreen
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(company.address + ', Turkey')}&zoom=15`}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                    <div className="text-center">
                                        <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Adres bilgisi girilmemiş</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {company.address && (
                            <div className="p-4">
                                <a
                                    href={getDirectionsUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-600/25"
                                >
                                    <Navigation className="w-5 h-5" />
                                    Yol Tarifi Al
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Hızlı İşlemler */}
                    <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl border p-4 shadow-sm`}>
                        <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>Hızlı İşlemler</h3>
                        <div className="space-y-3">
                            <Link
                                href={`/risk-degerlendirme?company=${companyId}`}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${isDark ? 'bg-emerald-900/20 hover:bg-emerald-900/30' : 'bg-emerald-50 hover:bg-emerald-100'}`}
                            >
                                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className={`font-medium ${isDark ? 'text-emerald-400' : 'text-slate-700'}`}>Risk Değerlendirmesi</p>
                                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Yeni rapor oluştur</p>
                                </div>
                            </Link>
                            <Link
                                href={`/acil-durum?company=${companyId}`}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${isDark ? 'bg-orange-900/20 hover:bg-orange-900/30' : 'bg-orange-50 hover:bg-orange-100'}`}
                            >
                                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/20">
                                    <AlertTriangle className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className={`font-medium ${isDark ? 'text-orange-400' : 'text-slate-700'}`}>Acil Durum Planı</p>
                                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>ADEP oluştur</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Firma Notları */}
                    <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl border p-4 shadow-sm`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                <StickyNote className="w-5 h-5 text-amber-500" />
                                Notlar
                            </h3>
                            <button
                                onClick={() => setShowNoteForm(!showNoteForm)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                                {showNoteForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Not Ekleme Formu */}
                        {showNoteForm && (
                            <div className="mb-4 p-3 bg-amber-50 rounded-xl space-y-3">
                                <textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Notunuzu yazın..."
                                    className="w-full p-2 border border-amber-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    rows={2}
                                />
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 whitespace-nowrap">Hedef Tarih :</span>
                                    <select
                                        value={dueDateDay}
                                        onChange={(e) => setDueDateDay(e.target.value)}
                                        className="w-14 p-1.5 border border-amber-200 rounded-lg text-xs bg-white"
                                    >
                                        <option value="">Gün</option>
                                        {days.map(d => <option key={d} value={String(d)}>{d}</option>)}
                                    </select>
                                    <select
                                        value={dueDateMonth}
                                        onChange={(e) => setDueDateMonth(e.target.value)}
                                        className="w-20 p-1.5 border border-amber-200 rounded-lg text-xs bg-white"
                                    >
                                        <option value="">Ay</option>
                                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                    <select
                                        value={dueDateYear}
                                        onChange={(e) => setDueDateYear(e.target.value)}
                                        className="w-16 p-1.5 border border-amber-200 rounded-lg text-xs bg-white"
                                    >
                                        <option value="">Yıl</option>
                                        {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                                    </select>
                                    <button
                                        onClick={handleAddNote}
                                        className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors"
                                    >
                                        Ekle
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Not Listesi */}
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {notes.length === 0 ? (
                                <p className={`text-center text-sm py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Henüz not yok</p>
                            ) : (
                                notes.map((note) => (
                                    <div
                                        key={note.id}
                                        className={`p-3 rounded-lg border transition-all ${note.isCompleted
                                            ? (isDark ? 'bg-slate-800/30 border-slate-800 opacity-60' : 'bg-slate-50 border-slate-200 opacity-60')
                                            : isOverdue(note.dueDate)
                                                ? (isDark ? 'bg-red-900/20 border-red-900/30' : 'bg-red-50 border-red-200')
                                                : (isDark ? 'bg-amber-900/20 border-amber-900/30' : 'bg-amber-50 border-amber-200')
                                            }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <button
                                                onClick={() => toggleNoteComplete(note.id, note.isCompleted)}
                                                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${note.isCompleted
                                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                                    : (isDark ? 'border-slate-700 hover:border-emerald-500' : 'border-slate-300 hover:border-emerald-500')
                                                    }`}
                                            >
                                                {note.isCompleted && <Check className="w-3 h-3" />}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${note.isCompleted ? 'line-through text-slate-500' : (isDark ? 'text-slate-300' : 'text-slate-700')}`}>
                                                    {note.content}
                                                </p>
                                                {note.dueDate && (
                                                    <p className={`text-xs mt-1 ${isOverdue(note.dueDate) && !note.isCompleted
                                                        ? 'text-red-500 font-medium'
                                                        : (isDark ? 'text-slate-500' : 'text-slate-400')
                                                        }`}>
                                                        <Clock className="w-3 h-3 inline mr-1" />
                                                        {formatDate(note.dueDate)}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteNote(note.id)}
                                                className={`p-1 rounded transition-colors ${isDark ? 'text-slate-600 hover:text-red-400 hover:bg-red-900/30' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Toplu Yükleme Modal */}
            {showBulkUploadModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} rounded-2xl border shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden`}>
                        {/* Modal Header */}
                        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                Toplu Çalışan Yükleme
                            </h3>
                            <button
                                onClick={() => { setShowBulkUploadModal(false); setBulkUploadData([]); }}
                                className={`p-1 rounded-lg ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 overflow-y-auto max-h-[50vh]">
                            {/* Şablon ve Yükleme Butonları */}
                            <div className={`mb-4 p-4 rounded-xl ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                                <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Excel dosyası ile toplu çalışan ekleyebilirsiniz. Önce şablonu indirip doldurun, ardından yükleyin.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={downloadEmployeeTemplate}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isDark ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                                    >
                                        <FileSpreadsheet className="w-4 h-4" />
                                        Şablon İndir
                                    </button>
                                    <button
                                        onClick={() => bulkFileInputRef.current?.click()}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Excel Yükle
                                    </button>
                                </div>
                            </div>

                            {/* Önizleme Tablosu */}
                            {bulkUploadData.length > 0 && (
                                <div className="overflow-x-auto">
                                    <p className={`text-sm font-bold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                        {bulkUploadData.length} kişi bulundu ({bulkUploadData.filter(e => e.isValid).length} geçerli)
                                    </p>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                                <th className={`text-left py-2 px-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>#</th>
                                                <th className={`text-left py-2 px-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ad Soyad</th>
                                                <th className={`text-left py-2 px-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>TC No</th>
                                                <th className={`text-left py-2 px-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Görev</th>
                                                <th className={`text-center py-2 px-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Durum</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bulkUploadData.map((emp, idx) => (
                                                <tr key={idx} className={`border-b ${isDark ? 'border-slate-800/50' : 'border-slate-100'} ${!emp.isValid ? (isDark ? 'bg-red-900/10' : 'bg-red-50') : ''}`}>
                                                    <td className={`py-2 px-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{idx + 1}</td>
                                                    <td className={`py-2 px-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{emp.fullName}</td>
                                                    <td className={`py-2 px-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{emp.tcNo || '-'}</td>
                                                    <td className={`py-2 px-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{emp.position || '-'}</td>
                                                    <td className="py-2 px-2 text-center">
                                                        {emp.isValid ? (
                                                            <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                                                        ) : (
                                                            <span className="text-xs text-red-500 font-medium">{emp.error}</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className={`flex items-center justify-end gap-3 p-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                            <button
                                onClick={() => { setShowBulkUploadModal(false); setBulkUploadData([]); }}
                                className={`px-4 py-2 rounded-lg font-bold ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleBulkEmployeeUpload}
                                disabled={bulkUploading || bulkUploadData.filter(e => e.isValid).length === 0}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {bulkUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                {bulkUploading ? 'Yükleniyor...' : `${bulkUploadData.filter(e => e.isValid).length} Çalışan Ekle`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tümünü Sil Onay Modal */}
            {showDeleteAllModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} rounded-2xl border shadow-2xl max-w-md w-full`}>
                        <div className="p-6 text-center">
                            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-red-900/30' : 'bg-red-100'}`}>
                                <Trash2 className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                            </div>
                            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                Tüm Çalışanları Sil
                            </h3>
                            <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                <strong>{employees.length}</strong> çalışanı silmek istediğinize emin misiniz?
                                <br />Bu işlem geri alınamaz!
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowDeleteAllModal(false)}
                                    disabled={deletingAll}
                                    className={`px-4 py-2 rounded-lg font-bold ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleDeleteAllEmployees}
                                    disabled={deletingAll}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {deletingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    {deletingAll ? 'Siliniyor...' : 'Evet, Tümünü Sil'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
