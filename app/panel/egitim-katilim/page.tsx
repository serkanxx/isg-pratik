"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys, apiFetchers } from '@/lib/queries';
import { Company } from '@/app/types';
import { formatDate } from '@/app/utils';
import {
    GraduationCap, Plus, Trash2, Download, Building2,
    Calendar, Clock, User, CheckCircle2, AlertCircle,
    ChevronDown, ChevronUp, Info, ListCheck, Loader2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTheme } from '@/app/context/ThemeContext';

// Eğitim Konuları
const TRAINING_SUBJECTS = {
    'GENEL KONULAR': [
        'ÇALIŞMA MEVZUATI İLE İLGİLİ BİLGİLER',
        'ÇALIŞANLARIN YASAL HAK VE SORUMLULUKLARI',
        'İŞYERİ TEMİZLİĞİ VE DÜZENİ',
        'İŞ KAZASI VE MESLEK HASTALIKLARINDAN DOĞAN HUKUKİ SONUÇLAR'
    ],
    'TEKNİK KONULAR': [
        'KİMYASAL, FİZİKSEL VE ERGONOMİK RİSK ETMENLERİ',
        'ELLE KALDIRMA VE TAŞIMA',
        'PARLAMA, PATLAMA, YANGIN VE YANGINDAN KORUNMA',
        'İŞ EKİPMANLARININ GÜVENLİ KULLANIMI',
        'EKRANLI ARAÇLARLA ÇALIŞMA',
        'ELEKTRİK TEHLİKELERİ, RİSKLERİ VE ÖNLEMLERİ',
        'İŞ KAZALARININ SEBEPLERİ VE KORUNMA PRENSİPLERİ İLE TEKNİKLERİNİN UYGULANMASI',
        'GÜVENLİK VE SAĞLIK İŞARETLERİ',
        'KİŞİSEL KORUYUCU DONANIM KULLANIMI',
        'İŞ SAĞLIĞI VE GÜVENLİĞİ GENEL KURALLARI VE GÜVENLİK KÜLTÜRÜ',
        'TAHLİYE VE KURTARMA'
    ],
    'SAĞLIK KONULAR': [
        'MESLEK HASTALIKLARININ SEBEPLERİ',
        'HASTALIKTAN KORUNMA PRENSİPLERİ VE KORUNMA TEKNİKLERİNİN UYGULANMASI',
        'BİYOLOJİK VE PSİKOSOSYAL RİSK ETMENLERİ',
        'İLKYARDIM',
        'TÜTÜN ÜRÜNLERİNİN ZARARLARI VE ETKİLENİM'
    ],
    'DİĞER KONULAR': [
        'ÇALIŞANIN YAPTIĞI İŞE ÖZGÜ YÜKSEKTE ÇALIŞMA',
        'KAYNAKLA ÇALIŞMA',
        'ÖZEL RİSK TAŞIYAN EKİPMAN İLE ÇALIŞMA',
        'KANSEROJEN MADDELERİN YOL AÇTIĞI OLASI SAĞLIK RİSKLERİ'
    ]
};

// Flattened subjects for global selection
const ALL_SUBJECTS = Object.entries(TRAINING_SUBJECTS).flatMap(([category, subjects]) =>
    subjects.map(s => ({ category, name: s }))
).map((s, i) => ({ ...s, id: (i + 1).toString() }));

const MONTHS = [
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
    { value: '12', label: 'Aralık' },
];
const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const YEARS = Array.from({ length: 11 }, (_, i) => (new Date().getFullYear() - 5 + i).toString());

