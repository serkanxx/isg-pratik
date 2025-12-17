"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, apiFetchers } from '@/lib/queries';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Building2, Plus, Search, Edit2, Trash2, X, Upload,
    ChevronRight, AlertCircle, CheckCircle, FileSpreadsheet, Download, Loader2,
    LayoutGrid, List, ArrowUpDown, SortAsc
} from 'lucide-react';
import { Company, DangerClass, DANGER_CLASS_LABELS } from '../../types';
import * as XLSX from 'xlsx';

export default function FirmalarPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const showNewForm = searchParams.get('new') === 'true';
    const editId = searchParams.get('edit');

    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(showNewForm);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

    // Toplu yükleme state'leri
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkData, setBulkData] = useState<{ title: string; address: string; registration_number: string; danger_class: string }[]>([]);
    const [bulkUploading, setBulkUploading] = useState(false);
    const [bulkResult, setBulkResult] = useState<{ success: boolean; successCount: number; errorCount: number; errors: { row: number; message: string }[] } | null>(null);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const csvInputRef = useRef<HTMLInputElement>(null);

    // Görünüm ve sıralama state'leri
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'default' | 'name' | 'danger'>('default');

    const [form, setForm] = useState({
        title: '',
        address: '',
        registration_number: '',
        danger_class: 'tehlikeli' as DangerClass,
        logo: null as string | null,
        employer: '',
        igu: '',
        doctor: '',
        representative: '',
        support: ''
    });

    const queryClient = useQueryClient();
    
    const { data: companiesData, isLoading: companiesLoading, refetch } = useQuery({
        queryKey: queryKeys.companies,
        queryFn: apiFetchers.companies,
    });

    useEffect(() => {
        if (companiesData) {
            setCompanies(companiesData);

            // Edit parametresi varsa firmayı düzenleme modunda aç
            if (editId && companiesData.length > 0) {
                const companyToEdit = companiesData.find((c: Company) => c.id === editId);
                if (companyToEdit) {
                    setForm({
                        title: companyToEdit.title,
                        address: companyToEdit.address,
                        registration_number: companyToEdit.registration_number,
                        danger_class: companyToEdit.danger_class,
                        logo: companyToEdit.logo,
                        employer: companyToEdit.employer,
                        igu: companyToEdit.igu,
                        doctor: companyToEdit.doctor,
                        representative: companyToEdit.representative,
                        support: companyToEdit.support
                    });
                    setEditingId(companyToEdit.id);
                    setShowForm(true);
                }
            }
        }
    }, [companiesData, editId]);

    useEffect(() => {
        if (!companiesLoading) {
            setLoading(false);
        }
    }, [companiesLoading]);

    const showNotif = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
    };

    const resetForm = () => {
        setForm({
            title: '',
            address: '',
            registration_number: '',
            danger_class: 'tehlikeli',
            logo: null,
            employer: '',
            igu: '',
            doctor: '',
            representative: '',
            support: ''
        });
        setEditingId(null);
    };

    // Excel şablonu indirme
    const downloadTemplate = () => {
        // Şablon verileri
        const templateData = [
            { 'FİRMA': 'ABC Sanayi Ltd. Şti.', 'ADRES': 'İstanbul Organize Sanayi Bölgesi No:15', 'SİCİL NO': '1234567890', 'TEHLİKE SINIFI': 'Tehlikeli' },
            { 'FİRMA': 'XYZ Ticaret A.Ş.', 'ADRES': 'Ankara Sincan OSB 2. Cadde No:42', 'SİCİL NO': '9876543210', 'TEHLİKE SINIFI': 'Az Tehlikeli' },
            { 'FİRMA': 'Örnek Metal İmalat', 'ADRES': 'İzmir Atatürk OSB 3. Sokak No:8', 'SİCİL NO': '5555555555', 'TEHLİKE SINIFI': 'Çok Tehlikeli' },
        ];

        // Worksheet oluştur
        const ws = XLSX.utils.json_to_sheet(templateData);

        // Sütun genişlikleri ayarla
        ws['!cols'] = [
            { wch: 35 }, // FİRMA
            { wch: 45 }, // ADRES
            { wch: 15 }, // SİCİL NO
            { wch: 18 }, // TEHLİKE SINIFI
        ];

        // Workbook oluştur
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Firmalar');

        // İndir
        XLSX.writeFile(wb, 'firma_sablonu.xlsx');
    };

    // Tehlike sınıfını belirle
    const detectDangerClass = (value: string): string => {
        const lower = (value || '').toLowerCase().trim();
        if (lower.includes('çok') || lower.includes('cok')) {
            return 'Çok Tehlikeli';
        } else if (lower.includes('az')) {
            return 'Az Tehlikeli';
        } else {
            return 'Tehlikeli';
        }
    };

    // Excel dosyası okuma
    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                // İlk sayfayı al
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // JSON'a çevir
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                if (jsonData.length < 2) {
                    showNotif('Dosyada veri bulunamadı!', 'error');
                    return;
                }

                // Başlık satırını atla
                const dataRows = jsonData.slice(1);
                const parsedData: { title: string; address: string; registration_number: string; danger_class: string }[] = [];

                dataRows.forEach(row => {
                    if (row && row[0]) { // En az firma adı olmalı (A sütunu)
                        const dangerClassValue = (row[3] || '').toString();
                        parsedData.push({
                            title: (row[0] || '').toString().trim(),
                            address: (row[1] || '').toString().trim(),
                            registration_number: (row[2] || '').toString().trim(),
                            danger_class: detectDangerClass(dangerClassValue)
                        });
                    }
                });

                if (parsedData.length === 0) {
                    showNotif('Geçerli firma verisi bulunamadı!', 'error');
                    return;
                }

                setBulkData(parsedData);
                setBulkResult(null);
            } catch (error) {
                showNotif('Dosya okunamadı!', 'error');
                console.error('Excel parse error:', error);
            }
        };
        reader.readAsArrayBuffer(file);

        // Input'u sıfırla (aynı dosya tekrar seçilebilsin)
        if (csvInputRef.current) {
            csvInputRef.current.value = '';
        }
    };

    // Toplu yükleme işlemi
    const handleBulkUpload = async () => {
        if (bulkData.length === 0) {
            showNotif('Yüklenecek firma verisi yok!', 'error');
            return;
        }

        setBulkUploading(true);
        setBulkResult(null);

        try {
            const res = await fetch('/api/companies/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companies: bulkData })
            });

            const result = await res.json();

            if (res.ok) {
                setBulkResult(result);
                if (result.successCount > 0) {
                    queryClient.invalidateQueries({ queryKey: queryKeys.companies });
                    // Başarılı yüklemeden sonra modal'ı kapat
                    if (result.success) {
                        showNotif(`${result.successCount} firma başarıyla eklendi!`, 'success');
                        setTimeout(() => {
                            setShowBulkModal(false);
                            setBulkData([]);
                            setBulkResult(null);
                        }, 1000);
                    }
                }
            } else {
                showNotif(result.error || 'Yükleme hatası', 'error');
            }
        } catch (error) {
            showNotif('Sunucu hatası', 'error');
        } finally {
            setBulkUploading(false);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                showNotif("Logo 1MB'dan büyük olamaz!", "error");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm({ ...form, logo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.title.trim()) {
            showNotif('Firma unvanı zorunludur!', 'error');
            return;
        }

        setSaving(true);

        try {
            const url = editingId ? `/api/companies/${editingId}` : '/api/companies';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                showNotif(editingId ? 'Firma güncellendi!' : 'Firma eklendi!');
                resetForm();
                setShowForm(false);
                fetchCompanies();
                router.replace('/panel/firmalar');
            } else {
                const error = await res.json();
                showNotif(error.error || 'Bir hata oluştu', 'error');
            }
        } catch (error) {
            showNotif('Sunucu hatası', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (company: Company) => {
        setForm({
            title: company.title,
            address: company.address,
            registration_number: company.registration_number,
            danger_class: company.danger_class,
            logo: company.logo,
            employer: company.employer,
            igu: company.igu,
            doctor: company.doctor,
            representative: company.representative,
            support: company.support
        });
        setEditingId(company.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu firmayı silmek istediğinize emin misiniz?')) return;

        try {
            const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showNotif('Firma silindi!');
                queryClient.invalidateQueries({ queryKey: queryKeys.companies });
            } else {
                showNotif('Firma silinemedi', 'error');
            }
        } catch (error) {
            showNotif('Sunucu hatası', 'error');
        }
    };

    // Tehlike sınıfı öncelik sıralaması
    const dangerPriority: Record<string, number> = {
        'cok_tehlikeli': 1,
        'tehlikeli': 2,
        'az_tehlikeli': 3
    };

    const filteredCompanies = companies
        .filter(c =>
            c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.address.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'name') {
                return a.title.localeCompare(b.title, 'tr');
            } else if (sortBy === 'danger') {
                return dangerPriority[a.danger_class] - dangerPriority[b.danger_class];
            }
            return 0; // default - ekleme sırasına göre
        });

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Notification */}
            {notification.show && (
                <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-2xl z-50 flex items-center ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                    {notification.type === 'error' ? <AlertCircle className="w-5 h-5 mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                    <span className="font-bold text-sm">{notification.message}</span>
                </div>
            )}

            {/* Gizli Logo Input */}
            <input type="file" accept="image/*" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" />

            {/* Gizli Excel Input */}
            <input type="file" accept=".xlsx,.xls" ref={csvInputRef} onChange={handleExcelUpload} className="hidden" />

            {/* Toplu Yükleme Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                                    Toplu Firma Yükle
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">Excel dosyasından birden fazla firma ekleyin</p>
                            </div>
                            <button
                                onClick={() => setShowBulkModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Şablon İndirme ve Dosya Yükleme */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                <button
                                    onClick={downloadTemplate}
                                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all"
                                >
                                    <Download className="w-5 h-5" />
                                    Şablon Excel İndir
                                </button>
                                <button
                                    onClick={() => csvInputRef.current?.click()}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-700 hover:bg-emerald-100 hover:border-emerald-500 transition-all"
                                >
                                    <Upload className="w-5 h-5" />
                                    Excel Dosyası Seç
                                </button>
                            </div>

                            {/* Önizleme Tablosu */}
                            {bulkData.length > 0 && (
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                                        <span className="font-bold text-slate-700">
                                            {bulkData.length} firma yüklenmeye hazır
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto max-h-64">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-100 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2 text-left font-bold text-slate-600">#</th>
                                                    <th className="px-4 py-2 text-left font-bold text-slate-600">Firma Adı</th>
                                                    <th className="px-4 py-2 text-left font-bold text-slate-600">Adres</th>
                                                    <th className="px-4 py-2 text-left font-bold text-slate-600">Sicil No</th>
                                                    <th className="px-4 py-2 text-left font-bold text-slate-600">Tehlike Sınıfı</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bulkData.map((item, index) => (
                                                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                                                        <td className="px-4 py-2 text-slate-400">{index + 1}</td>
                                                        <td className="px-4 py-2 text-slate-800 font-medium max-w-[250px]"><div className="truncate" title={item.title}>{item.title}</div></td>
                                                        <td className="px-4 py-2 text-slate-600 max-w-[300px]"><div className="truncate" title={item.address || '-'}>{item.address || '-'}</div></td>
                                                        <td className="px-4 py-2 text-slate-600">{item.registration_number || '-'}</td>
                                                        <td className="px-4 py-2">
                                                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${item.danger_class.toLowerCase().includes('çok') || item.danger_class.toLowerCase().includes('cok')
                                                                ? 'bg-red-100 text-red-700'
                                                                : item.danger_class.toLowerCase().includes('az')
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                {item.danger_class}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Yükleme Sonucu */}
                            {bulkResult && (
                                <div className={`mt-4 p-4 rounded-xl ${bulkResult.success ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {bulkResult.success ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-amber-600" />
                                        )}
                                        <span className="font-bold text-slate-800">
                                            {bulkResult.successCount} firma başarıyla eklendi
                                            {bulkResult.errorCount > 0 && `, ${bulkResult.errorCount} hata`}
                                        </span>
                                    </div>
                                    {bulkResult.errors.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {bulkResult.errors.map((err, i) => (
                                                <p key={i} className="text-sm text-red-600">
                                                    Satır {err.row}: {err.message}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-200 flex gap-3 bg-slate-50">
                            <button
                                onClick={() => setShowBulkModal(false)}
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-white transition-colors"
                            >
                                {bulkResult?.success ? 'Kapat' : 'İptal'}
                            </button>
                            <button
                                onClick={handleBulkUpload}
                                disabled={bulkData.length === 0 || bulkUploading || bulkResult?.success}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {bulkUploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Yükleniyor...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5" />
                                        Firmaları Yükle
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Başlık */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2 sm:gap-3">
                        <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" />
                        Firmalarım
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm sm:text-base">Kayıtlı firmalarınızı yönetin</p>
                </div>
                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => { setShowBulkModal(true); setBulkData([]); setBulkResult(null); }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                    >
                        <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Toplu Yükle</span>
                        <span className="sm:hidden">Toplu</span>
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                    >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Yeni Firma Ekle</span>
                        <span className="sm:hidden">Ekle</span>
                    </button>
                </div>
            </div>

            {/* Arama ve Filtreler */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Firma ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm sm:text-base"
                    />
                </div>

                <div className="flex gap-2">
                    {/* Sıralama Seçenekleri */}
                    <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setSortBy('default')}
                            className={`px-3 py-2 text-xs font-medium transition-colors ${sortBy === 'default' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                            title="Varsayılan sıralama"
                        >
                            Tarih
                        </button>
                        <button
                            onClick={() => setSortBy('name')}
                            className={`px-3 py-2 text-xs font-medium transition-colors border-l border-slate-200 ${sortBy === 'name' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                            title="Alfabetik sıralama"
                        >
                            A-Z
                        </button>
                        <button
                            onClick={() => setSortBy('danger')}
                            className={`px-3 py-2 text-xs font-medium transition-colors border-l border-slate-200 ${sortBy === 'danger' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                            title="Tehlike sınıfına göre"
                        >
                            Tehlike
                        </button>
                    </div>

                    {/* Görünüm Modu */}
                    <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                            title="Kart görünümü"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 transition-colors border-l border-slate-200 ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                            title="Liste görünümü"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                                {editingId ? 'Firma Düzenle' : 'Yeni Firma Ekle'}
                            </h2>
                            <button
                                onClick={() => { setShowForm(false); resetForm(); router.replace('/panel/firmalar'); }}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Logo - Kompakt */}
                            <div className="flex items-center gap-3">
                                <div
                                    onClick={() => logoInputRef.current?.click()}
                                    className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all overflow-hidden flex-shrink-0"
                                >
                                    {form.logo ? (
                                        <img src={form.logo} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <Upload className="w-5 h-5 text-slate-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-700">Firma Logosu</p>
                                    <p className="text-xs text-slate-400">PNG, JPG (max 1MB)</p>
                                </div>
                                {form.logo && (
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, logo: null })}
                                        className="text-red-500 text-xs hover:underline"
                                    >
                                        Kaldır
                                    </button>
                                )}
                            </div>

                            {/* Firma Unvanı */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Firma Unvanı *</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => {
                                        // Yeni satır karakterlerini temizle
                                        const cleanedValue = e.target.value.replace(/[\r\n]+/g, ' ');
                                        setForm({ ...form, title: cleanedValue });
                                    }}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Örn: ABC Sanayi Ltd. Şti."
                                />
                            </div>

                            {/* Adres */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Adres</label>
                                <input
                                    type="text"
                                    value={form.address}
                                    onChange={(e) => {
                                        // Yeni satır karakterlerini temizle
                                        const cleanedValue = e.target.value.replace(/[\r\n]+/g, ' ');
                                        setForm({ ...form, address: cleanedValue });
                                    }}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Firma adresi..."
                                />
                            </div>

                            {/* Sicil No ve Tehlike Sınıfı */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">SGK Sicil No</label>
                                    <input
                                        type="text"
                                        value={form.registration_number}
                                        onChange={(e) => {
                                            // Sadece sayılara izin ver
                                            const value = e.target.value.replace(/[^0-9]/g, '');
                                            setForm({ ...form, registration_number: value });
                                        }}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Sadece rakam giriniz"
                                        inputMode="numeric"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Tehlike Sınıfı *</label>
                                    <select
                                        value={form.danger_class}
                                        onChange={(e) => setForm({ ...form, danger_class: e.target.value as DangerClass })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                    >
                                        <option value="az_tehlikeli">Az Tehlikeli</option>
                                        <option value="tehlikeli">Tehlikeli</option>
                                        <option value="cok_tehlikeli">Çok Tehlikeli</option>
                                    </select>
                                </div>
                            </div>

                            {/* Risk Değerlendirme Ekibi */}
                            <div className="border-t border-slate-200 pt-6">
                                <h3 className="text-sm font-bold text-slate-700 mb-4">Risk Değerlendirme Ekibi</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">İşveren / Vekili</label>
                                        <input
                                            type="text"
                                            value={form.employer}
                                            onChange={(e) => setForm({ ...form, employer: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">İş Güvenliği Uzmanı</label>
                                        <input
                                            type="text"
                                            value={form.igu}
                                            onChange={(e) => setForm({ ...form, igu: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">İşyeri Hekimi</label>
                                        <input
                                            type="text"
                                            value={form.doctor}
                                            onChange={(e) => setForm({ ...form, doctor: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Çalışan Temsilcisi</label>
                                        <input
                                            type="text"
                                            value={form.representative}
                                            onChange={(e) => setForm({ ...form, representative: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Destek Elemanı</label>
                                        <input
                                            type="text"
                                            value={form.support}
                                            onChange={(e) => setForm({ ...form, support: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Butonlar */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); resetForm(); router.replace('/panel/firmalar'); }}
                                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }

            {/* Firma Listesi - Modern Kart Tasarımı */}
            {
                loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                    </div>
                ) : filteredCompanies.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 mb-6 text-lg">
                            {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz firma eklemediniz'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => { resetForm(); setShowForm(true); }}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-600/25"
                            >
                                <Plus className="w-5 h-5" />
                                İlk Firmayı Ekle
                            </button>
                        )}
                    </div>
                ) : viewMode === 'list' ? (
                    /* Liste Görünümü */
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left font-bold text-slate-600">Firma</th>
                                    <th className="px-4 py-3 text-left font-bold text-slate-600 hidden md:table-cell">Adres</th>
                                    <th className="px-4 py-3 text-left font-bold text-slate-600 hidden sm:table-cell">Sicil No</th>
                                    <th className="px-4 py-3 text-center font-bold text-slate-600">Tehlike</th>
                                    <th className="px-4 py-3 text-right font-bold text-slate-600">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCompanies.map((company) => (
                                    <tr
                                        key={company.id}
                                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                                        onClick={() => router.push(`/panel/firmalar/${company.id}`)}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {company.logo ? (
                                                    <img src={company.logo} alt="" className="w-8 h-8 rounded-lg object-contain bg-slate-100" />
                                                ) : (
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${company.danger_class === 'az_tehlikeli' ? 'bg-emerald-500' :
                                                        company.danger_class === 'tehlikeli' ? 'bg-amber-500' : 'bg-red-500'
                                                        }`}>
                                                        {company.title.charAt(0)}
                                                    </div>
                                                )}
                                                <span className="font-medium text-slate-800 line-clamp-1">{company.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                                            <span className="line-clamp-1">{company.address || '-'}</span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                                            {company.registration_number || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${company.danger_class === 'az_tehlikeli' ? 'bg-emerald-100 text-emerald-700' :
                                                company.danger_class === 'tehlikeli' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {DANGER_CLASS_LABELS[company.danger_class]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleEdit(company)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(company.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* Kart Görünümü - %40 Küçültülmüş */
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredCompanies.map((company) => (
                            <div
                                key={company.id}
                                className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-300 transition-all duration-300 cursor-pointer"
                                onClick={() => router.push(`/panel/firmalar/${company.id}`)}
                            >
                                {/* Kart Üst Kısım - Gradient Header */}
                                <div className={`h-14 relative bg-gradient-to-br ${company.danger_class === 'az_tehlikeli'
                                    ? 'from-emerald-500 to-teal-600'
                                    : company.danger_class === 'tehlikeli'
                                        ? 'from-amber-500 to-orange-600'
                                        : 'from-red-500 to-rose-600'
                                    }`}>
                                    {/* Logo */}
                                    <div className="absolute -bottom-5 left-3">
                                        {company.logo ? (
                                            <img
                                                src={company.logo}
                                                alt={company.title}
                                                className="w-10 h-10 rounded-lg object-contain bg-white border-2 border-white shadow-md"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-white border-2 border-white shadow-md flex items-center justify-center">
                                                <span className="text-base font-bold text-slate-600">
                                                    {company.title.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {/* Tehlike Sınıfı Badge */}
                                    <div className="absolute top-2 right-2">
                                        <span className="bg-white/90 backdrop-blur-sm text-[10px] px-2 py-1 rounded-full font-bold shadow-sm">
                                            {DANGER_CLASS_LABELS[company.danger_class]}
                                        </span>
                                    </div>
                                </div>

                                {/* Kart İçerik */}
                                <div className="pt-7 pb-3 px-3">
                                    <h3 className="font-bold text-slate-800 text-xs mb-0.5 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-tight">
                                        {company.title}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 line-clamp-1 mb-2">
                                        {company.address || 'Adres bilgisi yok'}
                                    </p>

                                    {/* Alt Bilgiler */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                        <div className="text-[9px] text-slate-400 truncate max-w-[60%]">
                                            {company.registration_number ? (
                                                <span>SGK: {company.registration_number}</span>
                                            ) : (
                                                <span>-</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleEdit(company)}
                                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                title="Düzenle"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(company.id)}
                                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Sil"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            }
        </div >
    );
}
