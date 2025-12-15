"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
    AlertTriangle, Download, Lock, Calendar, User, Briefcase, ChevronDown, LogIn, Building2, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Company, VALIDITY_YEARS, DANGER_CLASS_LABELS } from '@/app/types';
import { formatDate } from '@/app/utils';

export default function AcilDurumPage() {
    const { data: session, status } = useSession();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

    // Rapor bilgileri
    const [reportDate, setReportDate] = useState<string>('');
    const [validityDate, setValidityDate] = useState<string>('');
    const [documentNo, setDocumentNo] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

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

    // React DOM sync sorunu için ref kullan
    const dateInputRef = useRef<HTMLInputElement>(null);

    // Firma seçildiğinde header bilgilerini doldur
    const handleCompanySelect = (companyId: string) => {
        setSelectedCompanyId(companyId);
    };

    // Rapor tarihi değiştiğinde geçerlilik tarihini güncelle
    const handleReportDateChange = (date: string) => {
        let finalDate = date;
        if (date) {
            const parts = date.split('-');
            if (parts[0].length > 4) {
                parts[0] = parts[0].slice(0, 4);
                finalDate = parts.join('-');
                // DOM'u manuel düzelt
                if (dateInputRef.current) {
                    dateInputRef.current.value = finalDate;
                }
            }
        }
        setReportDate(finalDate);
        if (finalDate && selectedCompany) {
            const reportDateObj = new Date(finalDate);
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

        setIsGenerating(true);
        // showNotification('PDF hazırlanıyor...', 'success'); // Overlay kullanıldığı için bildirime gerek yok

        try {
            const requestData = {
                companyName: selectedCompany.title,
                companyAddress: selectedCompany.address,
                registrationNumber: selectedCompany.registration_number,
                reportDate: formatDate(reportDate),
                validityDate: formatDate(validityDate),
                employer: selectedCompany.employer,
                igu: selectedCompany.igu,
                doctor: selectedCompany.doctor,
                support: selectedCompany.support,
                documentNo: documentNo
            };

            const response = await fetch('/api/acil-durum-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', errorText);
                throw new Error('PDF oluşturulamadı: ' + errorText);
            }



            const blob = await response.blob();
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

            // Raporu veritabanına kaydet (Arka planda)
            try {
                // Rapor verisini hazırla (Snapshot)
                const reportSnapshot = {
                    company: selectedCompany,
                    date: reportDate,
                    validity: validityDate
                };

                await fetch('/api/reports', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'EMERGENCY_PLAN',
                        title: selectedCompany.title,
                        data: reportSnapshot
                    })
                });
                console.log('Rapor geçmişe kaydedildi.');
            } catch (saveError) {
                console.error('Rapor kaydetme hatası:', saveError);
                // Kullanıcıya hata göstermeye gerek yok, PDF zaten indi.
            }
        } catch (error: any) {
            console.error('PDF hatası:', error);
            showNotification('PDF oluşturulurken hata oluştu: ' + (error.message || 'Bilinmeyen hata'), 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-8">

            {notification.show && (
                <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-2xl z-[100] flex items-center animate-bounce-in ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                    {notification.type === 'error' ? <AlertCircle className="w-5 h-5 mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                    <span className="font-bold text-sm">{notification.message}</span>
                </div>
            )}

            {/* Sayfa Başlığı */}
            <div className="text-center mt-8 mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Acil Durum Eylem Planı</h1>
                <p className="text-slate-500">Firma bilgilerinizi seçin ve Acil Durum Eylem Planı PDF'i oluşturun</p>
            </div>

            {/* --- 1. FİRMA VE RAPOR BİLGİLERİ --- */}
            <div className="max-w-5xl mx-auto bg-white shadow-sm shadow-slate-200/50 rounded-xl border border-slate-100 overflow-hidden">
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
                                    <div className="grid grid-cols-3 gap-2">
                                        {/* Gün Dropdown */}
                                        <select
                                            className="border border-slate-200 bg-slate-50 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all focus:bg-white"
                                            value={reportDate ? reportDate.split('-')[2] || '' : ''}
                                            onChange={(e) => {
                                                const day = e.target.value;
                                                const currentDate = reportDate || '';
                                                const parts = currentDate.split('-');
                                                const year = parts[0] || new Date().getFullYear().toString();
                                                const month = parts[1] || '01';
                                                if (day) {
                                                    handleReportDateChange(`${year}-${month}-${day}`);
                                                }
                                            }}
                                        >
                                            <option value="">Gün</option>
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                                <option key={d} value={d.toString().padStart(2, '0')}>{d}</option>
                                            ))}
                                        </select>
                                        {/* Ay Dropdown */}
                                        <select
                                            className="border border-slate-200 bg-slate-50 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all focus:bg-white"
                                            value={reportDate ? reportDate.split('-')[1] || '' : ''}
                                            onChange={(e) => {
                                                const month = e.target.value;
                                                const currentDate = reportDate || '';
                                                const parts = currentDate.split('-');
                                                const year = parts[0] || new Date().getFullYear().toString();
                                                const day = parts[2] || '01';
                                                if (month) {
                                                    handleReportDateChange(`${year}-${month}-${day}`);
                                                }
                                            }}
                                        >
                                            <option value="">Ay</option>
                                            {['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'].map((ay, i) => (
                                                <option key={i} value={(i + 1).toString().padStart(2, '0')}>{ay}</option>
                                            ))}
                                        </select>
                                        {/* Yıl Dropdown */}
                                        <select
                                            className="border border-slate-200 bg-slate-50 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all focus:bg-white"
                                            value={reportDate ? reportDate.split('-')[0] || '' : ''}
                                            onChange={(e) => {
                                                const year = e.target.value;
                                                const currentDate = reportDate || '';
                                                const parts = currentDate.split('-');
                                                const month = parts[1] || '01';
                                                const day = parts[2] || '01';
                                                if (year) {
                                                    handleReportDateChange(`${year}-${month}-${day}`);
                                                }
                                            }}
                                        >
                                            <option value="">Yıl</option>
                                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                                                <option key={y} value={y.toString()}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {reportDate && (
                                        <p className="text-xs text-slate-500 mt-2">Seçilen tarih: <span className="font-medium text-slate-700">{formatDate(reportDate)}</span></p>
                                    )}
                                </div>

                                {/* Doküman No */}
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Doküman No</label>
                                    <input
                                        type="text"
                                        value={documentNo}
                                        onChange={(e) => setDocumentNo(e.target.value)}
                                        placeholder="Örn: AD-01"
                                        className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all focus:bg-white"
                                    />
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
                {/* Loading Overlay */}
                {isGenerating && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] flex flex-col items-center justify-center">
                        <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce-in max-w-sm text-center">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                                <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">PDF Hazırlanıyor</h3>
                            <p className="text-slate-500">Lütfen bekleyiniz, belgeniz oluşturuluyor...</p>
                        </div>
                    </div>
                )}

            </div>

            {/* Bilgi Kutusu */}
            <div className="max-w-3xl mx-auto bg-orange-50 border border-orange-200 rounded-xl p-6">
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
    );
}
