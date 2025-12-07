"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Save, Plus, Trash2, Edit, X, Check, Lock, LogOut, ChevronDown, ChevronRight, Home, FolderPlus, Move, Pencil } from 'lucide-react';
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

    // Kategori Ekleme/Düzenleme Modu
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [categoryModalMode, setCategoryModalMode] = useState<'add' | 'edit'>('add');
    const [editingCategoryCode, setEditingCategoryCode] = useState<string | null>(null);
    const [newCategoryData, setNewCategoryData] = useState({ code: '', category: '' });

    // Sub-category (Risk Başlığı) Silme ve Taşıma
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [moveItem, setMoveItem] = useState<{ categoryCode: string; itemIndex: number; item: any } | null>(null);
    const [targetCategoryCode, setTargetCategoryCode] = useState('');

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

    // Risk başlığı (sub_category) silme - aynı sub_category'deki tüm maddeler silinir
    const handleDeleteSubCategory = (categoryCode: string, subCategory: string) => {
        if (!confirm(`"${subCategory}" başlığındaki TÜM risk maddelerini silmek istediğinize emin misiniz?`)) return;

        const newData = data.map(cat => {
            if (cat.code === categoryCode) {
                const newItems = cat.items.filter((item: any) => item.sub_category !== subCategory);
                return { ...cat, items: newItems };
            }
            return cat;
        });
        saveDataToApi(newData);
    };

    // Risk maddesini başka kategoriye taşıma
    const openMoveModal = (categoryCode: string, itemIndex: number, item: any) => {
        setMoveItem({ categoryCode, itemIndex, item });
        setTargetCategoryCode('');
        setIsMoveModalOpen(true);
    };

    const handleMoveItem = () => {
        if (!moveItem || !targetCategoryCode) return;
        if (moveItem.categoryCode === targetCategoryCode) {
            alert('Aynı kategoriye taşıyamazsınız!');
            return;
        }

        const newData = data.map(cat => {
            if (cat.code === moveItem.categoryCode) {
                // Kaynak kategoriden sil
                const newItems = [...cat.items];
                newItems.splice(moveItem.itemIndex, 1);
                return { ...cat, items: newItems };
            }
            if (cat.code === targetCategoryCode) {
                // Hedef kategoriye ekle
                return { ...cat, items: [...cat.items, moveItem.item] };
            }
            return cat;
        });

        saveDataToApi(newData);
        setIsMoveModalOpen(false);
        setMoveItem(null);
    };

    // Kategori ismini düzenleme
    const openCategoryEditModal = (category: RiskCategory) => {
        setCategoryModalMode('edit');
        setEditingCategoryCode(category.code);
        setNewCategoryData({ code: category.code, category: category.category });
        setIsCategoryModalOpen(true);
    };

    // Kategori silme
    const handleDeleteCategory = (categoryCode: string) => {
        const category = data.find(c => c.code === categoryCode);
        if (!category) return;

        if (!confirm(`"${category.category}" kategorisini ve içindeki ${category.items.length} maddeyi silmek istediğinize emin misiniz?`)) return;

        const newData = data.filter(cat => cat.code !== categoryCode);
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

        if (categoryModalMode === 'add') {
            // Yeni kategori ekle
            const newData = [...data, {
                code: newCategoryData.code,
                category: newCategoryData.category.toUpperCase(),
                items: []
            }];
            saveDataToApi(newData);
        } else {
            // Mevcut kategori ismini düzenle
            const newData = data.map(cat => {
                if (cat.code === editingCategoryCode) {
                    return { ...cat, category: newCategoryData.category.toUpperCase() };
                }
                return cat;
            });
            saveDataToApi(newData);
        }

        setIsCategoryModalOpen(false);
        setNewCategoryData({ code: '', category: '' });
        setEditingCategoryCode(null);
        setCategoryModalMode('add');
    };

    // Sub-category'leri grupla
    const getSubCategories = (items: any[]) => {
        const groups: { [key: string]: any[] } = {};
        items.forEach((item, idx) => {
            const subCat = item.sub_category || 'Diğer';
            if (!groups[subCat]) groups[subCat] = [];
            groups[subCat].push({ ...item, originalIndex: idx });
        });
        return groups;
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
                            onClick={() => {
                                setCategoryModalMode('add');
                                setNewCategoryData({ code: '', category: '' });
                                setIsCategoryModalOpen(true);
                            }}
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
                        {data.map((category) => {
                            const subCategories = getSubCategories(category.items);

                            return (
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
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openCategoryEditModal(category); }}
                                                className="flex items-center text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200 transition-colors"
                                                title="Kategori İsmini Düzenle"
                                            >
                                                <Pencil className="w-3 h-3 mr-1" /> Düzenle
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.code); }}
                                                className="flex items-center text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                                                title="Kategoriyi Sil"
                                            >
                                                <Trash2 className="w-3 h-3 mr-1" /> Sil
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openModal('add', category.code); }}
                                                className="flex items-center text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors"
                                            >
                                                <Plus className="w-4 h-4 mr-1" /> Yeni Ekle
                                            </button>
                                        </div>
                                    </div>

                                    {expandedCategory === category.code && (
                                        <div className="p-4 border-t border-gray-200">
                                            {category.items.length === 0 ? (
                                                <p className="text-gray-500 italic text-sm">Bu kategoride henüz kayıt yok.</p>
                                            ) : (
                                                <div className="space-y-6">
                                                    {Object.entries(subCategories).map(([subCatName, items]) => (
                                                        <div key={subCatName} className="border rounded-lg overflow-hidden">
                                                            <div className="bg-indigo-50 px-4 py-2 flex justify-between items-center">
                                                                <span className="font-bold text-indigo-800 text-sm">{subCatName}</span>
                                                                <div className="flex space-x-2">
                                                                    <span className="text-xs text-indigo-600">{items.length} madde</span>
                                                                    <button
                                                                        onClick={() => handleDeleteSubCategory(category.code, subCatName)}
                                                                        className="text-xs text-red-600 hover:text-red-800 flex items-center"
                                                                        title="Bu başlıktaki tüm maddeleri sil"
                                                                    >
                                                                        <Trash2 className="w-3 h-3 mr-1" /> Başlığı Sil
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="p-4 grid grid-cols-1 gap-3">
                                                                {items.map((item: any) => (
                                                                    <div key={item.originalIndex} className="border rounded p-3 hover:shadow-md transition-shadow bg-white relative group">
                                                                        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <button
                                                                                onClick={() => openMoveModal(category.code, item.originalIndex, item)}
                                                                                className="p-1 text-purple-600 bg-purple-50 rounded hover:bg-purple-100"
                                                                                title="Başka Kategoriye Taşı"
                                                                            >
                                                                                <Move className="w-3 h-3" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => openModal('edit', category.code, item, item.originalIndex)}
                                                                                className="p-1 text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                                                                                title="Düzenle"
                                                                            >
                                                                                <Edit className="w-3 h-3" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteItem(category.code, item.originalIndex)}
                                                                                className="p-1 text-red-600 bg-red-50 rounded hover:bg-red-100"
                                                                                title="Sil"
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </button>
                                                                        </div>

                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                                                            <div>
                                                                                <div className="mb-1">
                                                                                    <span className="font-bold text-black text-[10px] uppercase">Risk No:</span> <span className="text-blue-700 font-bold">{item.riskNo || '-'}</span>
                                                                                </div>
                                                                                <div className="mb-1"><span className="font-bold text-black text-[10px] uppercase">Tehlike:</span> <span className="text-black">{item.hazard}</span></div>
                                                                                <div className="mb-1"><span className="font-bold text-black text-[10px] uppercase">Risk:</span> <span className="text-black">{item.risk}</span></div>
                                                                                <div><span className="font-bold text-black text-[10px] uppercase">Kaynak:</span> <span className="bg-gray-200 text-black px-1.5 py-0.5 rounded text-[10px] font-bold">{item.source}</span></div>
                                                                            </div>
                                                                            <div>
                                                                                <div className="mb-1"><span className="font-bold text-black text-[10px] uppercase">Önlemler:</span> <p className="text-black mt-1 text-[11px]">{item.measures}</p></div>
                                                                                <div className="flex space-x-3 mt-2">
                                                                                    <div className="bg-red-50 px-2 py-1 rounded border border-red-100">
                                                                                        <span className="text-[8px] font-bold text-red-800 block">Mevcut</span>
                                                                                        <span className="font-bold text-red-600 text-xs">{item.p * item.f * item.s}</span>
                                                                                    </div>
                                                                                    <div className="bg-green-50 px-2 py-1 rounded border border-green-100">
                                                                                        <span className="text-[8px] font-bold text-green-800 block">Hedef</span>
                                                                                        <span className="font-bold text-green-600 text-xs">{item.p2 * item.f2 * item.s2}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* RISK MADDESI MODAL */}
            {isModalOpen && (
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
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alt Kategori (Risk Başlığı)</label>
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
            )}

            {/* KATEGORİ EKLEME/DÜZENLEME MODAL */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-4 border-b flex justify-between items-center bg-white rounded-t-lg">
                            <h3 className="text-lg font-bold text-gray-800">
                                {categoryModalMode === 'add' ? 'Yeni Kategori Ekle' : 'Kategori İsmini Düzenle'}
                            </h3>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
                            {categoryModalMode === 'add' && (
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
                            )}
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
            )}

            {/* TAŞIMA MODAL */}
            {isMoveModalOpen && moveItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">Risk Maddesini Taşı</h3>
                            <button onClick={() => setIsMoveModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">
                                <span className="font-bold">"{moveItem.item.hazard?.substring(0, 50)}..."</span> maddesini taşımak istediğiniz kategoriyi seçin:
                            </p>
                            <select
                                className="w-full border rounded p-2 text-black"
                                value={targetCategoryCode}
                                onChange={e => setTargetCategoryCode(e.target.value)}
                            >
                                <option value="">Kategori seçin...</option>
                                {data.filter(c => c.code !== moveItem.categoryCode).map(cat => (
                                    <option key={cat.code} value={cat.code}>{cat.code} - {cat.category}</option>
                                ))}
                            </select>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button type="button" onClick={() => setIsMoveModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm font-bold">İptal</button>
                                <button
                                    onClick={handleMoveItem}
                                    disabled={!targetCategoryCode}
                                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-bold disabled:bg-gray-300 flex items-center"
                                >
                                    <Move className="w-4 h-4 mr-2" /> Taşı
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
