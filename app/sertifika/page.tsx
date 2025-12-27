"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys, apiFetchers } from '@/lib/queries';
import { Company } from '@/app/types';
import { formatDate } from '@/app/utils';
import {
    Award, Plus, Trash2, Download, Building2,
    Calendar, Clock, User, CheckCircle2, AlertCircle,
    Info, Loader2, FileSpreadsheet, Upload
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useTheme } from '@/app/context/ThemeContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import * as XLSX from 'xlsx';

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
const YEARS = Array.from({ length: 3 }, (_, i) => (new Date().getFullYear() + i).toString());

const TRAINING_DURATIONS = ['2 saat', '4 saat', '8 saat', '12 saat', '16 saat'];

// Eğitim Konuları - Sertifikada gösterilecek
const TRAINING_TOPICS = {
    'Genel Konular': [
        'a) Çalışma mevzuatı ile ilgili bilgiler,',
        'b) Çalışanların yasal hak ve sorumlulukları',
        'c) İşyeri temizliği ve düzeni,',
        'd) İş kazası ve meslek hastalığından doğan hukuki sonuçlar'
    ],
    'Sağlık Konuları': [
        'a) Meslek hastalıklarının sebepleri,',
        'b) Hastalıktan korunma prensipleri ve korunma tekniklerinin uygulanması',
        'c) Biyolojik ve psikososyal risk etmenleri',
        'd) Tütün ürünlerinin zararları ve pasif etkilenim',
        'e) İlkyardım'
    ],
    'Teknik Konular': [
        'a) Kimyasal, fiziksel ve ergonomik risk etmenleri',
        'b) Elle kaldırma ve taşıma,',
        'c) Parlama, patlama, yangın ve yangından korunma',
        'd) Ekranlı araçlarla çalışma,',
        'e) Elektrik tehlikeleri, riskleri ve önlemleri',
        'f) İş ekipmanlarının güvenli kullanımı,',
        'g) İş kazalarının sebepleri ve korunma prensipleri ile tekniklerin uygulanması',
        'ğ) Güvenlik ve sağlık işaretleri',
        'h) Kişisel koruyucu donanım kullanımı',
        'ı) İş Sağlığı ve Güvenliği genel kuralları ve güvenlik kültürü',
        'i) Tahliye ve Kurtarma'
    ],
    'Diğer Konular': [
        'a) Çalışanın yaptığı işe özgü yüksekte çalışma',
        'b) Kapalı ortamda çalışma,',
        'c) Radyasyon riskinin bulunduğu ortamda çalışma',
        'd) Kaynakla çalışma',
        'e) Kanserojen maddelerinin yol açtığı olası sağlık riskleri'
    ]
};

