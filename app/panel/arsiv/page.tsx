"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/app/context/ThemeContext';
import {
    Search, Download, AlertCircle, X, FileText, FolderOpen,
    Filter, CheckCircle, Loader2, File, FileSpreadsheet,
    FileImage, FileVideo, FileCode, ExternalLink, Info,
    ChevronRight, BarChart3, Clock, Database
} from 'lucide-react';

interface ArchiveFile {
    fileName: string;
    link: string;
    category: string;
}

// Kategori belirleme fonksiyonu
function getCategory(fileName: string): string {
    const name = fileName.toLowerCase();

    if (name.includes('kontrol listesi') || name.includes('çeklist') || name.includes('checklist')) {
        return 'Kontrol Listesi';
    }
    if (name.includes('risk değerlendirme') || name.includes('risk analiz') || name.includes('risk analizi')) {
        return 'Risk Değerlendirme';
    }
    if (name.includes('talimat') || name.includes('talimatı')) {
        return 'Talimat';
    }
    if (name.includes('form') || name.includes('formu')) {
        return 'Form';
    }
    if (name.includes('rehber') || name.includes('rehberi')) {
        return 'Rehber';
    }
    if (name.includes('sunum') || name.includes('presentation')) {
        return 'Sunum';
    }
    if (name.includes('prosedür') || name.includes('prosedürü')) {
        return 'Prosedür';
    }
    if (name.includes('afiş') || name.includes('poster')) {
        return 'Afiş';
    }
    if (name.includes('rapor') || name.includes('raporu')) {
        return 'Rapor';
    }
    if (name.includes('bülten') || name.includes('bülteni')) {
        return 'Bülten';
    }
    if (name.includes('not') || name.includes('notları')) {
        return 'Not';
    }
    if (name.includes('soru') || name.includes('sorular')) {
        return 'Sınav Soruları';
    }

    return 'Diğer';
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

// İndirme linkini API üzerinden oluştur
function getDownloadLink(originalLink: string, fileName: string): string {
    const encodedUrl = encodeURIComponent(originalLink);
    const encodedName = encodeURIComponent(fileName);
    return `/api/archive/download?url=${encodedUrl}&name=${encodedName}`;
}

export default function ArsivPage() {
    const { data: session } = useSession();
    const { isDark } = useTheme();
    const [archiveFiles, setArchiveFiles] = useState<ArchiveFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<ArchiveFile | null>(null);
    const [errorDescription, setErrorDescription] = useState('');
    const [submittingError, setSubmittingError] = useState(false);
    const [errorNotification, setErrorNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

    // CSV dosyasını yükle
    useEffect(() => {
        const loadArchiveFiles = async () => {
            try {
                const response = await fetch('/isg-arsiv.csv');
                const text = await response.text();

                // CSV parse et
                const lines = text.split('\n').filter(line => line.trim());
                const files: ArchiveFile[] = [];

                // İlk satır header, atla
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i];
                    // CSV formatını parse et (tırnak içinde değerler)
                    const match = line.match(/"([^"]+)","([^"]+)"/);
                    if (match) {
                        const fileName = match[1].trim();
                        const link = match[2].trim();
                        if (fileName && link) {
                            files.push({
                                fileName,
                                link,
                                category: getCategory(fileName)
                            });
                        }
                    }
                }

                setArchiveFiles(files);
            } catch (error) {
                console.error('Arşiv dosyaları yüklenemedi:', error);
            } finally {
                setLoading(false);
            }
        };

        loadArchiveFiles();
    }, []);

    // Kategorileri hesapla
    const categories = useMemo(() => {
        const cats = new Set(archiveFiles.map(f => f.category));
        return ['Tümü', ...Array.from(cats).sort()];
    }, [archiveFiles]);

    // Filtrelenmiş dosyalar
    const filteredFiles = useMemo(() => {
        let filtered = archiveFiles;

        // Kategori filtresi
        if (selectedCategory !== 'Tümü') {
            filtered = filtered.filter(f => f.category === selectedCategory);
        }

        // Arama filtresi
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(f =>
                f.fileName.toLowerCase().includes(term) ||
                f.category.toLowerCase().includes(term)
            );
        }

        return filtered;
    }, [archiveFiles, selectedCategory, searchTerm]);

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
        <div className={`min-h-screen ${isDark ? 'dark-content bg-slate-900' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
                {/* Başlık */}
                <div className="mb-6 md:mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-100'}`}>
                            <FolderOpen className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        </div>
                        <div>
                            <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                İSG Arşiv Dosyaları
                            </h1>
                            <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                Profesyonel dokümantasyon kütüphanesi
                            </p>
                        </div>
                    </div>
                </div>

                {/* İstatistik Kartları */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                    {[
                        { label: 'Toplam Dosya', value: stats.total, icon: Database, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                        { label: 'PDF Belgeleri', value: stats.pdfCount, icon: FileText, color: 'text-red-500', bg: 'bg-red-500/10' },
                        { label: 'Word Dosyaları', value: stats.wordCount, icon: File, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'Excel Tabloları', value: stats.excelCount, icon: FileSpreadsheet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    ].map((stat, i) => (
                        <div key={i} className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm transition-all hover:shadow-md group`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{stat.label}</p>
                                    <h4 className={`text-xl md:text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</h4>
                                </div>
                                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bildirim */}
                {errorNotification.show && (
                    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-2xl z-[100] flex items-center ${errorNotification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                        }`}>
                        {errorNotification.type === 'error' ? (
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        ) : (
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        )}
                        <span className="font-bold text-xs sm:text-sm">{errorNotification.message}</span>
                    </div>
                )}

                {/* Filtreler ve Arama */}
                <div className={`mb-8 p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Arama */}
                        <div className="flex-1">
                            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                Dosya Arama
                            </label>
                            <div className="relative group">
                                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${isDark ? 'text-slate-500 group-within:text-indigo-400' : 'text-slate-400 group-within:text-indigo-600'}`} />
                                <input
                                    type="text"
                                    placeholder="Dosya adı veya kategori ile ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all outline-none text-base md:text-sm ${isDark
                                        ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10'
                                        : 'bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600/20 focus:ring-4 focus:ring-indigo-600/5'
                                        }`}
                                />
                            </div>
                        </div>

                        {/* Kategori Filtresi */}
                        <div className="lg:w-2/3">
                            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                Kategoriye Göre Filtrele
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${selectedCategory === cat
                                            ? isDark
                                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20'
                                                : 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                            : isDark
                                                ? 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                                                : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:text-slate-900 shadow-sm'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
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
                    <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl shadow-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'} overflow-hidden`}>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {filteredFiles.map((file, index) => {
                                const downloadLink = getDownloadLink(file.link, file.fileName);
                                const { icon: FileIcon, color, bg, darkBg } = getFileStyle(file.fileName);

                                return (
                                    <div
                                        key={index}
                                        className={`group relative py-4 px-6 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-all duration-300 ${isDark ? 'bg-slate-800' : 'bg-white'
                                            }`}
                                    >
                                        {/* Hover Highlight Line */}
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />

                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1 min-w-0 flex items-center gap-4">
                                                {/* File Icon */}
                                                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${isDark ? darkBg : bg} ${color}`}>
                                                    <FileIcon className="w-6 h-6" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <h3 className={`font-bold text-base md:text-lg leading-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                            {file.fileName}
                                                        </h3>
                                                        <div className={`p-1 rounded-full ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} cursor-help transition-colors`} title="Dosya bilgisi">
                                                            <Info className="w-3.5 h-3.5 text-slate-400" />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-tight ${isDark
                                                                ? 'bg-slate-700/50 text-slate-300'
                                                                : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            <BarChart3 className="w-3 h-3" />
                                                            {file.category}
                                                        </span>
                                                        <span className={`inline-flex items-center gap-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                            <Clock className="w-3 h-3" />
                                                            Sistem Dosyası
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 md:ml-4">
                                                <a
                                                    href={downloadLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-sm hover:shadow-lg active:scale-95 ${isDark
                                                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
                                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                                                        }`}
                                                >
                                                    <Download className="w-4 h-4" />
                                                    İndir
                                                </a>
                                                <button
                                                    onClick={() => {
                                                        setSelectedFile(file);
                                                        setShowErrorModal(true);
                                                    }}
                                                    title="Dosyada bir hata varsa bildirin"
                                                    className={`inline-flex items-center justify-center p-2.5 rounded-xl transition-all duration-300 border ${isDark
                                                            ? 'bg-slate-900 border-slate-700 text-red-400 hover:bg-red-500/10 hover:border-red-500/50'
                                                            : 'bg-white border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200'
                                                        }`}
                                                >
                                                    <AlertCircle className="w-5 h-5" />
                                                </button>
                                                <div className={`hidden lg:block text-slate-300 dark:text-slate-600 transition-transform group-hover:translate-x-1 duration-300`}>
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

                {/* Sonuç Sayısı */}
                {!loading && filteredFiles.length > 0 && (
                    <div className={`mt-4 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {filteredFiles.length} dosya gösteriliyor
                    </div>
                )}
            </div>

            {/* Hata Bildirimi Modal */}
            {showErrorModal && selectedFile && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className={`w-full max-w-md rounded-xl shadow-2xl ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
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
                                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
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

