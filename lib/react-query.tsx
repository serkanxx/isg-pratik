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
            staleTime: 5 * 60 * 1000, // 5 dakika - veri taze kabul edilir
            gcTime: 30 * 60 * 1000, // 30 dakika (eski adı cacheTime) - cache'te tutulur
            refetchOnWindowFocus: false, // Pencere odağa geldiğinde otomatik yenileme kapalı
            refetchOnMount: false, // Component mount olduğunda otomatik yenileme kapalı
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
