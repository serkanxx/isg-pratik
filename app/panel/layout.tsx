"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Building2, FileText, Shield, AlertTriangle, Eye, FileCheck,
    ChevronRight, LogOut, User, Settings, Home, LayoutDashboard,
    PlusCircle, Info, Clock, X, Check, RefreshCw, Edit, Save, Menu, StickyNote,
    Headphones as HeadphonesIcon, Moon, Sun, Calendar, Search, Briefcase, FolderOpen, Loader2, Bell
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { P_VALUES, F_VALUES, S_VALUES } from '../utils';
import { useTheme } from '@/app/context/ThemeContext';
import OnboardingTour, { useTourStatus } from '@/components/OnboardingTour';

const menuItems = [
    {
        name: 'Firmalarım',
        href: '/panel/firmalar',
        icon: Building2,
        active: true,
        dataTour: 'firmalar'
    },
    {
        name: 'Risklerim',
        href: '/panel/risk-maddelerim',
        icon: Shield,
        active: true,
        dataTour: 'risklerim'
    },
    {
        name: 'Raporlarım',
        href: '/panel/raporlarim',
        icon: FileText,
        active: true,
        dataTour: 'raporlarim'
    },
    {
        name: 'Notlarım',
        href: '/panel/notlarim',
        icon: StickyNote,
        active: true,
        dataTour: 'notlarim'
    },

    { type: 'divider' },
    {
        name: 'Risk Değerlendirmesi',
        href: '/risk-degerlendirme',
        icon: Shield,
        active: true,
        highlight: true,
        dataTour: 'risk-degerlendirme'
    },
    {
        name: 'Acil Durum Eylem Planı',
        href: '/panel/acil-durum',
        icon: AlertTriangle,
        active: true,
        dataTour: 'acil-durum'
    },
    {
        name: 'İş İzin Formu',
        href: '/panel/is-izin-formu',
        icon: FileCheck,
        active: true,
        dataTour: 'is-izin'
    },
    {
        name: 'Firma Ziyaret Programı',
        href: '/panel/ziyaret-programi',
        icon: Calendar,
        active: true,
        dataTour: 'ziyaret-programi'
    },
    {
        name: 'Nace  Teh. Sınıf Sorgula',
        href: '/panel/nace-kod',
        icon: Search,
        active: true,
        dataTour: 'nace-kod'
    },
    {
        name: 'İSG İş İlanları',
        href: '/is-ilanlari',
        icon: Briefcase,
        active: true,
        dataTour: 'is-ilanlari'
    },
    {
        name: 'İSG Dosya Arşivi',
        href: '/panel/arsiv',
        icon: FolderOpen,
        active: true,
        highlight: true,
        featured: true,
        dataTour: 'arsiv'
    },
];

const ADMIN_EMAIL = 'serkanxx@gmail.com';

