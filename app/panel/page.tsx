"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, apiFetchers } from '@/lib/queries';
import {
    Building2, FileText, Shield, Plus, TrendingUp,
    AlertCircle, ChevronRight, PlusCircle, PieChart, Activity, AlertTriangle,
    StickyNote, Clock, Check, Trash2, Bell, X, Calendar
} from 'lucide-react';
import { Company } from '../types';
import { useTheme } from '@/app/context/ThemeContext';

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

export default function PanelPage() {
    const { data: session } = useSession();
    const { isDark } = useTheme();
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
                        {/* @ts-ignore */}
                        {session?.user?.role === 'ADMIN' && (
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
                <Link
                    href="/panel/firmalar?new=true"
                    className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-white rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group"
                >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all flex-shrink-0">
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 text-sm sm:text-base">Yeni Firma Ekle</h3>
                        <p className="text-xs sm:text-sm text-slate-500 truncate">Firma bilgilerini kaydet</p>
                    </div>
                </Link>

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
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <span className="text-slate-600 font-medium">İş İzin: {stats.workPermitCount}</span>
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
                                <span className="text-2xl font-bold text-slate-800 leading-none">
                                    {stats.reportCount}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Container for Visit Programs and Notes */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6 w-full">
                {/* Ziyaret Programları */}
                {visitPrograms.length > 0 && (
                    <div className="xl:col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden w-full">
                        <div className="p-3 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-indigo-600" />
                                Ziyaret Programım
                            </h2>
                            <Link href="/panel/ziyaret-programi" className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1">
                                Tümünü Gör <ChevronRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="p-3">
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
                                            className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all bg-white w-full"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
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
                                            <div className="mt-2 pt-2 border-t border-indigo-100/50 dark:border-indigo-900/30">
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

                {/* Notlar Kartı (Taşındı) */}
                <div className="xl:col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden h-full">
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
                        <ul className="divide-y divide-slate-100 h-[400px] overflow-y-auto">
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


        </div >
    );
}

