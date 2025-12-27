'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { ReactNode, useState, useEffect } from 'react';
import { get, set, del } from 'idb-keyval';
import { setupOfflineSync } from './offline-sync';

// IndexedDB tabanlı async storage
const idbStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const value = await get(key);
      return value ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await set(key, value);
    } catch (error) {
      console.error('[ReactQuery] IndexedDB yazma hatası:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await del(key);
    } catch (error) {
      console.error('[ReactQuery] IndexedDB silme hatası:', error);
    }
  },
};

// Persister - IndexedDB'de verileri saklar
const persister = createSyncStoragePersister({
  storage: {
    getItem: (key: string) => {
      // Sync wrapper for async storage
      let result: string | null = null;
      get(key).then((value) => {
        result = value ?? null;
      }).catch(() => {
        result = null;
      });
      return result;
    },
    setItem: (key: string, value: string) => {
      set(key, value).catch((error) => {
        console.error('[ReactQuery] IndexedDB yazma hatası:', error);
      });
    },
    removeItem: (key: string) => {
      del(key).catch((error) => {
        console.error('[ReactQuery] IndexedDB silme hatası:', error);
      });
    },
  },
  key: 'isg-pratik-query-cache',
});

// QueryClient yapılandırması
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache süreleri
        staleTime: 10 * 60 * 1000, // 10 dakika - veri taze kabul edilir
        gcTime: 24 * 60 * 60 * 1000, // 24 saat - cache'te tutulur (persistence için uzun)
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: true, // İnternet geldiğinde yenile
        retry: 1,
      },
    },
  });
}

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Offline sync'i başlat
    setupOfflineSync();
  }, []);

  // SSR sırasında basit provider kullan
  if (!isClient) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  // Client'ta PersistQueryClientProvider kullan
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000, // 24 saat
        buster: 'v1', // Cache'i invalidate etmek için bu değeri değiştirin
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
