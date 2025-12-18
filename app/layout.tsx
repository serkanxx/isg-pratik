import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Kalam } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/app/context/ThemeContext";
import { Analytics } from "@vercel/analytics/next";
import { ReactQueryProvider } from "@/lib/react-query";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const kalam = Kalam({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  variable: '--font-kalam',
});

export const metadata: Metadata = {
  title: {
    default: "İSG Pratik - İş Güvenliği Risk Değerlendirme Sistemi",
    template: "%s | İSG Pratik"
  },
  description: "İSG'de pratik dijital çözümler. Risk değerlendirme, acil durum eylem planı otomatik indir, iş izin formları, NACE kod sorgulama ve daha fazlası. Ücretsiz İSG yönetim platformu.",
  keywords: [
    "isg",
    "iş güvenliği",
    "risk değerlendirme",
    "fine kinney",
    "iş sağlığı",
    "risk analizi",
    "tehlike analizi",
    "osgb",
    "iş güvenliği uzmanı",
    "risk değerlendirme formu",
    "risk skoru hesaplama",
    "isg yazılımı",
    "online risk değerlendirme",
    "acil durum eylem planı",
    "ieyep",
    "iş izin formu",
    "nace kod sorgulama",
    "tehlike sınıfı",
    "6331 sayılı kanun",
    "iş güvenliği platformu",
    "isg yönetim sistemi",
    "risk değerlendirme programı",
    "iş güvenliği raporu",
    "isg dokümantasyon"
  ],
  authors: [{ name: "İSG Pratik", url: "https://isgpratik.com" }],
  creator: "İSG Pratik",
  publisher: "İSG Pratik",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://isgpratik.com",
    siteName: "İSG Pratik",
    title: "İSG Pratik - İş Güvenliği Risk Değerlendirme Sistemi",
    description: "İSG'de pratik dijital çözümler. Risk değerlendirme, acil durum eylem planı otomatik indir, iş izin formları, NACE kod sorgulama ve daha fazlası. Ücretsiz İSG yönetim platformu.",
    images: [
      {
        url: "https://isgpratik.com/logo.png",
        width: 1200,
        height: 630,
        alt: "İSG Pratik - Risk Değerlendirme Sistemi",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "İSG Pratik - İş Güvenliği Risk Değerlendirme Sistemi",
    description: "İSG'de pratik dijital çözümler. Risk değerlendirme, acil durum eylem planı otomatik indir, iş izin formları, NACE kod sorgulama ve daha fazlası.",
    images: ["/og-image.png"],
    creator: "@isgpratik",
  },
  verification: {
    google: "j4rFgnURFww2H9HH7z5kWXtedMvdalOyefFAJqPlsr8", // Google Search Console doğrulama kodu
  },
  alternates: {
    canonical: "https://www.isgpratik.com",
  },
  category: "İş Güvenliği",
  icons: {
    icon: [
      { url: 'https://isgpratik.com/favicon.ico', sizes: 'any' },
      { url: 'https://isgpratik.com/favicon.svg', type: 'image/svg+xml' },
      { url: 'https://isgpratik.com/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    shortcut: 'https://isgpratik.com/favicon.ico',
    apple: 'https://isgpratik.com/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // JSON-LD yapılandırılmış veri
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://isgpratik.com/#organization",
        "name": "İSG Pratik",
        "url": "https://isgpratik.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://isgpratik.com/logo.png",
          "width": 512,
          "height": 512
        },
        "sameAs": [
          "https://www.isgpratik.com"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "availableLanguage": "Turkish"
        }
      },
      {
        "@type": "WebApplication",
        "@id": "https://isgpratik.com/#webapp",
        "name": "İSG Pratik",
        "alternateName": "İSG Pratik Risk Değerlendirme Sistemi",
        "description": "İş Sağlığı ve Güvenliği Risk Değerlendirme Sistemi. Fine-Kinney metoduyla profesyonel risk analizi yapın.",
        "url": "https://isgpratik.com",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "TRY",
          "description": "Ücretsiz risk değerlendirme aracı"
        },
        "provider": {
          "@id": "https://isgpratik.com/#organization"
        },
        "featureList": [
          "Fine-Kinney risk değerlendirme metodu",
          "Otomatik risk skoru hesaplama",
          "PDF rapor oluşturma",
          "Risk kütüphanesi",
          "Sektörel risk analizi",
          "Acil durum eylem planı",
          "İş izin formları",
          "NACE kod sorgulama",
          "Firma ziyaret programı"
        ],
        "inLanguage": "tr",
        "audience": {
          "@type": "Audience",
          "audienceType": "İş Güvenliği Uzmanları, OSGB'ler, İSG Profesyonelleri"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://isgpratik.com/#website",
        "url": "https://isgpratik.com",
        "name": "İSG Pratik",
        "description": "İş Güvenliği Risk Değerlendirme ve Yönetim Sistemi",
        "publisher": {
          "@id": "https://isgpratik.com/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://isgpratik.com/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        },
        "inLanguage": "tr"
      }
    ]
  };

  return (
    <html lang="tr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="canonical" href="https://isgpratik.com" />
        <link rel="icon" href="https://isgpratik.com/favicon.ico" sizes="any" />
        <link rel="icon" href="https://isgpratik.com/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="https://isgpratik.com/favicon-96x96.png" type="image/png" sizes="96x96" />
        <link rel="shortcut icon" href="https://isgpratik.com/favicon.ico" />
        <link rel="apple-touch-icon" href="https://isgpratik.com/apple-touch-icon.png" />
        <meta name="google-site-verification" content="j4rFgnURFww2H9HH7z5kWXtedMvdalOyefFAJqPlsr8" />
        <meta name="geo.region" content="TR" />
        <meta name="geo.placename" content="Türkiye" />
        <meta name="language" content="Turkish" />
        <meta name="revisit-after" content="7 days" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${kalam.variable} antialiased`}
      >
        <AuthProvider>
          <ThemeProvider>
            <ReactQueryProvider>
              {children}
            </ReactQueryProvider>
          </ThemeProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
