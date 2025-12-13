"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Building2, FileText, Shield, AlertTriangle, Eye, FileCheck,
    ChevronRight, LogOut, User, Settings, Home, LayoutDashboard,
    PlusCircle, Info, Clock, X, Check, RefreshCw, Edit, Save, Menu
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { P_VALUES, F_VALUES, S_VALUES } from '../utils';

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

const ADMIN_EMAIL = 'serkanxx@gmail.com';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    // Admin Risk Önerileri State
    const [pendingRisksCount, setPendingRisksCount] = useState(0);
    const [showRiskSuggestions, setShowRiskSuggestions] = useState(false);
    const [pendingRisks, setPendingRisks] = useState<any[]>([]);
    const [loadingRisks, setLoadingRisks] = useState(false);
    const [editingRisk, setEditingRisk] = useState<any | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const isAdmin = session?.user?.email === ADMIN_EMAIL;

    // Giriş yapmamış kullanıcıları yönlendir
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Admin için bekleyen önerileri çek
    useEffect(() => {
        if (isAdmin) {
            fetchPendingCount();
        }
    }, [isAdmin]);

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
                <div className="px-6 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {session.user?.name || session.user?.email}
                            </p>
                            <p className="text-xs text-slate-400">Kullanıcı</p>
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
            <main className="flex-1 md:ml-72 min-h-screen">
                {/* Üst Navbar */}
                <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                    {/* Mobil Hamburger Menü */}
                    <button
                        onClick={() => setIsMobileSidebarOpen(true)}
                        className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Masaüstü: Boş alan (premium bilgisi sidebar'da) */}
                    <div className="hidden md:block" />

                    <div className="flex items-center gap-3">
                        {/* Admin Öneriler Butonu */}
                        {isAdmin && (
                            <button
                                onClick={() => { setShowRiskSuggestions(true); fetchPendingRisks(); }}
                                className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-colors ${pendingRisksCount > 0
                                    ? 'bg-amber-500 text-white hover:bg-amber-600 animate-pulse'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <span className="mr-2">📥</span>
                                Risk Önerileri
                                {pendingRisksCount > 0 && (
                                    <span className="ml-2 bg-white text-amber-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                        {pendingRisksCount}
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {children}
            </main>

            {/* Admin Risk Önerileri Modal */}
            {showRiskSuggestions && (
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
            )}
        </div>
    );
}

