
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { FileText, Download, RefreshCw, AlertTriangle, Shield, CheckCircle, Search, Calendar, Trash2, Filter } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface ReportHistory {
    id: string;
    type: string;
    title: string;
    createdAt: string;
    data: any;
}

export default function ReportsPage() {
    const { data: session } = useSession();
    const [reports, setReports] = useState<ReportHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    // Yeni: Arama ve Filtreleme State'leri
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'RISK_ASSESSMENT' | 'EMERGENCY_PLAN' | 'WORK_PERMIT'>('all');

    useEffect(() => {
        fetchReports();
    }, [session]);

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/reports');
            if (res.ok) {
                const data = await res.json();
                setReports(data);
            }
        } catch (error) {
            console.error('Raporlar alınamadı:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadEmergencyPlan = async (report: ReportHistory) => {
        setDownloadingId(report.id);
        try {
            // API'nin beklediği formata dönüştür
            const apiPayload = {
                companyName: report.data.company?.title,
                companyAddress: report.data.company?.address,
                registrationNumber: report.data.company?.registration_number,
                employer: report.data.company?.employer,
                isgUzmani: report.data.company?.igu,
                reportDate: report.data.date,
                validityDate: report.data.validity
            };

            const response = await fetch('/api/acil-durum-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiPayload)
            });

            if (!response.ok) throw new Error('PDF oluşturulamadı');

            const blob = await response.blob();
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
        } finally {
            setDownloadingId(null);
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
                // Listeden silinenleri çıkar
                setReports(reports.filter(r => !selectedIds.includes(r.id)));
                setSelectedIds([]);
                // Opsiyonel: Bildirim göster
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
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-6 flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-7 h-7 text-indigo-600" />
                        Raporlarım
                    </h1>
                    <p className="text-slate-500 mt-1">Geçmişte oluşturduğunuz tüm risk analizleri ve acil durum planları</p>
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
            <div className="flex flex-wrap items-center gap-4 mb-6">
                {/* Arama Kutusu */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Firma adı ile ara..."
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                </div>

                {/* Tür Filtresi */}
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-500">Filtrele:</span>
                </div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                    {[
                        { value: 'all', label: 'Tümü' },
                        { value: 'RISK_ASSESSMENT', label: 'Risk Analizi' },
                        { value: 'EMERGENCY_PLAN', label: 'Acil Durum' },
                        { value: 'WORK_PERMIT', label: 'İş İzin Formu' }
                    ].map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setFilterType(opt.value as any)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filterType === opt.value
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                <span className="text-sm text-slate-400">
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
                                    <th className="px-6 py-4 w-10">
                                        <input
                                            type="checkbox"
                                            checked={filteredReports.length > 0 && selectedIds.length === filteredReports.length}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rapor Türü</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Başlık / Firma</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rapor Tarihi</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Oluşturulma Tarihi</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">İşlemler</th>
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
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(report.id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${report.type === 'RISK_ASSESSMENT'
                                                            ? 'bg-indigo-100 text-indigo-600'
                                                            : report.type === 'WORK_PERMIT'
                                                                ? 'bg-blue-100 text-blue-600'
                                                                : 'bg-orange-100 text-orange-600'
                                                        }`}>
                                                        {report.type === 'RISK_ASSESSMENT'
                                                            ? <Shield className="w-5 h-5" />
                                                            : report.type === 'WORK_PERMIT'
                                                                ? <FileText className="w-5 h-5" />
                                                                : <AlertTriangle className="w-5 h-5" />}
                                                    </div>
                                                    <span className="font-medium text-slate-700">
                                                        {report.type === 'RISK_ASSESSMENT'
                                                            ? 'Risk Analizi'
                                                            : report.type === 'WORK_PERMIT'
                                                                ? 'İş İzin Formu'
                                                                : 'Acil Durum Planı'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 mb-1">{companyInfo.name || '-'}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full w-fit font-bold ${dangerStatus.class}`}>
                                                        {dangerStatus.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-slate-600 text-sm font-medium">
                                                    <Calendar className="w-4 h-4 mr-2 opacity-50" />
                                                    {reportDate}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-slate-500 text-sm">
                                                    {new Date(report.createdAt).toLocaleDateString('tr-TR', {
                                                        day: 'numeric', month: 'long', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {report.type === 'RISK_ASSESSMENT' ? (
                                                        <Link
                                                            href={`/risk-degerlendirme?reportId=${report.id}`}
                                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                                        >
                                                            <RefreshCw className="w-4 h-4" />
                                                            Düzenle/Oluştur
                                                        </Link>
                                                    ) : report.type === 'WORK_PERMIT' ? (
                                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-500">
                                                            <FileText className="w-4 h-4" />
                                                            {(report.data as any)?.permitNo || 'İzin Formu'}
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleDownloadEmergencyPlan(report)}
                                                            disabled={downloadingId === report.id}
                                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200 disabled:opacity-50"
                                                        >
                                                            {downloadingId === report.id ? (
                                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Download className="w-4 h-4" />
                                                            )}
                                                            İndir
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
        </div>
    );
}
