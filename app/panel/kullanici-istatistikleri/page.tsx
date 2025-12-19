"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Users, Building2, FileText, Shield, StickyNote, Calendar,
    TrendingUp, User, Mail, Phone, Clock, ChevronLeft, Search,
    PieChart, BarChart3, Activity, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface UserStatistics {
    id: string;
    name: string | null;
    email: string;
    role: string;
    plan: string;
    trialEndsAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    phone: string | null;
    phoneVerified: boolean;
    statistics: {
        companyCount: number;
        reportStats: {
            total: number;
            riskAssessment: number;
            emergencyPlan: number;
            workPermit: number;
        };
        riskCount: number;
        noteCount: number;
        visitProgramCount: number;
        lastActivity: Date;
    };
}

interface SummaryData {
    totalUsers: number;
    newUsersThisMonth: number;
    newUsersThisWeek: number;
    totalCompanies: number;
    totalReports: number;
    totalRisks: number;
    planDistribution: {
        premium_trial: number;
        free: number;
        premium: number;
    };
}

export default function KullaniciIstatistikleriPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const { isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserStatistics[]>([]);
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<string>('all');
    const [error, setError] = useState<string | null>(null);

    const ADMIN_EMAIL = 'serkanxx@gmail.com';
    const isAdmin = session?.user?.email === ADMIN_EMAIL || (session?.user as any)?.role === 'ADMIN';

    useEffect(() => {
        if (!isAdmin) {
            router.push('/panel');
            return;
        }
        fetchStatistics();
    }, [isAdmin, router]);

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/admin/user-statistics');
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'İstatistikler yüklenemedi');
            }
            
            if (data.success && data.data) {
                setUsers(data.data.users || []);
                setSummary(data.data.summary || null);
            } else {
                throw new Error('Geçersiz veri formatı');
            }
        } catch (error: any) {
            console.error('İstatistikler yüklenemedi:', error);
            setError(error.message || 'İstatistikler yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date | string) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatDateTime = (date: Date | string) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleString('tr-TR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeAgo = (date: Date | string) => {
        if (!date) return '-';
        const now = new Date();
        const past = new Date(date);
        const diffMs = now.getTime() - past.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (diffDays > 0) return `${diffDays} gün önce`;
        if (diffHours > 0) return `${diffHours} saat önce`;
        if (diffMinutes > 0) return `${diffMinutes} dakika önce`;
        return 'Az önce';
    };

    const getPlanLabel = (plan: string) => {
        switch (plan) {
            case 'premium_trial': return 'Premium Deneme';
            case 'premium': return 'Premium';
            case 'free': return 'Ücretsiz';
            default: return plan;
        }
    };

    const getPlanColor = (plan: string) => {
        switch (plan) {
            case 'premium_trial': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'premium': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
            case 'free': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Filtreleme
    const filteredUsers = users.filter(user => {
        const matchesSearch = 
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlan = selectedPlan === 'all' || user.plan === selectedPlan;
        return matchesSearch && matchesPlan;
    });

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Başlık */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <Link
                        href="/panel"
                        className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 mb-2"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Panele Dön
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <PieChart className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                        Kullanıcı İstatistikleri
                    </h1>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        <h3 className="text-lg font-bold text-red-800 dark:text-red-300">Hata</h3>
                    </div>
                    <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
                    <button
                        onClick={fetchStatistics}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                        Tekrar Dene
                    </button>
                </div>
            ) : (
                <>
                    {/* Özet Kartları */}
                    {summary && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <Users className="w-8 h-8 opacity-80" />
                                    <TrendingUp className="w-5 h-5 opacity-70" />
                                </div>
                                <div className="text-3xl font-bold mb-1">{summary.totalUsers}</div>
                                <div className="text-sm opacity-90">Toplam Kullanıcı</div>
                                <div className="text-xs opacity-75 mt-2">
                                    Bu ay: +{summary.newUsersThisMonth} | Bu hafta: +{summary.newUsersThisWeek}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <Building2 className="w-8 h-8 opacity-80" />
                                    <TrendingUp className="w-5 h-5 opacity-70" />
                                </div>
                                <div className="text-3xl font-bold mb-1">{summary.totalCompanies}</div>
                                <div className="text-sm opacity-90">Toplam Firma</div>
                            </div>

                            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <FileText className="w-8 h-8 opacity-80" />
                                    <TrendingUp className="w-5 h-5 opacity-70" />
                                </div>
                                <div className="text-3xl font-bold mb-1">{summary.totalReports}</div>
                                <div className="text-sm opacity-90">Toplam Rapor</div>
                            </div>

                            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <Shield className="w-8 h-8 opacity-80" />
                                    <TrendingUp className="w-5 h-5 opacity-70" />
                                </div>
                                <div className="text-3xl font-bold mb-1">{summary.totalRisks}</div>
                                <div className="text-sm opacity-90">Toplam Risk</div>
                            </div>
                        </div>
                    )}

                    {/* Plan Dağılımı */}
                    {summary && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Plan Dağılımı
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                        {summary.planDistribution.premium_trial}
                                    </div>
                                    <div className="text-sm text-blue-600 dark:text-blue-400">Premium Deneme</div>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                        {summary.planDistribution.premium}
                                    </div>
                                    <div className="text-sm text-purple-600 dark:text-purple-400">Premium</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                                        {summary.planDistribution.free}
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">Ücretsiz</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filtreleme */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Kullanıcı adı veya email ile ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                />
                            </div>
                            <select
                                value={selectedPlan}
                                onChange={(e) => setSelectedPlan(e.target.value)}
                                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                            >
                                <option value="all">Tüm Planlar</option>
                                <option value="premium_trial">Premium Deneme</option>
                                <option value="premium">Premium</option>
                                <option value="free">Ücretsiz</option>
                            </select>
                        </div>
                    </div>

                    {/* Kullanıcı Listesi */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-600" />
                                Kullanıcılar ({filteredUsers.length})
                            </h2>
                        </div>

                        {filteredUsers.length === 0 ? (
                            <div className="p-12 text-center">
                                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                {users.length === 0 ? (
                                    <>
                                        <p className="text-slate-500 dark:text-slate-400 mb-2">Henüz kayıtlı kullanıcı bulunmuyor</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">Veritabanında kullanıcı kaydı yok</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-slate-500 dark:text-slate-400 mb-2">Arama kriterlerinize uygun kullanıcı bulunamadı</p>
                                        <button
                                            onClick={() => {
                                                setSearchTerm('');
                                                setSelectedPlan('all');
                                            }}
                                            className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                                        >
                                            Filtreleri Temizle
                                        </button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                                            {/* Kullanıcı Bilgileri */}
                                            <div className="flex-1">
                                                <div className="flex items-start gap-4 mb-4">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                                        {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                                                {user.name || 'İsimsiz Kullanıcı'}
                                                            </h3>
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getPlanColor(user.plan)}`}>
                                                                {getPlanLabel(user.plan)}
                                                            </span>
                                                            {user.role === 'admin' && (
                                                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                                                    Admin
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                                            <div className="flex items-center gap-1">
                                                                <Mail className="w-4 h-4" />
                                                                {user.email}
                                                            </div>
                                                            {user.phone && (
                                                                <div className="flex items-center gap-1">
                                                                    <Phone className="w-4 h-4" />
                                                                    {user.phone}
                                                                    {user.phoneVerified && (
                                                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* İstatistikler */}
                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
                                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Building2 className="w-4 h-4 text-indigo-600" />
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">Firma</span>
                                                        </div>
                                                        <div className="text-xl font-bold text-slate-800 dark:text-white">
                                                            {user.statistics.companyCount}
                                                        </div>
                                                    </div>

                                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <FileText className="w-4 h-4 text-orange-600" />
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">Rapor</span>
                                                        </div>
                                                        <div className="text-xl font-bold text-slate-800 dark:text-white">
                                                            {user.statistics.reportStats.total}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                            Risk: {user.statistics.reportStats.riskAssessment} | 
                                                            Acil: {user.statistics.reportStats.emergencyPlan} | 
                                                            İzin: {user.statistics.reportStats.workPermit}
                                                        </div>
                                                    </div>

                                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Shield className="w-4 h-4 text-amber-600" />
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">Risk</span>
                                                        </div>
                                                        <div className="text-xl font-bold text-slate-800 dark:text-white">
                                                            {user.statistics.riskCount}
                                                        </div>
                                                    </div>

                                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <StickyNote className="w-4 h-4 text-purple-600" />
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">Not</span>
                                                        </div>
                                                        <div className="text-xl font-bold text-slate-800 dark:text-white">
                                                            {user.statistics.noteCount}
                                                        </div>
                                                    </div>

                                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Calendar className="w-4 h-4 text-emerald-600" />
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">Ziyaret</span>
                                                        </div>
                                                        <div className="text-xl font-bold text-slate-800 dark:text-white">
                                                            {user.statistics.visitProgramCount}
                                                        </div>
                                                    </div>

                                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Activity className="w-4 h-4 text-blue-600" />
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">Son Aktivite</span>
                                                        </div>
                                                        <div className="text-xs font-medium text-slate-800 dark:text-white">
                                                            {getTimeAgo(user.statistics.lastActivity)}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                                            {formatDateTime(user.statistics.lastActivity)}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Üyelik Bilgileri */}
                                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            Üyelik: {formatDate(user.createdAt)}
                                                        </div>
                                                        {user.trialEndsAt && (
                                                            <div className="flex items-center gap-1">
                                                                <AlertCircle className="w-3 h-3" />
                                                                Deneme Bitiş: {formatDate(user.trialEndsAt)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
