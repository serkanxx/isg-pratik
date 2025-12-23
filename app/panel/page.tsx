"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, apiFetchers } from '@/lib/queries';
import {
    Building2, FileText, Shield, Plus, TrendingUp,
    AlertCircle, ChevronRight, PlusCircle, PieChart, Activity, AlertTriangle,
    StickyNote, Clock, Check, Trash2, Bell, X, Calendar, MessageCircle,
    FileSpreadsheet, Upload, Download, Edit2, Loader2, Search, CheckCircle, FolderOpen, RefreshCw
} from 'lucide-react';
import { Company } from '../types';
import { useTheme } from '@/app/context/ThemeContext';
import * as XLSX from 'xlsx';

interface Note {
    id: string;
    content: string;
    companyId: string | null;
    dueDate: string | null;
    isCompleted: boolean;
    createdAt: string;
}

interface UserRisk {
    id: string;
    risk_no: string;
    hazard: string;
    risk: string;
    status: string;
    created_at: string;
}

interface ReportData {
    id: string;
    type: 'RISK_ASSESSMENT' | 'EMERGENCY_PLAN' | 'WORK_PERMIT';
    title: string;
    createdAt: string;
    data: any;
}

interface VisitProgram {
    id: string;
    name: string;
    type: string;
    startDate: string;
    endDate: string;
    companies: any[];
    schedule: any[];
}

const ADMIN_EMAIL = 'serkanxx@gmail.com';

