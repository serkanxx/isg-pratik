"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Building2, Plus, Search, Edit2, Trash2, X, Upload,
    ChevronRight, AlertCircle, CheckCircle
} from 'lucide-react';
import { Company, DangerClass, DANGER_CLASS_LABELS } from '../../types';

export default function FirmalarPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const showNewForm = searchParams.get('new') === 'true';
    const editId = searchParams.get('edit');

    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(showNewForm);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

    const logoInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        title: '',
        address: '',
        registration_number: '',
        danger_class: 'tehlikeli' as DangerClass,
        logo: null as string | null,
        employer: '',
        igu: '',
        doctor: '',
        representative: '',
        support: ''
    });

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const res = await fetch('/api/companies');
            if (res.ok) {
                const data = await res.json();
                setCompanies(data);

                // Edit parametresi varsa firmayı düzenleme modunda aç
                if (editId && data.length > 0) {
                    const companyToEdit = data.find((c: Company) => c.id === editId);
                    if (companyToEdit) {
                        setForm({
                            title: companyToEdit.title,
                            address: companyToEdit.address,
                            registration_number: companyToEdit.registration_number,
                            danger_class: companyToEdit.danger_class,
                            logo: companyToEdit.logo,
                            employer: companyToEdit.employer,
                            igu: companyToEdit.igu,
                            doctor: companyToEdit.doctor,
                            representative: companyToEdit.representative,
                            support: companyToEdit.support
                        });
                        setEditingId(companyToEdit.id);
                        setShowForm(true);
                    }
                }
            }
        } catch (error) {
            console.error('Firmalar alınamadı:', error);
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
            title: '',
            address: '',
            registration_number: '',
            danger_class: 'tehlikeli',
            logo: null,
            employer: '',
            igu: '',
            doctor: '',
            representative: '',
            support: ''
        });
        setEditingId(null);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                showNotif("Logo 1MB'dan büyük olamaz!", "error");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm({ ...form, logo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.title.trim()) {
            showNotif('Firma unvanı zorunludur!', 'error');
            return;
        }

        setSaving(true);

        try {
            const url = editingId ? `/api/companies/${editingId}` : '/api/companies';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                showNotif(editingId ? 'Firma güncellendi!' : 'Firma eklendi!');
                resetForm();
                setShowForm(false);
                fetchCompanies();
                router.replace('/panel/firmalar');
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

    const handleEdit = (company: Company) => {
        setForm({
            title: company.title,
            address: company.address,
            registration_number: company.registration_number,
            danger_class: company.danger_class,
            logo: company.logo,
            employer: company.employer,
            igu: company.igu,
            doctor: company.doctor,
            representative: company.representative,
            support: company.support
        });
        setEditingId(company.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu firmayı silmek istediğinize emin misiniz?')) return;

        try {
            const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showNotif('Firma silindi!');
                fetchCompanies();
            } else {
                showNotif('Firma silinemedi', 'error');
            }
        } catch (error) {
            showNotif('Sunucu hatası', 'error');
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8">
            {/* Notification */}
            {notification.show && (
                <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-2xl z-50 flex items-center ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                    {notification.type === 'error' ? <AlertCircle className="w-5 h-5 mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                    <span className="font-bold text-sm">{notification.message}</span>
                </div>
            )}

            {/* Gizli Logo Input */}
            <input type="file" accept="image/*" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" />

            {/* Başlık */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <Building2 className="w-7 h-7 text-indigo-600" />
                        Firmalarım
                    </h1>
                    <p className="text-slate-500 mt-1">Kayıtlı firmalarınızı yönetin</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Firma Ekle
                </button>
            </div>

            {/* Arama */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Firma ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800">
                                {editingId ? 'Firma Düzenle' : 'Yeni Firma Ekle'}
                            </h2>
                            <button
                                onClick={() => { setShowForm(false); resetForm(); router.replace('/panel/firmalar'); }}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Logo - Kompakt */}
                            <div className="flex items-center gap-3">
                                <div
                                    onClick={() => logoInputRef.current?.click()}
                                    className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all overflow-hidden flex-shrink-0"
                                >
                                    {form.logo ? (
                                        <img src={form.logo} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <Upload className="w-5 h-5 text-slate-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-700">Firma Logosu</p>
                                    <p className="text-xs text-slate-400">PNG, JPG (max 1MB)</p>
                                </div>
                                {form.logo && (
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, logo: null })}
                                        className="text-red-500 text-xs hover:underline"
                                    >
                                        Kaldır
                                    </button>
                                )}
                            </div>

                            {/* Firma Unvanı */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Firma Unvanı *</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => {
                                        // Yeni satır karakterlerini temizle
                                        const cleanedValue = e.target.value.replace(/[\r\n]+/g, ' ');
                                        setForm({ ...form, title: cleanedValue });
                                    }}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Örn: ABC Sanayi Ltd. Şti."
                                />
                            </div>

                            {/* Adres */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Adres</label>
                                <input
                                    type="text"
                                    value={form.address}
                                    onChange={(e) => {
                                        // Yeni satır karakterlerini temizle
                                        const cleanedValue = e.target.value.replace(/[\r\n]+/g, ' ');
                                        setForm({ ...form, address: cleanedValue });
                                    }}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Firma adresi..."
                                />
                            </div>

                            {/* Sicil No ve Tehlike Sınıfı */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">SGK Sicil No</label>
                                    <input
                                        type="text"
                                        value={form.registration_number}
                                        onChange={(e) => {
                                            // Sadece sayılara izin ver
                                            const value = e.target.value.replace(/[^0-9]/g, '');
                                            setForm({ ...form, registration_number: value });
                                        }}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Sadece rakam giriniz"
                                        inputMode="numeric"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Tehlike Sınıfı *</label>
                                    <select
                                        value={form.danger_class}
                                        onChange={(e) => setForm({ ...form, danger_class: e.target.value as DangerClass })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                    >
                                        <option value="az_tehlikeli">Az Tehlikeli</option>
                                        <option value="tehlikeli">Tehlikeli</option>
                                        <option value="cok_tehlikeli">Çok Tehlikeli</option>
                                    </select>
                                </div>
                            </div>

                            {/* Risk Değerlendirme Ekibi */}
                            <div className="border-t border-slate-200 pt-6">
                                <h3 className="text-sm font-bold text-slate-700 mb-4">Risk Değerlendirme Ekibi</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">İşveren / Vekili</label>
                                        <input
                                            type="text"
                                            value={form.employer}
                                            onChange={(e) => setForm({ ...form, employer: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">İş Güvenliği Uzmanı</label>
                                        <input
                                            type="text"
                                            value={form.igu}
                                            onChange={(e) => setForm({ ...form, igu: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">İşyeri Hekimi</label>
                                        <input
                                            type="text"
                                            value={form.doctor}
                                            onChange={(e) => setForm({ ...form, doctor: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Çalışan Temsilcisi</label>
                                        <input
                                            type="text"
                                            value={form.representative}
                                            onChange={(e) => setForm({ ...form, representative: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Destek Elemanı</label>
                                        <input
                                            type="text"
                                            value={form.support}
                                            onChange={(e) => setForm({ ...form, support: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Butonlar */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); resetForm(); router.replace('/panel/firmalar'); }}
                                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }

            {/* Firma Listesi - Modern Kart Tasarımı */}
            {
                loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                    </div>
                ) : filteredCompanies.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 mb-6 text-lg">
                            {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz firma eklemediniz'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => { resetForm(); setShowForm(true); }}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-600/25"
                            >
                                <Plus className="w-5 h-5" />
                                İlk Firmayı Ekle
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCompanies.map((company) => (
                            <div
                                key={company.id}
                                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-300 transition-all duration-300 cursor-pointer"
                                onClick={() => router.push(`/panel/firmalar/${company.id}`)}
                            >
                                {/* Kart Üst Kısım - Gradient Header */}
                                <div className={`h-24 relative bg-gradient-to-br ${company.danger_class === 'az_tehlikeli'
                                    ? 'from-emerald-500 to-teal-600'
                                    : company.danger_class === 'tehlikeli'
                                        ? 'from-amber-500 to-orange-600'
                                        : 'from-red-500 to-rose-600'
                                    }`}>
                                    {/* Logo */}
                                    <div className="absolute -bottom-8 left-6">
                                        {company.logo ? (
                                            <img
                                                src={company.logo}
                                                alt={company.title}
                                                className="w-16 h-16 rounded-xl object-contain bg-white border-4 border-white shadow-lg"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
                                                <span className="text-2xl font-bold text-slate-600">
                                                    {company.title.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {/* Tehlike Sınıfı Badge */}
                                    <div className="absolute top-3 right-3">
                                        <span className="bg-white/90 backdrop-blur-sm text-xs px-3 py-1.5 rounded-full font-bold shadow-sm">
                                            {DANGER_CLASS_LABELS[company.danger_class]}
                                        </span>
                                    </div>
                                </div>

                                {/* Kart İçerik */}
                                <div className="pt-12 pb-5 px-6">
                                    <h3 className="font-bold text-slate-800 text-lg mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                        {company.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                                        {company.address || 'Adres bilgisi yok'}
                                    </p>

                                    {/* Alt Bilgiler */}
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="text-xs text-slate-400">
                                            {company.registration_number ? (
                                                <span>SGK: {company.registration_number}</span>
                                            ) : (
                                                <span>Sicil No Girilmemiş</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleEdit(company)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Düzenle"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(company.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Sil"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                        ))}
                    </div>
                )
            }
        </div >
    );
}
