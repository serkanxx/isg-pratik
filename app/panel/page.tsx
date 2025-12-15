"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
    Building2, FileText, Shield, Plus, TrendingUp,
    AlertCircle, ChevronRight, PlusCircle, PieChart, Activity, AlertTriangle,
    StickyNote, Clock, Check, Trash2, Bell, X
} from 'lucide-react';
import { Company } from '../types';

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
    type: 'RISK_ASSESSMENT' | 'EMERGENCY_PLAN';
    title: string;
    createdAt: string;
    data: any;
}

export default function PanelPage() {
    const { data: session } = useSession();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [userRisks, setUserRisks] = useState<UserRisk[]>([]);
    const [recentReports, setRecentReports] = useState<ReportData[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        companyCount: 0,
        reportCount: 0,
        riskCount: 0,
        riskReportCount: 0,
        emergencyReportCount: 0
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

    useEffect(() => {
        fetchData();
        fetchNotes();
        fetchUpcomingNotes();
    }, []);

    const fetchData = async () => {
        try {
            // Firmaları çek
            const res = await fetch('/api/companies');
            if (res.ok) {
                const data = await res.json();
                setCompanies(data);
                setStats(prev => ({ ...prev, companyCount: data.length }));
            }

            // Kullanıcı risklerini çek
            const risksRes = await fetch('/api/user-risks');
            if (risksRes.ok) {
                const risksData = await risksRes.json();
                setUserRisks(risksData);
                setStats(prev => ({ ...prev, riskCount: risksData.length }));
            }

            // Raporları çek ve analiz et
            const allReportsRes = await fetch('/api/reports');
            if (allReportsRes.ok) {
                const allReports: ReportData[] = await allReportsRes.json();

                // Son 5 raporu kaydet
                setRecentReports(allReports.slice(0, 5));

                const riskReports = allReports.filter(r => r.type === 'RISK_ASSESSMENT').length;
                const emergencyReports = allReports.filter(r => r.type === 'EMERGENCY_PLAN').length;

                setStats(prev => ({
                    ...prev,
                    reportCount: allReports.length,
                    riskReportCount: riskReports,
                    emergencyReportCount: emergencyReports
                }));
            }
        } catch (error) {
            console.error('Veri alınamadı:', error);
        } finally {
            setLoading(false);
        }
    };

    // Tüm notları getir
    const fetchNotes = async () => {
        try {
            const res = await fetch('/api/notes');
            if (res.ok) {
                const data = await res.json();
                setNotes(data);
            }
        } catch (error) {
            console.error('Notlar alınamadı:', error);
        }
    };

    // Yaklaşan hatırlatmalar (5 gün içinde)
    const fetchUpcomingNotes = async () => {
        try {
            const res = await fetch('/api/notes?upcoming=true');
            if (res.ok) {
                const data = await res.json();
                setUpcomingNotes(data);
            }
        } catch (error) {
            console.error('Hatırlatmalar alınamadı:', error);
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
                fetchNotes();
                fetchUpcomingNotes();
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
            fetchNotes();
            fetchUpcomingNotes();
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
            fetchUpcomingNotes();
        } catch (error) {
            console.error('Not silinemedi:', error);
        }
    };

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

    // Acil Durum Dilimi (Kalan kısım)
    const emergencyPercent = stats.emergencyReportCount / totalReports;
    const emergencyDash = emergencyPercent * circumference;

    // Boş durum kontrolü
    const isEmpty = stats.reportCount === 0;

    return (
        <div className="p-8">
            {/* Hoşgeldin Kartı */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-8 mb-8 text-white shadow-xl shadow-indigo-600/20">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-indigo-200 text-sm font-medium mb-1">{getGreeting()}</p>
                        <h1 className="text-3xl font-bold mb-2">
                            {session?.user?.name || 'Kullanıcı'}
                        </h1>
                        <p className="text-indigo-200">
                            İSG Pratik Risk Yönetim Sistemi
                        </p>

                        {/* Admin Butonları */}
                        {/* @ts-ignore */}
                        {session?.user?.role === 'ADMIN' && (
                            <div className="flex items-center gap-3 mt-4">
                                <Link
                                    href="/admin"
                                    className="inline-flex items-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-bold text-sm transition-colors shadow-lg"
                                >
                                    <span className="mr-2">⚙️</span>
                                    Admin Paneli
                                </Link>
                                <Link
                                    href="/panel?showRiskSuggestions=true"
                                    className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-sm transition-colors shadow-lg"
                                >
                                    <span className="mr-2">📥</span>
                                    Risk Önerileri
                                </Link>
                            </div>
                        )}
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        <img src="/logo.png" alt="Logo" className="w-20 h-20 opacity-80" />
                    </div>
                </div>
            </div>

            {/* Hatırlatmalar Kartı */}
            {upcomingNotes.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5 mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Bell className="w-5 h-5 text-amber-600" />
                        <h2 className="font-bold text-amber-800">Hatırlatmalar</h2>
                        <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
                            {upcomingNotes.length}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {upcomingNotes.slice(0, 6).map((note) => (
                            <div
                                key={note.id}
                                className={`p-3 rounded-xl border transition-all ${isOverdue(note.dueDate)
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-white border-amber-200'
                                    }`}
                            >
                                <div className="flex items-start gap-2">
                                    <button
                                        onClick={() => toggleNoteComplete(note.id, note.isCompleted)}
                                        className="mt-0.5 w-5 h-5 rounded-full border-2 border-amber-400 hover:border-emerald-500 flex items-center justify-center flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-700 line-clamp-2">{note.content}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-xs font-medium ${isOverdue(note.dueDate) ? 'text-red-600' : 'text-amber-600'
                                                }`}>
                                                <Clock className="w-3 h-3 inline mr-1" />
                                                {formatDate(note.dueDate)}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {getCompanyName(note.companyId)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* Hızlı Erişim Butonları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Link
                    href="/panel/firmalar?new=true"
                    className="flex items-center gap-4 p-5 bg-white rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group"
                >
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Plus className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Yeni Firma Ekle</h3>
                        <p className="text-sm text-slate-500">Firma bilgilerini kaydet</p>
                    </div>
                </Link>

                <Link
                    href="/risk-degerlendirme"
                    className="flex items-center gap-4 p-5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:scale-[1.02] transition-all group"
                >
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold">Yeni Risk Analizi</h3>
                        <p className="text-sm text-emerald-100">Hemen başla</p>
                    </div>
                    <ChevronRight className="w-5 h-5 ml-auto opacity-70" />
                </Link>

                <Link
                    href="/panel/acil-durum"
                    className="flex items-center gap-4 p-5 bg-white rounded-xl border border-slate-200 hover:shadow-lg hover:border-orange-200 transition-all group"
                >
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Acil Durum Planı</h3>
                        <p className="text-sm text-slate-500">Hemen oluştur</p>
                    </div>
                    <ChevronRight className="w-5 h-5 ml-auto opacity-0 group-hover:opacity-70 transition-opacity" />
                </Link>
            </div>

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Firma Sayısı */}
                <Link href="/panel/firmalar" className="block h-full">
                    <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg hover:border-indigo-200 transition-all group h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-slate-800 mb-1">
                                {loading ? '...' : stats.companyCount}
                            </h3>
                            <p className="text-sm text-slate-500">Kayıtlı Firma</p>
                        </div>
                    </div>
                </Link>

                {/* Risklerim Kartı */}
                <Link href="/panel/risk-maddelerim" className="block h-full">
                    <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg hover:border-amber-200 transition-all group h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                <Shield className="w-6 h-6" />
                            </div>
                            <PlusCircle className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-slate-800 mb-1">
                                {loading ? '...' : stats.riskCount}
                            </h3>
                            <p className="text-sm text-slate-500">Risklerim</p>
                        </div>
                    </div>
                </Link>

                {/* Rapor İstatistikleri Grafiği */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 relative overflow-hidden h-full">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-bold text-slate-800 mb-1">Rapor Özeti</h3>
                            <p className="text-sm text-slate-500 mb-4">Oluşturulan Raporlar</p>

                            {/* Legend */}
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span className="text-slate-600 font-medium">Risk: {stats.riskReportCount}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                    <span className="text-slate-600 font-medium">Acil Durum: {stats.emergencyReportCount}</span>
                                </div>
                            </div>
                        </div>

                        {/* Donut Chart */}
                        <div className="relative w-24 h-24 flex-shrink-0">
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
                                            strokeDashoffset={-riskDash} // Risk bitiminden başla
                                            strokeLinecap="round"
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </>
                                )}
                            </svg>
                            {/* Ortadaki Sayı */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-slate-800 leading-none">
                                    {stats.reportCount}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Son Firmalar */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        Son Eklenen Firmalar
                    </h2>
                    <Link href="/panel/firmalar" className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
                        Tümünü Gör <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto mb-3"></div>
                        Yükleniyor...
                    </div>
                ) : companies.length === 0 ? (
                    <div className="p-8 text-center">
                        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 mb-4">Henüz firma eklemediniz</p>
                        <Link
                            href="/panel/firmalar?new=true"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            İlk Firmayı Ekle
                        </Link>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {companies.slice(0, 5).map((company) => (
                            <li key={company.id}>
                                <Link
                                    href={`/panel/firmalar?edit=${company.id}`}
                                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                                        {company.title.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 truncate">{company.title}</p>
                                        <p className="text-sm text-slate-500 truncate">{company.address || 'Adres girilmemiş'}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${company.danger_class === 'az_tehlikeli'
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
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Son Alınan Raporlar */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-8">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        Son Alınan Raporlar
                    </h2>
                    <Link href="/panel/raporlarim" className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
                        Tümünü Gör <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto mb-3"></div>
                        Yükleniyor...
                    </div>
                ) : recentReports.length === 0 ? (
                    <div className="p-8 text-center">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 mb-4">Henüz rapor oluşturmadınız</p>
                        <div className="flex justify-center gap-3">
                            <Link href="/risk-degerlendirme" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                                Risk Analizi
                            </Link>
                            <Link href="/panel/acil-durum" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
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
                                    <div className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${report.type === 'RISK_ASSESSMENT' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                                            {report.type === 'RISK_ASSESSMENT' ? <Shield className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-800 truncate">{companyName}</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span>{report.type === 'RISK_ASSESSMENT' ? 'Risk Analizi' : 'Acil Durum Planı'}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span>{reportDate}</span>
                                            </div>
                                        </div>
                                        {dangerClass && (
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap hidden sm:inline-block ${dangerClassStyle}`}>
                                                {dangerClassLabel}
                                            </span>
                                        )}
                                        <Link href={report.type === 'RISK_ASSESSMENT' ? `/risk-degerlendirme?reportId=${report.id}` : '/panel/raporlarim'} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                        </Link>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Son Eklenen Risk Maddeleri */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-8">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-amber-600" />
                        Son Eklenen Risk Maddeleri
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

            {/* Notlar Kartı */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-8">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <StickyNote className="w-5 h-5 text-amber-500" />
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
                                    <span className="text-xs text-slate-500 whitespace-nowrap">Hedef Tarih :</span>
                                    <select
                                        value={dueDateDay}
                                        onChange={(e) => setDueDateDay(e.target.value)}
                                        className="w-16 p-2 border border-amber-200 rounded-lg text-sm bg-white"
                                    >
                                        <option value="">Gün</option>
                                        {days.map(d => <option key={d} value={String(d)}>{d}</option>)}
                                    </select>
                                    <select
                                        value={dueDateMonth}
                                        onChange={(e) => setDueDateMonth(e.target.value)}
                                        className="w-24 p-2 border border-amber-200 rounded-lg text-sm bg-white"
                                    >
                                        <option value="">Ay</option>
                                        {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                    <select
                                        value={dueDateYear}
                                        onChange={(e) => setDueDateYear(e.target.value)}
                                        className="w-20 p-2 border border-amber-200 rounded-lg text-sm bg-white"
                                    >
                                        <option value="">Yıl</option>
                                        {yearOptions.map(y => <option key={y} value={String(y)}>{y}</option>)}
                                    </select>
                                </div>
                                <button
                                    onClick={handleAddNote}
                                    className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 transition-colors"
                                >
                                    Ekle
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Not Listesi */}
                {notes.length === 0 ? (
                    <div className="p-8 text-center">
                        <StickyNote className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 mb-4">Henüz not eklemediniz</p>
                        <button
                            onClick={() => setShowNoteForm(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            İlk Notu Ekle
                        </button>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
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
    );
}