export default function SertifikaPage() {
    const { data: session } = useSession();
    const { isDark } = useTheme();
    const { requireAuth } = useRequireAuth();

    // State management
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [isManualCompany, setIsManualCompany] = useState(false);
    const [manualCompanyTitle, setManualCompanyTitle] = useState('');

    // Eğitim Gün Sayısı ve Tarihleri
    const [trainingDayCount, setTrainingDayCount] = useState<number>(1);
    const [trainingDays, setTrainingDays] = useState<Array<{ day: string; month: string }>>([{ day: '', month: '' }]);
    const [trainingYear, setTrainingYear] = useState<string>('');

    // Geçerlilik Tarihi
    const [validityDate, setValidityDate] = useState({ day: '', month: '', year: '' });
    const [isAutoValidity, setIsAutoValidity] = useState(true);

    // Eğitim Süresi
    const [trainingDuration, setTrainingDuration] = useState('8 saat');

    // Katılımcılar (certNo alanı eklendi)
    const [participants, setParticipants] = useState<Array<{ id: string; name: string; tc: string; position: string; certNo: string }>>([]);
    const [newParticipant, setNewParticipant] = useState({ name: '', tc: '', position: '' });
    const [startCertNo, setStartCertNo] = useState('');

    const [isGenerating, setIsGenerating] = useState(false);
    const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Excel file input ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Firma çalışanları state
    const [companyEmployees, setCompanyEmployees] = useState<Array<{ id: string; fullName: string; tcNo: string | null; position: string | null }>>([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);

    // Firma seçildiğinde çalışanları çek
    useEffect(() => {
        if (selectedCompanyId && selectedCompanyId !== 'manual') {
            fetchCompanyEmployees(selectedCompanyId);
        } else {
            setCompanyEmployees([]);
        }
    }, [selectedCompanyId]);

    const fetchCompanyEmployees = async (companyId: string) => {
        setEmployeesLoading(true);
        try {
            const res = await fetch(`/api/employees?company_id=${companyId}`);
            if (res.ok) {
                const data = await res.json();
                setCompanyEmployees(data);
            }
        } catch (error) {
            console.error('Çalışanlar alınamadı:', error);
        } finally {
            setEmployeesLoading(false);
        }
    };

    // Çalışanı katılımcı listesine ekle
    const addEmployeeToParticipants = (employeeId: string) => {
        const emp = companyEmployees.find(e => e.id === employeeId);
        if (!emp) return;

        // Aynı çalışan zaten eklenmişse ekleme
        const alreadyExists = participants.some(p => p.tc === emp.tcNo);
        if (alreadyExists) {
            showNotification('Bu çalışan zaten listede!', 'error');
            return;
        }

        // TC kontrolü
        if (!emp.tcNo || !validateTC(emp.tcNo)) {
            showNotification('Çalışanın TC No geçersiz!', 'error');
            return;
        }

        setParticipants([...participants, {
            id: Date.now().toString(),
            name: emp.fullName,
            tc: emp.tcNo,
            position: emp.position || '',
            certNo: ''
        }]);
    };

    // Tüm çalışanları katılımcı listesine ekle
    const addAllEmployeesToParticipants = () => {
        let addedCount = 0;
        const newParticipants: Array<{ id: string; name: string; tc: string; position: string; certNo: string }> = [];

        companyEmployees.forEach(emp => {
            if (!emp.tcNo || !validateTC(emp.tcNo)) return;
            const alreadyExists = participants.some(p => p.tc === emp.tcNo);
            if (alreadyExists) return;

            newParticipants.push({
                id: Date.now().toString() + addedCount,
                name: emp.fullName,
                tc: emp.tcNo,
                position: emp.position || '',
                certNo: ''
            });
            addedCount++;
        });

        if (addedCount > 0) {
            setParticipants([...participants, ...newParticipants]);
            showNotification(`${addedCount} çalışan eklendi!`, 'success');
        } else {
            showNotification('Eklenebilecek çalışan bulunamadı!', 'error');
        }
    };

    // Excel şablon indirme
    const downloadExcelTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            ['Ad Soyad', 'TC No', 'Görev Ünvanı'],
            ['Örnek Katılımcı 1', '12345678900', 'İşçi'],
            ['Örnek Katılımcı 2', '98765432100', 'Formen'],
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Katılımcılar');
        XLSX.writeFile(wb, 'Katilimci_Sablonu.xlsx');
    };

    // TC No doğrulama fonksiyonu
    const validateTC = (tc: string): boolean => {
        const tcRegex = /^[0-9]{11}$/;
        if (!tcRegex.test(tc)) return false;
        const lastDigit = parseInt(tc[10]);
        return lastDigit % 2 === 0;
    };

    // Excel dosyası yükleme
    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

                // TC doğrulama kontrolü
                const errors: string[] = [];
                const validParticipants: Array<{ id: string; name: string; tc: string; position: string; certNo: string }> = [];

                jsonData.forEach((row: Record<string, unknown>, index: number) => {
                    // Alternatif sütun isimlerini destekle
                    const name = (row['Ad Soyad'] || row['Ad Soyadı'] || row['İsim'])?.toString().trim() || '';
                    const tc = (row['TC No'] || row['TC'] || row['T.C.'] || row['T.C. No'])?.toString().trim() || '';
                    const position = (row['Görev Ünvanı'] || row['Görev'] || row['Ünvan'] || row['Pozisyon'])?.toString().trim() || '';

                    if (!name) return; // Boş satırları atla

                    if (!validateTC(tc)) {
                        errors.push(`Satır ${index + 2}: "${name}" - Geçersiz TC No: ${tc || '(boş)'}`);
                    } else {
                        validParticipants.push({
                            id: Date.now().toString() + index,
                            name,
                            tc,
                            position,
                            certNo: ''
                        });
                    }
                });

                if (errors.length > 0) {
                    showNotification(`TC No Hataları:\n${errors.join('\n')}\n\nLütfen Excel dosyanızı düzeltip tekrar yükleyin.`, 'error');
                } else if (validParticipants.length > 0) {
                    setParticipants(prev => [...prev, ...validParticipants]);
                    showNotification(`${validParticipants.length} katılımcı başarıyla eklendi!`, 'success');
                } else {
                    showNotification('Excel dosyasında geçerli katılımcı bulunamadı!', 'error');
                }
            } catch (error) {
                console.error('Excel parse error:', error);
                showNotification('Excel dosyası okunamadı! Lütfen geçerli bir Excel dosyası yükleyin.', 'error');
            }
        };
        reader.readAsArrayBuffer(file);

        // Input'u sıfırla (aynı dosya tekrar yüklenebilsin)
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
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

    // Eğitim gün sayısı değiştiğinde trainingDays dizisini güncelle
    const handleDayCountChange = (count: number) => {
        setTrainingDayCount(count);
        setTrainingDays(prev => {
            const newDays = [...prev];
            while (newDays.length < count) {
                // Yeni gün eklerken önceki günün ayını kullan
                const lastMonth = newDays.length > 0 ? newDays[newDays.length - 1].month : '';
                newDays.push({ day: '', month: lastMonth || '' });
            }
            return newDays.slice(0, count);
        });
    };

    // Eğitim günü değişikliği
    const handleTrainingDayChange = (index: number, field: 'day' | 'month', value: string) => {
        setTrainingDays(prev => {
            const newDays = [...prev];
            newDays[index] = { ...newDays[index], [field]: value };

            // İlk gün seçildiğinde diğer günleri otomatik doldur
            if (index === 0 && field === 'day' && value) {
                const firstDay = parseInt(value);
                for (let i = 1; i < newDays.length; i++) {
                    const nextDay = firstDay + i;
                    // 31'i geçmeyecek şekilde ayarla (basit kontrol)
                    if (nextDay <= 31) {
                        newDays[i] = { ...newDays[i], day: nextDay.toString().padStart(2, '0') };
                    }
                }
            }

            // İlk ay seçildiğinde diğer ayları da aynı yap
            if (index === 0 && field === 'month' && value) {
                for (let i = 1; i < newDays.length; i++) {
                    newDays[i] = { ...newDays[i], month: value };
                }
            }

            return newDays;
        });

        // İlk günün ayı değiştiğinde otomatik geçerlilik tarihi hesapla
        if (index === 0 && isAutoValidity) {
            updateValidityDate();
        }
    };

    // Yıl değiştiğinde otomatik geçerlilik tarihi hesapla
    const handleYearChange = (value: string) => {
        setTrainingYear(value);

        if (isAutoValidity && value) {
            // En son tarihi bul ve +1 yıl ekle
            setTimeout(() => {
                let latestDate: Date | null = null;
                trainingDays.forEach(d => {
                    if (d.day && d.month) {
                        const date = new Date(parseInt(value), parseInt(d.month) - 1, parseInt(d.day));
                        if (!latestDate || date > latestDate) {
                            latestDate = date;
                        }
                    }
                });

                if (latestDate) {
                    const validityYear = (latestDate as Date).getFullYear() + 1;
                    setValidityDate({
                        day: (latestDate as Date).getDate().toString().padStart(2, '0'),
                        month: ((latestDate as Date).getMonth() + 1).toString().padStart(2, '0'),
                        year: validityYear.toString()
                    });
                }
            }, 0);
        }
    };

    // Geçerlilik tarihini güncelle (en son eğitim tarihine göre)
    const updateValidityDate = () => {
        if (!trainingYear) return;

        let latestDate: Date | null = null;
        trainingDays.forEach(d => {
            if (d.day && d.month) {
                const date = new Date(parseInt(trainingYear), parseInt(d.month) - 1, parseInt(d.day));
                if (!latestDate || date > latestDate) {
                    latestDate = date;
                }
            }
        });

        if (latestDate) {
            const validityYear = (latestDate as Date).getFullYear() + 1;
            setValidityDate({
                day: (latestDate as Date).getDate().toString().padStart(2, '0'),
                month: ((latestDate as Date).getMonth() + 1).toString().padStart(2, '0'),
                year: validityYear.toString()
            });
        }
    };

    const handleValidityDateChange = (part: 'day' | 'month' | 'year', value: string) => {
        setIsAutoValidity(false);
        setValidityDate({ ...validityDate, [part]: value });
    };

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

        setParticipants([...participants, { ...newParticipant, id: Date.now().toString(), certNo: '' }]);
        setNewParticipant({ name: '', tc: '', position: '' });
    };

    const removeParticipant = (id: string) => {
        setParticipants(participants.filter(p => p.id !== id));
    };

    // Katılımcı sertifika numarasını güncelle
    const updateParticipantCertNo = (id: string, certNo: string) => {
        // Max 5 hane
        const sanitized = certNo.replace(/[^0-9]/g, '').slice(0, 5);
        setParticipants(prev => prev.map(p => p.id === id ? { ...p, certNo: sanitized } : p));
    };

    // Otomatik sertifika numarası oluştur
    const generateAutoNumbers = () => {
        if (!startCertNo) {
            showNotification('Lütfen başlangıç sertifika numarasını girin!', 'error');
            return;
        }
        const startNum = parseInt(startCertNo);
        if (isNaN(startNum)) {
            showNotification('Geçersiz başlangıç numarası!', 'error');
            return;
        }
        setParticipants(prev => prev.map((p, idx) => ({
            ...p,
            certNo: (startNum + idx).toString().padStart(startCertNo.length, '0').slice(-5)
        })));
        showNotification('Sertifika numaraları otomatik oluşturuldu!', 'success');
    };

    // Çoklu gün için eğitim tarihlerini formatla
    // Aynı ay içindeki günler: gün-gün-gün.ay.yıl
    // Farklı aylara sarkan günler: gün-gün.ay1.yıl, gün-gün.ay2.yıl
    const getFormattedTrainingDates = () => {
        if (!trainingYear || trainingDays.some(d => !d.day || !d.month)) return '';

        // Günleri aylara göre grupla
        const monthGroups: { [key: string]: string[] } = {};
        trainingDays.forEach(d => {
            const key = d.month;
            if (!monthGroups[key]) monthGroups[key] = [];
            monthGroups[key].push(d.day);
        });

        // Her ay grubu için format oluştur
        const formattedParts: string[] = [];
        Object.entries(monthGroups).forEach(([month, days]) => {
            const daysStr = days.join('-');
            formattedParts.push(`${daysStr}.${month}.${trainingYear}`);
        });

        return formattedParts.join(', ');
    };

    // Geçerlilik tarihi formatla
    const getFormattedValidityDate = () => {
        if (!validityDate.day || !validityDate.month || !validityDate.year) return '';
        return `${validityDate.day}.${validityDate.month}.${validityDate.year}`;
    };

    // Çalışan eğitim durumunu güncelle (TC No ile eşleştir)
    const updateEmployeeTrainingStatus = async (tcNo: string, trainingDateStr: string, trainingTopic: string) => {
        try {
            // Önce bu TC ile eşleşen çalışanı bul
            if (!selectedCompanyId || selectedCompanyId === 'manual') return;

            const employees = await fetch(`/api/employees?company_id=${selectedCompanyId}`);
            if (!employees.ok) return;

            const empList = await employees.json();
            const matchingEmployee = empList.find((e: { tcNo: string }) => e.tcNo === tcNo);

            if (matchingEmployee) {
                // Eğitim tarihini parse et (gün.ay.yıl formatından)
                const dateParts = trainingDateStr.split('.');
                if (dateParts.length >= 3) {
                    const day = dateParts[0].split('-')[0]; // İlk günü al
                    const month = dateParts[1];
                    const year = dateParts[2];
                    const trainingDate = new Date(`${year}-${month}-${day}`);

                    // Çalışanın eğitim durumunu güncelle
                    await fetch('/api/employees', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: matchingEmployee.id,
                            trainingDate: trainingDate.toISOString(),
                            trainingTopic: trainingTopic
                        })
                    });
                }
            }
        } catch (error) {
            console.error('Eğitim durumu güncellenemedi:', error);
        }
    };

    // PDF Generation
    const generatePDF = async () => {
        // Giriş kontrolü
        if (!requireAuth()) return;

        if (!selectedCompany || (isManualCompany && !manualCompanyTitle)) {
            showNotification('Lütfen bir firma seçin veya adını girin!', 'error');
            return;
        }
        // Tüm günlerin seçilip seçilmediğini kontrol et
        const allDaysSelected = trainingDays.every(d => d.day && d.month) && trainingYear;
        if (!allDaysSelected) {
            showNotification('Lütfen tüm eğitim tarihlerini seçin!', 'error');
            return;
        }
        if (!validityDate.day || !validityDate.month || !validityDate.year) {
            showNotification('Lütfen geçerlilik tarihini seçin!', 'error');
            return;
        }
        if (participants.length === 0) {
            showNotification('Lütfen en az bir katılımcı ekleyin!', 'error');
            return;
        }

        setIsGenerating(true);

        try {
            const pageWidth = 297; // A4 landscape
            const pageHeight = 210;
            const margin = 15;

            // Türkçe karakterleri büyük harfe çeviren fonksiyon
            const toUpperCaseTurkish = (str: string) => {
                return str
                    .replace(/i/g, 'İ')
                    .replace(/ı/g, 'I')
                    .replace(/ğ/g, 'Ğ')
                    .replace(/ü/g, 'Ü')
                    .replace(/ş/g, 'Ş')
                    .replace(/ö/g, 'Ö')
                    .replace(/ç/g, 'Ç')
                    .toUpperCase();
            };

            // Her katılımcı için ayrı PDF dosyası oluştur ve indir
            for (const participant of participants) {
                const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

                // Font yükleme
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

                // Katılımcı adını büyük harfe çevir
                const participantNameUpper = toUpperCaseTurkish(participant.name);

                // Sayfa çerçevesi
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.5);
                doc.rect(margin - 5, margin - 5, pageWidth - 2 * (margin - 5), pageHeight - 2 * (margin - 5));

                // İç çerçeve (dekoratif)
                doc.setLineWidth(0.2);
                doc.rect(margin - 2, margin - 2, pageWidth - 2 * (margin - 2), pageHeight - 2 * (margin - 2));

                let currentY = margin;

                // Başlık
                doc.setFontSize(22);
                doc.setFont('Roboto', 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text('İŞ SAĞLIĞI VE GÜVENLİĞİ TEMEL', pageWidth / 2, currentY + 10, { align: 'center' });
                doc.text('EĞİTİM BELGESİ', pageWidth / 2, currentY + 20, { align: 'center' });

                // Mavi çizgi
                currentY += 28;
                doc.setDrawColor(0, 100, 180);
                doc.setLineWidth(2);
                doc.line(margin, currentY, pageWidth - margin, currentY);

                // Bilgi Alanları
                currentY += 10;
                doc.setFontSize(10);
                doc.setFont('Roboto', 'normal');
                doc.setTextColor(0, 0, 0);

                const leftColX = margin + 5;
                const rightColX = pageWidth / 2 + 10;
                const colonLeftX = margin + 55;
                const colonRightX = pageWidth / 2 + 55;
                const valueLeftX = margin + 60;
                const valueRightX = pageWidth / 2 + 60;
                const maxCompanyWidth = (pageWidth / 2) - valueLeftX - 10;

                // Sol kolon
                doc.text('Katılımcının Adı Soyadı', leftColX, currentY);
                doc.text(':', colonLeftX, currentY);
                doc.setFont('Roboto', 'bold');
                doc.text(participantNameUpper, valueLeftX, currentY);
                doc.setFont('Roboto', 'normal');

                doc.text('Katılımcının Görev Ünvanı', leftColX, currentY + 7);
                doc.text(':', colonLeftX, currentY + 7);
                doc.text(participant.position || '-', valueLeftX, currentY + 7);

                // Firma - uzun isimler için satır kaydırma
                doc.text('Firma', leftColX, currentY + 14);
                doc.text(':', colonLeftX, currentY + 14);
                const companyName = selectedCompany?.title || '';
                const companyLines = doc.splitTextToSize(companyName, maxCompanyWidth);
                doc.text(companyLines, valueLeftX, currentY + 14);

                const companyExtraLines = companyLines.length > 1 ? (companyLines.length - 1) * 5 : 0;

                // Sağ kolon
                doc.text('Katılımcının T.C. No', rightColX, currentY);
                doc.text(':', colonRightX, currentY);
                doc.setFont('Roboto', 'bold');
                doc.text(participant.tc, valueRightX, currentY);
                doc.setFont('Roboto', 'normal');

                doc.text('Eğitim Tarihi', rightColX, currentY + 7);
                doc.text(':', colonRightX, currentY + 7);
                doc.text(getFormattedTrainingDates(), valueRightX, currentY + 7);

                doc.text('Geçerlilik Süresi', rightColX, currentY + 14);
                doc.text(':', colonRightX, currentY + 14);
                doc.text(getFormattedValidityDate(), valueRightX, currentY + 14);

                doc.text('Eğitim Süresi', rightColX, currentY + 21);
                doc.text(':', colonRightX, currentY + 21);
                doc.text(trainingDuration, valueRightX, currentY + 21);

                // Açıklama paragrafı (paragraf başı boşluğu ile)
                currentY += 35 + companyExtraLines;
                doc.setFontSize(9);
                doc.setFont('Roboto', 'bold');
                const paragraphIndent = '        '; // Paragraf başı boşluğu
                const descText = paragraphIndent + 'Yukarıda adı geçen katılımcı, "Çalışanların İş Sağlığı ve Güvenliği Eğitimleri Usul ve Esasları hakkında" yönetmelik kapsamında verilen "İş Sağlığı ve Güvenliği" eğitimlerini başarıyla tamamlayarak bu eğitim belgesini almaya hak kazanmıştır.';
                const splitDesc = doc.splitTextToSize(descText, pageWidth - 2 * margin);
                doc.text(splitDesc, margin, currentY);

                // Eğitim Konuları Bölümü
                currentY += 18;
                doc.setFontSize(9);
                doc.setFont('Roboto', 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text('Eğitimin Konuları  :', margin, currentY);

                currentY += 5;
                const colWidth = (pageWidth - 2 * margin) / 4;

                Object.entries(TRAINING_TOPICS).forEach(([category, topics], catIdx) => {
                    const colX = margin + (catIdx * colWidth);
                    let topicY = currentY;

                    doc.setFont('Roboto', 'bold');
                    doc.setFontSize(8);
                    doc.text(`${catIdx + 1}. ${category}`, colX, topicY);
                    topicY += 4;

                    doc.setFont('Roboto', 'normal');
                    doc.setFontSize(6.5);
                    topics.forEach((topic) => {
                        const splitTopic = doc.splitTextToSize(topic, colWidth - 5);
                        doc.text(splitTopic, colX, topicY);
                        topicY += splitTopic.length * 3;
                    });
                });

                // Alt Bölüm - İmzalar
                const footerY = pageHeight - 30;
                doc.setFontSize(9);
                doc.setFont('Roboto', 'normal');

                // Eğitici
                doc.text('Eğitici Adı Soyadı', margin, footerY);
                doc.text(':', margin + 35, footerY);
                doc.text('İmza', margin, footerY + 7);
                doc.text(':', margin + 35, footerY + 7);

                // İşveren
                const rightFooterX = pageWidth - margin - 80;
                doc.text('İşveren / İşveren Vekilinin', rightFooterX, footerY);
                doc.text('Adı Soyadı', rightFooterX, footerY + 5);
                doc.text(':', rightFooterX + 35, footerY + 5);
                doc.text('İmza', rightFooterX, footerY + 12);
                doc.text(':', rightFooterX + 35, footerY + 12);

                // Sertifika No - sağ alt köşede çerçeve dışına
                if (participant.certNo) {
                    doc.setFontSize(7);
                    doc.setFont('Roboto', 'normal');
                    doc.setTextColor(100, 100, 100);
                    doc.text(`Sertifika No: ${participant.certNo}`, pageWidth - margin + 3, pageHeight - 5, { align: 'right' });
                    doc.setTextColor(0, 0, 0);
                }

                // PDF'i indir - her katılımcı için ayrı dosya
                const fileName = `${participantNameUpper} İSG Sertifikası.pdf`;
                doc.save(fileName);

                // Çalışan eğitim durumunu güncelle (firmadan eklenen çalışanlar için)
                const trainingDateStr = getFormattedTrainingDates();
                await updateEmployeeTrainingStatus(participant.tc, trainingDateStr, 'İSG Temel Eğitimi');

                // Birden fazla dosya indirirken tarayıcının engellemesini önlemek için küçük gecikme
                if (participants.length > 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            showNotification(`${participants.length} sertifika PDF'i başarıyla oluşturuldu!`, 'success');
        } catch (error) {
            console.error('PDF error:', error);
            showNotification('PDF oluşturulurken bir hata oluştu!', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="sertifika-page min-h-screen bg-white dark:bg-slate-950 p-4 md:p-8 transition-colors duration-300 text-black dark:text-slate-100">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                            <Award className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-2xl font-bold text-black dark:text-slate-50 font-outfit">İSG Sertifikası Oluştur</h1>
                            <p className="text-black dark:text-slate-400 text-xs md:text-sm">İş Sağlığı ve Güvenliği Temel Eğitim Belgesi</p>
                        </div>
                    </div>
                    <button
                        onClick={generatePDF}
                        disabled={isGenerating || participants.length === 0}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
                    >
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                        PDF İndir
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">

                    {/* Form Sol Taraf - 3 kolon */}
                    <div className="lg:col-span-3 space-y-4 md:space-y-6">

                        {/* Firma ve Eğitim Bilgileri */}
                        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                            <h3 className="flex items-center gap-2 font-bold text-black dark:text-slate-100 border-b pb-3 border-slate-200 dark:border-slate-800">
                                <Building2 className="w-5 h-5 text-emerald-500" />
                                Firma ve Eğitim Bilgileri
                            </h3>

                            {/* Firma Seçimi */}
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
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-black dark:text-slate-100"
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
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-black dark:text-slate-100 placeholder:text-slate-500"
                                    />
                                )}
                            </div>

                            {/* Eğitim Gün Sayısı */}
                            <div className="pt-2">
                                <label className="text-xs font-bold text-black dark:text-slate-400 uppercase block mb-2 px-1 tracking-wider">Eğitim Gün Sayısı *</label>
                                <select
                                    value={trainingDayCount}
                                    onChange={(e) => handleDayCountChange(parseInt(e.target.value))}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-black dark:text-slate-100"
                                >
                                    {[1, 2, 3, 4, 5, 6].map(n => (
                                        <option key={n} value={n} className="bg-white text-black dark:bg-slate-800 dark:text-slate-100">{n} Gün</option>
                                    ))}
                                </select>
                            </div>

                            {/* Eğitim Tarihleri */}
                            <div className="space-y-3 pt-2">
                                <label className="text-xs font-bold text-black dark:text-slate-400 uppercase block px-1 tracking-wider">Eğitim Tarihleri *</label>

                                {/* Yıl Seçimi (Tüm günler için ortak) */}
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Yıl:</span>
                                    <select
                                        value={trainingYear}
                                        onChange={(e) => handleYearChange(e.target.value)}
                                        className="flex-1 bg-white dark:bg-transparent text-sm outline-none text-black dark:text-slate-100 cursor-pointer"
                                    >
                                        <option value="" className="bg-white text-black dark:bg-slate-800 dark:text-white">Yıl Seçin</option>
                                        {YEARS.map(y => <option key={y} value={y} className="bg-white text-black dark:bg-slate-800 dark:text-white">{y}</option>)}
                                    </select>
                                </div>

                                {/* Her gün için ayrı gün ve ay seçimi */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {trainingDays.map((day, index) => (
                                        <div key={index} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2">
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 min-w-[24px]">{index + 1}.</span>
                                            <select
                                                value={day.day}
                                                onChange={(e) => handleTrainingDayChange(index, 'day', e.target.value)}
                                                className="bg-white dark:bg-transparent text-sm outline-none text-black dark:text-slate-100 cursor-pointer w-12"
                                            >
                                                <option value="" className="bg-white text-black dark:bg-slate-800 dark:text-white">Gün</option>
                                                {DAYS.map(d => <option key={d} value={d} className="bg-white text-black dark:bg-slate-800 dark:text-white">{d}</option>)}
                                            </select>
                                            <span className="text-slate-400">/</span>
                                            <select
                                                value={day.month}
                                                onChange={(e) => handleTrainingDayChange(index, 'month', e.target.value)}
                                                className="bg-white dark:bg-transparent text-sm outline-none text-black dark:text-slate-100 cursor-pointer flex-1"
                                            >
                                                <option value="" className="bg-white text-black dark:bg-slate-800 dark:text-white">Ay</option>
                                                {MONTHS.map(m => <option key={m.value} value={m.value} className="bg-white text-black dark:bg-slate-800 dark:text-white">{m.label}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Geçerlilik Tarihi */}
                            <div className="space-y-2 pt-2">
                                <label className="text-xs font-bold text-black dark:text-slate-400 uppercase block px-1 tracking-wider">
                                    Geçerlilik Tarihi *
                                    {isAutoValidity && <span className="text-emerald-500 ml-2">(+1 yıl otomatik)</span>}
                                </label>
                                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2">
                                    <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                    <select
                                        value={validityDate.day}
                                        onChange={(e) => handleValidityDateChange('day', e.target.value)}
                                        className="bg-white dark:bg-transparent text-sm outline-none text-black dark:text-slate-100 cursor-pointer"
                                    >
                                        <option value="" className="bg-white text-black dark:bg-slate-800 dark:text-white">Gün</option>
                                        {DAYS.map(d => <option key={d} value={d} className="bg-white text-black dark:bg-slate-800 dark:text-white">{d}</option>)}
                                    </select>
                                    <span className="text-slate-400">/</span>
                                    <select
                                        value={validityDate.month}
                                        onChange={(e) => handleValidityDateChange('month', e.target.value)}
                                        className="bg-white dark:bg-transparent text-sm outline-none text-black dark:text-slate-100 cursor-pointer"
                                    >
                                        <option value="" className="bg-white text-black dark:bg-slate-800 dark:text-white">Ay</option>
                                        {MONTHS.map(m => <option key={m.value} value={m.value} className="bg-white text-black dark:bg-slate-800 dark:text-white">{m.label}</option>)}
                                    </select>
                                    <span className="text-slate-400">/</span>
                                    <select
                                        value={validityDate.year}
                                        onChange={(e) => handleValidityDateChange('year', e.target.value)}
                                        className="bg-white dark:bg-transparent text-sm outline-none text-black dark:text-slate-100 cursor-pointer"
                                    >
                                        <option value="" className="bg-white text-black dark:bg-slate-800 dark:text-white">Yıl</option>
                                        {YEARS.map(y => <option key={y} value={y} className="bg-white text-black dark:bg-slate-800 dark:text-white">{y}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Eğitim Süresi */}
                            <div className="pt-2">
                                <label className="text-xs font-bold text-black dark:text-slate-400 uppercase block mb-2 px-1 tracking-wider">Eğitim Süresi *</label>
                                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2">
                                    <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                    <select
                                        value={trainingDuration}
                                        onChange={(e) => setTrainingDuration(e.target.value)}
                                        className="flex-1 bg-white dark:bg-transparent text-sm outline-none text-black dark:text-slate-100 cursor-pointer"
                                    >
                                        {TRAINING_DURATIONS.map(d => (
                                            <option key={d} value={d} className="bg-white text-black dark:bg-slate-800 dark:text-white">{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sağ Taraf: Katılımcı Listesi - 2 kolon */}
                    <div className="lg:col-span-2 space-y-4 md:space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-full lg:sticky lg:top-24">
                            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800 mb-4">
                                <h3 className="flex items-center gap-2 text-sm md:text-base font-bold text-black dark:text-slate-100">
                                    <User className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                                    Katılımcı Listesi ({participants.length})
                                </h3>
                                {participants.length > 0 && (
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Tümünü Sil
                                    </button>
                                )}
                            </div>

                            {/* Firmadan Çalışan Seçme */}
                            {companyEmployees.length > 0 && (
                                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">Firmadan Çalışan Ekle</p>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    addEmployeeToParticipants(e.target.value);
                                                    e.target.value = '';
                                                }
                                            }}
                                            className="flex-1 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-lg p-2.5 text-sm text-black dark:text-slate-100"
                                        >
                                            <option value="">Çalışan Seçin ({companyEmployees.length} kişi)</option>
                                            {companyEmployees.map(emp => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.fullName} {emp.position ? `- ${emp.position}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={addAllEmployeesToParticipants}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors whitespace-nowrap"
                                        >
                                            Tümünü Ekle
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Katılımcı Ekleme Formu */}
                            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
                                <input
                                    type="text"
                                    placeholder="Katılımcının Adı Soyadı"
                                    value={newParticipant.name}
                                    onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm font-bold text-black dark:text-slate-100 placeholder:text-slate-500"
                                />
                                <input
                                    type="text"
                                    placeholder="Katılımcının T.C. No"
                                    maxLength={11}
                                    value={newParticipant.tc}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        setNewParticipant({ ...newParticipant, tc: value });
                                    }}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm font-bold text-black dark:text-slate-100 placeholder:text-slate-500"
                                />
                                <input
                                    type="text"
                                    placeholder="Katılımcının Görev Ünvanı"
                                    value={newParticipant.position}
                                    onChange={(e) => setNewParticipant({ ...newParticipant, position: e.target.value })}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm font-bold text-black dark:text-slate-100 placeholder:text-slate-500"
                                />
                                <button
                                    onClick={addParticipant}
                                    className="w-full py-2.5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg text-sm font-black hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-md"
                                >
                                    <Plus className="w-4 h-4" />
                                    Listeye Ekle
                                </button>

                                {/* Excel İşlemleri */}
                                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 mt-3">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 text-center">veya Excel ile toplu yükle</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={downloadExcelTemplate}
                                            className="py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 dark:hover:bg-blue-500 transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <FileSpreadsheet className="w-3.5 h-3.5" />
                                            Şablon İndir
                                        </button>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="py-2 bg-green-600 dark:bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 dark:hover:bg-green-500 transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <Upload className="w-3.5 h-3.5" />
                                            Excel Yükle
                                        </button>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleExcelUpload}
                                        accept=".xlsx,.xls"
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            {/* Katılımcı Listesi */}
                            <div className="flex-1 overflow-y-auto max-h-[400px] space-y-2 pr-1 custom-scrollbar">
                                {participants.length === 0 ? (
                                    <div className="text-center py-10 opacity-70">
                                        <User className="w-12 h-12 mx-auto mb-2 text-slate-500" />
                                        <p className="text-xs font-black uppercase tracking-widest text-black dark:text-slate-400">Henüz katılımcı yok</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Otomatik Sertifika No Oluşturma */}
                                        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Sertifika No:</span>
                                                <input
                                                    type="text"
                                                    maxLength={5}
                                                    placeholder="Başlangıç No"
                                                    value={startCertNo}
                                                    onChange={(e) => setStartCertNo(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                                                    className="w-20 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg px-2 py-1 text-sm font-bold text-center text-black dark:text-slate-100"
                                                />
                                                <button
                                                    onClick={generateAutoNumbers}
                                                    className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors"
                                                >
                                                    Otomatik Oluştur
                                                </button>
                                            </div>
                                        </div>
                                        {participants.map((p, idx) => (
                                            <div key={p.id} className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 md:p-3 rounded-xl flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-3 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs md:text-sm font-black text-black dark:text-slate-200 truncate">{idx + 1}. {p.name}</p>
                                                    <p className="text-[9px] md:text-[10px] text-black dark:text-slate-400 flex items-center gap-1 md:gap-2 mt-0.5">
                                                        <span className="font-bold tracking-tighter">{p.tc}</span>
                                                        <span className="w-1 h-1 bg-emerald-300 dark:bg-emerald-700 rounded-full" />
                                                        <span className="italic font-bold truncate">{p.position || '-'}</span>
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 md:gap-2">
                                                    <input
                                                        type="text"
                                                        maxLength={5}
                                                        placeholder="No"
                                                        value={p.certNo}
                                                        onChange={(e) => updateParticipantCertNo(p.id, e.target.value)}
                                                        className="w-14 md:w-16 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-1.5 md:px-2 py-1 text-xs font-bold text-center text-black dark:text-slate-100"
                                                    />
                                                    <button
                                                        onClick={() => removeParticipant(p.id)}
                                                        className="p-1 md:p-1.5 text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>

                            {/* Bilgi Notu */}
                            <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                <div className="flex gap-3">
                                    <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-500 flex-shrink-0" />
                                    <div>
                                        <h5 className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase mb-1 tracking-wider">Bilgi</h5>
                                        <p className="text-[9px] text-emerald-700 dark:text-emerald-500/80 leading-relaxed font-bold">
                                            Her katılımcı için ayrı bir sertifika sayfası oluşturulacaktır. Eğitici ve İşveren imza alanları boş bırakılmıştır.
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
                    <span className="text-xs md:text-sm font-bold">{notification.message}</span>
                </div>
            )}

            {/* Toplu Silme Onay Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-black dark:text-white">Tüm Katılımcıları Sil</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Bu işlem geri alınamaz</p>
                            </div>
                        </div>
                        <p className="text-sm text-black dark:text-slate-300 mb-6">
                            <strong className="text-red-600 dark:text-red-400">{participants.length} katılımcı</strong> silinecek. Emin misiniz?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-700 text-black dark:text-white rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => {
                                    setParticipants([]);
                                    setShowDeleteModal(false);
                                    showNotification('Tüm katılımcılar silindi.', 'success');
                                }}
                                className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Evet, Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
