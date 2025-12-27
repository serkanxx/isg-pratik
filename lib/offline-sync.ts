'use client';

import { get, set, del, keys } from 'idb-keyval';

// Offline mutation için kullanılacak tip
export interface PendingMutation {
    id: string;
    url: string;
    method: 'POST' | 'PUT' | 'DELETE';
    body: unknown;
    timestamp: number;
    retryCount: number;
    entityType: 'note' | 'risk' | 'company' | 'report' | 'other';
}

const QUEUE_PREFIX = 'offline-mutation-';
const MAX_RETRIES = 3;

/**
 * Offline Mutation Queue
 * Çevrimdışı veri girişlerini IndexedDB'de saklar ve
 * internet geldiğinde senkronize eder
 */
export const offlineQueue = {
    /**
     * Yeni bir mutation'ı kuyruğa ekle
     */
    add: async (mutation: Omit<PendingMutation, 'id' | 'timestamp' | 'retryCount'>): Promise<string> => {
        const id = `${QUEUE_PREFIX}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const pendingMutation: PendingMutation = {
            ...mutation,
            id,
            timestamp: Date.now(),
            retryCount: 0,
        };
        await set(id, pendingMutation);

        // Custom event dispatch et - UI güncellemesi için
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('offline-queue-updated'));
        }

        return id;
    },

    /**
     * Tüm bekleyen mutation'ları getir
     */
    getAll: async (): Promise<PendingMutation[]> => {
        const allKeys = await keys();
        const mutationKeys = allKeys.filter(key =>
            typeof key === 'string' && key.startsWith(QUEUE_PREFIX)
        );

        const mutations: PendingMutation[] = [];
        for (const key of mutationKeys) {
            const mutation = await get<PendingMutation>(key);
            if (mutation) {
                mutations.push(mutation);
            }
        }

        // Timestamp'e göre sırala (eski önce)
        return mutations.sort((a, b) => a.timestamp - b.timestamp);
    },

    /**
     * Kuyruktan bir mutation'ı sil
     */
    remove: async (id: string): Promise<void> => {
        await del(id);

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('offline-queue-updated'));
        }
    },

    /**
     * Retry sayısını artır
     */
    incrementRetry: async (id: string): Promise<void> => {
        const mutation = await get<PendingMutation>(id);
        if (mutation) {
            mutation.retryCount += 1;
            await set(id, mutation);
        }
    },

    /**
     * Bekleyen mutation sayısını getir
     */
    getCount: async (): Promise<number> => {
        const allKeys = await keys();
        return allKeys.filter(key =>
            typeof key === 'string' && key.startsWith(QUEUE_PREFIX)
        ).length;
    },

    /**
     * İnternet geldiğinde tüm bekleyen mutation'ları senkronize et
     */
    sync: async (): Promise<{ success: number; failed: number }> => {
        const mutations = await offlineQueue.getAll();
        let success = 0;
        let failed = 0;

        for (const mutation of mutations) {
            try {
                const response = await fetch(mutation.url, {
                    method: mutation.method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(mutation.body),
                });

                if (response.ok) {
                    await offlineQueue.remove(mutation.id);
                    success++;
                } else {
                    // Retry count kontrolü
                    if (mutation.retryCount >= MAX_RETRIES) {
                        await offlineQueue.remove(mutation.id);
                        failed++;
                    } else {
                        await offlineQueue.incrementRetry(mutation.id);
                        failed++;
                    }
                }
            } catch {
                // Retry count kontrolü
                if (mutation.retryCount >= MAX_RETRIES) {
                    await offlineQueue.remove(mutation.id);
                    failed++;
                } else {
                    await offlineQueue.incrementRetry(mutation.id);
                    failed++;
                }
            }
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('offline-queue-updated'));
        }

        return { success, failed };
    },
};

/**
 * Online/Offline durumunu dinle ve senkronize et
 */
export function setupOfflineSync(): void {
    if (typeof window === 'undefined') return;

    const handleOnline = async () => {
        console.log('[OfflineSync] İnternet bağlantısı geri geldi, senkronizasyon başlıyor...');
        const result = await offlineQueue.sync();
        console.log(`[OfflineSync] Senkronizasyon tamamlandı: ${result.success} başarılı, ${result.failed} başarısız`);

        // Başarılı senkronizasyon için bildirim
        if (result.success > 0) {
            window.dispatchEvent(new CustomEvent('offline-sync-complete', {
                detail: result
            }));
        }
    };

    window.addEventListener('online', handleOnline);

    // Sayfa yüklendiğinde de kontrol et
    if (navigator.onLine) {
        offlineQueue.getCount().then(count => {
            if (count > 0) {
                handleOnline();
            }
        });
    }
}

/**
 * Fetch wrapper - çevrimdışıyken kuyruğa ekler
 */
export async function offlineFetch(
    url: string,
    options: {
        method: 'POST' | 'PUT' | 'DELETE';
        body: unknown;
        entityType?: PendingMutation['entityType'];
    }
): Promise<Response | { offline: true; queueId: string }> {
    // Online ise normal fetch yap
    if (typeof navigator !== 'undefined' && navigator.onLine) {
        return fetch(url, {
            method: options.method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(options.body),
        });
    }

    // Offline ise kuyruğa ekle
    const queueId = await offlineQueue.add({
        url,
        method: options.method,
        body: options.body,
        entityType: options.entityType || 'other',
    });

    return { offline: true, queueId };
}
