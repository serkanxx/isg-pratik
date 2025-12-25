"use client";

import React, { useState, useEffect } from 'react';
import {
    FileCheck, Download, AlertTriangle, Building2, User, Calendar,
    Clock, CheckCircle, AlertCircle, Flame, HardHat, Zap, Wind,
    Shield, Eye, Lock, Unlock, RefreshCw, ChevronDown
} from 'lucide-react';
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRequireAuth } from '@/hooks/useRequireAuth';

// İzin Türleri
const PERMIT_TYPES = [
    { id: 'sicak', label: 'Sıcak İş Çalışması', icon: Flame, color: 'bg-orange-100 text-orange-700', badge: 'risk-hot' },
    { id: 'yuksek', label: 'Yüksekte Çalışma', icon: HardHat, color: 'bg-blue-100 text-blue-700', badge: 'risk-height' },
    { id: 'kapali', label: 'Kapalı Alan', icon: Wind, color: 'bg-purple-100 text-purple-700' },
    { id: 'elektrik', label: 'Elektrik Çalışması', icon: Zap, color: 'bg-yellow-100 text-yellow-700' },
];

// Güvenlik Önlemleri - Genişletilmiş Liste
const SAFETY_MEASURES = [
    // Genel Önlemler
    'Çalışma alanı sınırlandırıldı / Uyarı levhaları asıldı',
    'Acil durum planı ve iletişim hazır',
    'İlk yardım malzemeleri kontrol edildi',
    'Çalışanlar iş güvenliği eğitimi aldı',
    'Risk değerlendirmesi yapıldı ve paylaşıldı',

    // Sıcak İş Önlemleri
    'Yangın söndürme tüpü hazır (Sıcak İş)',
    'Yanıcı malzemeler uzaklaştırıldı (Sıcak İş)',
    'Yangın gözetlemecisi görevlendirildi (Sıcak İş)',

    // Yüksekte Çalışma Önlemleri
    'Yaşam hattı / Emniyet kemeri kontrol edildi',
    'İskele ve platformlar kontrol edildi',
    'Düşme önleme sistemleri kuruldu',

    // Kapalı Alan Önlemleri
    'Gaz ölçümü yapıldı ve uygun (Kapalı Alan)',
    'Havalandırma sistemi çalışıyor (Kapalı Alan)',
    'Kurtarma ekipmanları hazır (Kapalı Alan)',

    // Elektrik Çalışması Önlemleri
    'Enerji kesildi ve kilitlendi (LOTO)',
    'Topraklama kontrolü yapıldı (Elektrik)',
];

// KKD Listesi
const PPE_LIST = [
    'Baret', 'İş Ayakkabısı', 'Reflektörlü Yelek', 'Koruyucu Gözlük',
    'Kaynak Maskesi', 'Emniyet Kemeri', 'Gaz Maskesi', 'Kulaklık'
];

interface Company {
    id: string;
    title: string;
}

