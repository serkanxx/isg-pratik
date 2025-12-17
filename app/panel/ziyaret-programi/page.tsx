"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, apiFetchers } from '@/lib/queries';
import {
    Calendar, Building2, Check, Plus, Trash2, Save, Edit2, X,
    ChevronDown, MapPin, AlertCircle, CheckCircle, Loader2, RefreshCw, GripVertical, CheckSquare, Download
} from 'lucide-react';
import { Company, DANGER_CLASS_LABELS } from '@/app/types';
import { useTheme } from '@/app/context/ThemeContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Ziyaret sıklığı seçenekleri
const FREQUENCY_OPTIONS = [
    { value: '1x', label: '1 Defa', visits: 1 },
    { value: '2x', label: '2 Defa', visits: 2 },
    { value: '3x', label: '3 Defa', visits: 3 },
    { value: '4x', label: '4 Defa', visits: 4 },
    { value: 'weekly_1x', label: 'Her Hafta 1 Defa', visits: 4 },
    { value: 'weekly_2x', label: 'Her Hafta 2 Defa', visits: 8 },
    { value: 'weekly_3x', label: 'Her Hafta 3 Defa', visits: 12 },
];

const VISITS_PER_DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Ay seçenekleri
const MONTHS = [
    { value: 0, label: 'Ocak' }, { value: 1, label: 'Şubat' }, { value: 2, label: 'Mart' },
    { value: 3, label: 'Nisan' }, { value: 4, label: 'Mayıs' }, { value: 5, label: 'Haziran' },
    { value: 6, label: 'Temmuz' }, { value: 7, label: 'Ağustos' }, { value: 8, label: 'Eylül' },
    { value: 9, label: 'Ekim' }, { value: 10, label: 'Kasım' }, { value: 11, label: 'Aralık' }
];

// Türkiye resmi tatilleri (sabit tarihler)
const HOLIDAYS: { [key: string]: string } = {
    '01-01': 'Yılbaşı',
    '04-23': 'Ulusal Egemenlik ve Çocuk Bayramı',
    '05-01': 'Emek ve Dayanışma Günü',
    '05-19': 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı',
    '07-15': 'Demokrasi ve Milli Birlik Günü',
    '08-30': 'Zafer Bayramı',
    '10-29': 'Cumhuriyet Bayramı',
};

// 2024-2025-2026 Dini bayramlar (yaklaşık tarihler)
const RELIGIOUS_HOLIDAYS: { [key: string]: string } = {
    // 2024
    '2024-04-10': 'Ramazan Bayramı',
    '2024-04-11': 'Ramazan Bayramı',
    '2024-04-12': 'Ramazan Bayramı',
    '2024-06-16': 'Kurban Bayramı',
    '2024-06-17': 'Kurban Bayramı',
    '2024-06-18': 'Kurban Bayramı',
    '2024-06-19': 'Kurban Bayramı',
    // 2025
    '2025-03-30': 'Ramazan Bayramı',
    '2025-03-31': 'Ramazan Bayramı',
    '2025-04-01': 'Ramazan Bayramı',
    '2025-06-06': 'Kurban Bayramı',
    '2025-06-07': 'Kurban Bayramı',
    '2025-06-08': 'Kurban Bayramı',
    '2025-06-09': 'Kurban Bayramı',
    // 2026
    '2026-03-20': 'Ramazan Bayramı',
    '2026-03-21': 'Ramazan Bayramı',
    '2026-03-22': 'Ramazan Bayramı',
    '2026-05-27': 'Kurban Bayramı',
    '2026-05-28': 'Kurban Bayramı',
    '2026-05-29': 'Kurban Bayramı',
    '2026-05-30': 'Kurban Bayramı',
};

interface SelectedCompany {
    id: string;
    title: string;
    address: string;
    frequency: string;
}

interface ScheduleVisit {
    id: string;
    companyId: string;
    title: string;
    address: string;
    visitNumber: number;
}

interface ScheduleDay {
    date: string;
    dayName: string;
    companies: ScheduleVisit[];
    isHoliday?: boolean;
    holidayName?: string;
}

interface SavedProgram {
    id: string;
    name: string;
    type: string;
    visitsPerDay: number;
    schedule: ScheduleDay[];
    companies: SelectedCompany[];
    startDate: string;
    endDate: string;
    createdAt: string;
}

