'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Check, X } from 'lucide-react';
import { offlineQueue } from '@/lib/offline-sync';

interface SyncResult {
    success: number;
    failed: number;
}

export function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [showNotification, setShowNotification] = useState(false);
    const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        // Initial state
        setIsOnline(navigator.onLine);

        // Bekleyen mutation sayısını al
        const updatePendingCount = async () => {
            const count = await offlineQueue.getCount();
            setPendingCount(count);
        };
        updatePendingCount();

        // Event listeners
        const handleOnline = () => {
            setIsOnline(true);
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowNotification(true);
        };

        const handleQueueUpdated = () => {
            updatePendingCount();
        };

        const handleSyncComplete = (event: CustomEvent<SyncResult>) => {
            setSyncResult(event.detail);
            setIsSyncing(false);
            setTimeout(() => setSyncResult(null), 5000);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('offline-queue-updated', handleQueueUpdated);
        window.addEventListener('offline-sync-complete', handleSyncComplete as EventListener);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('offline-queue-updated', handleQueueUpdated);
            window.removeEventListener('offline-sync-complete', handleSyncComplete as EventListener);
        };
    }, []);

    const handleManualSync = async () => {
        if (!isOnline || isSyncing) return;
        setIsSyncing(true);
        await offlineQueue.sync();
    };

    // Hiçbir şey gösterme koşulları
    if (isOnline && pendingCount === 0 && !showNotification && !syncResult) {
        return null;
    }

    return (
        <>
            {/* Offline/Online Banner */}
            {(!isOnline || showNotification) && (
                <div
                    className={`fixed top-0 left-0 right-0 z-[9999] px-4 py-2 text-center text-sm font-medium transition-all duration-300 ${isOnline
                            ? 'bg-green-500 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        {isOnline ? (
                            <>
                                <Wifi className="w-4 h-4" />
                                <span>İnternet bağlantısı geri geldi</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-4 h-4" />
                                <span>Çevrimdışısınız - Verileriniz otomatik senkronize edilecek</span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Pending Mutations Badge */}
            {pendingCount > 0 && (
                <div className="fixed bottom-4 right-4 z-[9999]">
                    <button
                        onClick={handleManualSync}
                        disabled={!isOnline || isSyncing}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all ${isOnline
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                                : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                            }`}
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span className="text-sm font-medium">
                            {isSyncing ? 'Senkronize ediliyor...' : `${pendingCount} bekleyen`}
                        </span>
                    </button>
                </div>
            )}

            {/* Sync Result Toast */}
            {syncResult && (
                <div className="fixed bottom-4 left-4 z-[9999] bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700">
                    <div className="flex items-center gap-3">
                        {syncResult.failed === 0 ? (
                            <Check className="w-5 h-5 text-green-400" />
                        ) : (
                            <X className="w-5 h-5 text-red-400" />
                        )}
                        <div>
                            <p className="font-medium">Senkronizasyon Tamamlandı</p>
                            <p className="text-sm text-slate-400">
                                {syncResult.success} başarılı
                                {syncResult.failed > 0 && `, ${syncResult.failed} başarısız`}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