export default function IsIzinFormuPage() {
    const { data: session } = useSession();
    const { requireAuth } = useRequireAuth();

    // Firmalar state
    const [companies, setCompanies] = useState<Company[]>([]);
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        companyName: '',
        location: '',
        workDescription: '',
        startTime: '',
        endTime: '',
        requesterLabel: '',  // Kullanıcının gireceği label
        requesterName: '',
        approverLabel: '',   // Kullanıcının gireceği label
        approverName: '',
    });

    const [selectedPermitTypes, setSelectedPermitTypes] = useState<string[]>([]);
    const [selectedSafetyMeasures, setSelectedSafetyMeasures] = useState<string[]>([]);
    const [selectedPPE, setSelectedPPE] = useState<string[]>([]);
    const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
    const [isLoading, setIsLoading] = useState(false);

    // İzin numarası - yıl sabit, kullanıcı geri kalanını girer
    const currentYear = new Date().getFullYear();
    const [permitNoSuffix, setPermitNoSuffix] = useState('');

    // Firmaları yükle
    useEffect(() => {
        if (session?.user?.email) {
            fetch('/api/companies')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setCompanies(data);
                    }
                })
                .catch(err => console.error('Firmalar yüklenemedi:', err));
        }
    }, [session]);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
    };

    const togglePermitType = (id: string) => {
        setSelectedPermitTypes(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const toggleSafetyMeasure = (measure: string) => {
        setSelectedSafetyMeasures(prev =>
            prev.includes(measure) ? prev.filter(m => m !== measure) : [...prev, measure]
        );
    };

    const togglePPE = (item: string) => {
        setSelectedPPE(prev =>
            prev.includes(item) ? prev.filter(p => p !== item) : [...prev, item]
        );
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const selectCompany = (companyTitle: string) => {
        setFormData(prev => ({ ...prev, companyName: companyTitle }));
        setShowCompanyDropdown(false);
    };

    // Tarih formatlama
    const formatDateTime = (dateTimeStr: string) => {
        if (!dateTimeStr) return '-';
        const date = new Date(dateTimeStr);
        return date.toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleSubmit = async () => {
        // Giriş kontrolü - giriş yapmamışsa kayıt sayfasına yönlendir
        if (!requireAuth()) return;

        if (!formData.companyName) {
            showNotification('Lütfen firma adını girin!', 'error');
            return;
        }
        if (!formData.location) {
            showNotification('Lütfen çalışma alanını girin!', 'error');
            return;
        }
        if (selectedPermitTypes.length === 0) {
            showNotification('Lütfen en az bir izin türü seçin!', 'error');
            return;
        }

        setIsLoading(true);
        showNotification('PDF oluşturuluyor...', 'success');

        const permitNo = `#${currentYear}-${permitNoSuffix || '0000'}`;

        try {
            const response = await fetch('/api/is-izin-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    permitNo,
                    companyName: formData.companyName,
                    location: formData.location,
                    workDescription: formData.workDescription,
                    startTime: formatDateTime(formData.startTime),
                    endTime: formatDateTime(formData.endTime),
                    permitTypes: selectedPermitTypes,
                    safetyMeasures: selectedSafetyMeasures,
                    ppeList: selectedPPE,
                    requesterLabel: formData.requesterLabel || 'İzni İsteyen',
                    requesterName: formData.requesterName,
                    approverLabel: formData.approverLabel || 'İzni Onaylayan',
                    approverName: formData.approverName,
                })
            });

            if (!response.ok) {
                throw new Error('PDF oluşturulamadı');
            }

            // PDF'i indir
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Is-Izin-Formu-${currentYear}-${permitNoSuffix || '0000'}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            // Raporu veritabanına kaydet
            try {
                const reportSnapshot = {
                    permitNo,
                    companyName: formData.companyName,
                    location: formData.location,
                    workDescription: formData.workDescription,
                    startTime: formData.startTime,
                    endTime: formData.endTime,
                    permitTypes: selectedPermitTypes,
                    safetyMeasures: selectedSafetyMeasures,
                    ppeList: selectedPPE,
                    requesterLabel: formData.requesterLabel,
                    requesterName: formData.requesterName,
                    approverLabel: formData.approverLabel,
                    approverName: formData.approverName,
                };

                await fetch('/api/reports', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'WORK_PERMIT',
                        title: `${formData.companyName} - İş İzin Formu ${permitNo}`,
                        data: reportSnapshot
                    })
                });
                console.log('İş İzin Formu raporu kaydedildi.');
            } catch (saveError) {
                console.error('Rapor kaydetme hatası:', saveError);
            }

            showNotification('İş İzin Formu PDF\'i başarıyla indirildi!', 'success');
        } catch (error: any) {
            console.error('PDF hatası:', error);
            showNotification('PDF oluşturulurken bir hata oluştu!', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
            {/* Bildirim */}
            {notification.show && (
                <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-2xl z-[100] flex items-center ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                    {notification.type === 'error' ? <AlertCircle className="w-5 h-5 mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                    <span className="font-bold text-sm">{notification.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="text-white">
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                            <FileCheck className="w-8 h-8" />
                            İş İzin Formu
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                        <span className="text-white font-medium">İzin No: #{currentYear}-</span>
                        <input
                            type="text"
                            value={permitNoSuffix}
                            onChange={(e) => setPermitNoSuffix(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                            placeholder="0001"
                            className="w-16 px-2 py-1 bg-white/30 border border-white/40 rounded-lg text-white placeholder-white/60 text-center font-bold focus:outline-none focus:ring-2 focus:ring-white/50"
                            maxLength={4}
                        />
                    </div>
                </div>
            </div>

            {/* 1. İş Tanımı ve Lokasyon */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        📝 1. İş Tanımı ve Lokasyon
                    </h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Firma / Yüklenici Adı *</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    onFocus={() => companies.length > 0 && setShowCompanyDropdown(true)}
                                    placeholder="Firma seçin veya yazın..."
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white pr-10"
                                />
                                {companies.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <ChevronDown className={`w-5 h-5 transition-transform ${showCompanyDropdown ? 'rotate-180' : ''}`} />
                                    </button>
                                )}
                            </div>
                            {/* Firma Dropdown */}
                            {showCompanyDropdown && companies.length > 0 && (
                                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-auto">
                                    {companies.map(company => (
                                        <button
                                            key={company.id}
                                            type="button"
                                            onClick={() => selectCompany(company.title)}
                                            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm text-slate-700 hover:text-blue-700 transition-colors flex items-center gap-2"
                                        >
                                            <Building2 className="w-4 h-4 text-slate-400" />
                                            {company.title}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Çalışma Alanı / Lokasyon *</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                placeholder="Örn: Kazan Dairesi, Çatı Katı"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Yapılacak İşin Detayı</label>
                        <textarea
                            name="workDescription"
                            value={formData.workDescription}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Yapılacak işi detaylıca açıklayınız..."
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white resize-none"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Başlangıç Zamanı</label>
                            <input
                                type="datetime-local"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Bitiş Zamanı</label>
                            <input
                                type="datetime-local"
                                name="endTime"
                                value={formData.endTime}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. İzin Türü */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-600 to-orange-500 px-6 py-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        ⚠️ 2. İzin Türü
                        <span className="text-sm font-normal text-amber-100 ml-2">(Birden fazla seçilebilir)</span>
                    </h2>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {PERMIT_TYPES.map((type) => {
                            const Icon = type.icon;
                            const isSelected = selectedPermitTypes.includes(type.id);
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => togglePermitType(type.id)}
                                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 text-left ${isSelected
                                        ? 'border-blue-500 bg-blue-50 shadow-md'
                                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg ${type.color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                                        {type.label}
                                    </span>
                                    {isSelected && (
                                        <CheckCircle className="w-5 h-5 text-blue-600 ml-auto" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 3. Güvenlik Önlemleri */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-green-500 px-6 py-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        🛡️ 3. Güvenlik Önlemleri Kontrol Listesi
                    </h2>
                </div>
                <div className="p-6">
                    <p className="text-sm text-slate-500 mb-4">Aşağıdaki önlemlerin alındığını doğrulayınız.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {SAFETY_MEASURES.map((measure, index) => {
                            const isSelected = selectedSafetyMeasures.includes(measure);
                            return (
                                <button
                                    key={index}
                                    onClick={() => toggleSafetyMeasure(measure)}
                                    className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 text-left text-sm ${isSelected
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                                        {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                    </div>
                                    <span className={isSelected ? 'text-emerald-700 font-medium' : 'text-slate-600'}>
                                        {measure}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 4. KKD */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-violet-500 px-6 py-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        🦺 4. Gerekli Kişisel Koruyucu Donanımlar
                    </h2>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {PPE_LIST.map((item, index) => {
                            const isSelected = selectedPPE.includes(item);
                            return (
                                <button
                                    key={index}
                                    onClick={() => togglePPE(item)}
                                    className={`p-3 rounded-xl border-2 transition-all text-center text-sm font-medium ${isSelected
                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-600'
                                        }`}
                                >
                                    {item}
                                    {isSelected && <span className="ml-1">✓</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 5. Onay ve İmzalar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-6 py-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        ✍️ 5. Onay ve İmzalar
                    </h2>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* İzni İsteyen */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Başlık (PDF'de görünecek)</label>
                                <input
                                    type="text"
                                    name="requesterLabel"
                                    value={formData.requesterLabel}
                                    onChange={handleInputChange}
                                    placeholder="Formen / Mühendis / Şef vb."
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Ad Soyad</label>
                                <input
                                    type="text"
                                    name="requesterName"
                                    value={formData.requesterName}
                                    onChange={handleInputChange}
                                    placeholder="Ad Soyad"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white"
                                />
                            </div>
                            <div className="h-20 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 bg-slate-50 text-sm">
                                İmza Alanı
                            </div>
                        </div>

                        {/* İzni Onaylayan */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Başlık (PDF'de görünecek)</label>
                                <input
                                    type="text"
                                    name="approverLabel"
                                    value={formData.approverLabel}
                                    onChange={handleInputChange}
                                    placeholder="İSG Uzmanı / Amir / Müdür vb."
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Ad Soyad</label>
                                <input
                                    type="text"
                                    name="approverName"
                                    value={formData.approverName}
                                    onChange={handleInputChange}
                                    placeholder="Ad Soyad"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white"
                                />
                            </div>
                            <div className="h-20 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 bg-slate-50 text-sm">
                                İmza Alanı
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl text-lg font-bold shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-600/40 transition-all flex items-center justify-center gap-3 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
            >
                {isLoading ? (
                    <>
                        <RefreshCw className="w-6 h-6 animate-spin" />
                        PDF Oluşturuluyor...
                    </>
                ) : (
                    <>
                        <Download className="w-6 h-6" />
                        Formu Onayla ve PDF Oluştur
                    </>
                )}
            </button>

            {/* Bilgi Kutusu */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    İş İzin Formu Hakkında
                </h3>
                <p className="text-sm text-blue-700">
                    İş İzin Formu (PTW - Permit to Work), tehlikeli işlerin güvenli bir şekilde yürütülmesi için gerekli izin ve kontrol sürecini belgeleyen yasal bir dokümandır.
                    Bu form, özellikle sıcak iş çalışmaları, yüksekte çalışma, kapalı alan çalışmaları ve elektrik işleri gibi yüksek riskli işler için zorunludur.
                </p>
            </div>
        </div>
    );
}
