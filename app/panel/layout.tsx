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
    Headphones as HeadphonesIcon, Mail, Lightbulb, Moon, Sun, Calendar, Search
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
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [showHamburgerTooltip, setShowHamburgerTooltip] = useState(false);

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

    // Hamburger menü tooltip kontrolü - sadece mobil ve ilk girişte
    useEffect(() => {
        const hasSeenTooltip = localStorage.getItem('hamburger_menu_tooltip_seen');
        if (!hasSeenTooltip) {
            // Mobil cihaz kontrolü
            const isMobile = window.innerWidth < 768; // md breakpoint
            if (isMobile) {
                // Sayfa yüklendikten kısa bir süre sonra göster
                const timer = setTimeout(() => {
                    setShowHamburgerTooltip(true);
                }, 1500);
                return () => clearTimeout(timer);
            }
        }
    }, []);

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
                w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col fixed h-screen z-50 transition-transform duration-300
            `}>
                {/* Logo + Premium Bilgisi */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
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
                        {/* Mobil Kapat Butonu */}
                        <button
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className="md:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Kullanıcı Bilgisi */}
                <div className="px-6 py-4 border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer">
                    <Link href="/panel" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {session.user?.name || session.user?.email}
                            </p>
                            <p className="text-xs text-slate-400">Kullanıcı</p>
                        </div>
                    </Link>
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
                                        data-tour={item.dataTour}
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

                {/* Destek Bölümü - Açılıp Kapanabilir */}
                <div className="px-4 py-2 border-t border-white/10">
                    <button
                        onClick={() => setIsSupportOpen(!isSupportOpen)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                    >
                        <HeadphonesIcon className="w-5 h-5" />
                        <span className="flex-1 text-left">Destek</span>
                        <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isSupportOpen ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Destek Alt Menüsü */}
                    <div className={`overflow-hidden transition-all duration-200 ${isSupportOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="pl-4 mt-1 space-y-1">
                            <Link
                                href="/iletisim"
                                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                <Mail className="w-4 h-4" />
                                <span>İletişim</span>
                            </Link>
                            <Link
                                href="/destek"
                                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                <Lightbulb className="w-4 h-4" />
                                <span>Öneride Bulun</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Alt Menü - Dark Mode Toggle + Çıkış */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            data-tour="dark-mode"
                            className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-300 hover:bg-white/10 transition-all"
                            title={isDark ? 'Açık Mod' : 'Karanlık Mod'}
                        >
                            {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={() => signOut({ callbackUrl: 'https://www.isgpratik.com/' })}
                            className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Çıkış Yap</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Ana İçerik */}
            <main className={`flex-1 md:ml-72 min-h-screen ${isDark ? 'dark-content bg-slate-900' : 'bg-slate-100'}`}>
                {/* Üst Navbar - Tam Genişlik */}
                <nav className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-xl border-b border-white/10 backdrop-blur-md sticky top-0 z-40">
                    <div className="w-full px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-14">
                            {/* Mobil Hamburger Menü */}
                            <div className="relative md:hidden">
                                <button
                                    onClick={handleHamburgerClick}
                                    className="p-2 text-blue-100 hover:bg-white/10 rounded-lg relative z-10"
                                >
                                    <Menu className="w-6 h-6" />
                                </button>
                                
                                {/* Hamburger Menü Tooltip - İlk Giriş */}
                                {showHamburgerTooltip && (
                                    <div className="absolute left-0 top-full mt-2 z-50 w-64 bg-white rounded-xl shadow-2xl border-2 border-indigo-200 animate-fade-in">
                                        {/* Ok işareti */}
                                        <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-l-2 border-t-2 border-indigo-200 transform rotate-45"></div>
                                        
                                        {/* İçerik */}
                                        <div className="p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                                        <Menu className="w-5 h-5 text-indigo-600" />
                                                    </div>
                                                    <h3 className="font-bold text-slate-800 text-sm">Menüyü Keşfedin</h3>
                                                </div>
                                                <button
                                                    onClick={handleCloseTooltip}
                                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">
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

                            {/* Sağ taraf - Kullanıcı bilgisi */}
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/panel"
                                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Panel
                                </Link>
                                <div className="hidden sm:flex flex-col items-end mr-2">
                                    <span className="text-xs font-bold text-blue-100">
                                        {session?.user?.name || session?.user?.email}
                                    </span>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: 'https://www.isgpratik.com/' })}
                                    className="bg-white/10 hover:bg-red-500/20 text-blue-200 hover:text-red-200 p-2 rounded-xl transition-all border border-white/10 hover:border-red-400/30 shadow-sm"
                                    title="Çıkış Yap"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
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

            {/* Kullanıcı Turu */}
            {showTour && <OnboardingTour onComplete={completeTour} />}
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