export default function EgitimKatilimPage() {
    const { data: session } = useSession();
    const { isDark } = useTheme();

    // State management
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [isManualCompany, setIsManualCompany] = useState(false);
    const [manualCompanyTitle, setManualCompanyTitle] = useState('');
    const [trainingTitle, setTrainingTitle] = useState<string>('İŞ SAĞLIĞI ve GÜVENLİĞİ');
    const [selectedGlobalSubjects, setSelectedGlobalSubjects] = useState<string[]>([]);
    const [dayCount, setDayCount] = useState<number>(1);
    const [trainingDays, setTrainingDays] = useState<Array<{ date: string; hours: string; selectedCategories: string[] }>>([
        { date: '', hours: '8 SAAT', selectedCategories: [] }
    ]);
    const [participants, setParticipants] = useState<Array<{ id: string; name: string; tc: string; position: string }>>([]);
    const [newParticipant, setNewParticipant] = useState({ name: '', tc: '', position: '' });

    const [isGenerating, setIsGenerating] = useState(false);
    const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

    // Mobile accordion state for category subtopics - tracks which categories are expanded per day
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    // Toggle accordion for a specific day-category combination
    const toggleCategoryAccordion = (dayIndex: number, category: string) => {
        const key = `${dayIndex}-${category}`;
        setExpandedCategories(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Check if a category accordion is expanded
    const isCategoryExpanded = (dayIndex: number, category: string) => {
        const key = `${dayIndex}-${category}`;
        return expandedCategories[key] || false;
    };

    // Fetch companies
    const { data: companies = [] } = useQuery<Company[]>({
        queryKey: queryKeys.companies,
        queryFn: apiFetchers.companies,
        enabled: !!session?.user?.email,
    });

    const selectedCompany = isManualCompany
        ? { title: manualCompanyTitle, id: 'manual' } as Company
        : (companies as Company[]).find(c => c.id === selectedCompanyId);

    // Update training days when dayCount changes
    useEffect(() => {
        setTrainingDays(prev => {
            const newDays = [...prev];
            if (dayCount > prev.length) {
                for (let i = prev.length; i < dayCount; i++) {
                    newDays.push({ date: '', hours: '8 SAAT', selectedCategories: [] });
                }
            } else if (dayCount < prev.length) {
                return newDays.slice(0, dayCount);
            }
            return newDays;
        });
    }, [dayCount]);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
    };

    const addParticipant = () => {
        if (!newParticipant.name || !newParticipant.tc) {
            showNotification('Lütfen ad soyad ve TC no girin!', 'error');
            return;
        }

        // TC No Validation
        const tcRegex = /^[0-9]{11}$/;
        if (!tcRegex.test(newParticipant.tc)) {
            showNotification('TC No sadece 11 haneli rakamlardan oluşmalıdır!', 'error');
            return;
        }

        const lastDigit = parseInt(newParticipant.tc[10]);
        if (lastDigit % 2 !== 0) {
            showNotification('Geçersiz TC No! Son hane çift olmalıdır.', 'error');
            return;
        }

        setParticipants([...participants, { ...newParticipant, id: Date.now().toString() }]);
        setNewParticipant({ name: '', tc: '', position: '' });
    };

    const removeParticipant = (id: string) => {
        setParticipants(participants.filter(p => p.id !== id));
    };

    // Category toggling
    const toggleCategory = (dayIndex: number, category: string) => {
        setTrainingDays(prev => prev.map((day, idx) => {
            if (idx !== dayIndex) return day;
            const isSelected = day.selectedCategories.includes(category);
            return {
                ...day,
                selectedCategories: isSelected
                    ? day.selectedCategories.filter(c => c !== category)
                    : [...day.selectedCategories, category]
            };
        }));
    };

    const handleDateChange = (dayIndex: number, part: 'day' | 'month' | 'year', value: string) => {
        setTrainingDays(prev => {
            const updated = prev.map((d, i) => {
                if (i !== dayIndex) return d;
                const currentParts = d.date.split('-'); // YYYY-MM-DD
                let year = currentParts[0] || new Date().getFullYear().toString();
                let month = currentParts[1] || '01';
                let day = currentParts[2] || '01';

                if (part === 'day') day = value;
                if (part === 'month') month = value;
                if (part === 'year') year = value;

                return { ...d, date: `${year}-${month}-${day}` };
            });

            // 1. gün tarihi seçildiğinde sonraki günleri otomatik doldur
            if (dayIndex === 0) {
                const firstDate = updated[0].date;
                const [yearStr, monthStr, dayStr] = firstDate.split('-');

                // Tam tarih girilmişse otomatik doldur
                if (yearStr && monthStr && dayStr && yearStr !== '' && monthStr !== '' && dayStr !== '') {
                    const baseDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));

                    if (!isNaN(baseDate.getTime())) {
                        return updated.map((d, i) => {
                            if (i === 0) return d; // 1. gün değişmez

                            // Sonraki günlerin tarihlerini otomatik ayarla
                            const nextDate = new Date(baseDate);
                            nextDate.setDate(baseDate.getDate() + i);

                            const newDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
                            return { ...d, date: newDateStr };
                        });
                    }
                }
            }

            return updated;
        });
    };

    const toggleGlobalSubject = (subjectId: string) => {
        setSelectedGlobalSubjects(prev =>
            prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
        );
    };

    // PDF Generation
    const generatePDF = async () => {
        if (!selectedCompany || (isManualCompany && !manualCompanyTitle)) {
            showNotification('Lütfen bir firma seçin veya adını girin!', 'error');
            return;
        }
        if (participants.length === 0) {
            showNotification('Lütfen en az bir katılımcı ekleyin!', 'error');
            return;
        }

        setIsGenerating(true);

        try {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            // Fetch Roboto font
            // Simplified version: we use standard fonts or try to fetch Roboto from CDN
            try {
                const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
                const fontUrlBold = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf';

                const [fontRes, fontBoldRes] = await Promise.all([
                    fetch(fontUrl),
                    fetch(fontUrlBold)
                ]);

                const fontBuffer = await fontRes.arrayBuffer();
                const fontBoldBuffer = await fontBoldRes.arrayBuffer();

                const toBase64 = (buffer: ArrayBuffer) => {
                    let binary = '';
                    const bytes = new Uint8Array(buffer);
                    const len = bytes.byteLength;
                    for (let i = 0; i < len; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    return btoa(binary);
                };

                doc.addFileToVFS('Roboto-Regular.ttf', toBase64(fontBuffer));
                doc.addFileToVFS('Roboto-Bold.ttf', toBase64(fontBoldBuffer));
                doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
                doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
                doc.setFont('Roboto');
            } catch (error) {
                console.error('Font error:', error);
                doc.setFont('helvetica');
            }

            const pageWidth = 210;
            const margin = 10;
            const contentWidth = pageWidth - 2 * margin;

            // Header Section
            doc.setDrawColor(0);
            doc.setLineWidth(0.5);

            // Header Rect
            doc.rect(margin, margin, contentWidth, 25);
            doc.line(margin + 50, margin, margin + 50, margin + 25);
            // doc.line(margin + 150, margin, margin + 150, margin + 25); // Removed for metadata deletion

            doc.setFontSize(10);
            doc.setFont('Roboto', 'normal');
            doc.text('EĞİTİM KONUSU', margin + 25, margin + 15, { align: 'center' });

            doc.setFont('Roboto', 'bold');
            doc.setFontSize(12);
            doc.text(`${trainingTitle} EĞİTİM KATILIM FORMU`, margin + 125, margin + 14, { align: 'center' });

            // Training Topics Section
            let currentY = margin + 25;
            doc.rect(margin, currentY, contentWidth, 50);
            doc.line(margin + 50, currentY, margin + 50, currentY + 50);

            // Yasal Dayanak
            doc.setFontSize(6);
            doc.setFont('Roboto', 'bold');
            doc.text('YASAL DAYANAK', margin + 25, currentY + 5, { align: 'center' });
            doc.setFont('Roboto', 'normal');
            doc.setFontSize(5.5);
            const legalText = '30.06.2012 tarih ve 28339 sayılı Resmi Gazete\'de yayımlanarak yürürlüğe giren 6331 Kanun numaralı "İş Sağlığı ve Güvenliği Kanunu" Madde 17 15.05.2013 tarih ve 28648 sayılı Resmi Gazetede yayımlanarak yürürlüğe giren "Çalışanların İş Sağlığı ve Güvenliği Eğitimlerinin Usül ve Esasları Hakkında Yönetmelik" Madde 6-7-8-9';
            doc.text(legalText, margin + 25, currentY + 10, { align: 'center', maxWidth: 45 });

            // Subjects List
            doc.setFontSize(5.5);
            let subjectY = currentY + 4;
            let currentSubjectCount = 0;

            Object.entries(TRAINING_SUBJECTS).forEach(([category, subjects]) => {
                if (category === 'DİĞER KONULAR') {
                    subjectY += 4; // Extra space before DİĞER KONULAR
                }
                doc.setFont('Roboto', 'bold');
                doc.text(category, margin + 52, subjectY);
                subjectY += 3;
                doc.setFont('Roboto', 'normal');

                let categoryText = '';
                subjects.forEach((s) => {
                    currentSubjectCount++;
                    categoryText += `${currentSubjectCount}-${s}, `;
                    if (categoryText.length > 180) {
                        doc.text(categoryText, margin + 52, subjectY, { maxWidth: contentWidth - 60 });
                        subjectY += 4;
                        categoryText = '';
                    }
                });
                if (categoryText) {
                    doc.text(categoryText.slice(0, -2), margin + 52, subjectY, { maxWidth: contentWidth - 60 });
                    subjectY += 7; // Increased spacing between categories
                }
            });

            // Middle Info Grid
            currentY += 50;
            doc.rect(margin, currentY, contentWidth, 30);
            doc.line(margin, currentY + 6, margin + contentWidth, currentY + 6);
            doc.line(margin, currentY + 12, margin + contentWidth, currentY + 12);
            doc.line(margin, currentY + 18, margin + contentWidth, currentY + 18);
            doc.line(margin, currentY + 24, margin + contentWidth, currentY + 24);

            // Column separator for labels (Always full height)
            doc.line(margin + 50, currentY, margin + 50, currentY + 30);

            // Vertical Dividers based on days (Start AFTER Firma row)
            const dayColWidth = (contentWidth - 50) / dayCount;
            for (let i = 1; i < dayCount; i++) {
                doc.line(margin + 50 + i * dayColWidth, currentY + 6, margin + 50 + i * dayColWidth, currentY + 30);
            }

            doc.setFontSize(8);
            doc.setFont('Roboto', 'bold');
            doc.text('FİRMA', margin + 5, currentY + 4.5);
            doc.text('EĞİTİM SIRALAMASI', margin + 5, currentY + 10.5);
            doc.text('EĞİTİM TARİHİ', margin + 5, currentY + 16.5);
            doc.text('EĞİTİM SÜRESİ (SAAT)', margin + 5, currentY + 22.5);
            doc.text('EĞİTİM KONULARI', margin + 5, currentY + 28.5);

            // Merged Company Title row
            doc.setFont('Roboto', 'normal');
            doc.setFontSize(7);
            const companyTargetX = margin + 50 + (contentWidth - 50) / 2;
            doc.text(selectedCompany?.title || '', companyTargetX, currentY + 4.5, { align: 'center', maxWidth: contentWidth - 55 });

            trainingDays.forEach((day, i) => {
                const x = margin + 50 + i * dayColWidth + dayColWidth / 2;

                // Eğitim Sıralaması (Kalın değil)
                doc.setFontSize(8);
                doc.text(`${i + 1}. EĞİTİM`, x, currentY + 10.5, { align: 'center' });

                doc.text(formatDate(day.date), x, currentY + 16.5, { align: 'center' });
                doc.text(day.hours, x, currentY + 22.5, { align: 'center' });

                // Eğitim Konuları (Ortalanmış)
                const catNames = day.selectedCategories.join(', ');
                doc.setFontSize(5);
                doc.text(catNames, x, currentY + 27, { align: 'center', maxWidth: dayColWidth - 4 });
                doc.setFontSize(8);
            });

            // Participant Table
            currentY += 30;
            const tableHeaders = [
                'NO',
                'AD-SOYAD',
                'TC KİMLİK NO',
                'GÖREVİ',
                ...trainingDays.map((_, i) => `${i + 1}. EĞİTİM İMZA`)
            ];

            const tableData = participants.map((p, i) => [
                (i + 1).toString(),
                p.name,
                p.tc,
                p.position,
                ...trainingDays.map(() => '')
            ]);

            autoTable(doc, {
                head: [tableHeaders],
                body: tableData,
                startY: currentY,
                margin: { left: margin, right: margin },
                theme: 'grid',
                styles: {
                    font: 'Roboto',
                    fontSize: 7.5,
                    textColor: 20,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.2,
                    halign: 'center',
                    valign: 'middle',
                    minCellHeight: 10 // Increased row height by ~20%
                },
                headStyles: {
                    fillColor: [240, 240, 240],
                    textColor: 0,
                    fontStyle: 'bold',
                    halign: 'center',
                    valign: 'middle',
                    minCellHeight: 12
                },
                columnStyles: {
                    0: { cellWidth: 8 },
                    1: { cellWidth: 35, halign: 'center' },
                    2: { cellWidth: 25, halign: 'center' },
                    3: { cellWidth: 30, halign: 'center' },
                },
                didDrawCell: (data) => {
                    // Make signature columns headers use smaller font
                    if (data.section === 'head' && data.column.index >= 4) {
                        doc.setFontSize(6);
                    }
                }
            });

            // Footer / Signatures
            const finalY = (doc as any).lastAutoTable.finalY + 20;
            if (finalY < 270) {
                doc.setFontSize(9);
                doc.setFont('Roboto', 'bold');
                doc.text('EĞİTİMCİ', margin + 30, finalY, { align: 'center' });
                doc.text('İŞVEREN / İŞVEREN VEKİLİ', pageWidth - margin - 30, finalY, { align: 'center' });
                doc.setFont('Roboto', 'normal');
                doc.text('İmza', margin + 30, finalY + 10, { align: 'center' });
                doc.text('Kaşe / İmza', pageWidth - margin - 30, finalY + 10, { align: 'center' });
            }

            doc.save(`${selectedCompany.title.split(' ')[0]}_Egitim_Katilim_Formu.pdf`);
            showNotification('PDF başarıyla oluşturuldu!', 'success');
        } catch (error) {
            console.error('PDF error:', error);
            showNotification('PDF oluşturulurken bir hata oluştu!', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="egitim-katilim-page min-h-screen bg-white dark:bg-slate-950 p-4 md:p-8 transition-colors duration-300 text-black dark:text-slate-100">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <GraduationCap className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-black dark:text-slate-50 font-outfit">Eğitim Katılım Formu</h1>
                            <p className="text-black dark:text-slate-400 text-sm">Eğitim verilerini girin ve resmi katılım formunu oluşturun</p>
                        </div>
                    </div>
                    <button
                        onClick={generatePDF}
                        disabled={isGenerating || participants.length === 0}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
                    >
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                        PDF İndir
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

                    {/* Form Left Side */}
                    {/* Company & Training */}
                    <div className="lg:col-span-2 space-y-4 md:space-y-6">

                        {/* Section 1: Company & Training */}
                        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                            <h3 className="flex items-center gap-2 font-bold text-black dark:text-slate-100 border-b pb-3 border-slate-50 dark:border-slate-800">
                                <Building2 className="w-5 h-5 text-indigo-500" />
                                Firma ve Eğitim Bilgileri
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-black dark:text-slate-400 uppercase block px-1 tracking-wider">Firma Seçin *</label>
                                    <select
                                        value={selectedCompanyId}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'manual') {
                                                setIsManualCompany(true);
                                                setSelectedCompanyId('manual');
                                            } else {
                                                setIsManualCompany(false);
                                                setSelectedCompanyId(val);
                                            }
                                        }}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-black dark:text-slate-100"
                                    >
                                        <option value="" className="bg-white text-black dark:bg-slate-800 dark:text-slate-100">Firma Seçiniz</option>
                                        {companies.map(c => (
                                            <option key={c.id} value={c.id} className="bg-white text-black dark:bg-slate-800 dark:text-slate-100">{c.title}</option>
                                        ))}
                                        <option value="manual" className="bg-white text-black dark:bg-slate-800 dark:text-slate-100">➥ El ile Manuel Giriş</option>
                                    </select>

                                    {isManualCompany && (
                                        <input
                                            type="text"
                                            value={manualCompanyTitle}
                                            onChange={(e) => setManualCompanyTitle(e.target.value)}
                                            placeholder="Firma adını manuel yazın..."
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-black dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-500 animate-in fade-in slide-in-from-top-2"
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-black dark:text-slate-400 uppercase block mb-1.5 px-1 tracking-wider">Eğitim Başlığı</label>
                                    <select
                                        value={trainingTitle}
                                        onChange={(e) => setTrainingTitle(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-black dark:text-slate-100"
                                    >
                                        <option value="İŞ SAĞLIĞI ve GÜVENLİĞİ" className="bg-white text-black dark:bg-slate-800 dark:text-slate-100">İŞ SAĞLIĞI ve GÜVENLİĞİ</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="text-xs font-bold text-black dark:text-slate-400 uppercase block mb-1.5 px-1 tracking-wider">Eğitim Süresi (Gün)</label>
                                    <select
                                        value={dayCount}
                                        onChange={(e) => setDayCount(parseInt(e.target.value))}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-black dark:text-slate-100"
                                    >
                                        {[1, 2, 3, 4].map(d => <option key={d} value={d} className="bg-white text-black dark:bg-slate-800 dark:text-slate-100">{d} Gün</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Days Configuration */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                            <h3 className="flex items-center gap-2 font-bold text-black dark:text-slate-100 border-b pb-3 border-slate-50 dark:border-slate-800">
                                <Calendar className="w-5 h-5 text-indigo-500" />
                                Gün Detayları ve Konu Seçimi
                            </h3>

                            <div className="space-y-6">
                                {trainingDays.map((day, dIdx) => (
                                    <div key={dIdx} className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 transition-all hover:border-indigo-200 dark:hover:border-indigo-500/30">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1.5 rounded-lg tracking-widest">
                                                    {dIdx + 1}. GÜN
                                                </span>
                                            </div>
                                            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3">
                                                <div className="w-full xs:w-auto flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20">
                                                    <Calendar className="w-4 h-4 text-slate-700 dark:text-slate-500 flex-shrink-0" />
                                                    <div className="flex items-center gap-1">
                                                        <select
                                                            value={day.date.split('-')[2] || ''}
                                                            onChange={(e) => handleDateChange(dIdx, 'day', e.target.value)}
                                                            className="bg-transparent text-xs outline-none text-black dark:text-slate-100 cursor-pointer font-bold appearance-none text-center"
                                                        >
                                                            <option value="" className="bg-white text-black dark:bg-slate-800 dark:text-slate-100">Gün</option>
                                                            {DAYS.map(d => <option key={d} value={d} className="bg-white text-black dark:bg-slate-800 dark:text-slate-100">{d}</option>)}
                                                        </select>
                                                        <span className="text-slate-500 dark:text-slate-600">/</span>
                                                        <select
                                                            value={day.date.split('-')[1] || ''}
                                                            onChange={(e) => handleDateChange(dIdx, 'month', e.target.value)}
                                                            className="bg-transparent text-xs outline-none text-black dark:text-slate-100 cursor-pointer font-bold appearance-none text-center"
                                                        >
                                                            <option value="" className="bg-white text-black dark:bg-slate-800 dark:text-slate-100">Ay</option>
                                                            {MONTHS.map(m => <option key={m.value} value={m.value} className="bg-white text-black dark:bg-slate-800 dark:text-slate-100">{m.label}</option>)}
                                                        </select>
                                                        <span className="text-slate-500 dark:text-slate-600">/</span>
                                                        <select
                                                            value={day.date.split('-')[0] || ''}
                                                            onChange={(e) => handleDateChange(dIdx, 'year', e.target.value)}
                                                            className="bg-transparent text-xs outline-none text-black dark:text-slate-100 cursor-pointer font-bold appearance-none text-center"
                                                        >
                                                            <option value="" className="bg-white text-black dark:bg-slate-800 dark:text-slate-100">Yıl</option>
                                                            {YEARS.map(y => <option key={y} value={y} className="bg-white text-black dark:bg-slate-800 dark:text-slate-100">{y}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="w-full xs:w-auto flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 overflow-hidden">
                                                    <Clock className="w-4 h-4 text-slate-700 dark:text-slate-500 flex-shrink-0" />
                                                    <select
                                                        value={day.hours}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setTrainingDays(prev => prev.map((d, i) => i === dIdx ? { ...d, hours: val } : d));
                                                        }}
                                                        className="w-full bg-transparent text-sm outline-none text-black dark:text-slate-100 cursor-pointer appearance-none"
                                                    >
                                                        {['2 SAAT', '4 SAAT', '6 SAAT', '8 SAAT'].map(h => <option key={h} value={h} className="bg-white text-black dark:bg-slate-800 dark:text-slate-100">{h}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-black dark:text-slate-500 uppercase tracking-widest block font-bold">BU GÜN VERİLEN EĞİTİM KONU BAŞLIKLARI</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 md:gap-y-6">
                                                {Object.entries(TRAINING_SUBJECTS).map(([category, subjects]) => {
                                                    const isSelected = day.selectedCategories.includes(category);
                                                    const isExpanded = isCategoryExpanded(dIdx, category);
                                                    return (
                                                        <div key={category} className="space-y-1 md:space-y-3 p-2 md:p-3 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all duration-300 ease-in-out">
                                                            {/* Category Header with Checkbox */}
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleCategory(dIdx, category)}
                                                                    className={`flex-1 flex items-center gap-3 transition-all p-2 rounded-lg ${isSelected
                                                                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                                                                        : 'text-black dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                                        }`}
                                                                >
                                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected
                                                                        ? 'bg-indigo-600 border-indigo-600'
                                                                        : 'border-slate-300 dark:border-slate-600'
                                                                        }`}>
                                                                        {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                                                                    </div>
                                                                    <h5 className="text-xs font-black uppercase tracking-wider">{category}</h5>
                                                                </button>

                                                                {/* Mobile Accordion Toggle Button */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleCategoryAccordion(dIdx, category)}
                                                                    className="md:hidden p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                                                                    aria-label={isExpanded ? 'Alt konuları kapat' : 'Alt konuları aç'}
                                                                >
                                                                    {isExpanded ? (
                                                                        <ChevronUp className="w-5 h-5" />
                                                                    ) : (
                                                                        <ChevronDown className="w-5 h-5" />
                                                                    )}
                                                                </button>
                                                            </div>

                                                            {/* Subtopics - Always visible on desktop, collapsible on mobile */}
                                                            <div className={`pl-6 md:pl-8 space-y-1 md:space-y-1.5 opacity-80 dark:opacity-90 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 pt-2' : 'max-h-0 md:max-h-96 md:pt-0'
                                                                }`}>
                                                                {subjects.map((s, idx) => (
                                                                    <p key={idx} className="text-[9px] md:text-[10px] leading-tight text-black dark:text-slate-300 font-medium">
                                                                        • {s}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Participant List */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full lg:sticky lg:top-24">
                            <h3 className="flex items-center gap-2 font-bold text-black dark:text-slate-100 border-b pb-3 border-slate-50 dark:border-slate-800 mb-4">
                                <User className="w-5 h-5 text-indigo-500" />
                                Katılımcı Listesi ({participants.length})
                            </h3>

                            {/* Add Participant Form */}
                            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-6">
                                <input
                                    type="text"
                                    placeholder="Ad Soyad"
                                    value={newParticipant.name}
                                    onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm font-bold text-black dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-500"
                                />
                                <div className="grid grid-cols-2 gap-2 font-bold">
                                    <input
                                        type="text"
                                        placeholder="TC No"
                                        maxLength={11}
                                        value={newParticipant.tc}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9]/g, '');
                                            setNewParticipant({ ...newParticipant, tc: value });
                                        }}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm font-bold text-black dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Görev"
                                        value={newParticipant.position}
                                        onChange={(e) => setNewParticipant({ ...newParticipant, position: e.target.value })}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm font-bold text-black dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-500"
                                    />
                                </div>
                                <button
                                    onClick={addParticipant}
                                    className="w-full py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg text-sm font-black hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-md"
                                >
                                    <Plus className="w-4 h-4" />
                                    Listeye Ekle
                                </button>
                            </div>

                            {/* Participants Scrollable List */}
                            <div className="flex-1 overflow-y-auto max-h-[400px] space-y-2 pr-1 custom-scrollbar">
                                {participants.length === 0 ? (
                                    <div className="text-center py-10 opacity-70">
                                        <User className="w-12 h-12 mx-auto mb-2 text-slate-500 dark:text-slate-500" />
                                        <p className="text-xs font-black uppercase tracking-widest text-black dark:text-slate-400">Henüz katılımcı yok</p>
                                    </div>
                                ) : (
                                    participants.map((p, idx) => (
                                        <div key={p.id} className="group bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-xl flex items-center justify-between hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all">
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-black dark:text-slate-200 truncate font-outfit">{idx + 1}. {p.name}</p>
                                                <p className="text-[10px] text-black dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                                    <span className="font-bold tracking-tighter">{p.tc}</span>
                                                    <span className="w-1 h-1 bg-indigo-300 dark:bg-indigo-700 rounded-full" />
                                                    <span className="italic font-bold">{p.position}</span>
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeParticipant(p.id)}
                                                className="p-1.5 text-slate-500 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Yasal Dayanak Disclaimer */}
                            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                <div className="flex gap-3">
                                    <Info className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                                    <div>
                                        <h5 className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase mb-1 tracking-wider">Yasal Dayanak</h5>
                                        <p className="text-[9px] text-amber-700 dark:text-amber-500/80 leading-relaxed font-bold">
                                            6331 Sayılı İSG Kanunu Madde 17 uyarınca bu formun düzenlenmesi ve saklanması zorunludur.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {notification.show && (
                <div className={`fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[100] px-3 py-2 md:px-6 md:py-4 rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl flex items-center gap-2 md:gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-[90vw] md:max-w-none ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                    }`}>
                    {notification.type === 'error' ? <AlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />}
                    <span className="font-semibold md:font-bold text-xs md:text-sm tracking-tight">{notification.message}</span>
                </div>
            )}
        </div>
    );
}
