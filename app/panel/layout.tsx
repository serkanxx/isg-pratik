"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Building2, FileText, Shield, AlertTriangle, Eye, FileCheck,
    ChevronRight, LogOut, User, Settings, Home, LayoutDashboard,
    PlusCircle, Info
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const menuItems = [
    {
        name: 'Dashboard',
        href: '/panel',
        icon: LayoutDashboard,
        active: true
    },
    {
        name: 'Firmalarım',
        href: '/panel/firmalar',
        icon: Building2,
        active: true
    },
    {
        name: 'Risklerim',
        href: '/panel/risk-maddelerim',
        icon: Shield,
        active: true
    },
    {
        name: 'Oluşturduklarım',
        href: '/panel/olusturduklarim',
        icon: FileText,
        active: false,
        badge: 'YAKINDA'
    },
    { type: 'divider' },
    {
        name: 'Risk Değerlendirmesi',
        href: '/risk-degerlendirme',
        icon: Shield,
        active: true,
        highlight: true
    },
    {
        name: 'Acil Durum Planları',
        href: '#',
        icon: AlertTriangle,
        active: false,
        badge: 'YAKINDA'
    },
    {
        name: 'Saha Gözlem Formları',
        href: '#',
        icon: Eye,
        active: false,
        badge: 'YAKINDA'
    },
    {
        name: 'DÖF Yönetimi',
        href: '#',
        icon: FileCheck,
        active: false,
        badge: 'YAKINDA'
    },
];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    // Giriş yapmamış kullanıcıları yönlendir
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Sidebar */}
            <aside className="w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col fixed h-screen">
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <Link href="/" className="flex items-center group">
                        <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                        <div className="ml-3">
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                                İSG Pratik
                            </span>
                            <span className="block text-[10px] text-blue-300/70 tracking-widest uppercase">
                                Yönetim Paneli
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Kullanıcı Bilgisi */}
                <div className="px-6 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {session.user?.name || session.user?.email}
                            </p>
                            <span className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-bold">
                                {(session.user as any)?.plan === 'premium_trial' ? 'PREMIUM DENEME' :
                                    (session.user as any)?.plan === 'premium' ? 'PREMIUM' : 'FREE'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Menü */}
                <nav className="flex-1 px-4 py-6 overflow-y-auto">
                    <ul className="space-y-1">
                        {menuItems.map((item, index) => {
                            if (item.type === 'divider') {
                                return <li key={index} className="my-4 border-t border-white/10" />;
                            }

                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <li key={index}>
                                    <Link
                                        href={item.active ? item.href : '#'}
                                        className={`
                                            flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                                            ${isActive
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                                : item.active
                                                    ? item.highlight
                                                        ? 'text-emerald-400 hover:bg-white/5'
                                                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                                    : 'text-slate-500 cursor-not-allowed'
                                            }
                                        `}
                                    >
                                        {Icon && <Icon className="w-5 h-5" />}
                                        <span className="flex-1">{item.name}</span>
                                        {item.badge && (
                                            <span className="text-[9px] px-2 py-0.5 bg-white/10 rounded-full text-slate-400 font-bold">
                                                {item.badge}
                                            </span>
                                        )}
                                        {item.active && !item.badge && (
                                            <ChevronRight className="w-4 h-4 opacity-50" />
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Risk Maddesi Ekle - Ayrı Bölüm */}
                <div className="px-4 py-4 border-t border-white/10">
                    <Link
                        href="/panel/risk-maddelerim"
                        className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                            ${pathname === '/panel/risk-maddelerim'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                : 'text-amber-400 hover:bg-white/5 hover:text-amber-300'
                            }
                        `}
                    >
                        <PlusCircle className="w-5 h-5" />
                        <span className="flex-1">Risk Maddesi Ekle</span>
                        <div className="relative group">
                            <Info className="w-4 h-4 opacity-70 cursor-help" />
                            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-[10px] text-slate-300 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-white/10">
                                Risk Değerlendirme Maddelerini kalıcı olarak sisteme öner, katkıda bulun.
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Alt Menü */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Çıkış Yap</span>
                    </button>
                </div>
            </aside>

            {/* Ana İçerik */}
            <main className="flex-1 ml-72 min-h-screen">
                {children}
            </main>
        </div>
    );
}
