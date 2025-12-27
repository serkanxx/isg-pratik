import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performans optimizasyonları
  compress: true, // Gzip compression
  poweredByHeader: false, // Güvenlik için X-Powered-By header'ını kaldır

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 gün cache
  },

  // Experimental optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@prisma/client'],
  },

  // Turbopack config (Next.js 16+ için gerekli)
  turbopack: {},

  // Webpack optimizations (production build için)
  webpack: (config, { isServer }) => {
    // Production build optimizations
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunks
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunks
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // PDF libraries chunk
            pdf: {
              name: 'pdf',
              test: /[\\/]node_modules[\\/](jspdf|@pdfme)[\\/]/,
              chunks: 'all',
              priority: 30,
            },
          },
        },
      };
    }
    return config;
  },

  // 301 Redirects for SEO - old /panel/* URLs to new root-level URLs
  async redirects() {
    return [
      { source: '/panel/acil-durum', destination: '/acil-durum', permanent: true },
      { source: '/panel/arsiv', destination: '/arsiv', permanent: true },
      { source: '/panel/egitim-katilim', destination: '/egitim-katilim', permanent: true },
      { source: '/panel/firmalar', destination: '/firmalar', permanent: true },
      { source: '/panel/is-izin-formu', destination: '/is-izin-formu', permanent: true },
      { source: '/panel/nace-kod', destination: '/nace-kod', permanent: true },
      { source: '/panel/notlarim', destination: '/notlarim', permanent: true },
      { source: '/panel/raporlarim', destination: '/raporlarim', permanent: true },
      { source: '/panel/risk-maddelerim', destination: '/risk-maddelerim', permanent: true },
      { source: '/panel/sertifika', destination: '/sertifika', permanent: true },
      { source: '/panel/ziyaret-programi', destination: '/ziyaret-programi', permanent: true },
      // Query parametreli URL'ler için
      { source: '/panel/firmalar/:path*', destination: '/firmalar/:path*', permanent: true },
    ];
  },

  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
