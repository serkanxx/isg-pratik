"use client";

import React, { useState, useEffect } from 'react';
import {
    AlertTriangle, Download, Lock, Menu, X, Calendar, User, Briefcase, ChevronDown, LogIn, UserPlus, LogOut, Building2, Shield, LayoutDashboard, FileText, CheckCircle, AlertCircle
} from 'lucide-react';
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import jsPDF from 'jspdf';
import { Company, VALIDITY_YEARS, DANGER_CLASS_LABELS } from '@/app/types';
import { formatDate } from '@/app/utils';

export default function AcilDurumPage() {
    const { data: session, status } = useSession();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

    // Rapor bilgileri
    const [reportDate, setReportDate] = useState<string>('');
    const [validityDate, setValidityDate] = useState<string>('');

    // Firmaları çek
    useEffect(() => {
        if (session?.user?.email) {
            fetch('/api/companies')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setCompanies(data);
                    }
                })
                .catch(err => console.error('Firmalar alınamadı:', err));
        }
    }, [session]);

    const selectedCompany = companies.find(c => c.id === selectedCompanyId);

    // Firma seçildiğinde header bilgilerini doldur
    const handleCompanySelect = (companyId: string) => {
        setSelectedCompanyId(companyId);
    };

    // Rapor tarihi değiştiğinde geçerlilik tarihini güncelle
    const handleReportDateChange = (date: string) => {
        setReportDate(date);
        if (date && selectedCompany) {
            const reportDateObj = new Date(date);
            const validityYears = VALIDITY_YEARS[selectedCompany.danger_class];
            reportDateObj.setFullYear(reportDateObj.getFullYear() + validityYears);
            setValidityDate(reportDateObj.toISOString().split('T')[0]);
        }
    };

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
    };

    // PDF oluşturma
    const generatePDF = async () => {
        if (!session) {
            showNotification('PDF oluşturmak için giriş yapmalısınız!', 'error');
            return;
        }
        if (!selectedCompany) {
            showNotification('Lütfen bir firma seçin!', 'error');
            return;
        }
        if (!reportDate) {
            showNotification('Lütfen rapor tarihini girin!', 'error');
            return;
        }

        showNotification('PDF hazırlanıyor...', 'success');

        try {
            // DOCX dosyasını fetch et ve PDF olarak dönüştür
            const response = await fetch('/api/acil-durum-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName: selectedCompany.title,
                    companyAddress: selectedCompany.address || '',
                    registrationNumber: selectedCompany.registration_number || '',
                    reportDate: formatDate(reportDate),
                    validityDate: validityDate ? formatDate(validityDate) : '',
                    employer: selectedCompany.employer || '',
                    dangerClass: selectedCompany.danger_class
                })
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            console.log('Response headers:', response.headers.get('content-type'));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', errorText);
                throw new Error('PDF oluşturulamadı: ' + errorText);
            }

            const blob = await response.blob();
            console.log('Blob size:', blob.size);
            console.log('Blob type:', blob.type);

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Firma adının ilk 2 kelimesini al ve dosya ismi oluştur
            const getFirstTwoWords = (name: string) => {
                const words = name.trim().split(/\s+/);
                return words.slice(0, 2).join(' ');
            };
            const sanitizeName = (name: string) => {
                return name
                    .replace(/İ/g, 'I').replace(/ı/g, 'i')
                    .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
                    .replace(/Ü/g, 'U').replace(/ü/g, 'u')
                    .replace(/Ş/g, 'S').replace(/ş/g, 's')
                    .replace(/Ö/g, 'O').replace(/ö/g, 'o')
                    .replace(/Ç/g, 'C').replace(/ç/g, 'c')
                    .replace(/[^a-zA-Z0-9 -]/g, '');
            };
            const firstTwo = getFirstTwoWords(selectedCompany.title);
            const safeFilename = sanitizeName(firstTwo);
            a.download = `${safeFilename} - Acil Durum Eylem Planı.pdf`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            showNotification('PDF başarıyla indirildi!', 'success');
        } catch (error: any) {
            console.error('PDF hatası:', error);
            showNotification('PDF oluşturulurken hata oluştu: ' + (error.message || 'Bilinmeyen hata'), 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 text-gray-800 font-sans flex flex-col relative">

            {notification.show && (
                <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-2xl z-[100] flex items-center animate-bounce-in ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                    {notification.type === 'error' ? <AlertCircle className="w-5 h-5 mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                    <span className="font-bold text-sm">{notification.message}</span>
                </div>
            )}

            {/* NAVBAR */}
            <nav className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-xl border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            {/* Mobil Hamburger Menü Butonu */}
                            <button
                                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                                className="md:hidden mr-3 p-2 rounded-xl text-blue-100 hover:bg-white/10 transition-colors"
                                aria-label="Menüyü Aç"
                            >
                                {isMobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>

                            {/* Logo Alanı */}
                            <Link href="/" className="flex items-center group">
                                <div className="transition-transform duration-300 group-hover:scale-105">
                                    <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
                                </div>
                                <div className="ml-3 flex flex-col">
                                    <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 group-hover:to-white transition-all">İSG Pratik</span>
                                    <span className="text-[10px] text-blue-300/80 font-medium tracking-widest uppercase">Risk Yönetim Sistemi</span>
                                </div>
                            </Link>
                        </div>

                        <div className="flex items-center space-x-1 sm:space-x-4">
                            <div className="hidden md:flex items-center space-x-1.5">
                                {/* Panel Dashboard */}
                                <Link href="/panel" className="px-3 py-2 rounded-xl text-sm font-semibold text-white hover:bg-white/20 transition-all border border-white/10 bg-white/5 flex items-center gap-2">
                                    <LayoutDashboard className="w-4 h-4" />
                                    <span>Dashboard</span>
                                </Link>
                                {/* Firmalarım */}
                                <Link href="/panel/firmalar" className="px-3 py-2 rounded-xl text-sm font-semibold text-white hover:bg-white/20 transition-all border border-white/10 bg-white/5 flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    <span>Firmalarım</span>
                                </Link>
                                {/* Risk Değerlendirmesi */}
                                <Link href="/risk-degerlendirme" className="px-3 py-2 rounded-xl text-sm font-semibold text-white hover:bg-white/20 transition-all border border-white/10 bg-white/5 flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    <span>Risk Değerlendirmesi</span>
                                </Link>
                                {/* Acil Durum Eylem Planı - Aktif */}
                                <Link href="/acil-durum" className="px-3 py-2 rounded-xl bg-orange-600/80 text-sm font-semibold text-white border border-orange-500 shadow-sm flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Acil Durum Planı</span>
                                </Link>
                            </div>

                            {session ? (
                                <div className="flex items-center space-x-3 pl-4 md:border-l md:border-white/10">
                                    <Link
                                        href="/panel"
                                        className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                                    >
                                        Panel
                                    </Link>
                                    <div className="hidden sm:flex flex-col items-end mr-2">
                                        <span className="text-xs font-bold text-blue-100">
                                            {session.user?.name || session.user?.email}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => signOut({ callbackUrl: 'https://www.isgpratik.com/' })}
                                        className="bg-white/10 hover:bg-red-500/20 text-blue-200 hover:text-red-200 p-2 rounded-xl transition-all border border-white/10 hover:border-red-400/30 shadow-sm group"
                                        title="Çıkış Yap"
                                    >
                                        <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Link
                                        href="/login"
                                        className="text-sm font-medium text-blue-100 hover:text-white transition-colors"
                                    >
                                        Giriş
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
                                    >
                                        Kayıt Ol
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* ANA İÇERİK */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Sayfa Başlığı */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">Acil Durum Eylem Planı</h1>
                        <p className="text-slate-500">Firma bilgilerinizi seçin ve Acil Durum Eylem Planı PDF'i oluşturun</p>
                    </div>

                    {/* --- 1. FİRMA VE RAPOR BİLGİLERİ --- */}
                    <div className="bg-white shadow-sm shadow-slate-200/50 rounded-xl border border-slate-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-red-600 px-6 py-4 flex items-center justify-between rounded-t-xl">
                            <div className="flex items-center">
                                <div className="bg-white/10 p-2 rounded-lg mr-3">
                                    <Briefcase className="w-5 h-5 text-orange-100" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">1. Firma & Rapor Bilgileri</h3>
                                    <p className="text-xs text-orange-100 mt-0.5">Kayıtlı firmalarınızdan birini seçin ve rapor tarihini girin</p>
                                </div>
                            </div>
                            {session && (
                                <Link
                                    href="/panel/firmalar?new=true"
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-bold hover:bg-white/20 transition-colors border border-white/20"
                                >
                                    <Building2 className="w-4 h-4" />
                                    Yeni Firma Ekle
                                </Link>
                            )}
                        </div>

                        <div className="p-6">
                            {!session ? (
                                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <Lock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 mb-4">Firma seçimi için giriş yapmanız gerekiyor</p>
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                                    >
                                        <LogIn className="w-4 h-4" />
                                        Giriş Yap
                                    </Link>
                                </div>
                            ) : companies.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 mb-4">Henüz kayıtlı firmanız yok</p>
                                    <Link
                                        href="/panel/firmalar?new=true"
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                                    >
                                        <Building2 className="w-4 h-4" />
                                        İlk Firmayı Ekle
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Sol: Firma Seçimi */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Firma Seçin *</label>
                                            <select
                                                value={selectedCompanyId}
                                                onChange={(e) => handleCompanySelect(e.target.value)}
                                                className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all focus:bg-white"
                                            >
                                                <option value="">-- Firma Seçin --</option>
                                                {companies.map(c => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.title} ({DANGER_CLASS_LABELS[c.danger_class]})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {selectedCompany && (
                                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                                                <div className="flex items-center gap-3 mb-3">
                                                    {selectedCompany.logo ? (
                                                        <img src={selectedCompany.logo} alt="" className="w-12 h-12 rounded-lg object-contain border border-slate-200" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                                            {selectedCompany.title.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-slate-800">{selectedCompany.title}</p>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${selectedCompany.danger_class === 'az_tehlikeli'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : selectedCompany.danger_class === 'tehlikeli'
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {DANGER_CLASS_LABELS[selectedCompany.danger_class]}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-500">{selectedCompany.address || 'Adres girilmemiş'}</p>
                                                {selectedCompany.registration_number && (
                                                    <p className="text-xs text-slate-500">Sicil No: {selectedCompany.registration_number}</p>
                                                )}
                                            </div>
                                        )}

                                        {/* İşveren Bilgisi */}
                                        {selectedCompany && (
                                            <div className="bg-orange-50/30 p-4 rounded-xl border border-orange-100">
                                                <h4 className="text-xs font-bold text-orange-900 border-b border-orange-100 pb-2 mb-3 flex items-center">
                                                    <User className="w-3 h-3 mr-2" />
                                                    İşveren Bilgisi
                                                </h4>
                                                <p className="text-sm font-medium text-slate-700">{selectedCompany.employer || 'Belirtilmemiş'}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sağ: Rapor Bilgileri */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Rapor Tarihi *</label>
                                            <input
                                                type="date"
                                                className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all focus:bg-white"
                                                value={reportDate}
                                                onChange={(e) => handleReportDateChange(e.target.value)}
                                            />
                                            {reportDate && (
                                                <p className="text-xs text-slate-500 mt-1">Seçilen tarih: <span className="font-medium text-slate-700">{formatDate(reportDate)}</span></p>
                                            )}
                                        </div>

                                        {/* Geçerlilik Tarihi (Otomatik) */}
                                        {selectedCompany && reportDate && (
                                            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-bold text-emerald-800 uppercase">Geçerlilik Tarihi</p>
                                                        <p className="text-lg font-bold text-emerald-700 mt-1">
                                                            {validityDate ? formatDate(validityDate) : '-'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-emerald-600">
                                                            {DANGER_CLASS_LABELS[selectedCompany.danger_class]} = +{VALIDITY_YEARS[selectedCompany.danger_class]} yıl
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PDF İndir Butonu - Her zaman görünür */}
                    <div className="flex justify-center">
                        <button
                            onClick={generatePDF}
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl text-lg font-bold shadow-lg shadow-orange-600/30 hover:shadow-xl hover:shadow-orange-600/40 transition-all hover:scale-105"
                        >
                            <Download className="w-6 h-6 mr-3" />
                            Acil Durum Eylem Planı PDF İndir
                        </button>
                    </div>

                    {/* Bilgi Kutusu */}
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                        <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Acil Durum Eylem Planı Hakkında
                        </h3>
                        <p className="text-sm text-orange-700">
                            Acil Durum Eylem Planı, işyerinizde meydana gelebilecek yangın, deprem, doğal afetler ve diğer acil durumlara karşı alınacak önlemleri içeren yasal bir belgedir.
                            Bu plan, 6331 sayılı İş Sağlığı ve Güvenliği Kanunu kapsamında her işyerinde bulundurulması zorunlu belgelerden biridir.
                        </p>
                    </div>

                </div>
            </main>
        </div>
    );
}
