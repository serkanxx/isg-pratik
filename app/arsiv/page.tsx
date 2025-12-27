"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/app/context/ThemeContext';
import {
    Search, Download, AlertCircle, X, FileText, FolderOpen,
    Filter, CheckCircle, Loader2, File, FileSpreadsheet,
    FileImage, FileVideo, FileCode, ExternalLink, Info,
    ChevronRight, BarChart3, Clock, Database, ChevronLeft,
    ListChecks, Shield, FileCheck, ClipboardList, BookOpen,
    Presentation, FileCode2, StickyNote, MoreHorizontal, Scale, ScrollText
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface ArchiveFile {
    fileName: string;
    link: string;
    category: string;
    size: number;
}

// Türkçe karakter düzeltme fonksiyonu
function fixTurkishCharacters(fileName: string): string {
    // Dosya uzantısını ayır
    const parts = fileName.split('.');
    const extension = parts.length > 1 ? '.' + parts.pop() : '';
    let name = parts.join('.');

    // Büyük/küçük harf durumunu korumak için helper fonksiyon
    const preserveCase = (original: string, replacement: string): string => {
        if (original === original.toUpperCase()) {
            return replacement.toUpperCase();
        } else if (original[0] === original[0].toUpperCase()) {
            return replacement.charAt(0).toUpperCase() + replacement.slice(1);
        }
        return replacement;
    };

    // Yaygın Türkçe kelime düzeltmeleri (kapsamlı liste)
    const replacements: Array<[RegExp, string]> = [
        // Çıkış ile ilgili
        [/\bcikis\b/gi, 'çıkış'],
        [/\bcikisi\b/gi, 'çıkışı'],
        [/\bcikislari\b/gi, 'çıkışları'],
        [/\bcikislar\b/gi, 'çıkışlar'],
        // Kılavuz ile ilgili
        [/\bkilavuz\b/gi, 'kılavuz'],
        [/\bkilavuzu\b/gi, 'kılavuzu'],
        [/\bkilavuzlari\b/gi, 'kılavuzları'],
        [/\bkilavuzlar\b/gi, 'kılavuzlar'],
        // Aydınlatma ile ilgili
        [/\baydinlatma\b/gi, 'aydınlatma'],
        [/\baydinlatmasi\b/gi, 'aydınlatması'],
        [/\baydinlatmalari\b/gi, 'aydınlatmaları'],
        [/\baydinlatmalar\b/gi, 'aydınlatmalar'],
        // Değerlendirme ile ilgili
        [/\bdegerlendirme\b/gi, 'değerlendirme'],
        [/\bdegerlendirmesi\b/gi, 'değerlendirmesi'],
        [/\bdegerlendirmeleri\b/gi, 'değerlendirmeleri'],
        [/\bdegerlendirmeler\b/gi, 'değerlendirmeler'],
        // Prosedür ile ilgili
        [/\bprosedur\b/gi, 'prosedür'],
        [/\bproseduru\b/gi, 'prosedürü'],
        [/\bprosedurleri\b/gi, 'prosedürleri'],
        [/\bprosedurler\b/gi, 'prosedürler'],
        // Bülten ile ilgili
        [/\bbulten\b/gi, 'bülten'],
        [/\bbulteni\b/gi, 'bülteni'],
        [/\bbultenleri\b/gi, 'bültenleri'],
        [/\bbultenler\b/gi, 'bültenler'],
        // Çeklist ile ilgili
        [/\bceklist\b/gi, 'çeklist'],
        [/\bceklisti\b/gi, 'çeklisti'],
        [/\bceklistleri\b/gi, 'çeklistleri'],
        [/\bceklistler\b/gi, 'çeklistler'],
        // Talimat ile ilgili
        [/\btalimati\b/gi, 'talimatı'],
        [/\btalimatlari\b/gi, 'talimatları'],
        [/\btalimatlar\b/gi, 'talimatlar'],
        // Form ile ilgili
        [/\bformu\b/gi, 'formu'],
        [/\bformlari\b/gi, 'formları'],
        [/\bformlar\b/gi, 'formlar'],
        // Rapor ile ilgili
        [/\braporu\b/gi, 'raporu'],
        [/\braporlari\b/gi, 'raporları'],
        [/\braporlar\b/gi, 'raporlar'],
        // Analiz ile ilgili
        [/\banalizi\b/gi, 'analizi'],
        [/\banalizleri\b/gi, 'analizleri'],
        [/\banalizler\b/gi, 'analizler'],
        // Rehber ile ilgili
        [/\brehberi\b/gi, 'rehberi'],
        [/\brehberleri\b/gi, 'rehberleri'],
        [/\brehberler\b/gi, 'rehberler'],
        // Not ile ilgili
        [/\bnotlari\b/gi, 'notları'],
        [/\bnotlar\b/gi, 'notlar'],
        // Soru ile ilgili
        [/\bsorulari\b/gi, 'soruları'],
        [/\bsorular\b/gi, 'sorular'],
        // Plan ile ilgili
        [/\bplani\b/gi, 'planı'],
        [/\bplanlari\b/gi, 'planları'],
        [/\bplanlar\b/gi, 'planlar'],
        // Diğer yaygın kelimeler
        [/\bgunluk\b/gi, 'günlük'],
        [/\bgunlugu\b/gi, 'günlüğü'],
        [/\bgunlukleri\b/gi, 'günlükleri'],
        [/\bgunlukler\b/gi, 'günlükler'],
        [/\bgun\b/gi, 'gün'],
        [/\bgunu\b/gi, 'günü'],
        [/\bgunleri\b/gi, 'günleri'],
        [/\bgunler\b/gi, 'günler'],
        [/\bgunes\b/gi, 'güneş'],
        [/\bgunesi\b/gi, 'güneşi'],
        [/\bgunesleri\b/gi, 'güneşleri'],
        [/\bgunesler\b/gi, 'güneşler'],
        [/\bguvenlik\b/gi, 'güvenlik'],
        [/\bguvenligi\b/gi, 'güvenliği'],
        [/\bguvenlikleri\b/gi, 'güvenlikleri'],
        [/\bguvenlikler\b/gi, 'güvenlikler'],
        [/\bguvenli\b/gi, 'güvenli'],
        [/\bguvenlisi\b/gi, 'güvenlisi'],
        [/\bguvenlileri\b/gi, 'güvenlileri'],
        [/\bguvenliler\b/gi, 'güvenliler'],
        [/\bkurulum\b/gi, 'kurulum'],
        [/\bkurulumu\b/gi, 'kurulumu'],
        [/\bkurulumlari\b/gi, 'kurulumları'],
        [/\bkurulumlar\b/gi, 'kurulumlar'],
        [/\bkullanim\b/gi, 'kullanım'],
        [/\bkullanimi\b/gi, 'kullanımı'],
        [/\bkullanimlari\b/gi, 'kullanımları'],
        [/\bkullanimlar\b/gi, 'kullanımlar'],
        [/\bkullanim\b/gi, 'kullanım'],
        [/\bkullanici\b/gi, 'kullanıcı'],
        [/\bkullanicisi\b/gi, 'kullanıcısı'],
        [/\bkullanicilari\b/gi, 'kullanıcıları'],
        [/\bkullanicilar\b/gi, 'kullanıcılar'],
        [/\bkosullari\b/gi, 'koşulları'],
        [/\bkosullar\b/gi, 'koşullar'],
        [/\bkosul\b/gi, 'koşul'],
        [/\bkosulu\b/gi, 'koşulu'],
        [/\bsozlesme\b/gi, 'sözleşme'],
        [/\bsozlesmesi\b/gi, 'sözleşmesi'],
        [/\bsozlesmeleri\b/gi, 'sözleşmeleri'],
        [/\bsozlesmeler\b/gi, 'sözleşmeler'],
        [/\bsozlesme\b/gi, 'sözleşme'],
        [/\bsozlesmesi\b/gi, 'sözleşmesi'],
        [/\bsozlesmeleri\b/gi, 'sözleşmeleri'],
        [/\bsozlesmeler\b/gi, 'sözleşmeler'],
        // Tebliğ ile ilgili
        [/\bteblig\b/gi, 'tebliğ'],
        [/\btebligi\b/gi, 'tebliği'],
        [/\btebligleri\b/gi, 'tebliğleri'],
        [/\btebligler\b/gi, 'tebliğler'],
    ];

    // Tüm düzeltmeleri uygula
    replacements.forEach(([regex, replacement]) => {
        name = name.replace(regex, (match) => preserveCase(match, replacement));
    });

    return name + extension;
}

// Türkçe karakterleri İngilizce karakterlere çevir (arama için)
function turkishToEnglish(text: string): string {
    const turkishChars: { [key: string]: string } = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G',
        'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U'
    };

    return text.split('').map(char => turkishChars[char] || char).join('');
}

