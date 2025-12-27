"use client";

import { useState, useEffect, useCallback } from 'react';
import { X, Download, Loader2, CheckCircle } from 'lucide-react';
import { AdBanner, AdBannerPlaceholder } from './AdBanner';

interface DownloadAdModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDownloadComplete?: () => void;
    downloadType: 'PDF' | 'Word' | 'Excel';
    fileName?: string;
    slot?: string;
    showPlaceholder?: boolean;
    autoCloseDelay?: number; // ms cinsinden otomatik kapanma süresi
}

type DownloadStatus = 'preparing' | 'downloading' | 'complete';

/**
 * İndirme sırasında gösterilen modal reklam komponenti
 * 
 * Kullanım:
 * 1. İndirme butonuna tıklandığında modal açılır
 * 2. Modal içinde reklam gösterilirken indirme başlar
 * 3. İndirme tamamlandığında modal kapanır veya kullanıcı kapatabilir
 * 
 * @param isOpen - Modal açık mı?
 * @param onClose - Modal kapandığında çağrılacak fonksiyon
 * @param onDownloadComplete - İndirme tamamlandığında çağrılacak fonksiyon
 * @param downloadType - İndirilen dosya türü
 * @param fileName - İndirilen dosya adı
 * @param slot - AdSense slot ID
 * @param showPlaceholder - Placeholder göster
 * @param autoCloseDelay - Otomatik kapanma süresi (varsayılan: 3000ms)
 */
export function DownloadAdModal({
    isOpen,
    onClose,
    onDownloadComplete,
    downloadType,
    fileName = 'dosya',
    slot,
    showPlaceholder = true,
    autoCloseDelay = 3000
}: DownloadAdModalProps) {
    const [status, setStatus] = useState<DownloadStatus>('preparing');
    const [progress, setProgress] = useState(0);

    // Modal açıldığında indirme animasyonunu başlat
    useEffect(() => {
        if (!isOpen) {
            setStatus('preparing');
            setProgress(0);
            return;
        }

        // İndirme simülasyonu
        setStatus('preparing');
        const prepareTimer = setTimeout(() => {
            setStatus('downloading');
        }, 500);

        return () => clearTimeout(prepareTimer);
    }, [isOpen]);

    // İndirme progress animasyonu
    useEffect(() => {
        if (status !== 'downloading') return;

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setStatus('complete');
                    return 100;
                }
                return prev + 20;
            });
        }, 300);

        return () => clearInterval(interval);
    }, [status]);

    // İndirme tamamlandığında
    useEffect(() => {
        if (status !== 'complete') return;

        onDownloadComplete?.();

        const closeTimer = setTimeout(() => {
            onClose();
        }, autoCloseDelay);

        return () => clearTimeout(closeTimer);
    }, [status, onClose, onDownloadComplete, autoCloseDelay]);

    if (!isOpen) return null;

    const getFileIcon = () => {
        switch (downloadType) {
            case 'PDF':
                return '📄';
            case 'Word':
                return '📝';
            case 'Excel':
                return '📊';
            default:
                return '📁';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'preparing':
                return 'Dosya hazırlanıyor...';
            case 'downloading':
                return 'İndiriliyor...';
            case 'complete':
                return 'İndirme tamamlandı!';
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFileIcon()}</span>
                        <div>
                            <h3 className="font-bold text-slate-800">{downloadType} İndiriliyor</h3>
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">{fileName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Kapat"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Progress */}
                <div className="px-4 py-3 bg-slate-50">
                    <div className="flex items-center gap-3">
                        {status === 'complete' ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        ) : (
                            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin flex-shrink-0" />
                        )}
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-slate-700">{getStatusText()}</span>
                                <span className="text-xs text-slate-400">{progress}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${status === 'complete' ? 'bg-emerald-500' : 'bg-indigo-500'
                                        }`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reklam Alanı */}
                <div className="p-4">
                    <div className="mb-2 flex items-center justify-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px] font-medium">
                            Sponsorlu
                        </span>
                    </div>

                    {showPlaceholder || !slot ? (
                        <AdBannerPlaceholder height={250} className="w-full rounded-xl" />
                    ) : (
                        <AdBanner
                            slot={slot}
                            format="rectangle"
                            className="rounded-xl overflow-hidden"
                            style={{ minHeight: 250 }}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 pb-4">
                    <button
                        onClick={onClose}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${status === 'complete'
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                    >
                        {status === 'complete' ? 'Kapat' : 'Arka Planda İndir'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * DownloadAdModal için custom hook
 * İndirme fonksiyonlarını modal ile sarmalayarak kullanımı kolaylaştırır
 */
export function useDownloadWithAd() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [downloadInfo, setDownloadInfo] = useState<{
        type: 'PDF' | 'Word' | 'Excel';
        fileName: string;
    }>({ type: 'PDF', fileName: '' });

    const triggerDownload = useCallback((
        downloadFn: () => void | Promise<void>,
        type: 'PDF' | 'Word' | 'Excel',
        fileName: string
    ) => {
        setDownloadInfo({ type, fileName });
        setIsModalOpen(true);

        // İndirme işlemini başlat
        setTimeout(() => {
            downloadFn();
        }, 500);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    return {
        isModalOpen,
        downloadInfo,
        triggerDownload,
        closeModal,
        DownloadModal: () => (
            <DownloadAdModal
                isOpen={isModalOpen}
                onClose={closeModal}
                downloadType={downloadInfo.type}
                fileName={downloadInfo.fileName}
                showPlaceholder={true}
            />
        )
    };
}

export default DownloadAdModal;