export default function PanelPage() {
    const { data: session } = useSession();
    const { isDark } = useTheme();
    const router = useRouter();
    const isAdmin = session?.user?.email === ADMIN_EMAIL || (session?.user as any)?.role === 'ADMIN';
    const [companies, setCompanies] = useState<Company[]>([]);
    const [userRisks, setUserRisks] = useState<UserRisk[]>([]);
    const [recentReports, setRecentReports] = useState<ReportData[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        companyCount: 0,
        reportCount: 0,
        riskCount: 0,
        riskReportCount: 0,
        emergencyReportCount: 0,
        workPermitCount: 0
    });

    // Notlar state
    const [notes, setNotes] = useState<Note[]>([]);
    const [upcomingNotes, setUpcomingNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');
    const [dueDateDay, setDueDateDay] = useState('');
    const [dueDateMonth, setDueDateMonth] = useState('');
    const [dueDateYear, setDueDateYear] = useState('');
    const [newNoteCompanyId, setNewNoteCompanyId] = useState<string>('');
    const [showNoteForm, setShowNoteForm] = useState(false);

    // Ziyaret Programları state
    const [visitPrograms, setVisitPrograms] = useState<VisitProgram[]>([]);

    // Yorum onay state'leri (admin için)
    const [pendingCommentsCount, setPendingCommentsCount] = useState(0);
    const [showJobComments, setShowJobComments] = useState(false);
    const [pendingComments, setPendingComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);

    // İlan onay state'leri (admin için)
    const [pendingJobPostingsCount, setPendingJobPostingsCount] = useState(0);
    const [showJobPostingApproval, setShowJobPostingApproval] = useState(false);
    const [pendingJobPostings, setPendingJobPostings] = useState<any[]>([]);
    const [loadingJobPostings, setLoadingJobPostings] = useState(false);
    const [editingJobPosting, setEditingJobPosting] = useState<any | null>(null);
    const [editedJobContent, setEditedJobContent] = useState('');

    // Toplu yükleme state'leri
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkData, setBulkData] = useState<{ title: string; address: string; registration_number: string; danger_class: string }[]>([]);
    const [bulkUploading, setBulkUploading] = useState(false);
    const [bulkResult, setBulkResult] = useState<{ success: boolean; successCount: number; errorCount: number; errors: { row: number; message: string }[] } | null>(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
    const [tempAddress, setTempAddress] = useState('');
    const [findingAddresses, setFindingAddresses] = useState(false);
    const [addressFindProgress, setAddressFindProgress] = useState({ current: 0, total: 0 });
    const csvInputRef = useRef<HTMLInputElement>(null);

    // Arşiv dosya sayısı
    const [archiveFileCount, setArchiveFileCount] = useState<number | null>(null);

    // Dropdown değerleri
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const monthOptions = [
        { value: '01', label: 'Ocak' }, { value: '02', label: 'Şubat' },
        { value: '03', label: 'Mart' }, { value: '04', label: 'Nisan' },
        { value: '05', label: 'Mayıs' }, { value: '06', label: 'Haziran' },
        { value: '07', label: 'Temmuz' }, { value: '08', label: 'Ağustos' },
        { value: '09', label: 'Eylül' }, { value: '10', label: 'Ekim' },
        { value: '11', label: 'Kasım' }, { value: '12', label: 'Aralık' }
    ];
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear + i);

    const queryClient = useQueryClient();

    // React Query hooks
    const { data: companiesData, isLoading: companiesLoading } = useQuery({
        queryKey: queryKeys.companies,
        queryFn: apiFetchers.companies,
    });

    const { data: userRisksData, isLoading: risksLoading } = useQuery({
        queryKey: queryKeys.userRisks,
        queryFn: apiFetchers.userRisks,
    });

    const { data: reportsData, isLoading: reportsLoading } = useQuery({
        queryKey: queryKeys.reports,
        queryFn: apiFetchers.reports,
    });

    const { data: notesData } = useQuery({
        queryKey: queryKeys.notes,
        queryFn: apiFetchers.notes,
    });

    const { data: upcomingNotesData } = useQuery({
        queryKey: queryKeys.upcomingNotes,
        queryFn: apiFetchers.upcomingNotes,
    });

    const { data: visitProgramsData } = useQuery({
        queryKey: queryKeys.visitPrograms,
        queryFn: apiFetchers.visitPrograms,
    });

    // Data geldiğinde state'i güncelle
    useEffect(() => {
        if (companiesData) {
            setCompanies(companiesData);
            setStats(prev => ({ ...prev, companyCount: companiesData.length }));
        }
    }, [companiesData]);

    useEffect(() => {
        if (userRisksData) {
            setUserRisks(userRisksData);
            setStats(prev => ({ ...prev, riskCount: userRisksData.length }));
        }
    }, [userRisksData]);

    useEffect(() => {
        if (reportsData) {
            const allReports: ReportData[] = reportsData;
            setRecentReports(allReports.slice(0, 5));

            const riskReports = allReports.filter(r => r.type === 'RISK_ASSESSMENT').length;
            const emergencyReports = allReports.filter(r => r.type === 'EMERGENCY_PLAN').length;
            const workPermitReports = allReports.filter(r => r.type === 'WORK_PERMIT').length;

            setStats(prev => ({
                ...prev,
                reportCount: allReports.length,
                riskReportCount: riskReports,
                emergencyReportCount: emergencyReports,
                workPermitCount: workPermitReports
            }));
        }
    }, [reportsData]);

    useEffect(() => {
        if (notesData) {
            setNotes(notesData);
        }
    }, [notesData]);

    useEffect(() => {
        if (upcomingNotesData) {
            setUpcomingNotes(upcomingNotesData);
        }
    }, [upcomingNotesData]);

    useEffect(() => {
        if (visitProgramsData) {
            setVisitPrograms(visitProgramsData);
        }
    }, [visitProgramsData]);

    // Loading state - cache'den veri varsa loading'i false yap
    useEffect(() => {
        const hasData = companiesData || userRisksData || reportsData;
        const isLoading = companiesLoading || risksLoading || reportsLoading;

        if (hasData || !isLoading) {
            setLoading(false);
        }
    }, [companiesData, userRisksData, reportsData, companiesLoading, risksLoading, reportsLoading]);

    // Admin için bekleyen yorumları çek
    useEffect(() => {
        if (isAdmin) {
            fetchPendingCommentsCount();
        }
    }, [isAdmin]);

    // Arşiv dosya sayısını çek
    useEffect(() => {
        const fetchArchiveFileCount = async () => {
            try {
                const res = await fetch('/api/archive/list');
                if (res.ok) {
                    const data = await res.json();
                    if (data.files && Array.isArray(data.files)) {
                        setArchiveFileCount(data.files.length);
                    }
                }
            } catch (err) {
                console.error("Arşiv dosya sayısı alınamadı:", err);
            }
        };
        fetchArchiveFileCount();
    }, []);

    const fetchPendingCommentsCount = async () => {
        try {
            const res = await fetch('/api/admin/job-comments?status=pending');
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setPendingCommentsCount(data.data.length);
                }
            }
        } catch (err) {
            console.error("Yorum sayısı çekilemedi:", err);
        }
    };

    const fetchPendingComments = async () => {
        setLoadingComments(true);
        try {
            const res = await fetch('/api/admin/job-comments?status=pending');
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setPendingComments(data.data);
                }
            }
        } catch (err) {
            console.error("Yorumlar çekilemedi:", err);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleApproveComment = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/job-comments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'approved' })
            });
            if (res.ok) {
                setPendingComments(pendingComments.filter(c => c.id !== id));
                setPendingCommentsCount(prev => prev - 1);
                alert('Yorum onaylandı!');
            }
        } catch (err) {
            console.error("Onaylama hatası:", err);
        }
    };

    const handleRejectComment = async (id: string) => {
        if (!confirm('Bu yorumu reddetmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/admin/job-comments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected' })
            });
            if (res.ok) {
                setPendingComments(pendingComments.filter(c => c.id !== id));
                setPendingCommentsCount(prev => prev - 1);
            }
        } catch (err) {
            console.error("Reddetme hatası:", err);
        }
    };

    // Toplu yükleme fonksiyonları
    const downloadTemplate = () => {
        const templateData = [
            { 'FİRMA': 'ABC Sanayi Ltd. Şti.', 'ADRES': 'İstanbul Organize Sanayi Bölgesi No:15', 'SİCİL NO': '1234567890', 'TEHLİKE SINIFI': 'Tehlikeli' },
            { 'FİRMA': 'XYZ Ticaret A.Ş.', 'ADRES': 'Ankara Sincan OSB 2. Cadde No:42', 'SİCİL NO': '9876543210', 'TEHLİKE SINIFI': 'Az Tehlikeli' },
            { 'FİRMA': 'Örnek Metal İmalat', 'ADRES': 'İzmir Atatürk OSB 3. Sokak No:8', 'SİCİL NO': '5555555555', 'TEHLİKE SINIFI': 'Çok Tehlikeli' },
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        ws['!cols'] = [{ wch: 35 }, { wch: 45 }, { wch: 15 }, { wch: 18 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Firmalar');
        XLSX.writeFile(wb, 'firma_sablonu.xlsx');
    };

    const detectDangerClass = (value: string): string => {
        const lower = (value || '').toLowerCase().trim();
        if (lower.includes('çok') || lower.includes('cok')) return 'Çok Tehlikeli';
        if (lower.includes('az')) return 'Az Tehlikeli';
        return 'Tehlikeli';
    };

    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
                if (jsonData.length < 2) {
                    alert('Dosyada veri bulunamadı!');
                    return;
                }
                let titleColIndex = 0, addressColIndex = 1, registrationColIndex = 2, dangerClassColIndex = 3;
                const dataRows = jsonData.slice(1);
                const parsedData: { title: string; address: string; registration_number: string; danger_class: string }[] = [];
                dataRows.forEach(row => {
                    const title = (row[titleColIndex] || '').toString().trim();
                    if (title) {
                        parsedData.push({
                            title,
                            address: (row[addressColIndex] || '').toString().trim(),
                            registration_number: (row[registrationColIndex] || '').toString().trim(),
                            danger_class: detectDangerClass((row[dangerClassColIndex] || '').toString())
                        });
                    }
                });
                if (parsedData.length === 0) {
                    alert('Geçerli firma verisi bulunamadı!');
                    return;
                }
                setBulkData(parsedData);
                setBulkResult(null);
            } catch (error) {
                alert('Dosya okunamadı!');
                console.error('Excel parse error:', error);
            }
        };
        reader.readAsArrayBuffer(file);
        if (csvInputRef.current) csvInputRef.current.value = '';
    };

    const handleAddressUpdate = () => {
        if (editingAddressIndex !== null) {
            const updatedData = [...bulkData];
            updatedData[editingAddressIndex] = { ...updatedData[editingAddressIndex], address: tempAddress.trim() };
            setBulkData(updatedData);
            setShowAddressModal(false);
            setEditingAddressIndex(null);
            setTempAddress('');
        }
    };

    const handleBulkUpload = async () => {
        if (bulkData.length === 0) {
            alert('Yüklenecek firma verisi yok!');
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
                    alert(`${result.successCount} firma başarıyla eklendi!`);
                    setTimeout(() => {
                        setShowBulkModal(false);
                        setBulkData([]);
                        setBulkResult(null);
                    }, 1000);
                }
            } else {
                alert(result.error || 'Yükleme hatası');
            }
        } catch (error) {
            alert('Sunucu hatası');
        } finally {
            setBulkUploading(false);
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
                    companyId: newNoteCompanyId || null,
                    dueDate
                })
            });
            if (res.ok) {
                setNewNote('');
                setDueDateDay('');
                setDueDateMonth('');
                setDueDateYear('');
                setNewNoteCompanyId('');
                setShowNoteForm(false);
                queryClient.invalidateQueries({ queryKey: queryKeys.notes });
                queryClient.invalidateQueries({ queryKey: queryKeys.upcomingNotes });
            }
        } catch (error) {
            console.error('Not eklenemedi:', error);
        }
    };

    // Not tamamla
    const toggleNoteComplete = async (id: string, currentStatus: boolean) => {
        try {
            await fetch('/api/notes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isCompleted: !currentStatus })
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.notes });
            queryClient.invalidateQueries({ queryKey: queryKeys.upcomingNotes });
        } catch (error) {
            console.error('Not güncellenemedi:', error);
        }
    };

    // Not sil
    const handleDeleteNote = async (id: string) => {
        if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;
        try {
            await fetch(`/api/notes?id=${id}`, { method: 'DELETE' });
            queryClient.invalidateQueries({ queryKey: queryKeys.notes });
            queryClient.invalidateQueries({ queryKey: queryKeys.upcomingNotes });
        } catch (error) {
            console.error('Not silinemedi:', error);
        }
    };

    // İlan Onay Fonksiyonları
    const fetchPendingJobPostingsCount = async () => {
        try {
            const res = await fetch('/api/admin/user-job-postings?status=pending');
            if (res.ok) {
                const result = await res.json();
                setPendingJobPostingsCount(result.data?.length || 0);
            }
        } catch (err) {
            console.error("Bekleyen ilan sayısı alınamadı:", err);
        }
    };

    const fetchPendingJobPostings = async () => {
        setLoadingJobPostings(true);
        try {
            const res = await fetch('/api/admin/user-job-postings?status=pending');
            if (res.ok) {
                const result = await res.json();
                setPendingJobPostings(result.data || []);
            }
        } catch (err) {
            console.error("Bekleyen ilanlar çekilemedi:", err);
        } finally {
            setLoadingJobPostings(false);
        }
    };

    const handleApproveJobPosting = async (id: string, content?: string) => {
        try {
            const res = await fetch(`/api/admin/user-job-postings/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'approved', content })
            });
            if (res.ok) {
                setPendingJobPostings(pendingJobPostings.filter(p => p.id !== id));
                setPendingJobPostingsCount(prev => Math.max(0, prev - 1));
                setEditingJobPosting(null);
                alert('İlan onaylandı ve yayınlandı!');
            }
        } catch (err) {
            console.error("İlan onaylama hatası:", err);
        }
    };

    const handleRejectJobPosting = async (id: string) => {
        if (!confirm('Bu ilanı reddetmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/admin/user-job-postings/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected' })
            });
            if (res.ok) {
                setPendingJobPostings(pendingJobPostings.filter(p => p.id !== id));
                setPendingJobPostingsCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error("İlan reddetme hatası:", err);
        }
    };

    // Admin için bekleyen ilanları çek
    useEffect(() => {
        if (isAdmin) {
            fetchPendingJobPostingsCount();
        }
    }, [isAdmin]);

    // Yardımcı fonksiyonlar
    const isOverdue = (dueDate: string | null) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short'
        });
    };

    const getCompanyName = (companyId: string | null) => {
        if (!companyId) return 'Genel';
        const company = companies.find(c => c.id === companyId);
        return company?.title || 'Bilinmeyen Firma';
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Günaydın';
        if (hour < 18) return 'İyi Günler';
        return 'İyi Akşamlar';
    };

    // --- Donut Chart Hesabı ---
    // Yarıçap 40, Çevre = 2 * PI * 40 ≈ 251.2
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const totalReports = stats.reportCount || 1; // 0 ise 1 kabul et (boş grafik için)

    // Risk Değerlendirme Dilimi
    const riskPercent = stats.riskReportCount / totalReports;
    const riskDash = riskPercent * circumference;

    // Acil Durum Dilimi
    const emergencyPercent = stats.emergencyReportCount / totalReports;
    const emergencyDash = emergencyPercent * circumference;

    // İş İzin Formu Dilimi
    const workPermitPercent = stats.workPermitCount / totalReports;
    const workPermitDash = workPermitPercent * circumference;

    // Boş durum kontrolü
    const isEmpty = stats.reportCount === 0;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Gizli Excel Input */}
            <input type="file" accept=".xlsx,.xls" ref={csvInputRef} onChange={handleExcelUpload} className="hidden" />

            {/* Toplu Yükleme Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                                    Toplu Firma Yükle
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">Excel dosyasından birden fazla firma ekleyin</p>
                            </div>
                            <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <p className="text-sm text-blue-800 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>İsgkatip Platformundan Dışa Aktarılan Belgelerinizi Yükleyebilirsiniz (Adres Bilgisini Manuel Girmelisiniz)</span>
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                <button onClick={downloadTemplate} className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all">
                                    <Download className="w-5 h-5" />
                                    Şablon Excel İndir
                                </button>
                                <button onClick={() => csvInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-700 hover:bg-emerald-100 hover:border-emerald-500 transition-all">
                                    <Upload className="w-5 h-5" />
                                    Excel Dosyası Seç
                                </button>
                            </div>
                            {bulkData.length > 0 && (
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                                        <span className="font-bold text-slate-700">{bulkData.length} firma yüklenmeye hazır</span>
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
                                                        <td className="px-4 py-2 text-slate-600 max-w-[300px]">
                                                            {item.address ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="truncate flex-1" title={item.address}>{item.address}</div>
                                                                    <button onClick={() => { setEditingAddressIndex(index); setTempAddress(item.address); setShowAddressModal(true); }} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors font-medium flex-shrink-0" title="Adresi düzenle">Düzenle</button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-slate-400">-</span>
                                                                    <button onClick={() => { setEditingAddressIndex(index); setTempAddress(''); setShowAddressModal(true); }} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors font-medium">Ekle</button>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2 text-slate-600">{item.registration_number || '-'}</td>
                                                        <td className="px-4 py-2">
                                                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${item.danger_class.toLowerCase().includes('çok') || item.danger_class.toLowerCase().includes('cok') ? 'bg-red-100 text-red-700' : item.danger_class.toLowerCase().includes('az') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
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
                            {bulkResult && (
                                <div className={`mt-4 p-4 rounded-xl ${bulkResult.success ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {bulkResult.success ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-amber-600" />}
                                        <span className="font-bold text-slate-800">
                                            {bulkResult.successCount} firma başarıyla eklendi
                                            {bulkResult.errorCount > 0 && `, ${bulkResult.errorCount} hata`}
                                        </span>
                                    </div>
                                    {bulkResult.errors.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {bulkResult.errors.map((err, i) => (
                                                <p key={i} className="text-sm text-red-600">Satır {err.row}: {err.message}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-200 flex gap-3 bg-slate-50">
                            <button onClick={() => setShowBulkModal(false)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-white transition-colors">
                                {bulkResult?.success ? 'Kapat' : 'İptal'}
                            </button>
                            <button onClick={handleBulkUpload} disabled={bulkData.length === 0 || bulkUploading || bulkResult?.success} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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

            {/* Adres Düzenleme Modal */}
            {showAddressModal && editingAddressIndex !== null && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Edit2 className="w-5 h-5 text-indigo-600" />
                                    Adres Ekle/Düzenle
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">{bulkData[editingAddressIndex]?.title || 'Firma'}</p>
                            </div>
                            <button onClick={() => { setShowAddressModal(false); setEditingAddressIndex(null); setTempAddress(''); }} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Adres</label>
                                <textarea value={tempAddress} onChange={(e) => setTempAddress(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" placeholder="Firma adresini giriniz..." rows={4} autoFocus />
                                <p className="text-xs text-slate-400 mt-2">Adres girmek zorunlu değildir. İsterseniz boş bırakabilirsiniz.</p>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-200 flex gap-3 bg-slate-50">
                            <button onClick={() => { setShowAddressModal(false); setEditingAddressIndex(null); setTempAddress(''); }} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-white transition-colors">İptal</button>
                            <button onClick={handleAddressUpdate} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">Kaydet</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hoşgeldin Kartı */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 text-white shadow-xl shadow-indigo-600/20">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-indigo-200 text-xs sm:text-sm font-medium mb-1">{getGreeting()}</p>
                        <h1 className="text-xl sm:text-2xl font-bold mb-1">
                            {session?.user?.name || 'Kullanıcı'}
                        </h1>
                        <p className="text-indigo-200 text-xs sm:text-sm">
                            İSG Pratik Risk Yönetim Sistemi
                        </p>

                        {/* Admin Butonları */}
                        {isAdmin && (
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                                <Link
                                    href="/admin"
                                    className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-bold text-xs sm:text-sm transition-colors shadow-lg"
                                >
                                    <span className="mr-1 sm:mr-2">⚙️</span>
                                    <span className="hidden sm:inline">Admin Paneli</span>
                                    <span className="sm:hidden">Admin</span>
                                </Link>
                                <Link
                                    href="/panel?showRiskSuggestions=true"
                                    className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs sm:text-sm transition-colors shadow-lg"
                                >
                                    <span className="mr-1 sm:mr-2">📥</span>
                                    <span className="hidden sm:inline">Risk Önerileri</span>
                                    <span className="sm:hidden">Öneriler</span>
                                </Link>
                                <button
                                    onClick={() => { setShowJobComments(true); fetchPendingComments(); }}
                                    className={`inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors shadow-lg ${pendingCommentsCount > 0
                                        ? 'bg-blue-500 hover:bg-blue-600 text-white animate-pulse'
                                        : 'bg-blue-400/80 hover:bg-blue-500 text-white'
                                        }`}
                                >
                                    <MessageCircle className="w-4 h-4 mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Yorum Onay</span>
                                    <span className="sm:hidden">Yorum</span>
                                    {pendingCommentsCount > 0 && (
                                        <span className="ml-2 bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                            {pendingCommentsCount}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => { setShowJobPostingApproval(true); fetchPendingJobPostings(); }}
                                    className={`inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors shadow-lg ${pendingJobPostingsCount > 0
                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white animate-pulse'
                                        : 'bg-emerald-400/80 hover:bg-emerald-500 text-white'
                                        }`}
                                >
                                    <span className="mr-1 sm:mr-2">📋</span>
                                    <span className="hidden sm:inline">İlan Onay</span>
                                    <span className="sm:hidden">İlanlar</span>
                                    {pendingJobPostingsCount > 0 && (
                                        <span className="ml-2 bg-white text-emerald-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                            {pendingJobPostingsCount}
                                        </span>
                                    )}
                                </button>
                                <Link
                                    href="/panel/kullanici-istatistikleri"
                                    className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-bold text-xs sm:text-sm transition-colors shadow-lg"
                                >
                                    <PieChart className="w-4 h-4 mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Kullanıcı İstatistikleri</span>
                                    <span className="sm:hidden">İstatistikler</span>
                                </Link>
                            </div>
                        )}
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        <img src="/logo.png" alt="Logo" className="w-16 h-16 lg:w-20 lg:h-20 opacity-80" />
                    </div>
                </div>
            </div>




            {/* Hızlı Erişim Butonları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-white rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group">
                    <Link
                        href="/panel/firmalar?new=true"
                        className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0"
                    >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all flex-shrink-0">
                            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-slate-800 text-sm sm:text-base">Yeni Firma Ekle</h3>
                            <p className="text-xs sm:text-sm text-slate-500 truncate">Firma bilgilerini kaydet</p>
                        </div>
                    </Link>
                    <button
                        onClick={() => { setShowBulkModal(true); setBulkData([]); setBulkResult(null); }}
                        className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 flex-shrink-0"
                        title="Toplu Yükle"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span className="hidden sm:inline">Toplu Yükle</span>
                        <span className="sm:hidden text-[10px]">Toplu</span>
                    </button>
                </div>

                <Link
                    href="/risk-degerlendirme"
                    className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:scale-[1.02] transition-all group"
                >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm sm:text-base">Yeni Risk Analizi</h3>
                        <p className="text-xs sm:text-sm text-emerald-100">Hemen başla</p>
                    </div>
                    <ChevronRight className="w-5 h-5 ml-auto opacity-70 hidden sm:block" />
                </Link>

                <Link
                    href="/panel/acil-durum"
                    className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-white rounded-xl border border-slate-200 hover:shadow-lg hover:border-orange-200 transition-all group sm:col-span-2 lg:col-span-1"
                >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 text-sm sm:text-base">Acil Durum Planı</h3>
                        <p className="text-xs sm:text-sm text-slate-500">Hemen oluştur</p>
                    </div>
                    <ChevronRight className="w-5 h-5 ml-auto opacity-0 group-hover:opacity-70 transition-opacity hidden sm:block" />
                </Link>
            </div>

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                {/* Firma Sayısı */}
                <Link href="/panel/firmalar" className="block h-full">
                    <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 hover:shadow-lg hover:border-indigo-200 transition-all group h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">
                                {loading ? '...' : stats.companyCount}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500">Kayıtlı Firma</p>
                        </div>
                    </div>
                </Link>

                {/* İSG Dosya Arşivi Kartı */}
                <Link href="/panel/arsiv" className="block h-full">
                    <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 rounded-xl p-6 border border-purple-500 hover:shadow-2xl hover:shadow-purple-500/50 transition-all group h-full flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                                    <FolderOpen className="w-6 h-6" />
                                </div>
                                <div className="px-3 py-1.5 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 rounded-lg border-2 border-yellow-300 shadow-lg shadow-yellow-500/50 animate-pulse">
                                    <span className="text-xs font-extrabold text-slate-900 tracking-wider uppercase">DEV ARŞİV</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-white mb-1">
                                    {archiveFileCount !== null ? archiveFileCount.toLocaleString('tr-TR') : '...'}
                                </h3>
                                <p className="text-sm text-purple-100 font-medium">İSG Dosya Arşivi</p>
                                <p className="text-xs text-purple-200 mt-2 leading-relaxed">
                                    Binlerce İSG dokümanına anında erişin. Kapsamlı arşiv sizi bekliyor!
                                </p>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Risklerim Kartı */}
                <Link href="/panel/risk-maddelerim" className="block h-full">
                    <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg hover:border-amber-200 transition-all group h-full flex flex-col justify-between relative overflow-visible">
                        {/* Post-it Image */}
                        <img
                            src="/postit.png"
                            alt="Risk Ekle"
                            className="hidden md:block absolute top-5 right-12 z-10 w-[9.75rem] transform -rotate-12 hover:scale-105 transition-transform duration-300 drop-shadow-lg"
                        />
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                <Shield className="w-6 h-6" />
                            </div>
                            <PlusCircle className="w-7 h-7 text-amber-500 mb-auto -mt-3" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-slate-800 mb-1">
                                {loading ? '...' : stats.riskCount}
                            </h3>
                            <p className="text-sm text-slate-500">Risklerim</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Container for Visit Programs, Notes and Risks */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6 w-full">
                {/* Ziyaret Programları */}
                {visitPrograms.length > 0 && (
                    <div className="xl:col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden w-full self-start max-h-[310px] flex flex-col">
                        <div className="p-2.5 border-b border-slate-200 flex items-center justify-between shrink-0">
                            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-indigo-600" />
                                Ziyaret Programım
                            </h2>
                            <Link href="/panel/ziyaret-programi" className="text-[10px] text-indigo-600 font-medium hover:underline flex items-center gap-0.5">
                                Tümünü Gör <ChevronRight className="w-2.5 h-2.5" />
                            </Link>
                        </div>
                        <div className="p-2 overflow-y-auto">
                            <div className="flex flex-col gap-2">
                                {(() => {
                                    // Tarihi en yakın olan programı bul
                                    if (visitPrograms.length === 0) return null;

                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);

                                    const programsWithDates = visitPrograms.map(program => {
                                        // Schedule içindeki tüm tarihleri topla
                                        const allDates: Date[] = [];

                                        if (program.schedule && Array.isArray(program.schedule)) {
                                            program.schedule.forEach((day: any) => {
                                                if (day.date) {
                                                    const date = new Date(day.date);
                                                    date.setHours(0, 0, 0, 0);
                                                    allDates.push(date);
                                                }
                                            });
                                        }

                                        // startDate ve endDate'i de ekle
                                        if (program.startDate) {
                                            const startDate = new Date(program.startDate);
                                            startDate.setHours(0, 0, 0, 0);
                                            allDates.push(startDate);
                                        }

                                        if (program.endDate) {
                                            const endDate = new Date(program.endDate);
                                            endDate.setHours(0, 0, 0, 0);
                                            allDates.push(endDate);
                                        }

                                        // Bugünden sonraki en yakın tarihi bul
                                        const futureDates = allDates.filter(date => date >= today);
                                        const nearestDate = futureDates.length > 0
                                            ? new Date(Math.min(...futureDates.map(d => d.getTime())))
                                            : (allDates.length > 0
                                                ? new Date(Math.max(...allDates.map(d => d.getTime())))
                                                : null);

                                        return {
                                            program,
                                            nearestDate: nearestDate || new Date(0) // Eğer tarih yoksa en eski tarih
                                        };
                                    });

                                    // En yakın tarihe göre sırala
                                    programsWithDates.sort((a, b) => {
                                        // Önce gelecek tarihleri önceliklendir
                                        const aIsFuture = a.nearestDate >= today;
                                        const bIsFuture = b.nearestDate >= today;

                                        if (aIsFuture && !bIsFuture) return -1;
                                        if (!aIsFuture && bIsFuture) return 1;

                                        // Aynı kategorideyse (ikisi de gelecek veya geçmiş) en yakın olanı seç
                                        return Math.abs(a.nearestDate.getTime() - today.getTime()) -
                                            Math.abs(b.nearestDate.getTime() - today.getTime());
                                    });

                                    // En yakın programı al
                                    const nearestProgram = programsWithDates[0]?.program;
                                    if (!nearestProgram) return null;

                                    return (
                                        <Link
                                            key={nearestProgram.id}
                                            href="/panel/ziyaret-programi"
                                            className="p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all bg-white w-full block"
                                        >
                                            <div className="flex items-start justify-between mb-1.5">
                                                <div className="flex flex-col gap-0 min-w-0 flex-1">
                                                    <h3 className="font-bold text-sm truncate visit-program-title">{nearestProgram.name}</h3>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                        <Building2 className="w-3 h-3" />
                                                        {nearestProgram.companies.length} Firma
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${nearestProgram.type === 'monthly' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                                                    {nearestProgram.type === 'monthly' ? 'Aylık' : 'Haftalık'}
                                                </span>
                                            </div>

                                            {/* Mini Takvim Önizleme - Kompakt */}
                                            <div className="mt-1.5 pt-1.5 border-t border-indigo-100/50 dark:border-indigo-900/30">
                                                <div className="grid grid-cols-5 gap-1 mb-1">
                                                    {['Pzt', 'Sal', 'Çar', 'Per', 'Cum'].map(d => (
                                                        <div key={d} className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-bold uppercase">{d}</div>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-5 gap-1">
                                                    {(() => {
                                                        const weekdays = (nearestProgram.schedule || []).filter((d: any) => !['Cumartesi', 'Pazar'].includes(d.dayName));
                                                        if (weekdays.length === 0) return null;

                                                        const firstDayDate = new Date(weekdays[0].date);
                                                        const startOffset = Math.max(0, firstDayDate.getDay() - 1);

                                                        const emptySlots = Array(startOffset).fill(null);
                                                        const allSlots = [...emptySlots, ...weekdays];

                                                        return allSlots.map((day, i) => {
                                                            if (!day) {
                                                                return <div key={`empty-${i}`} className="h-8 rounded bg-transparent" />;
                                                            }

                                                            const hasVisit = day.companies && day.companies.length > 0;
                                                            const dayNumber = new Date(day.date).getDate();

                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className={`h-8 rounded flex flex-col items-center justify-center transition-all ${hasVisit
                                                                        ? 'visit-day-light border border-indigo-100 dark:border-slate-700'
                                                                        : 'bg-slate-50 border border-slate-100 dark:bg-slate-700/50 dark:border-slate-600'
                                                                        }`}
                                                                    title={hasVisit ? `${day.companies.length} Ziyaret:\n${day.companies.map((c: any) => c.title).join('\n')}` : `Tarih: ${new Date(day.date).toLocaleDateString('tr-TR')}`}
                                                                >
                                                                    <span className={`text-xs font-bold ${hasVisit ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                                                        {dayNumber}
                                                                    </span>
                                                                    {hasVisit && (
                                                                        <div className="flex gap-0.5 mt-0.5">
                                                                            {[...Array(Math.min(day.companies.length, 3))].map((_, k) => (
                                                                                <div key={k} className="w-0.5 h-0.5 rounded-full bg-indigo-400 dark:bg-indigo-300"></div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Rapor İstatistikleri Grafiği */}
                <div className="xl:col-span-1 bg-white rounded-xl p-5 border border-slate-200 relative overflow-hidden h-full max-h-[310px] self-start flex flex-col">
                    <div className="mb-4">
                        <h3 className="font-bold text-slate-800 text-sm">Rapor Özeti</h3>
                        <p className="text-[10px] text-slate-500">Oluşturulan Raporlar</p>
                    </div>

                    <div className="flex-1 flex items-center justify-between gap-4">
                        <div className="space-y-3">
                            {/* Legend */}
                            <div className="flex items-center gap-2.5">
                                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20"></div>
                                <span className="text-slate-700 font-bold text-sm">Risk: {stats.riskReportCount}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="w-3.5 h-3.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/20"></div>
                                <span className="text-slate-700 font-bold text-sm">Acil Durum: {stats.emergencyReportCount}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/20"></div>
                                <span className="text-slate-700 font-bold text-sm">İş İzin: {stats.workPermitCount}</span>
                            </div>
                        </div>

                        {/* Donut Chart */}
                        <div className="relative w-32 h-32 flex-shrink-0">
                            <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
                                {/* Arkaplan Halkası */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r={radius}
                                    fill="transparent"
                                    stroke={isEmpty ? "#f1f5f9" : "transparent"}
                                    strokeWidth="12"
                                />

                                {!isEmpty && (
                                    <>
                                        {/* Risk Dilimi */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r={radius}
                                            fill="transparent"
                                            stroke="#10b981" // emerald-500
                                            strokeWidth="12"
                                            strokeDasharray={`${riskDash} ${circumference}`}
                                            strokeDashoffset="0"
                                            strokeLinecap="round"
                                            className="transition-all duration-1000 ease-out"
                                        />
                                        {/* Acil Durum Dilimi */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r={radius}
                                            fill="transparent"
                                            stroke="#f97316" // orange-500
                                            strokeWidth="12"
                                            strokeDasharray={`${emergencyDash} ${circumference}`}
                                            strokeDashoffset={-riskDash}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000 ease-out"
                                        />
                                        {/* İş İzin Formu Dilimi */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r={radius}
                                            fill="transparent"
                                            stroke="#3b82f6" // blue-500
                                            strokeWidth="12"
                                            strokeDasharray={`${workPermitDash} ${circumference}`}
                                            strokeDashoffset={-(riskDash + emergencyDash)}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </>
                                )}
                            </svg>
                            {/* Ortadaki Sayı */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-slate-800 leading-none">
                                    {stats.reportCount}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Toplam</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notlar Kartı */}
                <div className="xl:col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden h-full max-h-[310px] self-start flex flex-col">
                    <div className="p-3 border-b border-slate-200 flex items-center justify-between shrink-0">
                        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <StickyNote className="w-4 h-4 text-amber-500" />
                            Notlarım
                        </h2>
                        <button
                            onClick={() => setShowNoteForm(!showNoteForm)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                            {showNoteForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Not Ekleme Formu */}
                    {showNoteForm && (
                        <div className="p-4 bg-amber-50 border-b border-amber-200">
                            <div className="space-y-3">
                                <textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Notunuzu yazın..."
                                    className="w-full p-3 border border-amber-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    rows={2}
                                />
                                <div className="flex flex-wrap items-center gap-3">
                                    <select
                                        value={newNoteCompanyId}
                                        onChange={(e) => setNewNoteCompanyId(e.target.value)}
                                        className="flex-1 min-w-[150px] p-2 border border-amber-200 rounded-lg text-sm bg-white"
                                    >
                                        <option value="">Genel Not</option>
                                        {companies.map((c) => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <select
                                                value={dueDateDay}
                                                onChange={(e) => setDueDateDay(e.target.value)}
                                                className="w-14 p-2 border border-amber-200 rounded-lg text-sm bg-white"
                                            >
                                                <option value="">G</option>
                                                {days.map(d => <option key={d} value={String(d)}>{d}</option>)}
                                            </select>
                                            <select
                                                value={dueDateMonth}
                                                onChange={(e) => setDueDateMonth(e.target.value)}
                                                className="w-20 p-2 border border-amber-200 rounded-lg text-sm bg-white"
                                            >
                                                <option value="">Ay</option>
                                                {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                            </select>
                                            <select
                                                value={dueDateYear}
                                                onChange={(e) => setDueDateYear(e.target.value)}
                                                className="w-18 p-2 border border-amber-200 rounded-lg text-sm bg-white"
                                            >
                                                <option value="">Yıl</option>
                                                {yearOptions.map(y => <option key={y} value={String(y)}>{y}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleAddNote}
                                        className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 transition-colors ml-auto"
                                    >
                                        Ekle
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Not Listesi */}
                    {notes.length === 0 ? (
                        <div className="p-4 text-center">
                            <StickyNote className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-500 mb-3 text-xs">Henüz not eklemediniz</p>
                            <button
                                onClick={() => setShowNoteForm(true)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors"
                            >
                                <Plus className="w-3 h-3" />
                                İlk Notu Ekle
                            </button>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 flex-1 overflow-y-auto">
                            {notes.slice(0, 10).map((note) => (
                                <li key={note.id} className={`p-4 hover:bg-slate-50 transition-colors ${note.isCompleted ? 'opacity-60' : ''
                                    }`}>
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={() => toggleNoteComplete(note.id, note.isCompleted)}
                                            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${note.isCompleted
                                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                                : 'border-slate-300 hover:border-emerald-500'
                                                }`}
                                        >
                                            {note.isCompleted && <Check className="w-3 h-3" />}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${note.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                                {note.content}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                                <span className="bg-slate-100 px-2 py-0.5 rounded">
                                                    {getCompanyName(note.companyId)}
                                                </span>
                                                {note.dueDate && (
                                                    <span className={isOverdue(note.dueDate) && !note.isCompleted ? 'text-red-600 font-medium' : ''}>
                                                        <Clock className="w-3 h-3 inline mr-1" />
                                                        {formatDate(note.dueDate)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteNote(note.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Son Firmalar ve Son Alınan Raporlar - Yan Yana */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Son Firmalar */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-indigo-600" />
                            Son Eklenen Firmalar
                        </h2>
                        <Link href="/panel/firmalar" className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1">
                            Tümünü Gör <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="p-6 text-center text-slate-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent mx-auto mb-2"></div>
                            <p className="text-xs">Yükleniyor...</p>
                        </div>
                    ) : companies.length === 0 ? (
                        <div className="p-6 text-center">
                            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 mb-3">Henüz firma eklemediniz</p>
                            <Link
                                href="/panel/firmalar?new=true"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
                            >
                                <Plus className="w-3 h-3" />
                                İlk Firmayı Ekle
                            </Link>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {companies.slice(0, 5).map((company) => (
                                <li key={company.id}>
                                    <Link
                                        href={`/panel/firmalar?edit=${company.id}`}
                                        className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                                            {company.title.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-slate-800 truncate">{company.title}</p>
                                            <p className="text-xs text-slate-500 truncate">{company.address || 'Adres girilmemiş'}</p>
                                        </div>
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${company.danger_class === 'az_tehlikeli'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : company.danger_class === 'tehlikeli'
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                            {company.danger_class === 'az_tehlikeli'
                                                ? 'Az Tehlikeli'
                                                : company.danger_class === 'tehlikeli'
                                                    ? 'Tehlikeli'
                                                    : 'Çok Tehlikeli'}
                                        </span>
                                        <ChevronRight className="w-3 h-3 text-slate-400" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Son Alınan Raporlar */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-600" />
                            Son Alınan Raporlar
                        </h2>
                        <Link href="/panel/raporlarim" className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1">
                            Tümünü Gör <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="p-6 text-center text-slate-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent mx-auto mb-2"></div>
                            <p className="text-xs">Yükleniyor...</p>
                        </div>
                    ) : recentReports.length === 0 ? (
                        <div className="p-6 text-center">
                            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 mb-3">Henüz rapor oluşturmadınız</p>
                            <div className="flex justify-center gap-2">
                                <Link href="/risk-degerlendirme" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors">
                                    Risk Analizi
                                </Link>
                                <Link href="/panel/acil-durum" className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors">
                                    Acil Durum
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {recentReports.map((report) => {
                                let companyName = report.title;
                                let dangerClass = '';
                                let reportDate = '-';

                                try {
                                    if (report.type === 'RISK_ASSESSMENT') {
                                        dangerClass = report.data?.headerInfo?.dangerClass || report.data?.company?.danger_class || '';
                                        reportDate = report.data?.headerInfo?.date || '-';
                                    } else if (report.type === 'WORK_PERMIT') {
                                        companyName = report.data?.companyName || report.title;
                                        reportDate = report.createdAt || '-';
                                    } else {
                                        dangerClass = report.data?.company?.danger_class || report.data?.dangerClass || '';
                                        reportDate = report.data?.date || report.data?.reportDate || '-';
                                    }
                                } catch (e) { }

                                let dangerClassLabel = dangerClass;
                                let dangerClassStyle = 'bg-slate-100 text-slate-600';

                                if (dangerClass) {
                                    const normalized = dangerClass.toLowerCase().replace(/ /g, '_');
                                    if (normalized.includes('az')) { dangerClassLabel = 'Az Tehlikeli'; dangerClassStyle = 'bg-emerald-100 text-emerald-700'; }
                                    else if (normalized.includes('cok') || normalized.includes('çok')) { dangerClassLabel = 'Çok Tehlikeli'; dangerClassStyle = 'bg-red-100 text-red-700'; }
                                    else if (normalized.includes('tehlikeli')) { dangerClassLabel = 'Tehlikeli'; dangerClassStyle = 'bg-amber-100 text-amber-700'; }
                                }

                                if (reportDate !== '-') {
                                    try {
                                        const d = new Date(reportDate);
                                        if (!isNaN(d.getTime())) {
                                            reportDate = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
                                        }
                                    } catch (e) { }
                                }

                                return (
                                    <li key={report.id}>
                                        <div className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${report.type === 'RISK_ASSESSMENT'
                                                ? 'bg-indigo-100 text-indigo-600'
                                                : report.type === 'WORK_PERMIT'
                                                    ? 'bg-blue-100 text-blue-600'
                                                    : 'bg-orange-100 text-orange-600'
                                                }`}>
                                                {report.type === 'RISK_ASSESSMENT'
                                                    ? <Shield className="w-4 h-4" />
                                                    : report.type === 'WORK_PERMIT'
                                                        ? <FileText className="w-4 h-4" />
                                                        : <AlertTriangle className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-slate-800 truncate">{companyName}</p>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span>{
                                                        report.type === 'RISK_ASSESSMENT'
                                                            ? 'Risk Analizi'
                                                            : report.type === 'WORK_PERMIT'
                                                                ? 'İş İzin Formu'
                                                                : 'Acil Durum Planı'
                                                    }</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span>{reportDate}</span>
                                                </div>
                                            </div>
                                            {report.type === 'WORK_PERMIT' ? (
                                                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap bg-blue-100 text-blue-700 hidden sm:inline-block">
                                                    {(report.data as any)?.permitNo || 'İzin'}
                                                </span>
                                            ) : dangerClass && (
                                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap hidden sm:inline-block ${dangerClassStyle}`}>
                                                    {dangerClassLabel}
                                                </span>
                                            )}
                                            <Link href={report.type === 'RISK_ASSESSMENT' ? `/risk-degerlendirme?reportId=${report.id}` : '/panel/raporlarim'} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors">
                                                <ChevronRight className="w-3 h-3 text-slate-400" />
                                            </Link>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {/* Son Eklenen Risk Maddeleri */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-8">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-amber-600" />
                        Son Eklenen Riskler
                    </h2>
                    <Link href="/panel/risk-maddelerim" className="text-sm text-amber-600 font-medium hover:underline flex items-center gap-1">
                        Tümünü Gör <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent mx-auto mb-3"></div>
                        Yükleniyor...
                    </div>
                ) : userRisks.length === 0 ? (
                    <div className="p-8 text-center">
                        <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 mb-4">Henüz risk maddesi eklemediniz</p>
                        <Link
                            href="/panel/risk-maddelerim"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            İlk Risk Maddesini Ekle
                        </Link>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {userRisks.slice(0, 5).map((risk) => (
                            <li key={risk.id}>
                                <Link
                                    href="/panel/risk-maddelerim"
                                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
                                        {risk.risk_no}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 truncate">{risk.hazard}</p>
                                        <p className="text-sm text-slate-500 truncate">{risk.risk}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${risk.status === 'approved'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : risk.status === 'rejected'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {risk.status === 'approved' ? 'Onaylandı' : risk.status === 'rejected' ? 'Reddedildi' : 'Beklemede'}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Yorumlar Modal */}
            {showJobComments && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-blue-50">
                            <h2 className="text-lg font-bold text-blue-800">💬 Bekleyen İş İlanı Yorumları</h2>
                            <button
                                onClick={() => setShowJobComments(false)}
                                className="p-2 hover:bg-blue-100 rounded text-blue-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            {loadingComments ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
                                    <p className="text-gray-500">Yükleniyor...</p>
                                </div>
                            ) : pendingComments.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">Bekleyen yorum yok.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingComments.map((comment) => (
                                        <div key={comment.id} className="border rounded-lg p-4 bg-gray-50">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                                                            {comment.id.substring(0, 8)}...
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(comment.createdAt).toLocaleString('tr-TR')}
                                                        </span>
                                                    </div>
                                                    <div className="mb-2">
                                                        <p className="text-xs text-gray-600 mb-1">
                                                            <strong>Kullanıcı:</strong> {comment.user.name || 'Bilinmiyor'} ({comment.user.email})
                                                        </p>
                                                        <p className="text-xs text-gray-600">
                                                            <strong>Anonim:</strong> {comment.isAnonymous ? 'Evet' : 'Hayır'}
                                                        </p>
                                                    </div>
                                                    <p className="font-bold text-gray-800 mb-2">{comment.content}</p>
                                                    <div className="text-xs text-gray-500 bg-white p-2 rounded border">
                                                        <strong>İlan:</strong> {comment.jobPosting.content.substring(0, 100)}...
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 ml-4">
                                                    <button
                                                        onClick={() => handleApproveComment(comment.id)}
                                                        className="px-3 py-1.5 bg-green-600 text-white rounded font-bold text-xs hover:bg-green-700 flex items-center"
                                                    >
                                                        <Check className="w-3 h-3 mr-1" /> Onayla
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectComment(comment.id)}
                                                        className="px-3 py-1.5 bg-red-600 text-white rounded font-bold text-xs hover:bg-red-700 flex items-center"
                                                    >
                                                        <X className="w-3 h-3 mr-1" /> Reddet
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* İlan Onay Modal */}
            {showJobPostingApproval && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className={`rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                        <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-slate-700 bg-emerald-900/20' : 'border-slate-200 bg-emerald-50'}`}>
                            <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                                📋 Kullanıcı İlan Onayları
                                {pendingJobPostingsCount > 0 && (
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${isDark ? 'bg-emerald-500 text-white' : 'bg-emerald-600 text-white'}`}>
                                        {pendingJobPostingsCount} bekleyen
                                    </span>
                                )}
                            </h2>
                            <button
                                onClick={() => { setShowJobPostingApproval(false); setEditingJobPosting(null); }}
                                className={`p-2 rounded transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-emerald-100 text-emerald-700'}`}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto max-h-[70vh]">
                            {loadingJobPostings ? (
                                <div className="text-center py-8">
                                    <RefreshCw className={`w-8 h-8 animate-spin mx-auto mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
                                    <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Yükleniyor...</p>
                                </div>
                            ) : pendingJobPostings.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Bekleyen ilan yok.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingJobPostings.map((posting) => (
                                        <div key={posting.id} className={`border rounded-lg p-4 ${isDark ? 'border-slate-700 bg-slate-700/50' : 'border-slate-200 bg-slate-50'}`}>
                                            {editingJobPosting?.id === posting.id ? (
                                                // Düzenleme Modu
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>İlan İçeriği</label>
                                                        <textarea
                                                            rows={6}
                                                            className={`w-full border rounded p-3 text-sm ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                                                            value={editedJobContent}
                                                            onChange={e => setEditedJobContent(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => setEditingJobPosting(null)}
                                                            className={`px-3 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-slate-600 text-white hover:bg-slate-500' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                                                        >
                                                            İptal
                                                        </button>
                                                        <button
                                                            onClick={() => handleApproveJobPosting(posting.id, editedJobContent)}
                                                            className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700"
                                                        >
                                                            <Check className="w-4 h-4 inline mr-1" /> Onayla ve Yayınla
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                // Görüntüleme Modu
                                                <>
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                                <span className="font-bold">Gönderen:</span> {posting.user?.name || posting.user?.email || 'Anonim'}
                                                            </p>
                                                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                                <span className="font-bold">Tarih:</span> {new Date(posting.createdAt).toLocaleString('tr-TR')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className={`p-3 rounded-lg mb-3 whitespace-pre-wrap text-sm ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700 border border-slate-200'}`}>
                                                        {posting.content}
                                                    </div>
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => {
                                                                setEditingJobPosting(posting);
                                                                setEditedJobContent(posting.content);
                                                            }}
                                                            className={`px-3 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-slate-600 text-white hover:bg-slate-500' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                                                        >
                                                            <Edit2 className="w-4 h-4 inline mr-1" /> Düzenle
                                                        </button>
                                                        <button
                                                            onClick={() => handleApproveJobPosting(posting.id)}
                                                            className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700"
                                                        >
                                                            <Check className="w-4 h-4 inline mr-1" /> Onayla
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectJobPosting(posting.id)}
                                                            className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700"
                                                        >
                                                            <X className="w-4 h-4 inline mr-1" /> Reddet
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div >
    );
}

