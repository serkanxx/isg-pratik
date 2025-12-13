"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
    PlusCircle, Search, Edit2, Trash2, X, AlertCircle, CheckCircle,
    ChevronDown, ChevronUp, Save, FolderPlus
} from 'lucide-react';

interface UserRisk {
    id: string;
    risk_no: string;
    category_name: string;
    sub_category: string;
    source: string;
    hazard: string;
    risk: string;
    affected: string;
    probability: number;
    frequency: number;
    severity: number;
    probability2: number;
    frequency2: number;
    severity2: number;
    measures: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export default function RiskMaddelerimPage() {
    const { data: session } = useSession();
    const [risks, setRisks] = useState<UserRisk[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    const [form, setForm] = useState({
        category_name: 'Önerilen',
        sub_category: '',
        source: '',
        hazard: '',
        risk: '',
        affected: 'Çalışanlar',
        probability: 1,
        frequency: 1,
        severity: 1,
        probability2: 1,
        frequency2: 1,
        severity2: 1,
        measures: ''
    });

    useEffect(() => {
        if (session) {
            fetchRisks();
        }
    }, [session]);

    const fetchRisks = async () => {
        try {
            const res = await fetch('/api/user-risks');
            if (res.ok) {
                const data = await res.json();
                setRisks(data);
                // Tüm kategorileri başlangıçta açık yap
                const categories = new Set(data.map((r: UserRisk) => r.category_name));
                setExpandedCategories(categories);
            }
        } catch (error) {
            console.error('Riskler alınamadı:', error);
        } finally {
            setLoading(false);
        }
    };

    const showNotif = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
    };

    const resetForm = () => {
        setForm({
            category_name: 'Önerilen',
            sub_category: '',
            source: '',
            hazard: '',
            risk: '',
            affected: 'Çalışanlar',
            probability: 1,
            frequency: 1,
            severity: 1,
            probability2: 1,
            frequency2: 1,
            severity2: 1,
            measures: ''
        });
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.hazard.trim() || !form.risk.trim()) {
            showNotif('Tehlike ve Risk alanları zorunludur!', 'error');
            return;
        }

        setSaving(true);

        try {
            const url = editingId ? `/api/user-risks/${editingId}` : '/api/user-risks';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                showNotif(editingId ? 'Risk maddesi güncellendi!' : 'Risk maddesi eklendi ve öneriniz admin\'e iletildi!');
                resetForm();
                setShowForm(false);
                fetchRisks();
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

    const handleEdit = (risk: UserRisk) => {
        setForm({
            category_name: risk.category_name,
            sub_category: risk.sub_category,
            source: risk.source,
            hazard: risk.hazard,
            risk: risk.risk,
            affected: risk.affected,
            probability: risk.probability,
            frequency: risk.frequency,
            severity: risk.severity,
            probability2: risk.probability2,
            frequency2: risk.frequency2,
            severity2: risk.severity2,
            measures: risk.measures
        });
        setEditingId(risk.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu risk maddesini silmek istediğinize emin misiniz?')) return;

        try {
            const res = await fetch(`/api/user-risks/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showNotif('Risk maddesi silindi!');
                fetchRisks();
            } else {
                showNotif('Risk maddesi silinemedi', 'error');
            }
        } catch (error) {
            showNotif('Sunucu hatası', 'error');
        }
    };

    const toggleCategory = (category: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(category)) {
            newExpanded.delete(category);
        } else {
            newExpanded.add(category);
        }
        setExpandedCategories(newExpanded);
    };

    // Kategorilere göre grupla
    const groupedRisks = risks.reduce((acc, risk) => {
        const cat = risk.category_name || 'Önerilen';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(risk);
        return acc;
    }, {} as Record<string, UserRisk[]>);

    const filteredGroupedRisks = Object.entries(groupedRisks).reduce((acc, [cat, items]) => {
        const filtered = items.filter(r =>
            r.hazard.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.risk.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.source.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filtered.length > 0) acc[cat] = filtered;
        return acc;
    }, {} as Record<string, UserRisk[]>);

    const statusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">ONAYLANDI</span>;
            case 'rejected':
                return <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">REDDEDİLDİ</span>;
            default:
                return <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold">BEKLEMEDE</span>;
        }
    };

    return (
        <div className="p-8">
            {/* Notification */}
            {notification.show && (
                <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-2xl z-50 flex items-center ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                    {notification.type === 'error' ? <AlertCircle className="w-5 h-5 mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                    <span className="font-bold text-sm">{notification.message}</span>
                </div>
            )}

            {/* Başlık */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <PlusCircle className="w-7 h-7 text-amber-500" />
                        Risk Maddelerim
                    </h1>
                    <p className="text-slate-500 mt-1">Kendi risk maddelerinizi ekleyin ve yönetin</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                >
                    <PlusCircle className="w-5 h-5" />
                    Yeni Risk Maddesi
                </button>
            </div>

            {/* Arama */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Risk maddesi ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800">
                                {editingId ? 'Risk Maddesini Düzenle' : 'Yeni Risk Maddesi Ekle'}
                            </h2>
                            <button
                                onClick={() => { setShowForm(false); resetForm(); }}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Kategori */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Kategori</label>
                                    <input
                                        type="text"
                                        value={form.category_name}
                                        onChange={(e) => setForm({ ...form, category_name: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="Önerilen"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Alt Kategori</label>
                                    <input
                                        type="text"
                                        value={form.sub_category}
                                        onChange={(e) => setForm({ ...form, sub_category: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="Opsiyonel"
                                    />
                                </div>
                            </div>

                            {/* Kaynak */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Kaynak / Bölüm</label>
                                <input
                                    type="text"
                                    value={form.source}
                                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    placeholder="Örn: Üretim Alanı"
                                />
                            </div>

                            {/* Tehlike ve Risk */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Tehlike *</label>
                                    <textarea
                                        value={form.hazard}
                                        onChange={(e) => setForm({ ...form, hazard: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                                        rows={3}
                                        placeholder="Tehlike tanımı..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Risk *</label>
                                    <textarea
                                        value={form.risk}
                                        onChange={(e) => setForm({ ...form, risk: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                                        rows={3}
                                        placeholder="Risk tanımı..."
                                    />
                                </div>
                            </div>

                            {/* Etkilenen */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Etkilenen</label>
                                <input
                                    type="text"
                                    value={form.affected}
                                    onChange={(e) => setForm({ ...form, affected: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    placeholder="Çalışanlar"
                                />
                            </div>

                            {/* OFS Değerleri */}
                            <div className="border border-slate-200 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-slate-700 mb-3">1. Aşama (Mevcut Durum)</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Olasılık (O)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={form.probability}
                                            onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Frekans (F)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={form.frequency}
                                            onChange={(e) => setForm({ ...form, frequency: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Şiddet (Ş)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={form.severity}
                                            onChange={(e) => setForm({ ...form, severity: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Önlemler */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Kontrol Tedbirleri</label>
                                <textarea
                                    value={form.measures}
                                    onChange={(e) => setForm({ ...form, measures: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                                    rows={3}
                                    placeholder="Alınacak önlemler..."
                                />
                            </div>

                            {/* 2. Aşama OFS */}
                            <div className="border border-slate-200 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-slate-700 mb-3">2. Aşama (Tedbir Sonrası)</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Olasılık (O)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={form.probability2}
                                            onChange={(e) => setForm({ ...form, probability2: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Frekans (F)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={form.frequency2}
                                            onChange={(e) => setForm({ ...form, frequency2: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Şiddet (Ş)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={form.severity2}
                                            onChange={(e) => setForm({ ...form, severity2: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Butonlar */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); resetForm(); }}
                                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Kaydet ve Öner'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Risk Listesi */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent mx-auto mb-3"></div>
                        Yükleniyor...
                    </div>
                ) : Object.keys(filteredGroupedRisks).length === 0 ? (
                    <div className="p-8 text-center">
                        <PlusCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 mb-4">
                            {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz risk maddesi eklemediniz'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => { resetForm(); setShowForm(true); }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                            >
                                <PlusCircle className="w-4 h-4" />
                                İlk Risk Maddesini Ekle
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {Object.entries(filteredGroupedRisks).map(([category, items]) => (
                            <div key={category}>
                                <button
                                    onClick={() => toggleCategory(category)}
                                    className="w-full flex items-center justify-between px-6 py-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <FolderPlus className="w-5 h-5 text-amber-500" />
                                        <span className="font-bold text-slate-800">{category}</span>
                                        <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">{items.length}</span>
                                    </div>
                                    {expandedCategories.has(category) ? (
                                        <ChevronUp className="w-5 h-5 text-slate-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                    )}
                                </button>
                                {expandedCategories.has(category) && (
                                    <div className="divide-y divide-slate-50">
                                        {items.map((risk) => (
                                            <div key={risk.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{risk.risk_no}</span>
                                                            {statusBadge(risk.status)}
                                                        </div>
                                                        <p className="font-medium text-slate-800 mb-1">{risk.hazard}</p>
                                                        <p className="text-sm text-slate-600">{risk.risk}</p>
                                                        {risk.source && (
                                                            <p className="text-xs text-slate-400 mt-1">Kaynak: {risk.source}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-4">
                                                        <button
                                                            onClick={() => handleEdit(risk)}
                                                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                            title="Düzenle"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(risk.id)}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Sil"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
