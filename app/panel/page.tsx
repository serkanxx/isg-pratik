"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
    Building2, FileText, Shield, Plus, TrendingUp, Calendar,
    AlertCircle, Clock, ChevronRight, Zap, Star, Users, PlusCircle
} from 'lucide-react';
import { Company } from '../types';

interface UserRisk {
    id: string;
    risk_no: string;
    hazard: string;
    risk: string;
    status: string;
    created_at: string;
}

export default function PanelPage() {
    const { data: session } = useSession();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [userRisks, setUserRisks] = useState<UserRisk[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        companyCount: 0,
        reportCount: 0,
        riskCount: 0,
        upcomingExpirations: 0
    });

    useEffect(() => {
        fetchData();
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
        } catch (error) {
            console.error('Veri alınamadı:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Günaydın';
        if (hour < 18) return 'İyi Günler';
        return 'İyi Akşamlar';
    };

    const getPlanInfo = () => {
        const plan = (session?.user as any)?.plan;
        if (plan === 'premium_trial') return { label: 'Premium Deneme', color: 'from-amber-500 to-orange-500' };
        if (plan === 'premium') return { label: 'Premium', color: 'from-indigo-500 to-purple-500' };
        return { label: 'Free Paket', color: 'from-slate-500 to-slate-600' };
    };

    const planInfo = getPlanInfo();

    // Premium bitiş tarihi bilgisi
    const getPremiumExpiryText = () => {
        const plan = (session?.user as any)?.plan;
        const trialEndsAt = (session?.user as any)?.trialEndsAt;

        if (plan === 'premium_trial' && trialEndsAt) {
            const endDate = new Date(trialEndsAt);
            const now = new Date();
            const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return `${daysLeft} gün kaldı (${endDate.toLocaleDateString('tr-TR')})`;
        }
        return '';
    };

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
                        <p className="text-indigo-200 flex items-center gap-2">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${planInfo.color} shadow-lg`}>
                                {planInfo.label}
                            </span>
                        </p>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        {/* Premium Bilgisi */}
                        {getPremiumExpiryText() && (
                            <div className="text-right">
                                <p className="text-indigo-200 text-xs font-medium">Deneme Süresi</p>
                                <p className="text-white font-bold text-sm">{getPremiumExpiryText()}</p>
                            </div>
                        )}
                        <img src="/logo.png" alt="Logo" className="w-20 h-20 opacity-80" />
                    </div>
                </div>
            </div>

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

                <div className="flex items-center gap-4 p-5 bg-white rounded-xl border border-slate-200 opacity-60 cursor-not-allowed">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-400">Rapor Oluştur</h3>
                        <p className="text-sm text-slate-400">Yakında</p>
                    </div>
                </div>
            </div>

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Firma Sayısı */}
                <Link href="/panel/firmalar" className="block">
                    <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg hover:border-indigo-200 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-800 mb-1">
                            {loading ? '...' : stats.companyCount}
                        </h3>
                        <p className="text-sm text-slate-500">Kayıtlı Firma</p>
                    </div>
                </Link>

                {/* Risklerim Kartı */}
                <Link href="/panel/risk-maddelerim" className="block">
                    <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg hover:border-amber-200 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                <Shield className="w-6 h-6" />
                            </div>
                            <PlusCircle className="w-5 h-5 text-amber-500" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-800 mb-1">
                            {loading ? '...' : stats.riskCount}
                        </h3>
                        <p className="text-sm text-slate-500">Risklerim</p>
                    </div>
                </Link>

                {/* Rapor Sayısı */}
                <div className="bg-white rounded-xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                            <FileText className="w-6 h-6" />
                        </div>
                        <span className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-500 font-bold">
                            YAKINDA
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800 mb-1">0</h3>
                    <p className="text-sm text-slate-500">Oluşturulan Rapor</p>
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
        </div>
    );
}