// Kategori belirleme fonksiyonu - R2 deposundaki dosyalara göre optimize edilmiş
function getCategory(fileName: string): string {
    const name = fileName.toLowerCase();

    // Yönetmelikler - Öncelikli kontrol (Kanunlar'dan önce)
    if (name.includes('yönetmelik') || name.includes('yonetmelik') || name.includes('yönetmeli')) {
        return 'Yönetmelikler';
    }

    // Kanunlar ve Tebliğler
    if (name.includes('kanun') || name.includes('tebliğ') || name.includes('teblig') ||
        name.includes('yönerge') || name.includes('yonerge') ||
        name.includes('genelge') || name.includes('tüzük') || name.includes('tuzuk')) {
        return 'Kanunlar';
    }

    // Kontrol Listeleri
    if (name.includes('kontrol listesi') || name.includes('çeklist') || name.includes('checklist') ||
        name.includes('kontrol listesi') || name.includes('kontrol listeleri') ||
        name.includes('denetim listesi') || name.includes('kontrol formu')) {
        return 'Kontrol Listeleri';
    }

    // Risk Değerlendirmeleri
    if (name.includes('risk değerlendirme') || name.includes('risk analiz') || name.includes('risk analizi') ||
        name.includes('risk degerlendirme') || name.includes('risk analizi') ||
        name.includes('risk tespit') || name.includes('risk belirleme') ||
        name.includes('risk haritası') || name.includes('risk haritasi')) {
        return 'Risk Değerlendirmeleri';
    }

    // Talimatlar
    if (name.includes('talimat') || name.includes('talimatı') || name.includes('talimati') ||
        name.includes('iş talimatı') || name.includes('is talimati') ||
        name.includes('çalışma talimatı') || name.includes('calisma talimati') ||
        name.includes('güvenlik talimatı') || name.includes('guvenlik talimati')) {
        return 'Talimatlar';
    }

    // Formlar
    if (name.includes('form') || name.includes('formu') ||
        name.includes('başvuru formu') || name.includes('basvuru formu') ||
        name.includes('kayıt formu') || name.includes('kayit formu') ||
        name.includes('bildirim formu') || name.includes('onay formu')) {
        return 'Formlar';
    }

    // Rehberler
    if (name.includes('rehber') || name.includes('rehberi') ||
        name.includes('kılavuz') || name.includes('kilavuz') ||
        name.includes('el kitabı') || name.includes('el kitabi') ||
        name.includes('uygulama rehberi') || name.includes('uygulama kilavuzu')) {
        return 'Rehberler';
    }

    // Sunumlar
    if (name.includes('sunum') || name.includes('presentation') ||
        name.includes('slayt') || name.includes('powerpoint') ||
        name.includes('ppt') || name.includes('pptx')) {
        return 'Sunumlar';
    }

    // Toolbox Eğitimleri
    if (name.includes('toolbox')) {
        return 'Toolbox Eğitimleri';
    }

    // Notlar
    if (name.includes('not') || name.includes('notları') || name.includes('notlari') ||
        name.includes('notlar') || name.includes('not defteri') ||
        name.includes('toplantı notu') || name.includes('toplanti notu') ||
        name.includes('eğitim notu') || name.includes('egitim notu')) {
        return 'Notlar';
    }

    return 'Diğerleri';
}

