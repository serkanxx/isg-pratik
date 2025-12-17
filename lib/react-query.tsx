'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache süreleri
            staleTime: 10 * 60 * 1000, // 10 dakika - veri taze kabul edilir (cache'ten hemen gösterilir)
            gcTime: 60 * 60 * 1000, // 1 saat (eski adı cacheTime) - cache'te tutulur
            refetchOnWindowFocus: false, // Pencere odağa geldiğinde otomatik yenileme kapalı
            refetchOnMount: false, // Component mount olduğunda cache'ten direkt göster (yenileme yapma)
            refetchOnReconnect: false, // İnternet bağlantısı geldiğinde otomatik yenileme kapalı
            retry: 1, // Hata durumunda 1 kez daha dene
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
