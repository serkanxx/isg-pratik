"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
    AlertTriangle, Download, Lock, Calendar, User, Briefcase, ChevronDown, LogIn, Building2, CheckCircle, AlertCircle, Loader2, X, FileArchive, ChevronRight, FileText
} from 'lucide-react';
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queries';
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
    const [progress, setProgress] = useState<number>(0); // Progress bar için (0-100)

    // Toplu rapor indirme state'leri
    const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
    const [showBulkModalStep2, setShowBulkModalStep2] = useState<boolean>(false);
    const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
    const [bulkReportDate, setBulkReportDate] = useState<string>('');
    const [bulkReportDateDay, setBulkReportDateDay] = useState<string>('');
    const [bulkReportDateMonth, setBulkReportDateMonth] = useState<string>('');
    const [bulkReportDateYear, setBulkReportDateYear] = useState<string>('');
    const [autoDocumentNo, setAutoDocumentNo] = useState<boolean>(true);
    const [bulkCompanyData, setBulkCompanyData] = useState<Array<{
        companyId: string;
        reportDate: string;
        documentNo: string;
    }>>([]);

    // Toplu indirme format seçimi
    const [bulkDownloadPDF, setBulkDownloadPDF] = useState<boolean>(true);
    const [bulkDownloadWord, setBulkDownloadWord] = useState<boolean>(false);
    const [generatingType, setGeneratingType] = useState<'pdf' | 'word'>('pdf');

    // Tümünü seç/seçimi kaldır
    const toggleSelectAllCompanies = () => {
        if (selectedCompanyIds.length === companies.length) {
            setSelectedCompanyIds([]);
        } else {
            setSelectedCompanyIds(companies.map(c => c.id));
        }
    };

    // Firma seçimi toggle
    const toggleCompanySelection = (companyId: string) => {
        if (selectedCompanyIds.includes(companyId)) {
            setSelectedCompanyIds(selectedCompanyIds.filter(id => id !== companyId));
        } else {
            setSelectedCompanyIds([...selectedCompanyIds, companyId]);
        }
    };

    // İkinci modal'a geçiş
    const handleProceedToStep2 = () => {
        if (selectedCompanyIds.length === 0) {
            showNotification('Lütfen en az bir firma seçin!', 'error');
            return;
        }
        setShowBulkModal(false);

        // Seçilen firmalar için veri hazırla
        const today = new Date().toISOString().split('T')[0];
        const selectedCompanies = companies.filter(c => selectedCompanyIds.includes(c.id));
        const data = selectedCompanies.map((company, index) => ({
            companyId: company.id,
            reportDate: bulkReportDate || today,
            documentNo: autoDocumentNo ? String(index + 1).padStart(3, '0') : ''
        }));
        setBulkCompanyData(data);
        setShowBulkModalStep2(true);
    };

    // Firmaları çek (React Query ile cache'lenmiş)
    const { data: companiesData } = useQuery({
        queryKey: queryKeys.companies,
        queryFn: async () => {
            const res = await fetch('/api/companies');
            if (!res.ok) throw new Error('Firmalar alınamadı');
            return res.json();
        },
        enabled: !!session?.user?.email,
    });

    useEffect(() => {
        if (companiesData && Array.isArray(companiesData)) {
            setCompanies(companiesData);
        }
    }, [companiesData]);

    // İkinci modal açıldığında otomatik numaraları güncelle
    useEffect(() => {
        if (showBulkModalStep2 && autoDocumentNo) {
            const updated = bulkCompanyData.map((item, index) => ({
                ...item,
                documentNo: String(index + 1).padStart(3, '0')
            }));
            setBulkCompanyData(updated);
        }
    }, [showBulkModalStep2, autoDocumentNo]);

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

    // Üstteki tarih değiştiğinde bulkReportDate'i güncelle
    useEffect(() => {
        if (bulkReportDateDay && bulkReportDateMonth && bulkReportDateYear) {
            const dateStr = `${bulkReportDateYear}-${bulkReportDateMonth}-${bulkReportDateDay}`;
            setBulkReportDate(dateStr);
        } else {
            setBulkReportDate('');
        }
    }, [bulkReportDateDay, bulkReportDateMonth, bulkReportDateYear]);

    // Tümüne uygula butonu
    const handleApplyToAll = () => {
        if (!bulkReportDate) {
            showNotification('Lütfen önce rapor tarihini seçin!', 'error');
            return;
        }
        const updated = bulkCompanyData.map((item, index) => ({
            ...item,
            reportDate: bulkReportDate,
            documentNo: autoDocumentNo ? String(index + 1).padStart(3, '0') : item.documentNo
        }));
        setBulkCompanyData(updated);
        showNotification('Tüm firmalara uygulandı!', 'success');
    };

    // Firma adının ilk 2 kelimesini al
    const getFirstTwoWords = (name: string) => {
        const words = name.trim().split(/\s+/);
        return words.slice(0, 2).join(' ');
    };

    // Tarihi parçalara ayır (gün, ay, yıl)
    const parseDate = (dateStr: string) => {
        if (!dateStr) return { day: '', month: '', year: '' };
        const parts = dateStr.split('-');
        return {
            year: parts[0] || '',
            month: parts[1] || '',
            day: parts[2] || ''
        };
    };

    // Tarih parçalarından tarih string'i oluştur
    const buildDate = (day: string, month: string, year: string) => {
        if (!day || !month || !year) return '';
        return `${year}-${month}-${day}`;
    };

    // Gün, ay, yıl seçenekleri
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = [
        { value: '01', label: 'Ocak' },
        { value: '02', label: 'Şubat' },
        { value: '03', label: 'Mart' },
        { value: '04', label: 'Nisan' },
        { value: '05', label: 'Mayıs' },
        { value: '06', label: 'Haziran' },
        { value: '07', label: 'Temmuz' },
        { value: '08', label: 'Ağustos' },
        { value: '09', label: 'Eylül' },
        { value: '10', label: 'Ekim' },
        { value: '11', label: 'Kasım' },
        { value: '12', label: 'Aralık' }
    ];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);

    // Toplu PDF/Word indirme
    const handleBulkDownload = async () => {
        if (!bulkReportDate) {
            showNotification('Lütfen rapor tarihini girin!', 'error');
            return;
        }

        if (!bulkDownloadPDF && !bulkDownloadWord) {
            showNotification('Lütfen en az bir format seçin (PDF veya Word)!', 'error');
            return;
        }

        // Validasyon
        const invalidCompanies = bulkCompanyData.filter(item => !item.reportDate);
        if (invalidCompanies.length > 0) {
            showNotification('Lütfen tüm firmalar için rapor tarihi girin!', 'error');
            return;
        }

        setIsGenerating(true);
        setGeneratingType(bulkDownloadPDF ? 'pdf' : 'word');
        setProgress(0);
        setShowBulkModalStep2(false);

        try {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();

            // Sadece seçilen firmalar için dosya oluştur
            const selectedCompanies = companies.filter(c => selectedCompanyIds.includes(c.id));
            const totalCompanies = selectedCompanies.length;
            const formatsCount = (bulkDownloadPDF ? 1 : 0) + (bulkDownloadWord ? 1 : 0);
            const totalOperations = totalCompanies * formatsCount;
            let completed = 0;

            // Dosya adı oluşturma yardımcı fonksiyonları
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

            for (let i = 0; i < bulkCompanyData.length; i++) {
                const item = bulkCompanyData[i];
                // Sadece seçilen firmaları işle
                if (!selectedCompanyIds.includes(item.companyId)) continue;

                const company = companies.find(c => c.id === item.companyId);
                if (!company) continue;

                // Geçerlilik tarihini hesapla
                const reportDateObj = new Date(item.reportDate);
                const validityYears = VALIDITY_YEARS[company.danger_class];
                reportDateObj.setFullYear(reportDateObj.getFullYear() + validityYears);
                const validityDate = reportDateObj.toISOString().split('T')[0];

                // Request data
                const requestData = {
                    companyName: company.title,
                    companyAddress: company.address,
                    registrationNumber: company.registration_number,
                    reportDate: formatDate(item.reportDate),
                    validityDate: formatDate(validityDate),
                    employer: company.employer,
                    igu: company.igu,
                    doctor: company.doctor,
                    support: company.support,
                    documentNo: item.documentNo || ''
                };

                const firstTwo = getFirstTwoWords(company.title);
                const safeFilename = sanitizeName(firstTwo);

                // PDF oluştur
                if (bulkDownloadPDF) {
                    try {
                        const pdfResponse = await fetch('/api/acil-durum-pdf', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(requestData)
                        });

                        if (pdfResponse.ok) {
                            const pdfBlob = await pdfResponse.blob();
                            zip.file(`${safeFilename} - Acil Durum Eylem Planı.pdf`, pdfBlob);
                        } else {
                            console.error(`PDF oluşturulamadı: ${company.title}`);
                        }
                    } catch (pdfError) {
                        console.error(`PDF hatası (${company.title}):`, pdfError);
                    }
                    completed++;
                    setProgress(Math.round((completed / totalOperations) * 90));
                }

                // Word oluştur
                if (bulkDownloadWord) {
                    try {
                        const wordResponse = await fetch('/api/acil-durum-word', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(requestData)
                        });

                        if (wordResponse.ok) {
                            const wordBlob = await wordResponse.blob();
                            zip.file(`${safeFilename} - Acil Durum Eylem Planı.docx`, wordBlob);
                        } else {
                            console.error(`Word oluşturulamadı: ${company.title}`);
                        }
                    } catch (wordError) {
                        console.error(`Word hatası (${company.title}):`, wordError);
                    }
                    completed++;
                    setProgress(Math.round((completed / totalOperations) * 90));
                }

                // Raporu veritabanına kaydet (sadece bir kez)
                try {
                    const reportSnapshot = {
                        company: company,
                        date: item.reportDate,
                        validity: validityDate,
                        documentNo: item.documentNo || ''
                    };

                    await fetch('/api/reports', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'EMERGENCY_PLAN',
                            title: company.title,
                            data: reportSnapshot
                        })
                    });
                } catch (saveError) {
                    console.error('Rapor kaydetme hatası:', saveError);
                }
            }

            // ZIP'i oluştur ve indir
            setProgress(95);
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = window.URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Acil-Durum-Planlari-${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setProgress(100);
            const formatText = bulkDownloadPDF && bulkDownloadWord ? 'PDF ve Word' : bulkDownloadPDF ? 'PDF' : 'Word';
            showNotification(`${totalCompanies} firma için ${formatText} raporları başarıyla indirildi!`, 'success');

            // Modal'ları kapat ve state'leri temizle
            setShowBulkModalStep2(false);
            setSelectedCompanyIds([]);
            setBulkCompanyData([]);
        } catch (error: any) {
            console.error('Toplu indirme hatası:', error);
            showNotification('Toplu indirme sırasında hata oluştu: ' + (error.message || 'Bilinmeyen hata'), 'error');
            setProgress(0);
        } finally {
            setTimeout(() => {
                setIsGenerating(false);
                setProgress(0);
            }, 500);
        }
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
        setProgress(0);

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

            // XMLHttpRequest ile progress tracking
            const blob = await new Promise<Blob>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/acil-durum-pdf', true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.responseType = 'blob';

                // Progress event listener
                xhr.addEventListener('progress', (event) => {
                    if (event.lengthComputable && event.total > 0) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        setProgress(percentComplete);
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status === 200) {
                        setProgress(100);
                        resolve(xhr.response);
                    } else {
                        reject(new Error(`PDF oluşturulamadı: ${xhr.statusText}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('PDF oluşturulurken bir hata oluştu'));
                });

                // Simüle edilmiş progress (eğer progress event gelmezse veya yavaşsa)
                const progressInterval = setInterval(() => {
                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        clearInterval(progressInterval);
                        setProgress(prev => prev < 100 ? 100 : prev);
                        return;
                    }
                    // Yavaş yavaş artır (maksimum %90'a kadar, gerçek progress gelirse override edilir)
                    setProgress(prev => {
                        if (prev < 90) {
                            return Math.min(prev + 2, 90);
                        }
                        return prev;
                    });
                }, 300);

                xhr.send(JSON.stringify(requestData));
            });

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

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
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
                    validity: validityDate,
                    documentNo: documentNo || '' // Doküman no'yu da kaydet
                };

                // Debug log
                console.log('Rapor kaydediliyor:', {
                    type: 'EMERGENCY_PLAN',
                    title: selectedCompany.title,
                    documentNo: documentNo,
                    hasDocumentNo: !!documentNo
                });

                const saveResponse = await fetch('/api/reports', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'EMERGENCY_PLAN',
                        title: selectedCompany.title,
                        data: reportSnapshot
                    })
                });

                if (saveResponse.ok) {
                    const savedReport = await saveResponse.json();
                    console.log('Rapor geçmişe kaydedildi:', {
                        id: savedReport.id,
                        documentNo: savedReport.documentNo,
                        dataDocumentNo: savedReport.data?.documentNo
                    });
                } else {
                    const errorData = await saveResponse.json();
                    console.error('Rapor kaydetme hatası:', errorData);
                }
            } catch (saveError) {
                console.error('Rapor kaydetme hatası:', saveError);
                // Kullanıcıya hata göstermeye gerek yok, PDF zaten indi.
            }
        } catch (error: any) {
            console.error('PDF hatası:', error);
            showNotification('PDF oluşturulurken hata oluştu: ' + (error.message || 'Bilinmeyen hata'), 'error');
            setProgress(0);
        } finally {
            // Kısa bir gecikme ile progress'i sıfırla (kullanıcı %100'ü görebilsin)
            setTimeout(() => {
                setIsGenerating(false);
                setProgress(0);
            }, 500);
        }
    };

    // Word oluşturma
    const generateWord = async () => {
        if (!session) {
            showNotification('Word oluşturmak için giriş yapmalısınız!', 'error');
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
        setGeneratingType('word');
        setProgress(0);

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

            // Simüle edilmiş progress
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev < 90) {
                        return Math.min(prev + 5, 90);
                    }
                    return prev;
                });
            }, 200);

            const response = await fetch('/api/acil-durum-word', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            clearInterval(progressInterval);
            setProgress(100);

            if (!response.ok) {
                throw new Error('Word oluşturulamadı');
            }

            const blob = await response.blob();

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

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${safeFilename} - Acil Durum Eylem Planı.docx`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            showNotification('Word dosyası başarıyla indirildi!', 'success');

        } catch (error: any) {
            console.error('Word hatası:', error);
            showNotification('Word oluşturulurken hata oluştu: ' + (error.message || 'Bilinmeyen hata'), 'error');
            setProgress(0);
        } finally {
            setTimeout(() => {
                setIsGenerating(false);
                setProgress(0);
            }, 500);
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

            {/* PDF ve Word İndir Butonları */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4">
                <button
                    onClick={generatePDF}
                    className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl text-base font-bold shadow-lg shadow-orange-600/30 hover:shadow-xl hover:shadow-orange-600/40 transition-all hover:scale-105"
                >
                    <Download className="w-5 h-5 mr-2" />
                    PDF İndir
                </button>
                <button
                    onClick={generateWord}
                    className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-base font-bold shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all hover:scale-105"
                >
                    <FileText className="w-5 h-5 mr-2" />
                    Word İndir
                </button>
                {companies.length > 0 && (
                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-base font-bold shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-indigo-600/40 transition-all hover:scale-105"
                    >
                        <FileArchive className="w-5 h-5 mr-2" />
                        Toplu İndir
                    </button>
                )}
                {/* Loading Overlay with Progress Bar */}
                {isGenerating && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] flex flex-col items-center justify-center p-4">
                        <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce-in max-w-md w-full text-center">
                            <div className={`w-16 h-16 ${generatingType === 'word' ? 'bg-blue-100' : 'bg-orange-100'} rounded-full flex items-center justify-center mb-4`}>
                                <Loader2 className={`w-8 h-8 ${generatingType === 'word' ? 'text-blue-600' : 'text-orange-600'} animate-spin`} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">
                                {generatingType === 'word' ? 'Word Dosyası Hazırlanıyor' : 'PDF Hazırlanıyor'}
                            </h3>
                            <p className="text-slate-500 mb-6">Lütfen bekleyiniz, belgeniz oluşturuluyor...</p>

                            {/* Progress Bar */}
                            <div className="w-full mb-3">
                                <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden shadow-inner">
                                    <div
                                        className={`${generatingType === 'word' ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-500' : 'bg-gradient-to-r from-orange-500 via-orange-600 to-red-500'} h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2 relative`}
                                        style={{ width: `${progress}%` }}
                                    >
                                        {progress > 20 && (
                                            <span className="text-xs font-bold text-white drop-shadow-sm">{progress}%</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between w-full text-sm">
                                <span className="text-slate-500">
                                    {progress < 30 ? 'Hazırlanıyor...' : progress < 70 ? 'Oluşturuluyor...' : progress < 100 ? 'Son düzenlemeler...' : 'Tamamlandı!'}
                                </span>
                                <span className="font-bold text-slate-700">{progress}%</span>
                            </div>
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

            {/* Toplu Rapor İndirme Modal - Adım 1: Firma Seçimi */}
            {showBulkModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <FileArchive className="w-6 h-6 text-blue-600" />
                                Firma Seçimi
                            </h2>
                            <button
                                onClick={() => {
                                    setShowBulkModal(false);
                                    setSelectedCompanyIds([]);
                                }}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm text-slate-600">
                                    Toplu rapor indirmek için firmaları seçin
                                </p>
                                <button
                                    onClick={toggleSelectAllCompanies}
                                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200 transition-colors text-sm"
                                >
                                    {selectedCompanyIds.length === companies.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                                </button>
                            </div>

                            {/* Firma Listesi */}
                            <div className="space-y-2">
                                {companies.map((company) => {
                                    const isSelected = selectedCompanyIds.includes(company.id);
                                    return (
                                        <div
                                            key={company.id}
                                            onClick={() => toggleCompanySelection(company.id)}
                                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${isSelected
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected
                                                    ? 'border-blue-500 bg-blue-500'
                                                    : 'border-slate-300'
                                                    }`}>
                                                    {isSelected && (
                                                        <CheckCircle className="w-4 h-4 text-white" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-slate-800">{company.title}</h4>
                                                    <p className="text-xs text-slate-500 mt-0.5">{company.address || 'Adres girilmemiş'}</p>
                                                </div>
                                                <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                                                    {DANGER_CLASS_LABELS[company.danger_class]}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowBulkModal(false);
                                    setSelectedCompanyIds([]);
                                }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleProceedToStep2}
                                disabled={selectedCompanyIds.length === 0}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                İlerle
                                <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toplu Rapor İndirme Modal - Adım 2: Rapor Bilgileri */}
            {showBulkModalStep2 && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <FileArchive className="w-6 h-6 text-blue-600" />
                                Rapor Bilgileri ({selectedCompanyIds.length} firma seçildi)
                            </h2>
                            <button
                                onClick={() => {
                                    setShowBulkModalStep2(false);
                                    setSelectedCompanyIds([]);
                                    setBulkCompanyData([]);
                                }}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Üst Kontroller */}
                            <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-4">
                                <div className="flex items-end gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            Rapor Tarihi *
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <select
                                                value={bulkReportDateDay}
                                                onChange={(e) => setBulkReportDateDay(e.target.value)}
                                                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Gün</option>
                                                {days.map(d => (
                                                    <option key={d} value={d.toString().padStart(2, '0')}>{d}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={bulkReportDateMonth}
                                                onChange={(e) => setBulkReportDateMonth(e.target.value)}
                                                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Ay</option>
                                                {months.map(m => (
                                                    <option key={m.value} value={m.value}>{m.label}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={bulkReportDateYear}
                                                onChange={(e) => setBulkReportDateYear(e.target.value)}
                                                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Yıl</option>
                                                {years.map(y => (
                                                    <option key={y} value={y.toString()}>{y}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleApplyToAll}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors whitespace-nowrap"
                                    >
                                        Tümüne Uygula
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="autoDocNo"
                                        checked={autoDocumentNo}
                                        onChange={(e) => {
                                            setAutoDocumentNo(e.target.checked);
                                            if (e.target.checked) {
                                                // Otomatik numaraları güncelle
                                                const updated = bulkCompanyData.map((item, index) => ({
                                                    ...item,
                                                    documentNo: String(index + 1).padStart(3, '0')
                                                }));
                                                setBulkCompanyData(updated);
                                            }
                                        }}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="autoDocNo" className="text-sm font-medium text-slate-700 cursor-pointer">
                                        Döküman No için Otomatik Seç
                                    </label>
                                </div>
                            </div>

                            {/* Seçilen Firma Listesi */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-slate-700 mb-3">
                                    Seçilen Firmalar
                                </h3>
                                {companies
                                    .filter(c => selectedCompanyIds.includes(c.id))
                                    .map((company, index) => {
                                        const companyData = bulkCompanyData.find(d => d.companyId === company.id) || {
                                            companyId: company.id,
                                            reportDate: bulkReportDate || '',
                                            documentNo: autoDocumentNo ? String(index + 1).padStart(3, '0') : ''
                                        };

                                        const dateParts = parseDate(companyData.reportDate);

                                        return (
                                            <div key={company.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-4 flex-wrap">
                                                    {/* Firma Adı (İlk 2 kelime) */}
                                                    <div className="flex-1 min-w-[200px]">
                                                        <h4 className="font-bold text-slate-800 text-sm">
                                                            {getFirstTwoWords(company.title)}
                                                        </h4>
                                                    </div>

                                                    {/* Rapor Tarihi - Gün.Ay.Yıl Dropdown'ları */}
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={dateParts.day}
                                                            onChange={(e) => {
                                                                const newDate = buildDate(
                                                                    e.target.value,
                                                                    dateParts.month,
                                                                    dateParts.year
                                                                );
                                                                const updated = bulkCompanyData.map(item =>
                                                                    item.companyId === company.id
                                                                        ? { ...item, reportDate: newDate }
                                                                        : item
                                                                );
                                                                if (updated.length === 0 || !updated.find(i => i.companyId === company.id)) {
                                                                    updated.push({
                                                                        companyId: company.id,
                                                                        reportDate: newDate,
                                                                        documentNo: companyData.documentNo
                                                                    });
                                                                }
                                                                setBulkCompanyData(updated);
                                                            }}
                                                            className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent w-16"
                                                        >
                                                            <option value="">Gün</option>
                                                            {days.map(d => (
                                                                <option key={d} value={d.toString().padStart(2, '0')}>{d}</option>
                                                            ))}
                                                        </select>
                                                        <span className="text-slate-400">.</span>
                                                        <select
                                                            value={dateParts.month}
                                                            onChange={(e) => {
                                                                const newDate = buildDate(
                                                                    dateParts.day,
                                                                    e.target.value,
                                                                    dateParts.year
                                                                );
                                                                const updated = bulkCompanyData.map(item =>
                                                                    item.companyId === company.id
                                                                        ? { ...item, reportDate: newDate }
                                                                        : item
                                                                );
                                                                if (updated.length === 0 || !updated.find(i => i.companyId === company.id)) {
                                                                    updated.push({
                                                                        companyId: company.id,
                                                                        reportDate: newDate,
                                                                        documentNo: companyData.documentNo
                                                                    });
                                                                }
                                                                setBulkCompanyData(updated);
                                                            }}
                                                            className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent w-24"
                                                        >
                                                            <option value="">Ay</option>
                                                            {months.map(m => (
                                                                <option key={m.value} value={m.value}>{m.label}</option>
                                                            ))}
                                                        </select>
                                                        <span className="text-slate-400">.</span>
                                                        <select
                                                            value={dateParts.year}
                                                            onChange={(e) => {
                                                                const newDate = buildDate(
                                                                    dateParts.day,
                                                                    dateParts.month,
                                                                    e.target.value
                                                                );
                                                                const updated = bulkCompanyData.map(item =>
                                                                    item.companyId === company.id
                                                                        ? { ...item, reportDate: newDate }
                                                                        : item
                                                                );
                                                                if (updated.length === 0 || !updated.find(i => i.companyId === company.id)) {
                                                                    updated.push({
                                                                        companyId: company.id,
                                                                        reportDate: newDate,
                                                                        documentNo: companyData.documentNo
                                                                    });
                                                                }
                                                                setBulkCompanyData(updated);
                                                            }}
                                                            className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent w-20"
                                                        >
                                                            <option value="">Yıl</option>
                                                            {years.map(y => (
                                                                <option key={y} value={y.toString()}>{y}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Döküman No */}
                                                    <div className="w-24">
                                                        <input
                                                            type="text"
                                                            value={companyData.documentNo}
                                                            onChange={(e) => {
                                                                const updated = bulkCompanyData.map(item =>
                                                                    item.companyId === company.id
                                                                        ? { ...item, documentNo: e.target.value }
                                                                        : item
                                                                );
                                                                if (updated.length === 0 || !updated.find(i => i.companyId === company.id)) {
                                                                    updated.push({
                                                                        companyId: company.id,
                                                                        reportDate: companyData.reportDate,
                                                                        documentNo: e.target.value
                                                                    });
                                                                }
                                                                setBulkCompanyData(updated);
                                                            }}
                                                            disabled={autoDocumentNo}
                                                            className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                                                            placeholder="No"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                            <button
                                onClick={() => {
                                    setShowBulkModalStep2(false);
                                    setShowBulkModal(true);
                                }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <ChevronDown className="w-4 h-4 rotate-90" />
                                Geri
                            </button>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        setShowBulkModalStep2(false);
                                        setSelectedCompanyIds([]);
                                        setBulkCompanyData([]);
                                    }}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                                >
                                    İptal
                                </button>
                                <div className="flex items-center gap-4 px-4 py-2 bg-slate-100 rounded-lg">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={bulkDownloadPDF}
                                            onChange={(e) => setBulkDownloadPDF(e.target.checked)}
                                            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                        />
                                        <span className="text-sm font-medium text-slate-700">PDF</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={bulkDownloadWord}
                                            onChange={(e) => setBulkDownloadWord(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-slate-700">Word</span>
                                    </label>
                                </div>
                                <button
                                    onClick={handleBulkDownload}
                                    disabled={!bulkReportDate || selectedCompanyIds.length === 0 || (!bulkDownloadPDF && !bulkDownloadWord)}
                                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <FileArchive className="w-5 h-5" />
                                    Toplu İndir (ZIP)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