export default function ZiyaretProgramiPage() {
    const { data: session } = useSession();
    const { isDark } = useTheme();

    // State'ler
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCompanies, setSelectedCompanies] = useState<SelectedCompany[]>([]);
    const [programType, setProgramType] = useState<'monthly' | 'weekly'>('monthly');
    const [visitsPerDay, setVisitsPerDay] = useState(3);
    const [generatedSchedule, setGeneratedSchedule] = useState<ScheduleDay[]>([]);
    const [savedPrograms, setSavedPrograms] = useState<SavedProgram[]>([]);
    const [programName, setProgramName] = useState('');
    const [showSchedule, setShowSchedule] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
    const [editingProgram, setEditingProgram] = useState<SavedProgram | null>(null);

    // Yeni state'ler
    const [includeSaturday, setIncludeSaturday] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedWeek, setSelectedWeek] = useState(getWeekNumber(new Date()));

    // Drag & Drop state
    const [draggedItem, setDraggedItem] = useState<{ dayIndex: number; visitIndex: number } | null>(null);
    const [dragOverDay, setDragOverDay] = useState<number | null>(null);

    // Meşgul Günler State
    const [busyDays, setBusyDays] = useState<string[]>([]);
    const [showBusyDaysModal, setShowBusyDaysModal] = useState(false);

    // Program Görüntüleme Modal State
    const [selectedProgramForView, setSelectedProgramForView] = useState<SavedProgram | null>(null);

    const toggleBusyDay = (dateStr: string) => {
        setBusyDays(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]);
    };

    // Hafta numarası hesapla
    function getWeekNumber(date: Date): number {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    // Hafta seçenekleri oluştur
    function getWeekOptions(): { value: number; label: string; startDate: Date }[] {
        const options = [];
        const year = selectedYear;

        for (let week = 1; week <= 52; week++) {
            const firstDayOfYear = new Date(year, 0, 1);
            const daysOffset = (week - 1) * 7 - firstDayOfYear.getDay() + 1;
            const startDate = new Date(year, 0, 1 + daysOffset);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6);

            options.push({
                value: week,
                label: `${week}. Hafta (${startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })})`,
                startDate
            });
        }
        return options;
    }

    const queryClient = useQueryClient();

    // Firmaları çek (React Query ile cache'lenmiş)
    const { data: companiesData, isLoading: companiesLoading } = useQuery({
        queryKey: queryKeys.companies,
        queryFn: apiFetchers.companies,
    });

    // Ziyaret programlarını çek (React Query ile cache'lenmiş)
    const { data: programsData, isLoading: programsLoading } = useQuery({
        queryKey: queryKeys.visitPrograms,
        queryFn: apiFetchers.visitPrograms,
    });

    useEffect(() => {
        if (companiesData) {
            setCompanies(companiesData);
        }
    }, [companiesData]);

    useEffect(() => {
        if (programsData) {
            setSavedPrograms(programsData);
        }
    }, [programsData]);

    useEffect(() => {
        if ((companiesData && programsData) || (!companiesLoading && !programsLoading)) {
            setLoading(false);
        }
    }, [companiesData, programsData, companiesLoading, programsLoading]);

    const showNotif = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
    };

    // Tüm firmaları seç/kaldır
    const selectAllCompanies = () => {
        if (selectedCompanies.length === companies.length) {
            setSelectedCompanies([]);
        } else {
            setSelectedCompanies(companies.map(c => ({
                id: c.id,
                title: c.title,
                address: c.address,
                frequency: '1x'
            })));
        }
    };

    // Firma seçimi toggle
    const toggleCompany = (company: Company) => {
        const exists = selectedCompanies.find(c => c.id === company.id);
        if (exists) {
            setSelectedCompanies(selectedCompanies.filter(c => c.id !== company.id));
        } else {
            setSelectedCompanies([...selectedCompanies, {
                id: company.id,
                title: company.title,
                address: company.address,
                frequency: '1x'
            }]);
        }
    };

    // Sıklık değiştir
    const updateFrequency = (companyId: string, frequency: string) => {
        setSelectedCompanies(selectedCompanies.map(c =>
            c.id === companyId ? { ...c, frequency } : c
        ));
    };

    // Adresten bölge çıkar (Avrupa/Anadolu yakası ayrımı ile)
    const extractLocation = (address: string): string => {
        const lower = address.toLowerCase();

        // İstanbul Avrupa yakası ilçeleri
        const avrupaYakasi = ['arnavutköy', 'avcılar', 'bağcılar', 'bahçelievler', 'bakırköy', 'başakşehir', 'bayrampaşa', 'beşiktaş', 'beylikdüzü', 'beyoğlu', 'büyükçekmece', 'çatalca', 'esenler', 'esenyurt', 'eyüp', 'eyüpsultan', 'fatih', 'gaziosmanpaşa', 'güngören', 'kağıthane', 'küçükçekmece', 'sarıyer', 'silivri', 'sultangazi', 'şişli', 'zeytinburnu', 'avrupa'];

        // İstanbul Anadolu yakası ilçeleri  
        const anadoluYakasi = ['adalar', 'ataşehir', 'beykoz', 'çekmeköy', 'kadıköy', 'kartal', 'maltepe', 'pendik', 'sancaktepe', 'sultanbeyli', 'şile', 'tuzla', 'ümraniye', 'üsküdar', 'anadolu', 'gebze', 'çayırova', 'darıca', 'dilovası', 'körfez'];

        // Önce İstanbul yakalarını kontrol et
        for (const ilce of avrupaYakasi) {
            if (lower.includes(ilce)) {
                return 'istanbul_avrupa';
            }
        }
        for (const ilce of anadoluYakasi) {
            if (lower.includes(ilce)) {
                return 'istanbul_anadolu';
            }
        }

        // Diğer şehirler
        const cities = ['ankara', 'izmir', 'bursa', 'antalya', 'adana', 'konya', 'gaziantep', 'mersin', 'kayseri', 'eskişehir', 'samsun', 'denizli', 'şanlıurfa', 'malatya', 'trabzon', 'erzurum', 'van', 'diyarbakır', 'sakarya', 'kocaeli', 'tekirdağ', 'manisa', 'balıkesir', 'mardin', 'elazığ'];

        for (const city of cities) {
            if (lower.includes(city)) {
                return city;
            }
        }

        // istanbul genel olarak yazıldıysa
        if (lower.includes('istanbul') || lower.includes('İstanbul')) {
            return 'istanbul_diger';
        }

        return 'diger';
    };

    // Firmaları konuma göre grupla ve sırala
    const sortCompaniesByLocation = (comps: SelectedCompany[]): SelectedCompany[] => {
        const locationMap = new Map<string, SelectedCompany[]>();

        comps.forEach(comp => {
            const loc = extractLocation(comp.address);
            if (!locationMap.has(loc)) {
                locationMap.set(loc, []);
            }
            locationMap.get(loc)!.push(comp);
        });

        // Lokasyonları sırala ve firmaları gruplandır
        const sorted: SelectedCompany[] = [];
        locationMap.forEach((compsInLoc) => {
            sorted.push(...compsInLoc);
        });

        return sorted;
    };

    // Tarihi yerel formatta stringe çevir (YYYY-MM-DD)
    const formatDateLocal = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Tatil kontrolü
    const isHoliday = (date: Date): { isHoliday: boolean; name?: string } => {
        const dateStr = formatDateLocal(date);

        // Meşgul Gün Kontrolü
        if (busyDays.includes(dateStr)) {
            return { isHoliday: true, name: 'MEŞGUL' };
        }

        const monthDay = dateStr.slice(5); // MM-DD

        if (HOLIDAYS[monthDay]) {
            return { isHoliday: true, name: HOLIDAYS[monthDay] };
        }
        if (RELIGIOUS_HOLIDAYS[dateStr]) {
            return { isHoliday: true, name: RELIGIOUS_HOLIDAYS[dateStr] };
        }
        return { isHoliday: false };
    };

    // Program oluştur - Düzeltilmiş homojen dağılım algoritması
    const generateSchedule = () => {
        if (selectedCompanies.length === 0) {
            showNotif('Lütfen en az bir firma seçin!', 'error');
            return;
        }

        const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

        // Tarih aralığını belirle - Sadece seçilen ayın günleri
        let startDate: Date;
        let endDate: Date;

        if (programType === 'monthly') {
            // Ayın 1'inden başla (önceki ayın günlerini dahil etme)
            startDate = new Date(selectedYear, selectedMonth, 1);
            endDate = new Date(selectedYear, selectedMonth + 1, 0);
        } else {
            const weekOptions = getWeekOptions();
            const selectedWeekData = weekOptions.find(w => w.value === selectedWeek);
            startDate = selectedWeekData?.startDate || new Date();
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6);
        }

        // Tüm günleri topla (tatil dahil)
        const allDays: { date: Date; isHoliday: boolean; holidayName?: string }[] = [];

        // Tarih döngüsü - yalnızca gün bazında karşılaştır
        const current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

        while (current <= end) {
            const dayOfWeek = current.getDay();
            const isWeekend = dayOfWeek === 0 || (dayOfWeek === 6 && !includeSaturday);

            // Sadece seçilen ayın günlerini dahil et (Aylık program için)
            if (!isWeekend && (programType !== 'monthly' || current.getMonth() === selectedMonth)) {
                const holiday = isHoliday(current);
                allDays.push({
                    date: new Date(current),
                    isHoliday: holiday.isHoliday,
                    holidayName: holiday.name
                });
            }
            current.setDate(current.getDate() + 1);
        }

        // Tatil olmayan günleri çıkar (ziyaret planlaması için)
        const workDays = allDays.filter(d => !d.isHoliday);

        // Firmaları konuma göre grupla
        const locationGroups = new Map<string, SelectedCompany[]>();
        selectedCompanies.forEach(company => {
            const loc = extractLocation(company.address);
            if (!locationGroups.has(loc)) {
                locationGroups.set(loc, []);
            }
            locationGroups.get(loc)!.push(company);
        });

        // Schedule oluştur - Tüm günleri hazırla (tatiller dahil)
        const schedule: ScheduleDay[] = allDays.map(day => ({
            date: formatDateLocal(day.date),
            dayName: dayNames[day.date.getDay()],
            companies: [],
            isHoliday: day.isHoliday,
            holidayName: day.holidayName
        }));

        // Her firma için ziyaret günlerini hesapla (sadece çalışma günleri)
        const workDayIndices = allDays.map((d, i) => d.isHoliday ? -1 : i).filter(i => i !== -1);

        // Lokasyona göre gruplandırılmış firmaları işle
        const processedVisits: { scheduleIndex: number; visit: ScheduleVisit }[] = [];

        locationGroups.forEach((companiesInLoc) => {
            companiesInLoc.forEach(company => {
                const freq = FREQUENCY_OPTIONS.find(f => f.value === company.frequency);
                let visitCount = freq?.visits || 1;

                if (programType === 'weekly' && !company.frequency.startsWith('weekly_')) {
                    visitCount = Math.min(visitCount, workDayIndices.length);
                }

                // Eşit aralıklı dağılım
                const interval = workDayIndices.length / visitCount;
                for (let i = 0; i < visitCount; i++) {
                    const workDayIdx = Math.min(Math.round(i * interval + interval / 2 - 0.5), workDayIndices.length - 1);
                    const scheduleIdx = workDayIndices[workDayIdx];

                    processedVisits.push({
                        scheduleIndex: scheduleIdx,
                        visit: {
                            id: `${company.id}-${i}`,
                            companyId: company.id,
                            title: company.title,
                            address: company.address,
                            visitNumber: i + 1
                        }
                    });
                }
            });
        });

        // Ziyaretleri schedule'a "Akıllı" yerleştir (Lokasyon çakışmasını önle)
        processedVisits.forEach(pv => {
            const visitLoc = extractLocation(pv.visit.address);
            let startIdx = pv.scheduleIndex;
            let placed = false;

            // 1. TUR: En uygun günü bul (Limit dahilinde, Lokasyon uyumlu)
            for (let i = 0; i < schedule.length; i++) {
                const idx = (startIdx + i) % schedule.length;
                const day = schedule[idx];

                if (day.isHoliday) continue;

                // Kapasite kontrolü
                if (day.companies.length >= visitsPerDay) continue;

                // Gün boşsa
                if (day.companies.length === 0) {
                    day.companies.push(pv.visit);
                    placed = true;
                    break;
                }

                const firstCompanyLoc = extractLocation(day.companies[0].address);
                if (firstCompanyLoc === visitLoc) {
                    // Aynı lokasyon ve kapasite var
                    day.companies.push(pv.visit);
                    placed = true;
                    break;
                }
            }

            // 2. TUR: Kapasite dolu olsa bile aynı lokasyona öncelik ver
            if (!placed) {
                for (let i = 0; i < schedule.length; i++) {
                    const idx = (startIdx + i) % schedule.length;
                    const day = schedule[idx];

                    if (day.isHoliday) continue;

                    if (day.companies.length === 0) {
                        day.companies.push(pv.visit);
                        placed = true;
                        break;
                    }

                    const firstCompanyLoc = extractLocation(day.companies[0].address);
                    if (firstCompanyLoc === visitLoc) {
                        day.companies.push(pv.visit);
                        placed = true;
                        break;
                    }
                }
            }

            // 3. TUR: Mecburi yerleştirme (En müsait güne)
            if (!placed) {
                let minCount = Infinity;
                let minIdx = -1;

                for (let i = 0; i < schedule.length; i++) {
                    if (!schedule[i].isHoliday && schedule[i].companies.length < minCount) {
                        minCount = schedule[i].companies.length;
                        minIdx = i;
                    }
                }

                if (minIdx !== -1) {
                    schedule[minIdx].companies.push(pv.visit);
                } else {
                    schedule[pv.scheduleIndex].companies.push(pv.visit);
                }
            }
        });

        // Aynı günde aynı lokasyondan olan firmaları grupla, farklı lokasyonları ayır
        for (let i = 0; i < schedule.length; i++) {
            if (schedule[i].isHoliday) continue;

            const dayVisits = schedule[i].companies;
            if (dayVisits.length > visitsPerDay) {
                // Fazla ziyaretleri başka günlere taşı
                const locGroups = new Map<string, ScheduleVisit[]>();
                dayVisits.forEach(v => {
                    const loc = extractLocation(v.address);
                    if (!locGroups.has(loc)) locGroups.set(loc, []);
                    locGroups.get(loc)!.push(v);
                });

                // Her lokasyondan max visitsPerDay kadar al
                const kept: ScheduleVisit[] = [];
                const overflow: ScheduleVisit[] = [];

                locGroups.forEach(visits => {
                    visits.forEach((v, idx) => {
                        if (kept.length < visitsPerDay) {
                            kept.push(v);
                        } else {
                            overflow.push(v);
                        }
                    });
                });

                schedule[i].companies = kept;

                // Overflow'u diğer günlere dağıt
                overflow.forEach(v => {
                    let minDay = -1;
                    let minCount = Infinity;
                    for (let j = 0; j < schedule.length; j++) {
                        if (j !== i && !schedule[j].isHoliday && schedule[j].companies.length < minCount) {
                            minCount = schedule[j].companies.length;
                            minDay = j;
                        }
                    }
                    if (minDay !== -1) {
                        schedule[minDay].companies.push(v);
                    }
                });
            }
        }

        setGeneratedSchedule(schedule);

        const monthName = MONTHS[selectedMonth].label;
        const generatedProgramName = `${programType === 'monthly' ? monthName : selectedWeek + '. Hafta'} ${selectedYear} Programı`;
        setProgramName(generatedProgramName);

        // Modal'ı aç - geçici bir program nesnesi oluştur
        const tempProgram: SavedProgram = {
            id: 'temp-' + Date.now(), // Geçici ID
            name: generatedProgramName,
            type: programType,
            visitsPerDay: visitsPerDay,
            schedule: schedule,
            companies: selectedCompanies,
            startDate: schedule[0]?.date || new Date().toISOString(),
            endDate: schedule[schedule.length - 1]?.date || new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        setSelectedProgramForView(tempProgram);
    };

    // Programdan tekil ziyaret çıkar
    const removeVisitFromSchedule = (dayIndex: number, visitId: string) => {
        const newSchedule = [...generatedSchedule];
        newSchedule[dayIndex].companies = newSchedule[dayIndex].companies.filter(c => c.id !== visitId);
        setGeneratedSchedule(newSchedule);
    };

    // Program iptal - forma dön
    const cancelSchedule = () => {
        setShowSchedule(false);
        setGeneratedSchedule([]);
        setProgramName('');
    };

    // Drag & Drop handlers
    const handleDragStart = (dayIndex: number, visitIndex: number) => {
        setDraggedItem({ dayIndex, visitIndex });
    };

    const handleDragOver = (e: React.DragEvent, dayIndex: number) => {
        e.preventDefault();
        setDragOverDay(dayIndex);
    };

    const handleDragLeave = () => {
        setDragOverDay(null);
    };

    const handleDrop = (targetDayIndex: number) => {
        if (!draggedItem) return;

        const newSchedule = [...generatedSchedule];
        const draggedVisit = newSchedule[draggedItem.dayIndex].companies[draggedItem.visitIndex];

        // Kaynak günden çıkar
        newSchedule[draggedItem.dayIndex].companies.splice(draggedItem.visitIndex, 1);

        // Hedef güne ekle
        newSchedule[targetDayIndex].companies.push(draggedVisit);

        setGeneratedSchedule(newSchedule);
        setDraggedItem(null);
        setDragOverDay(null);
    };

    // Program kaydet
    const saveProgram = async () => {
        if (!programName.trim()) {
            showNotif('Lütfen program adı girin!', 'error');
            return;
        }

        setSaving(true);
        try {
            const programData = {
                name: programName,
                type: programType,
                visitsPerDay,
                schedule: generatedSchedule,
                companies: selectedCompanies,
                startDate: generatedSchedule[0]?.date,
                endDate: generatedSchedule[generatedSchedule.length - 1]?.date
            };

            const url = editingProgram
                ? `/api/visit-programs/${editingProgram.id}`
                : '/api/visit-programs';

            const res = await fetch(url, {
                method: editingProgram ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(programData)
            });

            if (res.ok) {
                showNotif(editingProgram ? 'Program güncellendi!' : 'Program kaydedildi!');
                queryClient.invalidateQueries({ queryKey: queryKeys.visitPrograms });
                resetForm();
            } else {
                showNotif('Kaydetme hatası!', 'error');
            }
        } catch (error) {
            showNotif('Sunucu hatası!', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Program sil
    const deleteProgram = async (id: string) => {
        if (!confirm('Bu programı silmek istediğinize emin misiniz?')) return;

        try {
            const res = await fetch(`/api/visit-programs/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showNotif('Program silindi!');
                queryClient.invalidateQueries({ queryKey: queryKeys.visitPrograms });
            } else {
                showNotif('Silme hatası!', 'error');
            }
        } catch (error) {
            showNotif('Sunucu hatası!', 'error');
        }
    };

    // Program düzenle
    const editProgram = (program: SavedProgram) => {
        setEditingProgram(program);
        setProgramName(program.name);
        setProgramType(program.type as 'monthly' | 'weekly');
        setVisitsPerDay(program.visitsPerDay);
        setSelectedCompanies(program.companies);
        setGeneratedSchedule(program.schedule);
        setShowSchedule(true);
    };

    // PDF generating state
    const [generatingPDF, setGeneratingPDF] = useState(false);

    // PDF oluşturma fonksiyonu
    const generateVisitProgramPDF = async (program: SavedProgram) => {
        setGeneratingPDF(true);

        try {
            // A4 yatay, sıkıştırılmış PDF
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 5;

            // Roboto font yükleme (Türkçe karakter desteği)
            const toBase64 = (buffer: ArrayBuffer) => {
                let binary = '';
                const bytes = new Uint8Array(buffer);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                return window.btoa(binary);
            };

            try {
                const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
                const fontUrlBold = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf';

                const [fontRes, fontBoldRes] = await Promise.all([
                    fetch(fontUrl),
                    fetch(fontUrlBold)
                ]);

                const fontBuffer = await fontRes.arrayBuffer();
                const fontBoldBuffer = await fontBoldRes.arrayBuffer();

                doc.addFileToVFS('Roboto-Regular.ttf', toBase64(fontBuffer));
                doc.addFileToVFS('Roboto-Bold.ttf', toBase64(fontBoldBuffer));

                doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
                doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

                doc.setFont('Roboto');
            } catch (error) {
                console.error("Font yüklenirken hata oluştu:", error);
            }

            // Arka plan beyaz
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');

            // Header - kompakt
            let yPos = margin;

            // Program adı (orta)
            doc.setFont('Roboto', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(program.name, pageWidth / 2, yPos + 5, { align: 'center' });

            // Tarih aralığı (sağ) - %20 küçük font
            const dateRange = `${new Date(program.startDate).toLocaleDateString('tr-TR')} - ${new Date(program.endDate).toLocaleDateString('tr-TR')}`;
            doc.setFont('Roboto', 'normal');
            doc.setFontSize(8); // 10'dan 8'e düşürüldü (%20 küçük)
            doc.text(dateRange, pageWidth - margin, yPos + 5, { align: 'right' });

            yPos += 10;

            // Hafta günlerini belirle
            const schedule = program.schedule;
            const hasSaturday = schedule.some(day => {
                const d = new Date(day.date);
                return d.getDay() === 6;
            });

            const dayHeaders = hasSaturday
                ? ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'C.tesi']
                : ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];

            const numCols = dayHeaders.length;
            const tableWidth = pageWidth - 2 * margin;
            const colWidth = tableWidth / numCols;

            // Günleri haftalara böl
            interface WeekDay {
                date: string;
                dayOfMonth: number;
                companies: string[];
                isHoliday: boolean;
                holidayName?: string;
            }

            const weeks: (WeekDay | null)[][] = [];
            let currentWeek: (WeekDay | null)[] = [];

            // İlk haftanın başına boş günler ekle
            if (schedule.length > 0) {
                const firstDayDate = new Date(schedule[0].date);
                const firstDayOfWeek = firstDayDate.getDay();
                const emptyDaysAtStart = firstDayOfWeek === 0 ? (hasSaturday ? 6 : 5) : firstDayOfWeek - 1;

                for (let i = 0; i < emptyDaysAtStart; i++) {
                    currentWeek.push(null);
                }
            }

            schedule.forEach((day) => {
                const date = new Date(day.date);
                const dayOfWeek = date.getDay();

                // Pazartesi ise yeni hafta başlat
                if (dayOfWeek === 1 && currentWeek.length > 0) {
                    // Haftayı doldur
                    while (currentWeek.length < numCols) {
                        currentWeek.push(null);
                    }
                    weeks.push(currentWeek);
                    currentWeek = [];
                }

                // Firma adının ilk 2 kelimesini al
                const getFirstTwoWords = (name: string) => {
                    const words = name.trim().split(/\s+/);
                    return words.slice(0, 2).join(' ');
                };

                currentWeek.push({
                    date: day.date,
                    dayOfMonth: date.getDate(),
                    companies: day.companies.map(c => getFirstTwoWords(c.title)),
                    isHoliday: day.isHoliday || false,
                    holidayName: day.holidayName
                });
            });

            // Son haftayı ekle
            if (currentWeek.length > 0) {
                while (currentWeek.length < numCols) {
                    currentWeek.push(null);
                }
                weeks.push(currentWeek);
            }

            // Tablo verilerini hazırla - Gün ve firmalar ayrı satırda
            const tableBody: any[][] = [];

            weeks.forEach((week) => {
                const row: any[] = [];
                week.forEach((day) => {
                    if (!day) {
                        row.push('');
                    } else {
                        // Gün numarası ve firmalar ayrı tutulacak
                        let cellContent = `${day.dayOfMonth}`;
                        if (day.isHoliday && day.holidayName) {
                            cellContent += `\n(${day.holidayName})`;
                        }
                        if (day.companies.length > 0) {
                            cellContent += '\n───\n' + day.companies.join('\n');
                        }
                        row.push(cellContent);
                    }
                });
                tableBody.push(row);
            });

            // Tablo yüksekliğini hesapla
            const availableHeight = pageHeight - yPos - margin;
            const rowHeight = Math.min(availableHeight / weeks.length, 30);

            // Satır aralığını ayarla - firmalar arası ~1mm boşluk
            doc.setLineHeightFactor(1.35);

            // jspdf-autotable ile tablo çiz
            autoTable(doc, {
                startY: yPos,
                head: [dayHeaders],
                body: tableBody,
                theme: 'grid',
                styles: {
                    font: 'Roboto',
                    fontSize: 9, // %25 büyütüldü (7 -> ~9)
                    cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
                    valign: 'middle', // Dikey ortala
                    halign: 'center',
                    textColor: [0, 0, 0],
                    lineColor: [150, 150, 150],
                    lineWidth: 0.2,
                    minCellHeight: rowHeight
                },
                headStyles: {
                    font: 'Roboto',
                    fillColor: [255, 255, 255], // Beyaz arka plan
                    textColor: [0, 0, 0], // Siyah yazı
                    fontStyle: 'bold',
                    fontSize: 9,
                    halign: 'center',
                    cellPadding: 2, // Kompakt başlık
                    minCellHeight: 8 // Sadece yazı kadar yükseklik
                },
                columnStyles: {
                    0: { cellWidth: colWidth },
                    1: { cellWidth: colWidth },
                    2: { cellWidth: colWidth },
                    3: { cellWidth: colWidth },
                    4: { cellWidth: colWidth },
                    5: { cellWidth: colWidth }
                },
                margin: { left: margin, right: margin },
                tableWidth: tableWidth,
                didParseCell: (data: any) => {
                    // Tatil günlerini kırmızı arka plan ile işaretle
                    if (data.section === 'body' && data.cell.raw) {
                        const cellText = String(data.cell.raw);
                        if (cellText.includes('Bayram') || cellText.includes('TATİL') || cellText.includes('MEŞGUL')) {
                            data.cell.styles.fillColor = [254, 226, 226]; // Açık kırmızı
                            data.cell.styles.textColor = [185, 28, 28]; // Koyu kırmızı
                        }
                    }
                },
                willDrawCell: (data: any) => {
                    // Gün numarasını gizle - didDrawCell'de kendimiz çizeceğiz
                    if (data.section === 'body' && data.cell.raw) {
                        const cellText = String(data.cell.raw);
                        const lines = cellText.split('\n');
                        if (lines.length > 0) {
                            // İlk satırı (gün numarasını) kaldır, sadece geri kalanı göster
                            const remainingLines = lines.slice(1).join('\n');
                            data.cell.text = remainingLines ? remainingLines.split('\n') : [''];
                        }
                    }
                },
                didDrawCell: (data: any) => {
                    // Gün numarasını kalın yap ve altına çizgi çiz
                    if (data.section === 'body' && data.cell.raw) {
                        const cellText = String(data.cell.raw);
                        const lines = cellText.split('\n');
                        if (lines.length > 0) {
                            const dayNumber = lines[0];
                            const x = data.cell.x + data.cell.width / 2;
                            const y = data.cell.y + 5;

                            // Gün numarasını kalın yaz
                            doc.setFont('Roboto', 'bold');
                            doc.setFontSize(10);
                            doc.setTextColor(0, 0, 0);
                            doc.text(dayNumber, x, y, { align: 'center' });

                            // Altına çizgi çiz (gün numarasının altına)
                            const textWidth = doc.getTextWidth(dayNumber);
                            doc.setDrawColor(100, 100, 100);
                            doc.setLineWidth(0.3);
                            doc.line(x - textWidth / 2 - 2, y + 1.5, x + textWidth / 2 + 2, y + 1.5);

                            // Font'u normal'e geri al
                            doc.setFont('Roboto', 'normal');
                        }
                    }
                }
            });

            // Dosya adını oluştur
            const sanitizeFilename = (name: string) => {
                return name
                    .replace(/İ/g, 'I').replace(/ı/g, 'i')
                    .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
                    .replace(/Ü/g, 'U').replace(/ü/g, 'u')
                    .replace(/Ş/g, 'S').replace(/ş/g, 's')
                    .replace(/Ö/g, 'O').replace(/ö/g, 'o')
                    .replace(/Ç/g, 'C').replace(/ç/g, 'c')
                    .replace(/[^a-zA-Z0-9 -]/g, '')
                    .trim();
            };

            doc.save(`${sanitizeFilename(program.name)} - Ziyaret Programi.pdf`);
            showNotif('PDF başarıyla indirildi!', 'success');

        } catch (error) {
            console.error('PDF oluşturma hatası:', error);
            showNotif('PDF oluşturulurken hata oluştu!', 'error');
        } finally {
            setGeneratingPDF(false);
        }
    };

    // Form sıfırla
    const resetForm = () => {
        setSelectedCompanies([]);
        setGeneratedSchedule([]);
        setProgramName('');
        setShowSchedule(false);
        setEditingProgram(null);
    };

    const allSelected = companies.length > 0 && selectedCompanies.length === companies.length;

    return (
        <div className={`p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ${isDark ? 'text-white' : ''}`}>
            {/* Notification */}
            {notification.show && (
                <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-2xl z-50 flex items-center ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                    {notification.type === 'error' ? <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> : <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />}
                    <span className="font-bold text-xs sm:text-sm">{notification.message}</span>
                </div>
            )}

            {/* Başlık */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
                <div>
                    <h1 className={`text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" />
                        <span className="hidden sm:inline">Firma Ziyaret Programı</span>
                        <span className="sm:hidden">Ziyaret Programı</span>
                    </h1>
                    <p className={`mt-1 text-sm sm:text-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Firmalarınız için ziyaret programı oluşturun</p>
                </div>
                {showSchedule && (
                    <button
                        onClick={cancelSchedule}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors self-start ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <X className="w-4 h-4" />
                        İptal
                    </button>
                )}
            </div>

            {!showSchedule ? (
                <>
                    {/* Kayıtlı Programlar - Üstte Göster */}
                    {savedPrograms.length > 0 && (
                        <div className={`rounded-2xl border p-4 mb-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <h2 className={`text-lg font-bold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                <Calendar className="w-5 h-5 text-indigo-500" />
                                Kayıtlı Programlarınız
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {savedPrograms.map((program) => (
                                    <div
                                        key={program.id}
                                        onClick={() => setSelectedProgramForView(program)}
                                        className={`rounded-xl border p-3 hover:shadow-lg transition-all cursor-pointer ${isDark ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{program.name}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${program.type === 'monthly' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                {program.type === 'monthly' ? 'Aylık' : 'Haftalık'}
                                            </span>
                                        </div>
                                        <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {new Date(program.startDate).toLocaleDateString('tr-TR')} - {new Date(program.endDate).toLocaleDateString('tr-TR')}
                                        </p>
                                        <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {program.companies.length} firma • {program.schedule.reduce((sum, day) => sum + day.companies.length, 0)} ziyaret
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Program Ayarları */}
                    <div className={`rounded-2xl border p-4 sm:p-6 mb-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <h2 className={`text-base sm:text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>Program Ayarları</h2>

                        {/* İlk Satır - Tip ve Dönem */}
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                            {/* Program Tipi */}
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Program Tipi</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setProgramType('monthly')}
                                        className={`flex-1 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${programType === 'monthly'
                                            ? 'bg-indigo-600 text-white shadow-lg'
                                            : isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        Aylık
                                    </button>
                                    <button
                                        onClick={() => setProgramType('weekly')}
                                        className={`flex-1 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${programType === 'weekly'
                                            ? 'bg-indigo-600 text-white shadow-lg'
                                            : isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        Haftalık
                                    </button>
                                </div>
                            </div>

                            {/* Yıl Seçimi */}
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Yıl</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'} border`}
                                >
                                    {[...Array(3)].map((_, i) => {
                                        const year = new Date().getFullYear() + i;
                                        return <option key={year} value={year}>{year}</option>;
                                    })}
                                </select>
                            </div>

                            {/* Ay veya Hafta Seçimi */}
                            {programType === 'monthly' ? (
                                <div>
                                    <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Ay</label>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                        className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'} border`}
                                    >
                                        {MONTHS.map(month => (
                                            <option key={month.value} value={month.value}>{month.label}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Hafta</label>
                                    <select
                                        value={selectedWeek}
                                        onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                                        className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'} border`}
                                    >
                                        {getWeekOptions().map(week => (
                                            <option key={week.value} value={week.value}>{week.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Cumartesi Dahil */}
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Cumartesi</label>
                                <label className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-colors ${isDark ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'} border`}>
                                    <input
                                        type="checkbox"
                                        checked={includeSaturday}
                                        onChange={(e) => setIncludeSaturday(e.target.checked)}
                                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Cumartesi dahil</span>
                                </label>
                            </div>
                        </div>

                        {/* İkinci Satır */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Günlük Ziyaret Sayısı */}
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Günlük Ziyaret Sayısı</label>
                                <select
                                    value={visitsPerDay}
                                    onChange={(e) => setVisitsPerDay(parseInt(e.target.value))}
                                    className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'} border`}
                                >
                                    {VISITS_PER_DAY_OPTIONS.map(n => (
                                        <option key={n} value={n}>{n} Firma</option>
                                    ))}
                                </select>
                            </div>

                            {/* Seçilen Firma Sayısı */}
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Seçilen Firmalar</label>
                                <div className="px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700 font-bold text-center">
                                    {selectedCompanies.length} Firma Seçildi
                                </div>
                            </div>

                            {/* Bilgi */}
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Bilgi</label>
                                <div className={`px-4 py-2.5 rounded-xl text-xs ${isDark ? 'bg-amber-900/30 border-amber-700 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'} border`}>
                                    💡 Sürükle-bırak ile program üzerinde değişiklik yapabilirsiniz
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Firma Listesi */}
                    <div className={`rounded-2xl border overflow-hidden mb-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                            <div>
                                <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                    <Building2 className="w-5 h-5 text-slate-500" />
                                    Firmalarınız
                                </h2>
                                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Programa eklemek istediğiniz firmaları seçin</p>
                            </div>
                            <button
                                onClick={selectAllCompanies}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${allSelected
                                    ? 'bg-indigo-600 text-white'
                                    : isDark ? 'bg-slate-600 text-slate-200 hover:bg-slate-500' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    }`}
                            >
                                <CheckSquare className="w-4 h-4" />
                                {allSelected ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                            </button>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center">
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                            </div>
                        ) : companies.length === 0 ? (
                            <div className={`p-12 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Henüz firma eklememişsiniz
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className={`border-b ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                        <tr>
                                            <th className="px-4 py-3 text-left w-12"></th>
                                            <th className={`px-4 py-3 text-left font-bold text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Firma</th>
                                            <th className={`px-4 py-3 text-left font-bold text-sm hidden lg:table-cell ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Adres</th>
                                            <th className={`px-4 py-3 text-center font-bold text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Tehlike</th>
                                            <th className={`px-4 py-3 text-left font-bold text-sm w-48 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Ziyaret Sıklığı</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {companies.map((company) => {
                                            const selected = selectedCompanies.find(c => c.id === company.id);
                                            return (
                                                <tr key={company.id} className={`border-b transition-colors ${isDark
                                                    ? `border-slate-700 hover:bg-slate-700 ${selected ? 'bg-indigo-900/30' : ''}`
                                                    : `border-slate-100 hover:bg-slate-50 ${selected ? 'bg-indigo-50' : ''}`
                                                    }`}>
                                                    <td className="px-3 py-1.5 text-sm">
                                                        <button
                                                            onClick={() => toggleCompany(company)}
                                                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selected
                                                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                                                : isDark ? 'border-slate-500 hover:border-indigo-400' : 'border-slate-300 hover:border-indigo-400'
                                                                }`}
                                                        >
                                                            {selected && <Check className="w-4 h-4" />}
                                                        </button>
                                                    </td>
                                                    <td className="px-3 py-1.5 text-sm">
                                                        <span className={`font-medium text-sm ${selected
                                                            ? isDark ? 'text-white' : 'text-slate-800'
                                                            : isDark ? 'text-slate-300' : 'text-slate-800'
                                                            }`}>{company.title}</span>
                                                    </td>
                                                    <td className={`px-4 py-3 hidden lg:table-cell ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        <div className="flex items-center gap-1 max-w-xs truncate text-sm">
                                                            <MapPin className="w-3 h-3 flex-shrink-0" />
                                                            <span className="truncate">{company.address || '-'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-1.5 text-sm text-center">
                                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${company.danger_class === 'az_tehlikeli' ? 'bg-emerald-100 text-emerald-700' :
                                                            company.danger_class === 'tehlikeli' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {DANGER_CLASS_LABELS[company.danger_class]}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-1.5 text-sm">
                                                        {selected ? (
                                                            <select
                                                                value={selected.frequency}
                                                                onChange={(e) => updateFrequency(company.id, e.target.value)}
                                                                className={`w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isDark ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-slate-200'} border`}
                                                            >
                                                                {FREQUENCY_OPTIONS.map(opt => (
                                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Önce firmayı seçin</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>



                </>
            ) : (
                /* Program Önizleme ve Düzenleme */
                <div>
                    {/* Program Adı */}
                    <div className={`rounded-2xl border p-6 mb-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Program Adı</label>
                        <input
                            type="text"
                            value={programName}
                            onChange={(e) => setProgramName(e.target.value)}
                            placeholder="Örn: Aralık 2024 Ziyaret Programı"
                            className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'border-slate-200'} border`}
                        />
                    </div>

                    {/* Program Çizelgesi - Sürükle Bırak */}
                    <div className={`rounded-2xl border overflow-hidden mb-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className="p-4 border-b bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                            <h2 className="text-lg font-bold">Ziyaret Programı</h2>
                            <p className="text-sm opacity-80 mt-1">
                                {generatedSchedule.length} gün, {generatedSchedule.reduce((acc, day) => acc + day.companies.length, 0)} ziyaret
                                <span className="ml-2">• Firmaları sürükleyerek günler arasında taşıyabilirsiniz</span>
                            </p>
                        </div>
                        {/* Hafta başlıkları */}
                        <div className={`grid grid-cols-5 gap-1 p-2 border-b ${isDark ? 'border-slate-700 bg-slate-700' : 'border-slate-200 bg-slate-100'}`}>
                            {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'].map(day => (
                                <div key={day} className={`text-center py-2 text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {day}
                                </div>
                            ))}
                            {includeSaturday && (
                                <div className={`text-center py-2 text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                    Cumartesi
                                </div>
                            )}
                        </div>

                        {/* Haftalık görünüm */}
                        <div className="p-2 max-h-[600px] overflow-y-auto">
                            {(() => {
                                // Ayın ilk gününün haftanın hangi günü olduğunu bul
                                const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
                                const firstDayOfWeek = firstDayOfMonth.getDay(); // 0=Pazar, 1=Pazartesi...

                                // İlk haftanın başına boş günler ekle
                                type DaySlot = ScheduleDay | { isEmpty: true; dayOfWeek: number };

                                // Haftalara böl
                                const weeks: DaySlot[][] = [];
                                let currentWeek: DaySlot[] = [];

                                // İlk haftanın başına boş günleri ekle (Pazartesi'den ayın 1'ine kadar)
                                // Pazartesi = 1, Salı = 2, Çarşamba = 3, Perşembe = 4, Cuma = 5, Cumartesi = 6
                                const emptyDaysAtStart = firstDayOfWeek === 0 ? 5 : firstDayOfWeek - 1; // Pazar ise 5 boş gün (Pazartesi-Cuma)

                                for (let i = 1; i <= emptyDaysAtStart; i++) {
                                    if (i <= 5 || (i === 6 && includeSaturday)) { // Sadece iş günleri
                                        currentWeek.push({ isEmpty: true, dayOfWeek: i });
                                    }
                                }

                                generatedSchedule.forEach((day) => {
                                    const date = new Date(day.date);
                                    const dayOfWeek = date.getDay();

                                    // Pazartesi ise yeni hafta başlat
                                    if (dayOfWeek === 1 && currentWeek.length > 0) {
                                        weeks.push(currentWeek);
                                        currentWeek = [];
                                    }

                                    currentWeek.push(day);
                                });

                                if (currentWeek.length > 0) {
                                    weeks.push(currentWeek);
                                }

                                // Tamamen boş haftaları gizle (Örn: Ayın 1'i Pazar ise ilk hafta boş olur)
                                const visibleWeeks = weeks.filter(week => week.some(day => !('isEmpty' in day)));

                                return visibleWeeks.map((week, weekIndex) => (
                                    <div key={weekIndex} className={`grid gap-1 mb-2 ${includeSaturday ? 'grid-cols-6' : 'grid-cols-5'}`}>
                                        {week.map((daySlot, dayInWeekIndex) => {
                                            // Boş gün kontrolü
                                            if ('isEmpty' in daySlot) {
                                                return (
                                                    <div
                                                        key={`empty-${weekIndex}-${dayInWeekIndex}`}
                                                        className={`border rounded-lg p-2 min-h-[120px] ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-100 border-gray-200'}`}
                                                    >
                                                        <div className={`flex items-center justify-center h-full ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
                                                            <span className="text-xs">—</span>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            const day = daySlot as ScheduleDay;
                                            const globalDayIndex = generatedSchedule.findIndex(d => d.date === day.date);

                                            return (
                                                <div
                                                    key={day.date}
                                                    className={`border rounded-lg p-2 min-h-[120px] transition-all ${day.isHoliday
                                                        ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                                                        : dragOverDay === globalDayIndex
                                                            ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300'
                                                            : isDark
                                                                ? 'border-slate-600 hover:border-slate-500 bg-slate-800'
                                                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                                        }`}
                                                    onDragOver={(e) => handleDragOver(e, globalDayIndex)}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={() => handleDrop(globalDayIndex)}
                                                >
                                                    {/* Gün başlığı */}
                                                    <div className={`flex items-center justify-between mb-2 pb-1 border-b ${day.isHoliday ? 'border-red-200' : isDark ? 'border-slate-600' : 'border-slate-100'}`}>
                                                        <div className="flex items-center gap-1">
                                                            <span className={`text-sm font-bold ${day.isHoliday ? 'text-red-600' : isDark ? 'text-white' : 'text-slate-800'}`}>
                                                                {new Date(day.date).getDate()}
                                                            </span>
                                                            {day.isHoliday && (
                                                                <span className="text-[10px] text-red-500 font-medium">TATİL</span>
                                                            )}
                                                        </div>
                                                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${day.isHoliday ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                            {day.companies.length}
                                                        </span>
                                                    </div>

                                                    {/* Tatil bilgisi */}
                                                    {day.isHoliday && day.holidayName && (
                                                        <div className="text-[10px] text-red-500 mb-1 font-medium truncate" title={day.holidayName}>
                                                            🎉 {day.holidayName}
                                                        </div>
                                                    )}

                                                    {/* Ziyaretler */}
                                                    <div className="space-y-1">
                                                        {day.companies.map((visit: ScheduleVisit, visitIndex: number) => (
                                                            <div
                                                                key={visit.id}
                                                                draggable
                                                                onDragStart={() => handleDragStart(globalDayIndex, visitIndex)}
                                                                className={`flex items-center justify-between rounded px-2 py-1 cursor-move transition-colors group text-[11px] ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-50 hover:bg-slate-100'}`}
                                                            >
                                                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                                                    <GripVertical className={`w-3 h-3 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                                                                    <span className={`truncate ${isDark ? 'text-white' : 'text-slate-700'}`} title={visit.title}>
                                                                        {visit.title}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    onClick={() => removeVisitFromSchedule(globalDayIndex, visit.id)}
                                                                    className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 ${isDark ? 'text-slate-400 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}

                                                        {day.companies.length === 0 && !day.isHoliday && (
                                                            <div className={`text-center py-2 text-[10px] border border-dashed rounded ${isDark ? 'text-slate-500 border-slate-600' : 'text-slate-400 border-slate-300'}`}>
                                                                Boş
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>

                    {/* Butonlar */}
                    <div className="flex gap-4">
                        <button
                            onClick={cancelSchedule}
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-bold rounded-xl transition-all ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            <X className="w-5 h-5" />
                            İptal
                        </button>
                        <button
                            onClick={saveProgram}
                            disabled={saving || !programName.trim()}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Kaydediliyor...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    {editingProgram ? 'Güncelle' : 'Kaydet'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {!showSchedule && (
                <div className={`fixed bottom-0 left-0 md:left-72 right-0 py-2 px-4 border-t z-30 flex items-center justify-between ${isDark ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'} backdrop-blur-sm transition-all shadow-[0_-2px_4px_rgba(0,0,0,0.05)]`}>
                    <div className="text-sm font-medium">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                            {selectedCompanies.length} firma seçildi
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowBusyDaysModal(true)}
                            className={`px-3 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${isDark ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}`}
                        >
                            <span>📅</span> <span className="hidden sm:inline">Meşgul Günler</span>
                        </button>
                        <button
                            onClick={generateSchedule}
                            disabled={selectedCompanies.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                        >
                            <Calendar className="w-5 h-5" />
                            Program Oluştur
                        </button>
                    </div>
                </div>
            )}

            {showBusyDaysModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                            <div className="flex items-center gap-2">
                                <span className="text-xl">📅</span>
                                <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>Meşgul Günleri Seçin</h3>
                            </div>
                            <button onClick={() => setShowBusyDaysModal(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Takvimde kırmızı ile işaretlemek istediğiniz günleri seçin.
                            </p>

                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {['Pts', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
                                    <div key={d} className={`text-center py-2 text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {(() => {
                                    const days = [];
                                    const year = selectedYear;
                                    const month = programType === 'monthly' ? selectedMonth : 0;

                                    const date = new Date(year, month, 1);
                                    let firstDay = date.getDay();
                                    if (firstDay === 0) firstDay = 7;

                                    for (let i = 1; i < firstDay; i++) {
                                        days.push(<div key={`empty-${i}`} />);
                                    }

                                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                                    for (let i = 1; i <= daysInMonth; i++) {
                                        const d = new Date(year, month, i);
                                        const dStr = formatDateLocal(d);
                                        const isBusy = busyDays.includes(dStr);

                                        days.push(
                                            <button
                                                key={dStr}
                                                onClick={() => toggleBusyDay(dStr)}
                                                className={`aspect-square flex items-center justify-center font-bold text-sm rounded-lg transition-all ${isBusy
                                                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-md transform scale-105'
                                                    : isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {i}
                                            </button>
                                        );
                                    }
                                    return days;
                                })()}
                            </div>
                        </div>
                        <div className={`p-4 border-t flex justify-end ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                            <button
                                onClick={() => setShowBusyDaysModal(false)}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm"
                            >
                                Tamam
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Program Görüntüleme ve Düzenleme Modal */}
            {selectedProgramForView && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className={`w-full max-w-6xl max-h-[98vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                        {/* Modal Header */}
                        <div className={`p-4 border-b flex items-center justify-between flex-shrink-0 ${isDark ? 'border-slate-700 bg-gradient-to-r from-indigo-600 to-purple-600' : 'border-slate-100 bg-gradient-to-r from-indigo-500 to-purple-500'}`}>
                            <div className="flex items-center gap-3 flex-1">
                                <Calendar className="w-6 h-6 text-white flex-shrink-0" />
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={selectedProgramForView.name}
                                        onChange={(e) => setSelectedProgramForView({
                                            ...selectedProgramForView,
                                            name: e.target.value
                                        })}
                                        className="font-bold text-lg text-white bg-white/20 rounded-lg px-3 py-1 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/50"
                                        placeholder="Program Adı"
                                    />
                                    <p className="text-xs text-white/80 mt-1">
                                        {new Date(selectedProgramForView.startDate).toLocaleDateString('tr-TR')} - {new Date(selectedProgramForView.endDate).toLocaleDateString('tr-TR')}
                                        <span className="ml-2 opacity-70">• Firmaları sürükleyerek günler arasında taşıyabilirsiniz</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedProgramForView(null)}
                                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors flex-shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Program Info Bar */}
                        <div className={`px-4 py-1.5 border-b flex items-center gap-3 flex-shrink-0 ${isDark ? 'border-slate-700 bg-slate-700/50' : 'border-slate-100 bg-slate-50'}`}>
                            <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                <Building2 className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">{selectedProgramForView.companies.length} Firma</span>
                            </div>
                            <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                <Check className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">{selectedProgramForView.schedule.reduce((sum, day) => sum + day.companies.length, 0)} Ziyaret</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${selectedProgramForView.type === 'monthly' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                {selectedProgramForView.type === 'monthly' ? 'Aylık' : 'Haftalık'}
                            </span>
                            <div className={`ml-auto text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                <GripVertical className="w-3 h-3 inline mr-1" />
                                Sürükle-bırak aktif
                            </div>
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {/* Hafta başlıkları - Cumartesi kontrolü */}
                            {(() => {
                                const hasSaturday = selectedProgramForView.schedule.some(day => {
                                    const d = new Date(day.date);
                                    return d.getDay() === 6;
                                });
                                const dayNames = hasSaturday
                                    ? ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'C.tesi']
                                    : ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
                                return (
                                    <div className={`grid ${hasSaturday ? 'grid-cols-6' : 'grid-cols-5'} gap-1 mb-1 sticky top-0 z-10 px-1 py-0.5 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                        {dayNames.map(day => (
                                            <div key={day} className={`text-center py-1 text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}

                            {/* Takvim - Sürükle Bırak Destekli */}
                            {(() => {
                                const schedule = selectedProgramForView.schedule;
                                if (!schedule || schedule.length === 0) {
                                    return (
                                        <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Bu program için ziyaret planı bulunamadı.
                                        </div>
                                    );
                                }

                                // Cumartesi kontrolü
                                const hasSaturday = schedule.some(day => {
                                    const d = new Date(day.date);
                                    return d.getDay() === 6;
                                });
                                const numCols = hasSaturday ? 6 : 5;

                                // Modal için drag handler fonksiyonları
                                const handleModalDragStart = (dayIndex: number, visitIndex: number, e: React.DragEvent) => {
                                    e.dataTransfer.setData('text/plain', JSON.stringify({ dayIndex, visitIndex }));
                                    e.dataTransfer.effectAllowed = 'move';
                                };

                                const handleModalDrop = (targetDayIndex: number, e: React.DragEvent) => {
                                    e.preventDefault();
                                    const data = e.dataTransfer.getData('text/plain');
                                    if (!data) return;

                                    try {
                                        const { dayIndex: sourceDayIndex, visitIndex } = JSON.parse(data);
                                        if (sourceDayIndex === targetDayIndex) return;

                                        const newSchedule = [...selectedProgramForView.schedule];
                                        const draggedVisit = newSchedule[sourceDayIndex].companies[visitIndex];

                                        // Kaynak günden çıkar
                                        newSchedule[sourceDayIndex] = {
                                            ...newSchedule[sourceDayIndex],
                                            companies: newSchedule[sourceDayIndex].companies.filter((_, i) => i !== visitIndex)
                                        };

                                        // Hedef güne ekle
                                        newSchedule[targetDayIndex] = {
                                            ...newSchedule[targetDayIndex],
                                            companies: [...newSchedule[targetDayIndex].companies, draggedVisit]
                                        };

                                        setSelectedProgramForView({
                                            ...selectedProgramForView,
                                            schedule: newSchedule
                                        });
                                    } catch (err) {
                                        console.error('Drop error:', err);
                                    }
                                };

                                const handleModalRemoveVisit = (dayIndex: number, visitId: string) => {
                                    const newSchedule = [...selectedProgramForView.schedule];
                                    newSchedule[dayIndex] = {
                                        ...newSchedule[dayIndex],
                                        companies: newSchedule[dayIndex].companies.filter(v => v.id !== visitId)
                                    };
                                    setSelectedProgramForView({
                                        ...selectedProgramForView,
                                        schedule: newSchedule
                                    });
                                };

                                // Günleri haftalara böl
                                const firstDayDate = new Date(schedule[0].date);
                                const firstDayOfWeek = firstDayDate.getDay();
                                const emptyDaysAtStart = firstDayOfWeek === 0 ? (hasSaturday ? 6 : 5) : firstDayOfWeek - 1;

                                type ViewDaySlot = { day: ScheduleDay; globalIndex: number } | { isEmpty: true };
                                const weeks: ViewDaySlot[][] = [];
                                let currentWeek: ViewDaySlot[] = [];

                                for (let i = 0; i < emptyDaysAtStart; i++) {
                                    currentWeek.push({ isEmpty: true });
                                }

                                schedule.forEach((day, index) => {
                                    const date = new Date(day.date);
                                    const dayOfWeek = date.getDay();

                                    if (dayOfWeek === 1 && currentWeek.length > 0) {
                                        weeks.push(currentWeek);
                                        currentWeek = [];
                                    }

                                    currentWeek.push({ day, globalIndex: index });
                                });

                                if (currentWeek.length > 0) {
                                    weeks.push(currentWeek);
                                }

                                const visibleWeeks = weeks.filter(week => week.some(d => !('isEmpty' in d)));

                                return visibleWeeks.map((week, weekIndex) => (
                                    <div key={weekIndex} className={`grid ${hasSaturday ? 'grid-cols-6' : 'grid-cols-5'} gap-1 mb-2`}>
                                        {week.map((daySlot, dayInWeekIndex) => {
                                            if ('isEmpty' in daySlot) {
                                                return (
                                                    <div
                                                        key={`empty-${weekIndex}-${dayInWeekIndex}`}
                                                        className={`border rounded-lg p-2 min-h-[100px] ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-100 border-gray-200'}`}
                                                    >
                                                        <div className={`flex items-center justify-center h-full ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
                                                            <span className="text-xs">—</span>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            const { day, globalIndex } = daySlot;

                                            return (
                                                <div
                                                    key={day.date}
                                                    className={`border rounded-lg p-2 min-h-[100px] transition-all ${day.isHoliday
                                                        ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                                                        : isDark
                                                            ? 'border-slate-600 bg-slate-800 hover:border-indigo-500'
                                                            : 'border-slate-200 bg-white hover:border-indigo-400'
                                                        }`}
                                                    onDragOver={(e) => {
                                                        e.preventDefault();
                                                        e.currentTarget.classList.add('ring-2', 'ring-indigo-400');
                                                    }}
                                                    onDragLeave={(e) => {
                                                        e.currentTarget.classList.remove('ring-2', 'ring-indigo-400');
                                                    }}
                                                    onDrop={(e) => {
                                                        e.currentTarget.classList.remove('ring-2', 'ring-indigo-400');
                                                        handleModalDrop(globalIndex, e);
                                                    }}
                                                >
                                                    <div className={`flex items-center justify-between mb-1.5 pb-1 border-b ${day.isHoliday ? 'border-red-200' : isDark ? 'border-slate-600' : 'border-slate-100'}`}>
                                                        <span className={`text-sm font-bold ${day.isHoliday ? 'text-red-600' : isDark ? 'text-white' : 'text-slate-800'}`}>
                                                            {new Date(day.date).getDate()}
                                                        </span>
                                                        {day.companies.length > 0 && (
                                                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${day.isHoliday ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                                {day.companies.length}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {day.isHoliday && day.holidayName && (
                                                        <div className="text-[9px] text-red-500 mb-1 font-medium truncate" title={day.holidayName}>
                                                            🎉 {day.holidayName}
                                                        </div>
                                                    )}

                                                    <div className="space-y-0.5">
                                                        {day.companies.map((visit, visitIndex) => (
                                                            <div
                                                                key={visit.id}
                                                                draggable
                                                                onDragStart={(e) => handleModalDragStart(globalIndex, visitIndex, e)}
                                                                className={`text-[10px] truncate px-1.5 py-0.5 rounded cursor-move flex items-center justify-between group ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                                                title={visit.title}
                                                            >
                                                                <div className="flex items-center gap-1 min-w-0">
                                                                    <GripVertical className={`w-2.5 h-2.5 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                                                                    <span className="truncate">{visit.title}</span>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleModalRemoveVisit(globalIndex, visit.id);
                                                                    }}
                                                                    className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 ${isDark ? 'text-slate-400 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}
                                                                >
                                                                    <X className="w-2.5 h-2.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {day.companies.length === 0 && !day.isHoliday && (
                                                            <div className={`text-center py-2 text-[9px] border border-dashed rounded ${isDark ? 'text-slate-600 border-slate-600' : 'text-slate-400 border-slate-300'}`}>
                                                                Buraya bırakın
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ));
                            })()}
                        </div>

                        {/* Modal Footer */}
                        <div className={`px-4 py-2 border-t flex justify-between gap-2 flex-shrink-0 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                            {/* Sil butonu sadece kayıtlı programlar için */}
                            {!selectedProgramForView.id.startsWith('temp-') ? (
                                <button
                                    onClick={() => {
                                        deleteProgram(selectedProgramForView.id);
                                        setSelectedProgramForView(null);
                                    }}
                                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-xs"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Sil
                                </button>
                            ) : (
                                <div /> // Boşluk için
                            )}
                            <div className="flex gap-2 flex-1 justify-end">
                                <button
                                    onClick={() => setSelectedProgramForView(null)}
                                    className={`px-4 py-1.5 rounded-lg font-medium text-xs transition-colors ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={() => generateVisitProgramPDF(selectedProgramForView)}
                                    disabled={generatingPDF}
                                    className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-xs disabled:opacity-50"
                                >
                                    {generatingPDF ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Hazırlanıyor...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4" />
                                            PDF İndir
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={async () => {
                                        setSaving(true);
                                        try {
                                            const isNewProgram = selectedProgramForView.id.startsWith('temp-');
                                            const url = isNewProgram
                                                ? '/api/visit-programs'
                                                : `/api/visit-programs/${selectedProgramForView.id}`;
                                            const method = isNewProgram ? 'POST' : 'PUT';

                                            const res = await fetch(url, {
                                                method: method,
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    name: selectedProgramForView.name,
                                                    type: selectedProgramForView.type,
                                                    visitsPerDay: selectedProgramForView.visitsPerDay,
                                                    schedule: selectedProgramForView.schedule,
                                                    companies: selectedProgramForView.companies,
                                                    startDate: selectedProgramForView.startDate,
                                                    endDate: selectedProgramForView.endDate
                                                })
                                            });
                                            if (res.ok) {
                                                showNotif(isNewProgram ? 'Program kaydedildi!' : 'Program güncellendi!');
                                                queryClient.invalidateQueries({ queryKey: queryKeys.visitPrograms });
                                                setSelectedProgramForView(null);
                                            } else {
                                                showNotif('Kaydetme hatası!', 'error');
                                            }
                                        } catch (error) {
                                            showNotif('Sunucu hatası!', 'error');
                                        } finally {
                                            setSaving(false);
                                        }
                                    }}
                                    disabled={saving || !selectedProgramForView.name.trim()}
                                    className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md shadow-green-600/25 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Kaydediliyor...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            {selectedProgramForView.id.startsWith('temp-') ? 'Kaydet' : 'Güncelle'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
