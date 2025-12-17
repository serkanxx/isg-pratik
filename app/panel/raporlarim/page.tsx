
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { FileText, Download, RefreshCw, AlertTriangle, Shield, CheckCircle, Search, Calendar, Trash2, Filter, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, apiFetchers } from '@/lib/queries';

interface ReportHistory {
    id: string;
    type: string;
    title: string;
    createdAt: string;
    documentNo?: string; // Acil Durum Planı için doküman no
    data: any;
}

export default function ReportsPage() {
    const { data: session } = useSession();
    const [reports, setReports] = useState<ReportHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0); // Progress bar için (0-100)

    // Yeni: Arama ve Filtreleme State'leri
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'RISK_ASSESSMENT' | 'EMERGENCY_PLAN' | 'WORK_PERMIT'>('all');

    const queryClient = useQueryClient();

    const { data: reportsData, isLoading: reportsLoading } = useQuery({
        queryKey: queryKeys.reports,
        queryFn: apiFetchers.reports,
        enabled: !!session,
    });

    useEffect(() => {
        if (reportsData) {
            setReports(reportsData);
        }
    }, [reportsData]);

    useEffect(() => {
        if (reportsData || !reportsLoading) {
            setLoading(false);
        }
    }, [reportsData, reportsLoading]);

    const handleDownloadWorkPermit = async (report: ReportHistory) => {
        setDownloadingId(report.id);
        setIsGenerating(true);
        setProgress(0);

        try {
            // Rapor verisinden iş izin formu bilgilerini al
            const reportData = report.data as any;
            
            // API'nin beklediği formata dönüştür
            const apiPayload = {
                permitNo: reportData.permitNo || '',
                companyName: reportData.companyName || report.title || '',
                location: reportData.location || '',
                workDescription: reportData.workDescription || '',
                startTime: reportData.startTime || '',
                endTime: reportData.endTime || '',
                permitTypes: reportData.permitTypes || [],
                safetyMeasures: reportData.safetyMeasures || [],
                ppeList: reportData.ppeList || [],
                requesterLabel: reportData.requesterLabel || 'İzni İsteyen',
                requesterName: reportData.requesterName || '',
                approverLabel: reportData.approverLabel || 'İzni Onaylayan',
                approverName: reportData.approverName || ''
            };

            // XMLHttpRequest ile progress tracking
            const blob = await new Promise<Blob>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/is-izin-pdf', true);
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

                xhr.send(JSON.stringify(apiPayload));
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const permitNo = reportData.permitNo || '0000';
            a.download = `Is-Izin-Formu-${permitNo}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('İndirme hatası:', error);
            alert('PDF indirilirken bir hata oluştu.');
            setProgress(0);
        } finally {
            setDownloadingId(null);
            // Kısa bir gecikme ile progress'i sıfırla (kullanıcı %100'ü görebilsin)
            setTimeout(() => {
                setIsGenerating(false);
                setProgress(0);
            }, 500);
        }
    };

    const handleDownloadEmergencyPlan = async (report: ReportHistory) => {
        setDownloadingId(report.id);
        setIsGenerating(true);
        setProgress(0);

        try {
            // Doküman no'yu önce kolondan, yoksa data JSON'ından oku (geriye dönük uyumluluk)
            const documentNo = (report as any).documentNo || report.data?.documentNo || '';
            
            // API'nin beklediği formata dönüştür
            const apiPayload = {
                companyName: report.data.company?.title,
                companyAddress: report.data.company?.address,
                registrationNumber: report.data.company?.registration_number,
                employer: report.data.company?.employer,
                isgUzmani: report.data.company?.igu,
                reportDate: report.data.date,
                validityDate: report.data.validity,
                documentNo: documentNo // Doküman no'yu da gönder
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

                xhr.send(JSON.stringify(apiPayload));
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${report.title || 'Acil-Durum'} - Rapor.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('İndirme hatası:', error);
            alert('PDF indirilirken bir hata oluştu.');
            setProgress(0);
        } finally {
            setDownloadingId(null);
            // Kısa bir gecikme ile progress'i sıfırla (kullanıcı %100'ü görebilsin)
            setTimeout(() => {
                setIsGenerating(false);
                setProgress(0);
            }, 500);
        }
    };

    // --- Silme ve Seçim İşlemleri ---

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredReports.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredReports.map(r => r.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(itemId => itemId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleDeleteSelected = async () => {
        if (!confirm(`${selectedIds.length} adet raporu silmek istediğinize emin misiniz ? `)) return;

        setIsDeleting(true);
        try {
            const res = await fetch('/api/reports', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });

            if (res.ok) {
                setSelectedIds([]);
                queryClient.invalidateQueries({ queryKey: queryKeys.reports });
            } else {
                alert('Silme işlemi başarısız oldu.');
            }
        } catch (error) {
            console.error('Silme hatası:', error);
            alert('Bir hata oluştu.');
        } finally {
            setIsDeleting(false);
        }
    };

    const formatDateTR = (dateStr: string) => {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            // Tarih geçerli değilse string'i olduğu gibi döndür (belki zaten formatlıdır)
            if (isNaN(date.getTime())) return dateStr;

            return date.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    };

    const getReportDate = (report: ReportHistory) => {
        try {
            let dateStr = '-';
            if (report.type === 'RISK_ASSESSMENT') {
                dateStr = report.data?.headerInfo?.date || '-';
            } else if (report.type === 'WORK_PERMIT') {
                dateStr = report.createdAt || '-';
            } else {
                dateStr = report.data?.date || report.data?.reportDate || '-';
            }
            return formatDateTR(dateStr);
        } catch (e) {
            return '-';
        }
    };

    const getCompanyInfo = (report: ReportHistory) => {
        try {
            if (report.type === 'RISK_ASSESSMENT') {
                return {
                    name: report.title,
                    dangerClass: report.data?.headerInfo?.dangerClass || report.data?.company?.danger_class
                };
            } else if (report.type === 'WORK_PERMIT') {
                return {
                    name: report.data?.companyName || report.title,
                    dangerClass: null // İş izin formunda tehlike sınıfı yok
                };
            } else {
                return {
                    name: report.title,
                    dangerClass: report.data?.company?.danger_class || report.data?.dangerClass
                }
            }
        } catch (e) {
            return { name: report.title, dangerClass: '-' };
        }
    };

    const getDangerClassLabel = (dangerClass: string) => {
        if (!dangerClass) return { label: '-', class: 'bg-slate-100 text-slate-500' };

        const normalized = dangerClass.toLowerCase().replace(/ /g, '_');

        if (normalized.includes('az')) return { label: 'Az Tehlikeli', class: 'bg-emerald-100 text-emerald-700' };
        if (normalized.includes('cok') || normalized.includes('çok')) return { label: 'Çok Tehlikeli', class: 'bg-red-100 text-red-700' };
        if (normalized.includes('tehlikeli')) return { label: 'Tehlikeli', class: 'bg-amber-100 text-amber-700' };

        return { label: dangerClass, class: 'bg-slate-100 text-slate-600' };
    };

    // Filtrelenmiş raporlar
    const filteredReports = useMemo(() => {
        return reports.filter(report => {
            // Tür filtresi
            if (filterType !== 'all' && report.type !== filterType) return false;

            // Arama filtresi
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const companyInfo = getCompanyInfo(report);
                const matchesTitle = (companyInfo.name || '').toLowerCase().includes(query);
                let matchesType = false;
                if (report.type === 'RISK_ASSESSMENT') matchesType = 'risk analizi'.includes(query);
                else if (report.type === 'EMERGENCY_PLAN') matchesType = 'acil durum planı'.includes(query);
                else if (report.type === 'WORK_PERMIT') matchesType = 'iş izin formu'.includes(query);
                if (!matchesTitle && !matchesType) return false;
            }

            return true;
        });
    }, [reports, filterType, searchQuery]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <div className="mb-4 flex items-end justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
                        Raporlarım
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 mt-0.5">Geçmişte oluşturduğunuz tüm risk analizleri ve acil durum planları</p>
                </div>

                {selectedIds.length > 0 && (
                    <button
                        onClick={handleDeleteSelected}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-bold text-sm"
                    >
                        {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Seçilenleri Sil ({selectedIds.length})
                    </button>
                )}
            </div>

            {/* Arama ve Filtreler */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4">
                {/* Arama Kutusu */}
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Firma adı ile ara..."
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs md:text-sm bg-white focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                </div>

                {/* Tür Filtresi */}
                <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500 hidden sm:inline">Filtre:</span>
                </div>
                <div className="flex gap-0.5 bg-slate-100 p-0.5 rounded-md">
                    {[
                        { value: 'all', label: 'Tümü' },
                        { value: 'RISK_ASSESSMENT', label: 'Risk' },
                        { value: 'EMERGENCY_PLAN', label: 'Acil' },
                        { value: 'WORK_PERMIT', label: 'İzin' }
                    ].map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setFilterType(opt.value as any)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${filterType === opt.value
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                    {filteredReports.length} rapor
                </span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {reports.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Henüz rapor oluşturmadınız</h3>
                        <p className="text-slate-500 max-w-md mx-auto mt-2 mb-6">
                            Risk analizi yaparak veya acil durum planı oluşturarak ilk raporunuzu kaydedin.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link href="/risk-degerlendirme" className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Risk Analizi Başlat
                            </Link>
                            <Link href="/panel/acil-durum" className="px-5 py-2.5 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors inline-flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Acil Durum Planı
                            </Link>
                        </div>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Sonuç bulunamadı</h3>
                        <p className="text-slate-500 max-w-md mx-auto mt-2">
                            Arama kriterlerinize uygun rapor bulunamadı. Filtreleri değiştirmeyi deneyin.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-2 py-2 w-8">
                                        <input
                                            type="checkbox"
                                            checked={filteredReports.length > 0 && selectedIds.length === filteredReports.length}
                                            onChange={toggleSelectAll}
                                            className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Tür</th>
                                    <th className="px-3 py-2 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Firma</th>
                                    <th className="px-3 py-2 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Rapor Tarihi</th>
                                    <th className="px-3 py-2 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Oluşturulma</th>
                                    <th className="px-3 py-2 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-20">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredReports.map((report) => {
                                    const companyInfo = getCompanyInfo(report);
                                    const dangerStatus = getDangerClassLabel(companyInfo.dangerClass);
                                    const reportDate = getReportDate(report);
                                    const isSelected = selectedIds.includes(report.id);

                                    return (
                                        <tr key={report.id} className={`transition-colors ${isSelected ? 'bg-indigo-50 hover:bg-indigo-50' : 'hover:bg-slate-50'}`}>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(report.id)}
                                                    className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`p-1 rounded ${report.type === 'RISK_ASSESSMENT'
                                                            ? 'bg-indigo-100 text-indigo-600'
                                                            : report.type === 'WORK_PERMIT'
                                                                ? 'bg-blue-100 text-blue-600'
                                                                : 'bg-orange-100 text-orange-600'
                                                        }`}>
                                                        {report.type === 'RISK_ASSESSMENT'
                                                            ? <Shield className="w-3.5 h-3.5" />
                                                            : report.type === 'WORK_PERMIT'
                                                                ? <FileText className="w-3.5 h-3.5" />
                                                                : <AlertTriangle className="w-3.5 h-3.5" />}
                                                    </div>
                                                    <span className="font-medium text-slate-700 text-xs">
                                                        {report.type === 'RISK_ASSESSMENT'
                                                            ? 'Risk Değerlendirme'
                                                            : report.type === 'WORK_PERMIT'
                                                                ? 'İş İzin'
                                                                : 'Acil Durum'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 text-xs leading-tight line-clamp-1">{companyInfo.name || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 hidden md:table-cell">
                                                <div className="flex items-center text-slate-600 text-xs font-medium">
                                                    <Calendar className="w-3 h-3 mr-1 opacity-50" />
                                                    {reportDate}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 hidden lg:table-cell">
                                                <div className="text-slate-500 text-xs">
                                                    {new Date(report.createdAt).toLocaleDateString('tr-TR', {
                                                        day: '2-digit', month: 'short', year: 'numeric'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <div className="flex justify-end gap-1">
                                                    {report.type === 'RISK_ASSESSMENT' ? (
                                                        <Link
                                                            href={`/risk-degerlendirme?reportId=${report.id}`}
                                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                            title="Düzenle/Oluştur"
                                                        >
                                                            <RefreshCw className="w-3.5 h-3.5" />
                                                            <span className="hidden sm:inline">Düzenle</span>
                                                        </Link>
                                                    ) : report.type === 'WORK_PERMIT' ? (
                                                        <button
                                                            onClick={() => handleDownloadWorkPermit(report)}
                                                            disabled={downloadingId === report.id}
                                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded transition-colors disabled:opacity-50"
                                                            title="İndir"
                                                        >
                                                            {downloadingId === report.id ? (
                                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <Download className="w-3.5 h-3.5" />
                                                            )}
                                                            <span className="hidden sm:inline">İndir</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleDownloadEmergencyPlan(report)}
                                                            disabled={downloadingId === report.id}
                                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded transition-colors disabled:opacity-50"
                                                            title="İndir"
                                                        >
                                                            {downloadingId === report.id ? (
                                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <Download className="w-3.5 h-3.5" />
                                                            )}
                                                            <span className="hidden sm:inline">İndir</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Loading Overlay with Progress Bar */}
            {isGenerating && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] flex flex-col items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce-in max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                            <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">PDF Hazırlanıyor</h3>
                        <p className="text-slate-500 mb-6">Lütfen bekleyiniz, belgeniz oluşturuluyor...</p>
                        
                        {/* Progress Bar */}
                        <div className="w-full mb-3">
                            <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden shadow-inner">
                                <div 
                                    className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2 relative"
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
    );
}