function PanelLayoutInner({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { isDark, toggleTheme } = useTheme();
    const { showTour, completeTour } = useTourStatus();

    // Admin Risk Önerileri State
    const [pendingRisksCount, setPendingRisksCount] = useState(0);
    const [showRiskSuggestions, setShowRiskSuggestions] = useState(false);
    const [pendingRisks, setPendingRisks] = useState<any[]>([]);
    const [loadingRisks, setLoadingRisks] = useState(false);
    const [editingRisk, setEditingRisk] = useState<any | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [showHamburgerTooltip, setShowHamburgerTooltip] = useState(false);
    const [archiveFileCount, setArchiveFileCount] = useState<number | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());

    const isAdmin = session?.user?.email === ADMIN_EMAIL;

    // Giriş yapmamış kullanıcıları yönlendir
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Query param ile Risk Önerileri modal'ını aç
    useEffect(() => {
        if (searchParams?.get('showRiskSuggestions') === 'true' && isAdmin) {
            setShowRiskSuggestions(true);
            fetchPendingRisks();
            // URL'den query param'ı temizle
            router.replace('/panel');
        }
    }, [searchParams, isAdmin]);

    // Admin için bekleyen önerileri çek
    useEffect(() => {
        if (isAdmin) {
            fetchPendingCount();
        }
    }, [isAdmin]);

    // R2'den arşiv dosya sayısını çek
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

    // Bildirimleri localStorage'dan yükle
    useEffect(() => {
        const stored = localStorage.getItem('readNotificationIds');
        if (stored) {
            try {
                setReadNotificationIds(new Set(JSON.parse(stored)));
            } catch (err) {
                console.error("Bildirim verileri yüklenemedi:", err);
            }
        }
    }, []);

    // Bildirim verileri
    const today = new Date();
    const notifications = [
        {
            id: 'is-ilanlari',
            title: 'İSG İş İlanları Eklendi',
            description: 'İSG iş ilanları bölümü eklendi, iş arayanlar ve işverenler için platform oluşturuldu.',
            date: new Date(today)
        },
        {
            id: 'mobil-iyilestirme',
            title: 'Mobil Görünümde İyileştirmeler Yapıldı',
            description: 'Mobil cihazlarda daha iyi bir deneyim için arayüz iyileştirmeleri yapıldı.',
            date: new Date(today)
        },
        {
            id: 'dosya-arsivi',
            title: 'İSG Dev Dosya Arşivi Eklendi',
            description: 'Kapsamlı İSG dosya arşivi eklendi, binlerce dokümana kolayca erişebilirsiniz.',
            date: new Date(today)
        }
    ];

    // Okunmamış bildirim sayısı
    const unreadCount = notifications.filter(n => !readNotificationIds.has(n.id)).length;

    // Bildirim penceresini aç
    const handleOpenNotifications = () => {
        setShowNotifications(true);
    };

    // Bildirim penceresini kapat
    const handleCloseNotifications = () => {
        setShowNotifications(false);
    };

    // Bildirim penceresi açıldığında 2 saniye sonra otomatik okundu işaretle
    useEffect(() => {
        if (showNotifications && unreadCount > 0) {
            const timer = setTimeout(() => {
                // Tüm okunmamış bildirimleri okundu olarak işaretle
                setReadNotificationIds(prevIds => {
                    const unreadIds = notifications
                        .filter(n => !prevIds.has(n.id))
                        .map(n => n.id);
                    
                    if (unreadIds.length > 0) {
                        const newReadIds = new Set(prevIds);
                        unreadIds.forEach(id => newReadIds.add(id));
                        localStorage.setItem('readNotificationIds', JSON.stringify(Array.from(newReadIds)));
                        return newReadIds;
                    }
                    return prevIds;
                });
            }, 2000); // 2 saniye

            return () => clearTimeout(timer);
        }
    }, [showNotifications, unreadCount]);

    // Tur tamamlandığında bildirim penceresini aç
    const handleTourComplete = () => {
        completeTour();
        // Tur tamamlandıktan sonra bildirim penceresini aç
        const hasOpenedNotifications = localStorage.getItem('notifications_auto_opened');
        if (!hasOpenedNotifications) {
            // Okunmamış bildirim sayısını kontrol et
            const currentUnreadCount = notifications.filter(n => !readNotificationIds.has(n.id)).length;
            if (currentUnreadCount > 0) {
                // Tur animasyonlarının bitmesi için kısa bir gecikme
                setTimeout(() => {
                    setShowNotifications(true);
                    localStorage.setItem('notifications_auto_opened', 'true');
                }, 1500);
            }
        }
    };

    // Bildirimi okundu olarak işaretle
    const markAsRead = (id: string) => {
        const newReadIds = new Set(readNotificationIds);
        newReadIds.add(id);
        setReadNotificationIds(newReadIds);
        localStorage.setItem('readNotificationIds', JSON.stringify(Array.from(newReadIds)));
    };

    // Tüm bildirimleri okundu olarak işaretle
    const markAllAsRead = () => {
        const allIds = new Set(notifications.map(n => n.id));
        setReadNotificationIds(allIds);
        localStorage.setItem('readNotificationIds', JSON.stringify(Array.from(allIds)));
    };

    // Hamburger menü tooltip kontrolü - sadece mobil ve ilk girişte (ve tur aktif değilse)
    useEffect(() => {
        // Eğer onboarding turu aktifse, hamburger tooltip'ı gösterme
        if (showTour) {
            setShowHamburgerTooltip(false);
            return;
        }

        const hasSeenTooltip = localStorage.getItem('hamburger_menu_tooltip_seen');
        if (!hasSeenTooltip) {
            // Mobil cihaz kontrolü
            const isMobile = window.innerWidth < 768; // md breakpoint
            if (isMobile) {
                // Sayfa yüklendk sonra kısa bir süre sonra göster
                const timer = setTimeout(() => {
                    setShowHamburgerTooltip(true);
                }, 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [showTour]);

    // Hamburger menüye tıklandığında tooltip'i kapat
    const handleHamburgerClick = () => {
        setIsMobileSidebarOpen(true);
        if (showHamburgerTooltip) {
            setShowHamburgerTooltip(false);
            localStorage.setItem('hamburger_menu_tooltip_seen', 'true');
        }
    };

    // Tooltip'i manuel kapat
    const handleCloseTooltip = () => {
        setShowHamburgerTooltip(false);
        localStorage.setItem('hamburger_menu_tooltip_seen', 'true');
    };

    const fetchPendingCount = async () => {
        try {
            const res = await fetch('/api/admin/user-risks?status=pending');
            if (res.ok) {
                const data = await res.json();
                setPendingRisksCount(data.length);
            }
        } catch (err) {
            console.error("Öneriler sayısı alınamadı:", err);
        }
    };

    const fetchPendingRisks = async () => {
        setLoadingRisks(true);
        try {
            const res = await fetch('/api/admin/user-risks?status=pending');
            if (res.ok) {
                const data = await res.json();
                setPendingRisks(data);
            }
        } catch (err) {
            console.error("Öneriler çekilemedi:", err);
        } finally {
            setLoadingRisks(false);
        }
    };

    const handleApproveRisk = async (id: string, editedData?: any) => {
        try {
            const res = await fetch('/api/admin/user-risks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'approved', editedRisk: editedData })
            });
            if (res.ok) {
                setPendingRisks(pendingRisks.filter(r => r.id !== id));
                setPendingRisksCount(prev => prev - 1);
                setEditingRisk(null);
                alert('Öneri onaylandı ve risk kütüphanesine eklendi!');
            }
        } catch (err) {
            console.error("Onaylama hatası:", err);
        }
    };

    const handleRejectRisk = async (id: string) => {
        if (!confirm('Bu öneriyi reddetmek istediğinize emin misiniz? Kullanıcının riski silinmeyecek, sadece kalıcı kütüphaneye eklenmeyecek.')) return;
        try {
            const res = await fetch('/api/admin/user-risks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'rejected' })
            });
            if (res.ok) {
                setPendingRisks(pendingRisks.filter(r => r.id !== id));
                setPendingRisksCount(prev => prev - 1);
            }
        } catch (err) {
            console.error("Reddetme hatası:", err);
        }
    };

    const startEditing = (risk: any) => {
        setEditingRisk(risk);
        setEditForm({
            hazard: risk.hazard || '',
            risk: risk.risk || '',
            measures: risk.measures || '',
            sub_category: risk.sub_category || '',
            source: risk.source || '',
            affected: risk.affected || 'Çalışanlar',
            probability: risk.probability || 1,
            frequency: risk.frequency || 1,
            severity: risk.severity || 1,
            probability2: risk.probability2 || 1,
            frequency2: risk.frequency2 || 1,
            severity2: risk.severity2 || 1
        });
    };

    const formatDate = (dateString: string | Date | null | undefined) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR');
    };

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
            {/* Mobil Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
                w-72 flex flex-col fixed h-screen z-50 transition-all duration-300
                ${isDark
                    ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white'
                    : 'bg-gradient-to-b from-white via-slate-50 to-white text-slate-900 border-r border-slate-200'
                }
            `}>
                {/* Logo + Premium Bilgisi */}
                <div className={`p-6 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                        <Link
                            href="/panel"
                            className="flex items-center group"
                            onClick={() => setIsMobileSidebarOpen(false)}
                        >
                            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                            <div className="ml-3">
                                <span className={`text-xl font-bold bg-clip-text text-transparent ${isDark ? 'bg-gradient-to-r from-white to-blue-200' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
                                    İSG Pratik
                                </span>
                                <span className={`block text-[10px] tracking-widest uppercase ${isDark ? 'text-blue-300/70' : 'text-slate-500'}`}>
                                    Yönetim Paneli
                                </span>
                            </div>
                        </Link>
                        {/* Mobil Kapat Butonu */}
                        <button
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className={`md:hidden p-2 rounded-lg transition-colors ${isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Menü */}
                <nav className="flex-1 px-4 py-6 overflow-y-auto">
                    <ul className="space-y-1">
                        {menuItems.map((item, index) => {
                            if (item.type === 'divider') {
                                return <li key={index} className={`my-4 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`} />;
                            }

                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            // Özel stillendirme: İSG Dosya Arşivi
                            const isFeatured = (item as any).featured === true;

                            return (
                                <li key={index}>
                                    <Link
                                        href={item.active ? item.href : '#'}
                                        data-tour={item.dataTour}
                                        onClick={() => setIsMobileSidebarOpen(false)}
                                        className={`
                                            flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                                            ${isActive
                                                ? isFeatured
                                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/50 ring-2 ring-purple-400/50'
                                                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                                : item.active
                                                    ? isFeatured
                                                        ? isDark
                                                            ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-300 hover:from-purple-600/30 hover:to-indigo-600/30 border-2 border-purple-500/50 hover:border-purple-400 shadow-lg shadow-purple-600/20 font-bold'
                                                            : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-700 hover:from-purple-500/30 hover:to-indigo-500/30 border-2 border-purple-400 hover:border-purple-500 shadow-lg shadow-purple-500/20 font-bold'
                                                        : item.highlight
                                                            ? isDark
                                                                ? 'text-emerald-400 hover:bg-white/5'
                                                                : 'text-emerald-600 hover:bg-slate-100'
                                                            : isDark
                                                                ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                                                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                                    : isDark
                                                        ? 'text-slate-500 cursor-not-allowed'
                                                        : 'text-slate-400 cursor-not-allowed'
                                            }
                                        `}
                                    >
                                        {Icon && <Icon className={`w-5 h-5 ${isFeatured && !isActive ? 'text-purple-600 dark:text-purple-400' : ''}`} />}
                                        <span className="flex-1">{item.name}</span>
                                        {isFeatured && archiveFileCount !== null && (
                                            <span className={`
                                                px-2 py-0.5 rounded-full text-xs font-bold
                                                ${isActive || isFeatured
                                                    ? isDark
                                                        ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50'
                                                        : 'bg-purple-500 text-white'
                                                    : isDark
                                                        ? 'bg-purple-600/40 text-purple-300 border border-purple-500/50'
                                                        : 'bg-purple-600 text-white'
                                                }
                                            `}>
                                                {archiveFileCount.toLocaleString('tr-TR')} dosya
                                            </span>
                                        )}
                                        {isFeatured && archiveFileCount === null && (
                                            <span className={`
                                                px-2 py-0.5 rounded-full text-xs font-bold
                                                ${isDark
                                                    ? 'bg-slate-700/40 text-slate-400 border border-slate-600/50'
                                                    : 'bg-slate-300 text-slate-600'
                                                }
                                            `}>
                                                <Loader2 className="w-3 h-3 animate-spin inline" />
                                            </span>
                                        )}
                                        {item.active && !isFeatured && (
                                            <ChevronRight className="w-4 h-4 opacity-50" />
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Alt Menü - Dark Mode Toggle + Destek (Desktop only) */}
                <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                    <div className="hidden md:flex items-center justify-center gap-2">
                        <button
                            onClick={toggleTheme}
                            data-tour="dark-mode"
                            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}
                            title={isDark ? 'Açık Mod' : 'Karanlık Mod'}
                        >
                            {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <Link
                            href="/destek"
                            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}
                            title="Destek"
                            onClick={() => setIsMobileSidebarOpen(false)}
                        >
                            <HeadphonesIcon className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Ana İçerik */}
            <main className={`flex-1 md:ml-72 min-h-screen ${isDark ? 'dark-content bg-slate-900' : 'bg-slate-100'}`}>
                {/* Üst Navbar - Tam Genişlik */}
                <nav className={`shadow-xl backdrop-blur-md sticky top-0 z-40 transition-all duration-300 ${isDark
                    ? 'bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 border-b border-white/10'
                    : 'bg-gradient-to-r from-white via-indigo-50 to-white border-b border-slate-200'
                    }`}>
                    <div className="w-full px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-14">
                            {/* Mobil Hamburger Menü */}
                            <div className="relative md:hidden">
                                <button
                                    onClick={handleHamburgerClick}
                                    data-mobile-tour="hamburger-menu"
                                    className={`p-2 rounded-lg relative z-10 transition-colors ${isDark
                                        ? 'text-blue-100 hover:bg-white/10'
                                        : 'text-indigo-600 hover:bg-indigo-100'
                                        }`}
                                >
                                    <Menu className="w-6 h-6" />
                                </button>

                                {/* Hamburger Menü Tooltip - İlk Giriş */}
                                {showHamburgerTooltip && (
                                    <div className={`absolute left-0 top-full mt-2 z-30 w-64 rounded-xl shadow-2xl border-2 animate-fade-in pointer-events-none ${isDark
                                        ? 'bg-slate-800 border-indigo-500'
                                        : 'bg-white border-indigo-200'
                                        }`}>
                                        {/* Ok işareti */}
                                        <div className={`absolute -top-2 left-6 w-4 h-4 transform rotate-45 border-l-2 border-t-2 ${isDark
                                            ? 'bg-slate-800 border-indigo-500'
                                            : 'bg-white border-indigo-200'
                                            }`}></div>

                                        {/* İçerik */}
                                        <div className="p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'
                                                        }`}>
                                                        <Menu className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                                                    </div>
                                                    <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>Menüyü Keşfedin</h3>
                                                </div>
                                                <button
                                                    onClick={handleCloseTooltip}
                                                    className={`transition-colors pointer-events-auto ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                                Bu butona tıklayarak tüm menü seçeneklerine erişebilirsiniz. Firmalar, riskler, raporlar ve daha fazlası burada!
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Desktop Nav Links */}
                            {/* Desktop Nav Links - Linkler kaldırıldı */}
                            <div className="hidden md:flex items-center space-x-1.5">
                            </div>

                            {/* Sağ taraf - Kullanıcı bilgisi - Layout shift önleme için min-width */}
                            <div className="flex items-center gap-2 sm:gap-3 min-w-[120px] sm:min-w-[280px] justify-end">
                                {session ? (
                                    <>
                                        {/* Mobile Panel Button */}
                                        <Link
                                            href="/panel"
                                            className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            <span>Panel</span>
                                        </Link>
                                        {/* Desktop Panel Button */}
                                        <Link
                                            href="/panel"
                                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 whitespace-nowrap"
                                        >
                                            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                                            <span>Panel</span>
                                        </Link>
                                        {/* Bildirim Butonu */}
                                        <div className="relative">
                                            <button
                                                onClick={handleOpenNotifications}
                                                className={`relative p-2 rounded-xl transition-all flex-shrink-0 ${isDark
                                                    ? 'text-blue-200 hover:bg-white/10 hover:text-white'
                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                    }`}
                                                title="Bildirimler"
                                            >
                                                <Bell className="w-5 h-5" />
                                                {unreadCount > 0 && (
                                                    <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full text-[10px] font-bold ${isDark
                                                        ? 'bg-red-500 text-white'
                                                        : 'bg-red-500 text-white'
                                                        }`}>
                                                        {unreadCount > 9 ? '9+' : unreadCount}
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                        {/* Mobile Dark Mode Toggle */}
                                        <button
                                            onClick={toggleTheme}
                                            className={`md:hidden p-2 rounded-lg transition-all ${isDark
                                                ? 'text-yellow-400 hover:bg-white/10'
                                                : 'text-slate-600 hover:bg-slate-100'
                                                }`}
                                            title={isDark ? 'Açık Mod' : 'Karanlık Mod'}
                                        >
                                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                        </button>
                                        <div className="hidden sm:flex flex-col items-end mr-2 min-w-[120px]">
                                            <span className={`text-[10px] font-bold truncate max-w-[120px] ${isDark ? 'text-blue-100' : 'text-slate-700'}`}>
                                                {session?.user?.name || session?.user?.email || ''}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => signOut({ callbackUrl: 'https://www.isgpratik.com/' })}
                                            className={`p-2 rounded-xl transition-all shadow-sm flex-shrink-0 ${isDark
                                                ? 'bg-white/10 hover:bg-red-500/20 text-blue-200 hover:text-red-200 border border-white/10 hover:border-red-400/30'
                                                : 'bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-300'
                                                }`}
                                            title="Çıkış Yap"
                                        >
                                            <LogOut className="w-5 h-5" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="w-full sm:w-auto flex justify-end">
                                        <Link
                                            href="/login"
                                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg whitespace-nowrap ${isDark
                                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                                }`}
                                        >
                                            Giriş Yap
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {children}
            </main>

            {/* Admin Risk Önerileri Modal */}
            {
                showRiskSuggestions && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[85vh] overflow-hidden">
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-amber-50">
                                <h2 className="text-lg font-bold text-amber-800">📥 Kullanıcı Risk Önerileri</h2>
                                <button
                                    onClick={() => { setShowRiskSuggestions(false); setEditingRisk(null); }}
                                    className="p-2 hover:bg-amber-100 rounded text-amber-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-4 overflow-y-auto max-h-[70vh]">
                                {loadingRisks ? (
                                    <div className="text-center py-8">
                                        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
                                        <p className="text-gray-500">Yükleniyor...</p>
                                    </div>
                                ) : pendingRisks.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">Bekleyen öneri yok.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {pendingRisks.map((risk) => (
                                            <div key={risk.id} className="border rounded-lg p-4 bg-gray-50">
                                                {editingRisk?.id === risk.id ? (
                                                    // Düzenleme Modu
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-xs font-bold text-slate-500 block mb-1">Alt Kategori</label>
                                                                <input type="text" className="w-full border rounded p-2 text-sm" value={editForm.sub_category} onChange={e => setEditForm({ ...editForm, sub_category: e.target.value })} />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-bold text-slate-500 block mb-1">Kaynak</label>
                                                                <input type="text" className="w-full border rounded p-2 text-sm" value={editForm.source} onChange={e => setEditForm({ ...editForm, source: e.target.value })} />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-slate-500 block mb-1">Tehlike</label>
                                                            <input type="text" className="w-full border rounded p-2 text-sm" value={editForm.hazard} onChange={e => setEditForm({ ...editForm, hazard: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-slate-500 block mb-1">Risk</label>
                                                            <textarea rows={2} className="w-full border rounded p-2 text-sm" value={editForm.risk} onChange={e => setEditForm({ ...editForm, risk: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-slate-500 block mb-1">Önlemler</label>
                                                            <textarea rows={3} className="w-full border rounded p-2 text-sm" value={editForm.measures} onChange={e => setEditForm({ ...editForm, measures: e.target.value })} />
                                                        </div>
                                                        <div className="grid grid-cols-6 gap-2">
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-400 block">O1</label>
                                                                <select className="w-full border rounded p-1 text-xs" value={editForm.probability} onChange={e => setEditForm({ ...editForm, probability: parseFloat(e.target.value) })}>
                                                                    {P_VALUES.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-400 block">F1</label>
                                                                <select className="w-full border rounded p-1 text-xs" value={editForm.frequency} onChange={e => setEditForm({ ...editForm, frequency: parseFloat(e.target.value) })}>
                                                                    {F_VALUES.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-400 block">Ş1</label>
                                                                <select className="w-full border rounded p-1 text-xs" value={editForm.severity} onChange={e => setEditForm({ ...editForm, severity: parseFloat(e.target.value) })}>
                                                                    {S_VALUES.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-400 block">O2</label>
                                                                <select className="w-full border rounded p-1 text-xs" value={editForm.probability2} onChange={e => setEditForm({ ...editForm, probability2: parseFloat(e.target.value) })}>
                                                                    {P_VALUES.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-400 block">F2</label>
                                                                <select className="w-full border rounded p-1 text-xs" value={editForm.frequency2} onChange={e => setEditForm({ ...editForm, frequency2: parseFloat(e.target.value) })}>
                                                                    {F_VALUES.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-400 block">Ş2</label>
                                                                <select className="w-full border rounded p-1 text-xs" value={editForm.severity2} onChange={e => setEditForm({ ...editForm, severity2: parseFloat(e.target.value) })}>
                                                                    {S_VALUES.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end gap-2 pt-2 border-t">
                                                            <button onClick={() => setEditingRisk(null)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">İptal</button>
                                                            <button onClick={() => handleApproveRisk(risk.id, editForm)} className="px-3 py-1.5 bg-green-600 text-white rounded font-bold text-sm hover:bg-green-700 flex items-center gap-1">
                                                                <Save className="w-3 h-3" /> Düzenleyip Onayla
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // Görüntüleme Modu
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">{risk.risk_no}</span>
                                                                <span className="text-xs text-gray-500">{risk.user_email}</span>
                                                            </div>
                                                            <p className="font-bold text-gray-800 mb-1">{risk.hazard}</p>
                                                            <p className="text-sm text-gray-600 mb-2">{risk.risk}</p>
                                                            {risk.measures && (
                                                                <p className="text-xs text-gray-500 bg-white p-2 rounded border">
                                                                    <strong>Önlemler:</strong> {risk.measures}
                                                                </p>
                                                            )}
                                                            <div className="flex gap-2 mt-2 text-xs text-gray-400">
                                                                <span>P: {risk.probability}</span>
                                                                <span>F: {risk.frequency}</span>
                                                                <span>S: {risk.severity}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-2 ml-4">
                                                            <button
                                                                onClick={() => startEditing(risk)}
                                                                className="px-3 py-1.5 bg-blue-600 text-white rounded font-bold text-xs hover:bg-blue-700 flex items-center"
                                                            >
                                                                <Edit className="w-3 h-3 mr-1" /> Düzenle
                                                            </button>
                                                            <button
                                                                onClick={() => handleApproveRisk(risk.id)}
                                                                className="px-3 py-1.5 bg-green-600 text-white rounded font-bold text-xs hover:bg-green-700 flex items-center"
                                                            >
                                                                <Check className="w-3 h-3 mr-1" /> Onayla
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectRisk(risk.id)}
                                                                className="px-3 py-1.5 bg-red-600 text-white rounded font-bold text-xs hover:bg-red-700 flex items-center"
                                                            >
                                                                <X className="w-3 h-3 mr-1" /> Reddet
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Bildirim Penceresi */}
            {showNotifications && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={handleCloseNotifications}
                    />
                    <div className={`fixed right-4 top-20 md:right-8 md:top-20 w-[90vw] max-w-md max-h-[80vh] rounded-xl shadow-2xl z-50 overflow-hidden ${isDark
                        ? 'bg-slate-800 border border-white/10'
                        : 'bg-white border border-slate-200'
                        }`}>
                        {/* Başlık */}
                        <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                            <div className="flex items-center gap-2">
                                <Bell className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-indigo-600'}`} />
                                <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Bildirimler
                                </h3>
                                {unreadCount > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isDark
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : 'bg-red-100 text-red-600'
                                        }`}>
                                        {unreadCount} yeni
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${isDark
                                            ? 'text-blue-400 hover:bg-white/10'
                                            : 'text-indigo-600 hover:bg-slate-100'
                                            }`}
                                    >
                                        Tümünü okundu işaretle
                                    </button>
                                )}
                                <button
                                    onClick={handleCloseNotifications}
                                    className={`p-1.5 rounded-lg transition-colors ${isDark
                                        ? 'text-slate-400 hover:text-white hover:bg-white/10'
                                        : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                                        }`}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Bildirim Listesi */}
                        <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
                            {notifications.length === 0 ? (
                                <div className={`p-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Henüz bildirim yok</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-200 dark:divide-white/10">
                                    {notifications.map((notification) => {
                                        const isRead = readNotificationIds.has(notification.id);
                                        return (
                                            <div
                                                key={notification.id}
                                                onClick={() => markAsRead(notification.id)}
                                                className={`p-4 cursor-pointer transition-colors ${isRead
                                                    ? isDark
                                                        ? 'bg-slate-800/50 hover:bg-slate-800'
                                                        : 'bg-slate-50 hover:bg-slate-100'
                                                    : isDark
                                                        ? 'bg-blue-500/10 hover:bg-blue-500/15 border-l-4 border-blue-500'
                                                        : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-1 flex-shrink-0 ${isRead
                                                        ? isDark ? 'text-slate-500' : 'text-slate-400'
                                                        : isDark ? 'text-blue-400' : 'text-blue-600'
                                                        }`}>
                                                        <Info className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                            <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                                {notification.title}
                                                            </h4>
                                                            {!isRead && (
                                                                <span className={`flex-shrink-0 w-2 h-2 rounded-full ${isDark
                                                                    ? 'bg-blue-400'
                                                                    : 'bg-blue-500'
                                                                    }`} />
                                                            )}
                                                        </div>
                                                        <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                                            {notification.description}
                                                        </p>
                                                        <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                            {notification.date.toLocaleDateString('tr-TR', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Kullanıcı Turu */}
            {showTour && (
                <OnboardingTour
                    onComplete={handleTourComplete}
                    isSidebarOpen={isMobileSidebarOpen}
                    onOpenSidebar={() => setIsMobileSidebarOpen(true)}
                />
            )}
        </div >
    );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
        }>
            <PanelLayoutInner>{children}</PanelLayoutInner>
        </Suspense>
    );
}
