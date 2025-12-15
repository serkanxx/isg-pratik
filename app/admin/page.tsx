"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Save, Plus, Trash2, Edit, X, Check, Lock, LogOut, ChevronDown, ChevronRight, Home, FolderPlus, Move, Pencil, RefreshCw, CloudUpload, Search, Tag, Filter } from 'lucide-react';
// import { config } from '../config'; // ARTIK GEREK YOK
import { RiskCategory, RiskLibraryItem } from '../types';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { P_VALUES, F_VALUES, S_VALUES } from '../utils';

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

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
    const [isSyncing, setIsSyncing] = useState(false); // Supabase senkronizasyon durumu

    // Arama ve Filtreleme State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    // Kullanıcı Risk Önerileri State
    const [pendingRisksCount, setPendingRisksCount] = useState(0);
    const [showRiskSuggestions, setShowRiskSuggestions] = useState(false);
    const [pendingRisks, setPendingRisks] = useState<any[]>([]);
    const [loadingRisks, setLoadingRisks] = useState(false);

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
        measures: '',
        sector_tags: [] as string[]
    });

    const [newTag, setNewTag] = useState(''); // Yeni eklenecek tag input'u için

    useEffect(() => {
        if (status === 'authenticated') {
            // @ts-ignore
            if (session?.user?.role === 'ADMIN') {
                setIsAuthenticated(true);
                fetchData();
            } else {
                router.push('/'); // Admin değilse ana sayfaya yönlendir
            }
        } else if (status === 'unauthenticated') {
            router.push('/login?callbackUrl=/admin'); // Giriş yapmamışsa login sayfasına yönlendir
        }
    }, [status, session, router]);


    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/risks');
            const jsonData = await res.json();
            if (Array.isArray(jsonData)) {
                setData(jsonData);
            }
            // Bekleyen önerilerin sayısını çek
            const pendingRes = await fetch('/api/admin/user-risks?status=pending');
            if (pendingRes.ok) {
                const pendingData = await pendingRes.json();
                setPendingRisksCount(pendingData.length);
            }
        } catch (err) {
            console.error("Veri çekme hatası:", err);
        } finally {
            setLoading(false);
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

    const handleApproveRisk = async (id: string) => {
        try {
            const res = await fetch('/api/admin/user-risks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'approved' })
            });
            if (res.ok) {
                setPendingRisks(pendingRisks.filter(r => r.id !== id));
                setPendingRisksCount(prev => prev - 1);
                alert('Öneri onaylandı ve risk kütüphanesine eklendi!');
            }
        } catch (err) {
            console.error("Onaylama hatası:", err);
        }
    };

    const handleRejectRisk = async (id: string) => {
        if (!confirm('Bu öneriyi reddetmek istediğinize emin misiniz?')) return;
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

    const handleLogout = () => {
        // signOut({ callbackUrl: '/' }); // Global logout yerine sadece bu sayfadan çıkış yok, next-auth signOut kullanılır
        // Ancak burada sadece state'i sıfırlamak yetmez, gerçekten çıkış yapmak lazım.
        // Admin panelindeki çıkış butonu aslında uygulamadan çıkış yapmalı.
        import("next-auth/react").then(({ signOut }) => signOut({ callbackUrl: 'https://www.isgpratik.com/' }));
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

    // Supabase ile çift yönlü senkronizasyon
    const handleSyncToSupabase = async () => {
        if (isSyncing) return;

        setIsSyncing(true);
        try {
            const response = await fetch('/api/sync-risks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                const report = result.report;
                alert(
                    `✅ Senkronizasyon Başarılı!\n\n` +
                    `📥 Supabase → Local: ${report.supabaseToLocal} yeni madde\n` +
                    `📤 Local → Supabase: ${report.localToSupabase} yeni madde\n` +
                    `🔄 Zaten mevcut: ${report.alreadyExists} madde\n\n` +
                    `Toplam Local: ${report.totalLocal} madde\n` +
                    `Toplam Supabase: ${report.totalSupabase} madde`
                );
                // Veriyi yeniden yükle
                fetchData();
            } else {
                alert('Senkronizasyon sırasında hata oluştu: ' + (result.error || 'Bilinmeyen hata'));
            }
        } catch (err) {
            console.error("Senkronizasyon hatası:", err);
            alert('Senkronizasyon sırasında hata oluştu.');
        } finally {
            setIsSyncing(false);
        }
    };

    // Filtreleme Mantığı
    const filteredData = useMemo(() => {
        if (!searchTerm && !selectedTag) return data;

        const lowerTerm = searchTerm.toLowerCase();

        return data.map(category => {
            // Eğer kategori aramaya uyuyorsa tüm items ile döndür (opsiyonel)
            // Ama biz item bazlı filtreleme istiyoruz

            const filteredItems = category.items.map((item, idx) => ({ ...item, _originalIndex: idx })).filter((item: any) => {
                // Tag kontrolü
                if (selectedTag && (!item.sector_tags || !item.sector_tags.includes(selectedTag))) {
                    return false;
                }

                // Arama kontrolü (Risk No, Tehlike, Risk, Önlem, Kaynak)
                if (searchTerm) {
                    return (
                        (item.riskNo && item.riskNo.toLowerCase().includes(lowerTerm)) ||
                        (item.hazard && item.hazard.toLowerCase().includes(lowerTerm)) ||
                        (item.risk && item.risk.toLowerCase().includes(lowerTerm)) ||
                        (item.measures && item.measures.toLowerCase().includes(lowerTerm)) ||
                        (item.source && item.source.toLowerCase().includes(lowerTerm))
                    );
                }

                return true;
            });

            if (filteredItems.length === 0) return null;

            return {
                ...category,
                items: filteredItems
            };
        }).filter(Boolean) as RiskCategory[];
    }, [data, searchTerm, selectedTag]);

    // Tüm Tagleri Topla
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        data.forEach(cat => {
            cat.items.forEach(item => {
                if (item.sector_tags) {
                    item.sector_tags.forEach(t => tags.add(t));
                }
            });
        });
        return Array.from(tags).sort();
    }, [data]);

    const handleDeleteItem = (categoryCode: string, itemIndex: number) => {
        // if (!confirm('Bu maddeyi silmek istediğinize emin misiniz?')) return;

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
        // if (!confirm(`"${subCategory}" başlığındaki TÜM risk maddelerini silmek istediğinize emin misiniz?`)) return;

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

        // if (!confirm(`"${category.category}" kategorisini ve içindeki ${category.items.length} maddeyi silmek istediğinize emin misiniz?`)) return;

        const newData = data.filter(cat => cat.code !== categoryCode);
        saveDataToApi(newData);
    };

    // Kategoriye Toplu Tag Ekleme
    const handleAddTagToCategory = (categoryCode: string) => {
        const tag = prompt("Bu kategorideki tüm maddelere eklenecek etiketi girin (örn: inşaat):");
        if (!tag) return;

        const cleanTag = tag.trim().toLowerCase();
        if (!cleanTag) return;

        const newData = data.map(cat => {
            if (cat.code === categoryCode) {
                const newItems = cat.items.map((item: any) => {
                    const currentTags = item.sector_tags || [];
                    if (!currentTags.includes(cleanTag)) {
                        return { ...item, sector_tags: [...currentTags, cleanTag] };
                    }
                    return item;
                });
                return { ...cat, items: newItems };
            }
            return cat;
        });
        saveDataToApi(newData);
    };

    // Kategoriden Toplu Tag Silme
    const handleRemoveTagFromCategory = (categoryCode: string, tagToRemove: string) => {
        // if (!confirm(`"${tagToRemove}" etiketini bu kategorideki TÜM risk maddelerinden silmek istediğinize emin misiniz?`)) return;

        const newData = data.map(cat => {
            if (cat.code === categoryCode) {
                const newItems = cat.items.map((item: any) => {
                    const currentTags = item.sector_tags || [];
                    return { ...item, sector_tags: currentTags.filter((t: string) => t !== tagToRemove) };
                });
                return { ...cat, items: newItems };
            }
            return cat;
        });
        saveDataToApi(newData);
    };

    // Tekil maddeye tag ekleme
    const handleAddTagToItem = (categoryCode: string, itemIdx: number, item: any) => {
        const tag = prompt("Bu maddeye eklenecek etiketi girin:");
        if (!tag) return;

        const cleanTag = tag.trim().toLowerCase();
        if (!cleanTag) return;

        const currentTags = item.sector_tags || [];
        if (currentTags.includes(cleanTag)) return;

        const newData = data.map(cat => {
            if (cat.code === categoryCode) {
                const newItems = [...cat.items];
                const targetIndex = item.originalIndex !== undefined ? item.originalIndex : itemIdx;

                newItems[targetIndex] = {
                    ...newItems[targetIndex],
                    sector_tags: [...currentTags, cleanTag]
                };
                return { ...cat, items: newItems };
            }
            return cat;
        });
        saveDataToApi(newData);
    };

    // Tekil maddeden tag silme
    const handleRemoveTagFromItem = (categoryCode: string, itemIdx: number, item: any, tagToRemove: string) => {
        // if (!confirm(`"${tagToRemove}" etiketini bu maddeden silmek istediğinize emin misiniz?`)) return;

        const newData = data.map(cat => {
            if (cat.code === categoryCode) {
                const newItems = [...cat.items];
                const targetIndex = item.originalIndex !== undefined ? item.originalIndex : itemIdx;
                const currentTags = item.sector_tags || [];

                newItems[targetIndex] = {
                    ...newItems[targetIndex],
                    sector_tags: currentTags.filter((t: string) => t !== tagToRemove)
                };
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
                measures: item.measures,
                sector_tags: item.sector_tags || []
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
                measures: '',
                sector_tags: []
            });
        }
        setNewTag(''); // Tag inputunu temizle
    };

    const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
        if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') return;
        e.preventDefault();

        const tag = newTag.trim().toLowerCase();
        if (tag && !formData.sector_tags.includes(tag)) {
            setFormData({
                ...formData,
                sector_tags: [...formData.sector_tags, tag]
            });
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagRemove: string) => {
        setFormData({
            ...formData,
            sector_tags: formData.sector_tags.filter(t => t !== tagRemove)
        });
    };

    const handleModalSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Mükerrer Risk No Kontrolü
        // Edit modunda ve risk no değişmemişse kontrolü pas geç
        const riskNoChanged = modalMode === 'edit' && editingItem ? formData.riskNo !== editingItem.riskNo : true;

        if (riskNoChanged && formData.riskNo && formData.riskNo.trim() !== "") {
            const isDuplicate = data.some(cat =>
                cat.items.some((item: any, idx: number) => {
                    // Kendi kendisiyle çakışma kontrolü (zaten yukarıda riskNoChanged ile handle ettik ama güvenlik olsun)
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
            // Eğer filtrelenmiş data ise _originalIndex vardır, onu kullan. Yoksa idx kullan.
            const originalIdx = item._originalIndex !== undefined ? item._originalIndex : idx;
            groups[subCat].push({ ...item, originalIndex: originalIdx });
        });
        return groups;
    };

    // Yükleniyor durumu
    if (status === 'loading' || (status === 'authenticated' && !isAuthenticated)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md flex flex-col items-center">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-600 font-medium">Oturum kontrol ediliyor...</p>
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
                        {/* Bekleyen Öneriler Butonu */}
                        <button
                            onClick={() => { setShowRiskSuggestions(true); fetchPendingRisks(); }}
                            className={`flex items-center px-4 py-2 rounded-md font-bold transition-colors ${pendingRisksCount > 0
                                ? 'bg-amber-500 text-white hover:bg-amber-600 animate-pulse'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <span className="mr-2">📥</span>
                            Öneriler
                            {pendingRisksCount > 0 && (
                                <span className="ml-2 bg-white text-amber-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                    {pendingRisksCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={handleSyncToSupabase}
                            disabled={isSyncing}
                            className="flex items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-md hover:from-indigo-700 hover:to-purple-700 transition-all font-bold disabled:opacity-50 shadow-md"
                        >
                            {isSyncing ? (
                                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-5 h-5 mr-2" />
                            )}
                            {isSyncing ? 'Senkronize Ediliyor...' : '🔄 Senkronize Et'}
                        </button>
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

                {/* Arama ve Filtreleme Bölümü */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="flex flex-col space-y-4">
                        {/* Arama Inputu */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition duration-150 ease-in-out"
                                placeholder="Ara... (Risk No, Tehlike, Risk, Önlem, Kaynak)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        {/* Etiket Filtreleme */}
                        {allTags.length > 0 && (
                            <div className="flex flex-wrap gap-2 items-center">
                                <div className="flex items-center text-gray-500 mr-2">
                                    <Filter className="w-4 h-4 mr-1" />
                                    <span className="text-xs font-bold uppercase">Etiketler:</span>
                                </div>

                                <button
                                    onClick={() => setSelectedTag(null)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${selectedTag === null
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Tümü
                                </button>

                                {allTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors border ${selectedTag === tag
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                            : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                                            }`}
                                    >
                                        #{tag}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Sonuç Özeti */}
                        {(searchTerm || selectedTag) && (
                            <div className="text-xs text-gray-500 italic">
                                {filteredData.length} kategori ve toplam {filteredData.reduce((acc, cat) => acc + cat.items.length, 0)} madde bulundu.
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10">Yükleniyor...</div>
                ) : (
                    <div className="space-y-4">
                        {filteredData.length === 0 ? (
                            <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-gray-200">
                                <Search className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                                <p>Aradığınız kriterlere uygun kayıt bulunamadı.</p>
                                <button onClick={() => { setSearchTerm(''); setSelectedTag(null); }} className="text-blue-600 hover:underline mt-2 text-sm">Filtreleri Temizle</button>
                            </div>
                        ) : (
                            filteredData.map((category) => {
                                const subCategories = getSubCategories(category.items);

                                return (
                                    <div key={`cat-${category.code}-${data.indexOf(category)}`} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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

                                            {/* Tag Yönetimi */}
                                            <div className="flex-1 px-4 flex flex-wrap gap-1 items-center justify-start" onClick={(e) => e.stopPropagation()}>
                                                {Array.from(new Set(category.items.flatMap((i: any) => i.sector_tags || []))).sort().map((tag: any) => (
                                                    <span
                                                        key={tag}
                                                        className={`flex items-center text-[10px] px-1.5 py-0.5 rounded border group shadow-sm transition-colors ${selectedTag === tag
                                                            ? 'bg-blue-600 text-white border-blue-700 font-bold ring-2 ring-blue-200'
                                                            : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                                            }`}
                                                    >
                                                        #{tag}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveTagFromCategory(category.code, tag); }}
                                                            className={`ml-1 hidden group-hover:block transition-colors ${selectedTag === tag ? 'text-blue-200 hover:text-red-200' : 'text-indigo-400 hover:text-red-600'
                                                                }`}
                                                            title="Bu etiketi kategoriden sil"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleAddTagToCategory(category.code); }}
                                                    className="text-[10px] bg-white text-gray-500 px-1.5 py-0.5 rounded border border-dashed border-gray-300 hover:text-blue-600 hover:border-blue-300 flex items-center transition-colors shadow-sm"
                                                    title="Kategoriye Toplu Etiket Ekle"
                                                >
                                                    <Plus className="w-3 h-3 mr-1" /> Etiket
                                                </button>
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
                                                        {Object.entries(subCategories).map(([subCatName, items], subIdx) => (
                                                            <div key={`${category.code}-sub-${subIdx}-${subCatName}`} className="border rounded-lg overflow-hidden">
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
                                                                    {items.map((item: any, itemIdx: number) => (
                                                                        <div key={`${category.code}-${subCatName}-item-${item.originalIndex}-${itemIdx}`} className="border rounded p-3 hover:shadow-md transition-shadow bg-white relative group">
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

                                                                                    <div className="mt-1 flex flex-wrap gap-1 items-center">
                                                                                        {(item.sector_tags || []).map((tag: string, i: number) => (
                                                                                            <span
                                                                                                key={i}
                                                                                                className={`flex items-center text-[9px] px-1 py-0.5 rounded border group transition-colors ${selectedTag === tag
                                                                                                    ? 'bg-blue-600 text-white border-blue-700 font-bold ring-1 ring-blue-200'
                                                                                                    : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                                                                                    }`}
                                                                                            >
                                                                                                #{tag}
                                                                                                <button
                                                                                                    onClick={(e) => { e.stopPropagation(); handleRemoveTagFromItem(category.code, itemIdx, item, tag); }}
                                                                                                    className={`ml-1 hidden group-hover:block transition-colors ${selectedTag === tag ? 'text-blue-200 hover:text-red-200' : 'text-indigo-400 hover:text-red-600'
                                                                                                        }`}
                                                                                                    title="Sil"
                                                                                                >
                                                                                                    <X className="w-3 h-3" />
                                                                                                </button>
                                                                                            </span>
                                                                                        ))}
                                                                                        <button
                                                                                            onClick={(e) => { e.stopPropagation(); handleAddTagToItem(category.code, itemIdx, item); }}
                                                                                            className="text-[9px] bg-transparent text-gray-400 px-1 py-0.5 rounded border border-dashed border-gray-300 hover:text-blue-600 hover:border-blue-300 flex items-center transition-colors opacity-50 hover:opacity-100"
                                                                                            title="Etiket Ekle"
                                                                                        >
                                                                                            <Plus className="w-3 h-3" />
                                                                                        </button>
                                                                                    </div>
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
                            }))}
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

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sektör Etiketleri (AI Arama İçin)</label>
                                <div className="flex space-x-2 mb-2">
                                    <input
                                        type="text"
                                        className="flex-1 border rounded p-2 text-sm text-black"
                                        value={newTag}
                                        onChange={e => setNewTag(e.target.value)}
                                        onKeyDown={handleAddTag}
                                        placeholder="Etiket yazıp Enter'a basın (örn: kaynak, metal, inşaat)"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddTag}
                                        className="bg-indigo-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-indigo-700"
                                    >
                                        Ekle
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 min-h-[30px] p-2 bg-gray-50 rounded border">
                                    {formData.sector_tags.map((tag, idx) => (
                                        <span key={idx} className="bg-white text-indigo-700 border border-indigo-200 px-2 py-1 rounded-full text-xs font-bold flex items-center shadow-sm">
                                            #{tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                                className="ml-1 text-indigo-400 hover:text-red-500"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                    {formData.sector_tags.length === 0 && <span className="text-gray-400 text-xs italic">Henüz etiket eklenmemiş.</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded border">
                                <div>
                                    <h4 className="text-xs font-bold text-red-800 mb-2 border-b border-red-200 pb-1">Mevcut Durum (Risk Skoru)</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-[10px] block mb-1">Olasılık</label>
                                            <select
                                                className="w-full border rounded p-1 text-xs text-black"
                                                value={formData.p}
                                                onChange={e => setFormData({ ...formData, p: parseFloat(e.target.value) })}
                                            >
                                                {P_VALUES.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] block mb-1">Frekans</label>
                                            <select
                                                className="w-full border rounded p-1 text-xs text-black"
                                                value={formData.f}
                                                onChange={e => setFormData({ ...formData, f: parseFloat(e.target.value) })}
                                            >
                                                {F_VALUES.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] block mb-1">Şiddet</label>
                                            <select
                                                className="w-full border rounded p-1 text-xs text-black"
                                                value={formData.s}
                                                onChange={e => setFormData({ ...formData, s: parseFloat(e.target.value) })}
                                            >
                                                {S_VALUES.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-green-800 mb-2 border-b border-green-200 pb-1">Önlem Sonrası (Hedef)</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-[10px] block mb-1">Olasılık</label>
                                            <select
                                                className="w-full border rounded p-1 text-xs text-black"
                                                value={formData.p2}
                                                onChange={e => setFormData({ ...formData, p2: parseFloat(e.target.value) })}
                                            >
                                                {P_VALUES.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] block mb-1">Frekans</label>
                                            <select
                                                className="w-full border rounded p-1 text-xs text-black"
                                                value={formData.f2}
                                                onChange={e => setFormData({ ...formData, f2: parseFloat(e.target.value) })}
                                            >
                                                {F_VALUES.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] block mb-1">Şiddet</label>
                                            <select
                                                className="w-full border rounded p-1 text-xs text-black"
                                                value={formData.s2}
                                                onChange={e => setFormData({ ...formData, s2: parseFloat(e.target.value) })}
                                            >
                                                {S_VALUES.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
                                            </select>
                                        </div>
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

            {/* Öneriler Modal */}
            {showRiskSuggestions && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-amber-50">
                            <h2 className="text-lg font-bold text-amber-800">📥 Kullanıcı Risk Önerileri</h2>
                            <button
                                onClick={() => setShowRiskSuggestions(false)}
                                className="p-2 hover:bg-amber-100 rounded text-amber-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto max-h-[60vh]">
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
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">{risk.risk_no}</span>
                                                        <span className="text-xs text-gray-500">
                                                            {risk.user_email}
                                                        </span>
                                                    </div>
                                                    <p className="font-bold text-gray-800 mb-1">{risk.hazard}</p>
                                                    <p className="text-sm text-gray-600 mb-2">{risk.risk}</p>
                                                    {risk.measures && (
                                                        <p className="text-xs text-gray-500 bg-white p-2 rounded border">
                                                            <strong>Önlemler:</strong> {risk.measures}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2 ml-4">
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
