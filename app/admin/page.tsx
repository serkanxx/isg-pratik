"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Save, Plus, Trash2, Edit, X, Check, Lock, LogOut, ChevronDown, ChevronRight, Home, FolderPlus } from 'lucide-react';
import { config } from '../config';
import { RiskCategory, RiskLibraryItem } from '../types';

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const [data, setData] = useState<RiskCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    // Düzenleme Modu
    const [editingItem, setEditingItem] = useState<RiskLibraryItem & { originalIndex: number } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

    const [activeCategoryCode, setActiveCategoryCode] = useState<string | null>(null);

    // Kategori Ekleme Modu
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryData, setNewCategoryData] = useState({ code: '', category: '' });

    // Form State
    const [formData, setFormData] = useState({
        riskNo: '',
        sub_category: '',
        source: '',
        hazard: '',
        risk: '',
        affected: 'Çalışanlar / Ziyaretçiler',
        p: 1, f: 1, s: 1,
        p2: 1, f2: 1, s2: 1,
        measures: ''
    });

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/risks');
            const jsonData = await res.json();
            if (Array.isArray(jsonData)) {
                setData(jsonData);
            }
        } catch (err) {
            console.error("Veri çekme hatası:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === config.adminPassword) {
            setIsAuthenticated(true);
            setError('');
        } else {
            setError('Hatalı şifre!');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setPassword('');
    };

    const saveDataToApi = async (newData: any[]) => {
        try {
            await fetch('/api/risks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newData)
            });
            setData(newData);
            // alert('Değişiklikler kaydedildi!'); // Kaldırıldı
        } catch (err) {
            console.error("Kaydetme hatası:", err);
            alert('Kaydederken bir hata oluştu.');
        }
    };

    const handleDeleteItem = (categoryCode: string, itemIndex: number) => {
        if (!confirm('Bu maddeyi silmek istediğinize emin misiniz?')) return;

        const newData = data.map(cat => {
            if (cat.code === categoryCode) {
                const newItems = [...cat.items];
                newItems.splice(itemIndex, 1);
                return { ...cat, items: newItems };
            }
            return cat;
        });
        saveDataToApi(newData);
    };

    const openModal = (mode: 'add' | 'edit', categoryCode: string, item: any = null, index: number = -1) => {
        setModalMode(mode);
        setActiveCategoryCode(categoryCode);
        setIsModalOpen(true);

        if (mode === 'edit' && item) {
            setEditingItem({ ...item, originalIndex: index });
            setFormData({
                riskNo: item.riskNo || '',
                sub_category: item.sub_category,
                source: item.source,
                hazard: item.hazard,
                risk: item.risk,
                affected: item.affected,
                p: item.p, f: item.f, s: item.s,
                p2: item.p2, f2: item.f2, s2: item.s2,
                measures: item.measures
            });
        } else {
            setFormData({
                riskNo: '',
                sub_category: '',
                source: '',
                hazard: '',
                risk: '',
                affected: 'Çalışanlar / Ziyaretçiler',
                p: 3, f: 3, s: 3,
                p2: 1, f2: 3, s2: 3,
                measures: ''
            });
        }
    };

    const handleModalSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Mükerrer Risk No Kontrolü
        if (formData.riskNo && formData.riskNo.trim() !== "") {
            const isDuplicate = data.some(cat =>
                cat.items.some((item: any, idx: number) => {
                    // Düzenleme modundaysak, kendi kendisiyle çakışmasını engelle
                    if (modalMode === 'edit' && editingItem && cat.code === activeCategoryCode && idx === editingItem.originalIndex) {
                        return false;
                    }
                    return item.riskNo === formData.riskNo;
                })
            );

            if (isDuplicate) {
                alert(`Bu Risk Numarası (${formData.riskNo}) zaten kullanımda! Lütfen başka bir numara giriniz.`);
                return;
            }
        }

        const newData = data.map(cat => {
            if (cat.code === activeCategoryCode) {
                const newItems = [...cat.items];

                if (modalMode === 'add') {
                    newItems.push(formData);
                } else if (modalMode === 'edit' && editingItem) {
                    newItems[editingItem.originalIndex] = formData;
                }

                return { ...cat, items: newItems };
            }
            return cat;
        });

        saveDataToApi(newData);
        setIsModalOpen(false);
    };

    const handleCategorySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newData = [...data, {
            code: newCategoryData.code,
            category: newCategoryData.category.toUpperCase(),
            items: []
        }];
        saveDataToApi(newData);
        setIsCategoryModalOpen(false);
        setNewCategoryData({ code: '', category: '' });
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md w-96">
                    <div className="flex justify-center mb-4">
                        <div className="bg-blue-100 p-3 rounded-full">
                            <Lock className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Yönetici Girişi</h2>
                    <form onSubmit={handleLogin}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                            <input
                                type="password"
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Şifrenizi girin"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors font-bold"
                        >
                            Giriş Yap
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center space-x-4">
                        <Link href="/" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors bg-gray-100 px-3 py-2 rounded-md">
                            <Home className="w-5 h-5 mr-2" />
                            <span className="font-bold">Ana Sayfa</span>
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-800 border-l-2 border-gray-300 pl-4">Risk Kütüphanesi Yönetimi</h1>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-bold"
                        >
                            <FolderPlus className="w-5 h-5 mr-2" />
                            Yeni Kategori Ekle
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center text-red-600 hover:bg-red-50 px-4 py-2 rounded-md transition-colors border border-red-200"
                        >
                            <LogOut className="w-5 h-5 mr-2" />
                            Çıkış Yap
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10">Yükleniyor...</div>
                ) : (
                    <div className="space-y-4">
                        {data.map((category) => (
                            <div key={category.code} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div
                                    className="p-4 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => setExpandedCategory(expandedCategory === category.code ? null : category.code)}
                                >
                                    <div className="flex items-center space-x-3">
                                        {expandedCategory === category.code ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                                        <span className="font-bold text-blue-900">{category.code}</span>
                                        <span className="font-semibold text-gray-700">{category.category}</span>
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{category.items.length} Madde</span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openModal('add', category.code); }}
                                        className="flex items-center text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors"
                                    >
                                        <Plus className="w-4 h-4 mr-1" /> Yeni Ekle
                                    </button>
                                </div>

                                {expandedCategory === category.code && (
                                    <div className="p-4 border-t border-gray-200">
                                        {category.items.length === 0 ? (
                                            <p className="text-gray-500 italic text-sm">Bu kategoride henüz kayıt yok.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {category.items.map((item: any, idx: number) => (
                                                    <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white relative group">
                                                        <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => openModal('edit', category.code, item, idx)}
                                                                className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                                                                title="Düzenle"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteItem(category.code, idx)}
                                                                className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100"
                                                                title="Sil"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <div className="mb-2">
                                                                    <span className="font-bold text-black text-xs uppercase">Risk No:</span> <span className="text-blue-700 font-bold">{item.riskNo || '-'}</span>
                                                                </div>
                                                                <div className="mb-2"><span className="font-bold text-black text-xs uppercase">Tehlike:</span> <span className="text-black font-medium">{item.hazard}</span></div>
                                                                <div className="mb-2"><span className="font-bold text-black text-xs uppercase">Risk:</span> <span className="text-black font-medium">{item.risk}</span></div>
                                                                <div><span className="font-bold text-black text-xs uppercase">Kaynak:</span> <span className="bg-gray-200 text-black px-2 py-0.5 rounded text-xs font-bold">{item.source}</span></div>
                                                            </div>
                                                            <div>
                                                                <div className="mb-2"><span className="font-bold text-black text-xs uppercase">Önlemler:</span> <p className="text-black mt-1 font-medium">{item.measures}</p></div>
                                                                <div className="flex space-x-4 mt-2">
                                                                    <div className="bg-red-50 px-2 py-1 rounded border border-red-100">
                                                                        <span className="text-[10px] font-bold text-red-800 block">Mevcut Skor</span>
                                                                        <span className="font-bold text-red-600">{item.p * item.f * item.s}</span>
                                                                    </div>
                                                                    <div className="bg-green-50 px-2 py-1 rounded border border-green-100">
                                                                        <span className="text-[10px] font-bold text-green-800 block">Hedef Skor</span>
                                                                        <span className="font-bold text-green-600">{item.p2 * item.f2 * item.s2}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                                <h3 className="text-lg font-bold text-gray-800">
                                    {modalMode === 'add' ? 'Yeni Risk Maddesi Ekle' : 'Risk Maddesini Düzenle'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Risk No</label>
                                        <input type="text" className="w-full border rounded p-2 text-sm text-black" value={formData.riskNo} onChange={e => setFormData({ ...formData, riskNo: e.target.value })} placeholder="Örn: 01.01" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alt Kategori</label>
                                        <input type="text" className="w-full border rounded p-2 text-sm text-black" value={formData.sub_category} onChange={e => setFormData({ ...formData, sub_category: e.target.value })} required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kaynak / Ekipman</label>
                                    <input type="text" className="w-full border rounded p-2 text-sm text-black" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} required />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tehlike</label>
                                    <input type="text" className="w-full border rounded p-2 text-sm text-black" value={formData.hazard} onChange={e => setFormData({ ...formData, hazard: e.target.value })} required />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Risk</label>
                                    <textarea rows={2} className="w-full border rounded p-2 text-sm text-black" value={formData.risk} onChange={e => setFormData({ ...formData, risk: e.target.value })} required />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Önlemler</label>
                                    <textarea rows={3} className="w-full border rounded p-2 text-sm text-black" value={formData.measures} onChange={e => setFormData({ ...formData, measures: e.target.value })} required />
                                </div>

                                <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded border">
                                    <div>
                                        <h4 className="text-xs font-bold text-red-800 mb-2 border-b border-red-200 pb-1">Mevcut Durum (Risk Skoru)</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div><label className="text-[10px]">Olasılık</label><input type="number" step="0.1" className="w-full border rounded p-1 text-xs text-black" value={formData.p} onChange={e => setFormData({ ...formData, p: parseFloat(e.target.value) })} /></div>
                                            <div><label className="text-[10px]">Frekans</label><input type="number" step="0.5" className="w-full border rounded p-1 text-xs text-black" value={formData.f} onChange={e => setFormData({ ...formData, f: parseFloat(e.target.value) })} /></div>
                                            <div><label className="text-[10px]">Şiddet</label><input type="number" className="w-full border rounded p-1 text-xs text-black" value={formData.s} onChange={e => setFormData({ ...formData, s: parseFloat(e.target.value) })} /></div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-green-800 mb-2 border-b border-green-200 pb-1">Önlem Sonrası (Hedef)</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div><label className="text-[10px]">Olasılık</label><input type="number" step="0.1" className="w-full border rounded p-1 text-xs text-black" value={formData.p2} onChange={e => setFormData({ ...formData, p2: parseFloat(e.target.value) })} /></div>
                                            <div><label className="text-[10px]">Frekans</label><input type="number" step="0.5" className="w-full border rounded p-1 text-xs text-black" value={formData.f2} onChange={e => setFormData({ ...formData, f2: parseFloat(e.target.value) })} /></div>
                                            <div><label className="text-[10px]">Şiddet</label><input type="number" className="w-full border rounded p-1 text-xs text-black" value={formData.s2} onChange={e => setFormData({ ...formData, s2: parseFloat(e.target.value) })} /></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4 border-t">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm font-bold">İptal</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-bold flex items-center">
                                        <Save className="w-4 h-4 mr-2" /> Kaydet
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* KATEGORİ EKLEME MODAL */}
            {
                isCategoryModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                            <div className="p-4 border-b flex justify-between items-center bg-white rounded-t-lg">
                                <h3 className="text-lg font-bold text-gray-800">Yeni Kategori Ekle</h3>
                                <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Kategori Kodu (Örn: 30)</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded p-2 text-black"
                                        value={newCategoryData.code}
                                        onChange={e => setNewCategoryData({ ...newCategoryData, code: e.target.value })}
                                        placeholder="Kodu giriniz..."
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Kategori Adı</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded p-2 text-black"
                                        value={newCategoryData.category}
                                        onChange={e => setNewCategoryData({ ...newCategoryData, category: e.target.value })}
                                        placeholder="Kategori adını giriniz..."
                                        required
                                    />
                                </div>
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm font-bold">İptal</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-bold">Kaydet</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