// Dosya uzantısına göre ikon ve renk belirleme
function getFileStyle(fileName: string) {
    const ext = fileName.toLowerCase().split('.').pop();

    switch (ext) {
        case 'pdf':
            return { icon: FileText, color: 'text-red-500', bg: 'bg-red-50', darkBg: 'dark:bg-red-900/20' };
        case 'doc':
        case 'docx':
            return { icon: File, color: 'text-blue-600', bg: 'bg-blue-50', darkBg: 'dark:bg-blue-900/20' };
        case 'xls':
        case 'xlsx':
            return { icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-900/20' };
        case 'ppt':
        case 'pptx':
            return { icon: FileVideo, color: 'text-orange-600', bg: 'bg-orange-50', darkBg: 'dark:bg-orange-900/20' };
        case 'zip':
        case 'rar':
            return { icon: Database, color: 'text-amber-600', bg: 'bg-amber-50', darkBg: 'dark:bg-amber-900/20' };
        default:
            return { icon: File, color: 'text-slate-500', bg: 'bg-slate-50', darkBg: 'dark:bg-slate-900/20' };
    }
}

// İndirme linkini oluştur (SSL sorunlarını önlemek için proxy kullan)
function getDownloadLink(link: string, fileName: string): string {
    const encodedUrl = encodeURIComponent(link);
    const encodedName = encodeURIComponent(fileName);
    return `/api/archive/download?url=${encodedUrl}&name=${encodedName}`;
}

// Format gruplarını tanımla
const formatGroups: { [key: string]: { label: string; extensions: string[]; icon: any; color: string } } = {
    'word': { label: 'Word', extensions: ['doc', 'docx'], icon: File, color: 'text-blue-600' },
    'pdf': { label: 'PDF', extensions: ['pdf'], icon: FileText, color: 'text-red-600' },
    'powerpoint': { label: 'PowerPoint', extensions: ['ppt', 'pptx'], icon: Presentation, color: 'text-orange-600' },
    'excel': { label: 'Excel', extensions: ['xls', 'xlsx'], icon: FileSpreadsheet, color: 'text-emerald-600' },
};

// Dosya boyutunu formatla (bytes'ı okunabilir formata çevir)
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export default function ArsivPage() {
    const { data: session } = useSession();
    const { isDark } = useTheme();
    const [archiveFiles, setArchiveFiles] = useState<ArchiveFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
    const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<ArchiveFile | null>(null);
    const [errorDescription, setErrorDescription] = useState('');
    const [submittingError, setSubmittingError] = useState(false);
    const [errorNotification, setErrorNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
    const { requireAuth } = useRequireAuth();

    const FILES_PER_PAGE = 100;

    // Dosya indirme işlemi - giriş kontrolü ile
    const handleDownload = (downloadLink: string) => {
        if (!requireAuth()) return;
        window.location.href = downloadLink;
    };

    // R2 bucket'tan dosyaları yükle
    useEffect(() => {
        const loadArchiveFiles = async () => {
            try {
                const response = await fetch('/api/archive/list');
                const data = await response.json();

                if (response.ok && data.files) {
                    const files: ArchiveFile[] = data.files.map((file: any) => {
                        const fixedFileName = fixTurkishCharacters(file.fileName);
                        // Dosya boyutunu %25 küçült (size * 0.75)
                        const reducedSize = Math.round((file.size || 0) * 0.75);
                        return {
                            fileName: fixedFileName, // Düzeltilmiş isim gösteriliyor
                            link: file.link, // Orijinal link korunuyor
                            category: getCategory(fixedFileName),
                            size: reducedSize // %25 küçültülmüş boyut
                        };
                    });
                    setArchiveFiles(files);
                } else {
                    console.error('Dosya listesi alınamadı:', data.error);
                    setArchiveFiles([]);
                }
            } catch (error) {
                console.error('Arşiv dosyaları yüklenemedi:', error);
                setArchiveFiles([]);
            } finally {
                setLoading(false);
            }
        };

        loadArchiveFiles();
    }, []);

    // Kategorileri hesapla - Belirli bir sıraya göre ve Diğerleri'ni en sona al
    const categories = useMemo(() => {
        const cats = Array.from(new Set(archiveFiles.map(f => f.category)));

        // Öncelikli sıralama
        const priorityOrder = ['Talimatlar', 'Toolbox Eğitimleri', 'Yönetmelikler', 'Risk Değerlendirmeleri'];

        const sortedCats = cats.sort((a, b) => {
            // "Diğerleri" her zaman en sonda olmalı
            if (a === 'Diğerleri') return 1;
            if (b === 'Diğerleri') return -1;

            // Öncelikli listedekileri kontrol et
            const indexA = priorityOrder.indexOf(a);
            const indexB = priorityOrder.indexOf(b);

            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;

            // Diğerlerini alfabetik sırala
            return a.localeCompare(b, 'tr');
        });

        return ['Tümü', ...sortedCats];
    }, [archiveFiles]);

    // Dosya formatlarını çıkar ve grupla
    const availableFormats = useMemo(() => {
        const allExtensions = new Set<string>();
        archiveFiles.forEach(file => {
            const ext = file.fileName.toLowerCase().split('.').pop();
            if (ext) {
                allExtensions.add(ext);
            }
        });

        // Format gruplarını oluştur
        const formatKeys: string[] = [];
        Object.keys(formatGroups).forEach(key => {
            const group = formatGroups[key];
            // Eğer gruptaki herhangi bir uzantı dosyalarda varsa, grubu ekle
            if (group.extensions.some(ext => allExtensions.has(ext))) {
                formatKeys.push(key);
            }
        });

        // Diğer formatları ekle (gruplanmamış ve filtrelenmemiş olanlar)
        const excludedExtensions = new Set<string>();
        Object.values(formatGroups).forEach(group => {
            group.extensions.forEach(ext => excludedExtensions.add(ext));
        });
        // pps, png, rtf'yi de hariç tut
        excludedExtensions.add('pps');
        excludedExtensions.add('png');
        excludedExtensions.add('rtf');

        allExtensions.forEach(ext => {
            if (!excludedExtensions.has(ext) && !formatKeys.includes(ext)) {
                formatKeys.push(ext);
            }
        });

        return formatKeys.sort();
    }, [archiveFiles]);

    // Dosya formatını al ve grup anahtarına çevir
    const getFormatKey = (fileName: string): string => {
        const ext = fileName.toLowerCase().split('.').pop() || '';

        // Format gruplarını kontrol et
        for (const [key, group] of Object.entries(formatGroups)) {
            if (group.extensions.includes(ext)) {
                return key;
            }
        }

        // Eğer gruplanmamışsa, uzantıyı döndür
        return ext;
    };

    // Filtrelenmiş dosyalar
    const filteredFiles = useMemo(() => {
        let filtered = archiveFiles;

        // Kategori filtresi
        if (selectedCategory !== 'Tümü' && selectedCategory !== 'Diğerleri') {
            filtered = filtered.filter(f => f.category === selectedCategory);
        } else if (selectedCategory === 'Diğerleri') {
            // Diğerleri için: bilinen kategoriler dışındakileri göster
            const knownCategories = ['Yönetmelikler', 'Kanunlar', 'Kontrol Listeleri', 'Risk Değerlendirmeleri', 'Talimatlar', 'Formlar', 'Rehberler', 'Sunumlar', 'Notlar', 'Toolbox Eğitimleri'];
            filtered = filtered.filter(f => !knownCategories.includes(f.category));
        }

        // Arama filtresi - Türkçe ve İngilizce karakter desteği
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const termEnglish = turkishToEnglish(term); // Türkçe karakterleri İngilizce'ye çevir

            filtered = filtered.filter(f => {
                const fileNameLower = f.fileName.toLowerCase();
                const fileNameEnglish = turkishToEnglish(fileNameLower);
                const categoryLower = f.category.toLowerCase();
                const categoryEnglish = turkishToEnglish(categoryLower);

                // Hem Türkçe hem İngilizce versiyonları kontrol et
                return (
                    fileNameLower.includes(term) ||
                    fileNameEnglish.includes(termEnglish) ||
                    categoryLower.includes(term) ||
                    categoryEnglish.includes(termEnglish)
                );
            });
        }

        // Format filtresi - Eğer format seçildiyse
        if (selectedFormats.length > 0) {
            filtered = filtered.filter(f => {
                const formatKey = getFormatKey(f.fileName);
                return selectedFormats.includes(formatKey);
            });
        }

        return filtered;
    }, [archiveFiles, selectedCategory, searchTerm, selectedFormats]);

    // Sayfalama hesaplamaları
    const totalPages = useMemo(() => {
        return Math.ceil(filteredFiles.length / FILES_PER_PAGE);
    }, [filteredFiles.length]);

    // Mevcut sayfadaki dosyalar
    const paginatedFiles = useMemo(() => {
        const startIndex = (currentPage - 1) * FILES_PER_PAGE;
        const endIndex = startIndex + FILES_PER_PAGE;
        return filteredFiles.slice(startIndex, endIndex);
    }, [filteredFiles, currentPage]);

    // Filtre veya arama değiştiğinde ilk sayfaya dön
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory, selectedFormats]);

    // Format seçimini toggle et
    const toggleFormat = (format: string) => {
        setSelectedFormats(prev =>
            prev.includes(format)
                ? prev.filter(f => f !== format)
                : [...prev, format]
        );
    };

    // İstatistikleri hesapla
    const stats = useMemo(() => {
        const total = archiveFiles.length;
        const pdfCount = archiveFiles.filter(f => f.fileName.toLowerCase().endsWith('.pdf')).length;
        const wordCount = archiveFiles.filter(f => f.fileName.toLowerCase().endsWith('.doc') || f.fileName.toLowerCase().endsWith('.docx')).length;
        const excelCount = archiveFiles.filter(f => f.fileName.toLowerCase().endsWith('.xls') || f.fileName.toLowerCase().endsWith('.xlsx')).length;

        return { total, pdfCount, wordCount, excelCount };
    }, [archiveFiles]);

    // Hata bildirimi gönder
    const handleReportError = async () => {
        if (!selectedFile || !errorDescription.trim()) {
            setErrorNotification({ show: true, message: 'Lütfen hata açıklaması girin.', type: 'error' });
            setTimeout(() => setErrorNotification({ show: false, message: '', type: 'success' }), 3000);
            return;
        }

        setSubmittingError(true);
        try {
            const response = await fetch('/api/archive/report-error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: selectedFile.fileName,
                    fileLink: selectedFile.link,
                    userEmail: session?.user?.email || 'Bilinmiyor',
                    userName: session?.user?.name || 'Bilinmeyen Kullanıcı',
                    errorDescription: errorDescription.trim()
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setErrorNotification({ show: true, message: 'Hata bildirimi başarıyla gönderildi. Teşekkürler!', type: 'success' });
                setShowErrorModal(false);
                setErrorDescription('');
                setSelectedFile(null);
            } else {
                setErrorNotification({ show: true, message: data.error || 'Hata bildirimi gönderilemedi. Lütfen daha sonra tekrar deneyin.', type: 'error' });
            }
        } catch (error) {
            console.error('Hata bildirimi gönderme hatası:', error);
            setErrorNotification({ show: true, message: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', type: 'error' });
        } finally {
            setSubmittingError(false);
            setTimeout(() => setErrorNotification({ show: false, message: '', type: 'success' }), 5000);
        }
    };

    return (
        <div className={`min-h-screen overflow-x-hidden ${isDark ? 'dark-content bg-slate-900' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto p-3 md:p-6 lg:p-8 w-full box-border">
                {/* Başlık */}
                <div className="mb-6 md:mb-8">
                    <div className="flex items-center gap-2 md:gap-3 mb-2">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-100'}`}>
                            <FolderOpen className={`w-5 h-5 md:w-6 md:h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        </div>
                        <div className="min-w-0">
                            <h1 className={`text-xl md:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                İSG Arşiv Dosyaları
                            </h1>
                            <p className={`text-xs md:text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                Profesyonel dokümantasyon kütüphanesi
                            </p>
                        </div>
                    </div>
                </div>

                {/* İstatistik Kartları */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-8 w-full">
                    {[
                        { label: 'Toplam Dosya', value: stats.total, icon: Database, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                        { label: 'PDF Belgeleri', value: stats.pdfCount, icon: FileText, color: 'text-red-500', bg: 'bg-red-500/10' },
                        { label: 'Word Dosyaları', value: stats.wordCount, icon: File, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'Excel Tabloları', value: stats.excelCount, icon: FileSpreadsheet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    ].map((stat, i) => (
                        <div key={i} className={`p-2.5 md:p-4 rounded-xl md:rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm transition-all hover:shadow-md group`}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <p className={`text-[9px] md:text-xs font-semibold uppercase tracking-wider mb-1 truncate ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{stat.label}</p>
                                    <h4 className={`text-lg md:text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</h4>
                                </div>
                                <div className={`p-1.5 md:p-2.5 rounded-lg md:rounded-xl flex-shrink-0 ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                                    <stat.icon className="w-3.5 h-3.5 md:w-5 md:h-5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bildirim */}
                {errorNotification.show && (
                    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-2xl z-[100] flex items-center max-w-[90vw] ${errorNotification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                        }`}>
                        {errorNotification.type === 'error' ? (
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                        ) : (
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                        )}
                        <span className="font-bold text-xs sm:text-sm">{errorNotification.message}</span>
                    </div>
                )}

                {/* Filtreler ve Arama */}
                <div className={`mb-6 md:mb-8 p-3 md:p-6 rounded-2xl shadow-sm border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
                        {/* Arama - Kısa ve kompakt */}
                        <div className="w-full md:w-auto md:flex-shrink-0">
                            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                Dosya Arama
                            </label>
                            <div className="relative group w-full md:w-64">
                                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isDark ? 'text-slate-500 group-within:text-indigo-400' : 'text-slate-400 group-within:text-indigo-600'}`} />
                                <input
                                    type="text"
                                    placeholder="Ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={`w-full pl-9 pr-3 py-2 rounded-lg border-2 transition-all outline-none text-sm box-border ${isDark
                                        ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10'
                                        : 'bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600/20 focus:ring-2 focus:ring-indigo-600/5'
                                        }`}
                                />
                            </div>

                            {/* Dosya Formatı Filtreleri - Sadece Simgeler */}
                            {availableFormats.length > 0 && (
                                <div className="mt-2 w-full md:w-64">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {availableFormats.map(formatKey => {
                                            const isSelected = selectedFormats.includes(formatKey);
                                            const formatInfo = formatGroups[formatKey];
                                            const FormatIcon = formatInfo ? formatInfo.icon : File;
                                            const iconColor = formatInfo ? formatInfo.color : 'text-slate-500';

                                            return (
                                                <button
                                                    key={formatKey}
                                                    onClick={() => toggleFormat(formatKey)}
                                                    type="button"
                                                    title={formatInfo ? formatInfo.label : formatKey.toUpperCase()}
                                                    className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-all border-2 ${isSelected
                                                        ? isDark
                                                            ? 'bg-indigo-600/20 border-indigo-500 shadow-sm'
                                                            : 'bg-indigo-50 border-indigo-500 shadow-sm'
                                                        : isDark
                                                            ? 'bg-slate-900/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                                                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <FormatIcon className={`w-5 h-5 ${isSelected ? iconColor : iconColor} ${isSelected ? 'opacity-100' : 'opacity-70'}`} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {selectedFormats.length > 0 && (
                                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                                            <span className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Seçili: {selectedFormats.map(f => {
                                                    const info = formatGroups[f];
                                                    return info ? info.label : f.toUpperCase();
                                                }).join(', ')}
                                            </span>
                                            <button
                                                onClick={() => setSelectedFormats([])}
                                                type="button"
                                                className={`text-[9px] font-medium underline ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Temizle
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Kategori Filtresi - Grid yapısında */}
                        <div className="flex-1 overflow-hidden">
                            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                Kategoriye Göre Filtrele
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2">
                                {categories.map(cat => {
                                    // Kategori ikonları ve renkleri
                                    const getCategoryIcon = (category: string) => {
                                        switch (category) {
                                            case 'Tümü':
                                                return { icon: FolderOpen, color: 'text-indigo-500' };
                                            case 'Yönetmelikler':
                                                return { icon: ScrollText, color: 'text-violet-600' };
                                            case 'Kanunlar':
                                                return { icon: Scale, color: 'text-emerald-600' };
                                            case 'Kontrol Listeleri':
                                                return { icon: ListChecks, color: 'text-blue-500' };
                                            case 'Risk Değerlendirmeleri':
                                                return { icon: Shield, color: 'text-red-500' };
                                            case 'Talimatlar':
                                                return { icon: FileCheck, color: 'text-green-500' };
                                            case 'Formlar':
                                                return { icon: ClipboardList, color: 'text-purple-500' };
                                            case 'Rehberler':
                                                return { icon: BookOpen, color: 'text-amber-500' };
                                            case 'Sunumlar':
                                                return { icon: Presentation, color: 'text-orange-500' };
                                            case 'Notlar':
                                                return { icon: StickyNote, color: 'text-yellow-500' };
                                            case 'Toolbox Eğitimleri':
                                                return { icon: ListChecks, color: 'text-orange-500' };
                                            case 'Diğerleri':
                                                return { icon: MoreHorizontal, color: 'text-slate-500' };
                                            default:
                                                return { icon: File, color: 'text-slate-500' };
                                        }
                                    };

                                    const { icon: CategoryIcon, color } = getCategoryIcon(cat);

                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`flex items-center justify-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-semibold transition-all duration-200 border-2 whitespace-nowrap ${selectedCategory === cat
                                                ? isDark
                                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20'
                                                    : 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                : isDark
                                                    ? 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                                                    : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:text-slate-900 shadow-sm'
                                                }`}
                                        >
                                            <CategoryIcon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${selectedCategory === cat ? 'text-white' : color}`} />
                                            <span className="truncate">{cat}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dosya Listesi */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className={`text-center py-20 ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <FileText className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                        <p className={`text-lg font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {searchTerm || selectedCategory !== 'Tümü' ? 'Sonuç bulunamadı' : 'Henüz dosya yok'}
                        </p>
                        <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            {searchTerm || selectedCategory !== 'Tümü' ? 'Farklı bir arama terimi veya kategori deneyin' : 'Yakında dosyalar eklenecek'}
                        </p>
                    </div>
                ) : (
                    <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl shadow-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'} overflow-hidden w-full`}>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700/50 w-full">
                            {paginatedFiles.map((file, index) => {
                                const downloadLink = getDownloadLink(file.link, file.fileName);
                                const { icon: FileIcon, color, bg, darkBg } = getFileStyle(file.fileName);

                                return (
                                    <div
                                        key={index}
                                        className={`group relative py-2 md:py-4 px-2 md:px-6 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-all duration-300 w-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white'
                                            }`}
                                    >
                                        {/* Hover Highlight Line - hidden on mobile */}
                                        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />

                                        <div className="flex items-center justify-between gap-3 md:gap-4 w-full overflow-hidden">
                                            <div className="flex-1 min-w-0 flex items-center gap-2 md:gap-4 overflow-hidden">
                                                {/* File Icon - smaller on mobile */}
                                                <div className={`flex-shrink-0 w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${isDark ? darkBg : bg} ${color}`}>
                                                    <FileIcon className="w-4 h-4 md:w-6 md:h-6" />
                                                </div>

                                                <div className="flex-1 min-w-0 overflow-hidden">
                                                    {/* File name - Mobilde daha okunabilir (text-xs) */}
                                                    <h3 className={`font-semibold md:font-bold text-xs md:text-sm leading-tight line-clamp-2 md:truncate break-words ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                        {file.fileName}
                                                    </h3>

                                                    {/* Category tag and file info - more compact on mobile */}
                                                    <div className="flex items-center gap-1.5 md:gap-2 mt-0.5 md:mt-1 flex-wrap">
                                                        <span className={`inline-flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded-md text-[8px] md:text-xs font-bold uppercase tracking-tight ${isDark
                                                            ? 'bg-slate-700/50 text-slate-300'
                                                            : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {file.category}
                                                        </span>
                                                        {/* Dosya boyutu - mobilde ve desktop'ta uyumlu */}
                                                        <span className={`text-[8px] md:text-xs font-medium whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                            {formatFileSize(file.size)}
                                                        </span>
                                                        {/* Dosya uzantısı - sadece mobilde, daha kompakt */}
                                                        <span className={`md:hidden text-[8px] font-medium px-1 py-0.5 rounded ${isDark ? 'bg-slate-700/30 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                                            {file.fileName.split('.').pop()?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action buttons - larger on mobile and beside filename */}
                                            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => handleDownload(downloadLink)}
                                                    className={`inline-flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition-all duration-300 shadow-sm hover:shadow-lg active:scale-95 whitespace-nowrap ${isDark
                                                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                                                        }`}
                                                >
                                                    <Download className="w-4 h-4 md:w-4 md:h-4 flex-shrink-0" />
                                                    <span className="hidden sm:inline">İndir</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedFile(file);
                                                        setShowErrorModal(true);
                                                    }}
                                                    title="Dosyada bir hata varsa bildirin"
                                                    className={`inline-flex items-center justify-center p-1 md:p-2.5 rounded-md md:rounded-xl transition-all duration-300 border flex-shrink-0 ${isDark
                                                        ? 'bg-slate-900 border-slate-700 text-red-400 hover:bg-red-500/10 hover:border-red-500/50'
                                                        : 'bg-white border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200'
                                                        }`}
                                                >
                                                    <AlertCircle className="w-3 h-3 md:w-5 md:h-5" />
                                                </button>
                                                <div className={`hidden lg:block text-slate-300 dark:text-slate-600 transition-transform group-hover:translate-x-1 duration-300 flex-shrink-0`}>
                                                    <ChevronRight className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Sonuç Sayısı ve Sayfalama */}
                {!loading && filteredFiles.length > 0 && (
                    <div className="mt-4 space-y-4">
                        <div className={`text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {filteredFiles.length} dosya bulundu
                            {filteredFiles.length > FILES_PER_PAGE && (
                                <span className="ml-2">
                                    (Sayfa {currentPage} / {totalPages})
                                </span>
                            )}
                        </div>

                        {/* Sayfalama Kontrolleri */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                {/* Önceki Sayfa */}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === 1
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                                        } ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline">Önceki</span>
                                </button>

                                {/* Sayfa Numaraları */}
                                <div className="flex items-center gap-1 flex-wrap justify-center">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                                        // İlk sayfa, son sayfa, mevcut sayfa ve etrafındaki sayfaları göster
                                        const showPage =
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= currentPage - 2 && pageNum <= currentPage + 2);

                                        if (!showPage) {
                                            // Elips göster
                                            if (
                                                pageNum === currentPage - 3 ||
                                                pageNum === currentPage + 3
                                            ) {
                                                return (
                                                    <span
                                                        key={pageNum}
                                                        className={`px-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                                                    >
                                                        ...
                                                    </span>
                                                );
                                            }
                                            return null;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === pageNum
                                                    ? isDark
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-indigo-600 text-white'
                                                    : isDark
                                                        ? 'text-slate-300 hover:bg-slate-700'
                                                        : 'text-slate-700 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Sonraki Sayfa */}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === totalPages
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                                        } ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                                >
                                    <span className="hidden sm:inline">Sonraki</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Hata Bildirimi Modal */}
            {showErrorModal && selectedFile && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
                    <div className={`w-full md:max-w-md rounded-t-2xl md:rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-800' : 'bg-white'} border-t md:border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <div className="p-4 md:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Hata Bildir
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowErrorModal(false);
                                        setErrorDescription('');
                                        setSelectedFile(null);
                                    }}
                                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                                >
                                    <X className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                                </button>
                            </div>

                            <div className="mb-4">
                                <p className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    Dosya:
                                </p>
                                <p className={`text-sm break-words ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                    {selectedFile.fileName}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    Hata Açıklaması *
                                </label>
                                <textarea
                                    value={errorDescription}
                                    onChange={(e) => setErrorDescription(e.target.value)}
                                    placeholder="Dosyada gördüğünüz hatayı detaylı olarak açıklayın..."
                                    rows={4}
                                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-base md:text-sm ${isDark
                                        ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400'
                                        : 'bg-white border-slate-200 text-slate-900'
                                        }`}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowErrorModal(false);
                                        setErrorDescription('');
                                        setSelectedFile(null);
                                    }}
                                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all min-h-[44px] ${isDark
                                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                        }`}
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleReportError}
                                    disabled={submittingError || !errorDescription.trim()}
                                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all min-h-[44px] flex items-center justify-center gap-2 ${submittingError || !errorDescription.trim()
                                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                        : 'bg-red-600 hover:bg-red-700 text-white'
                                        }`}
                                >
                                    {submittingError ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Gönderiliyor...
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="w-4 h-4" />
                                            Gönder
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

