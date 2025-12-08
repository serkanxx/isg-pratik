import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "İSG Pratik - İş Güvenliği Risk Değerlendirme Sistemi",
    template: "%s | İSG Pratik"
  },
  description: "İş Sağlığı ve Güvenliği (İSG) Risk Değerlendirme Sistemi. Fine-Kinney metoduyla profesyonel risk analizi yapın. Ücretsiz online risk değerlendirme aracı.",
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
    "online risk değerlendirme"
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
    description: "Fine-Kinney metoduyla profesyonel risk değerlendirmesi yapın. Ücretsiz online iş güvenliği risk analizi aracı.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "İSG Pratik - Risk Değerlendirme Sistemi",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "İSG Pratik - İş Güvenliği Risk Değerlendirme Sistemi",
    description: "Fine-Kinney metoduyla profesyonel risk değerlendirmesi yapın. Ücretsiz online iş güvenliği risk analizi aracı.",
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

  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // JSON-LD yapılandırılmış veri
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
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
      "description": "3 ay ücretsiz premium deneme"
    },
    "provider": {
      "@type": "Organization",
      "name": "İSG Pratik",
      "url": "https://isgpratik.com"
    },
    "featureList": [
      "Fine-Kinney risk değerlendirme metodu",
      "Otomatik risk skoru hesaplama",
      "PDF rapor oluşturma",
      "Risk kütüphanesi",
      "Sektörel risk analizi"
    ],
    "inLanguage": "tr"
  };

  return (
    <html lang="tr">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/isgpratik.png" />
        <link rel="apple-touch-icon" href="/isgpratik.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
