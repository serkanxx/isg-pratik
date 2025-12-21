"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from "next/link";
import {
  Shield, Brain, AlertTriangle, Calendar, BookOpen, Eye, FileText, Users, Building,
  CheckCircle, Clock, ChevronRight, Star, Zap, Target, BarChart3, FileCheck, Map, LogOut, User,
  StickyNote, CalendarDays, Flame, Moon, Search, Bell, Info, X
} from 'lucide-react';
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

// LiveDashboard'u client-only olarak yükle (hydration hatasını önlemek için)
const LiveDashboard = dynamic(() => import('./components/LiveDashboard'), {
  ssr: false,
  loading: () => (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative bg-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden p-6">
        <div className="h-64 flex items-center justify-center">
          <div className="text-slate-500 text-sm">Yükleniyor...</div>
        </div>
      </div>
    </div>
  )
});

export default function LandingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  // Bildirim state'leri
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());

  // Bildirimleri localStorage'dan yükle
  useEffect(() => {
    const stored = localStorage.getItem('readNotificationIds');
    if (stored) {
      try {
        setReadNotificationIds(new Set(JSON.parse(stored)));
      } catch (err) {
        console.error("Bildirim verileri yüklenemedi:", err);
      }
    }
  }, []);

  // Bildirim verileri
  const today = new Date();
  const notifications = [
    {
      id: 'is-ilanlari',
      title: 'İSG İş İlanları Eklendi',
      description: 'İSG iş ilanları bölümü eklendi, iş arayanlar ve işverenler için platform oluşturuldu.',
      date: new Date(today)
    },
    {
      id: 'mobil-iyilestirme',
      title: 'Mobil Görünümde İyileştirmeler Yapıldı',
      description: 'Mobil cihazlarda daha iyi bir deneyim için arayüz iyileştirmeleri yapıldı.',
      date: new Date(today)
    },
    {
      id: 'dosya-arsivi',
      title: 'İSG Dev Dosya Arşivi Eklendi',
      description: 'Kapsamlı İSG dosya arşivi eklendi, binlerce dokümana kolayca erişebilirsiniz.',
      date: new Date(today)
    }
  ];

  // Okunmamış bildirim sayısı
  const unreadCount = notifications.filter(n => !readNotificationIds.has(n.id)).length;

  // Bildirim penceresini aç
  const handleOpenNotifications = () => {
    setShowNotifications(true);
  };

  // Bildirim penceresini kapat
  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };

  // Bildirim penceresi açıldığında 2 saniye sonra otomatik okundu işaretle
  useEffect(() => {
    if (showNotifications && unreadCount > 0) {
      const timer = setTimeout(() => {
        // Tüm okunmamış bildirimleri okundu olarak işaretle
        setReadNotificationIds(prevIds => {
          const unreadIds = notifications
            .filter(n => !prevIds.has(n.id))
            .map(n => n.id);
          
          if (unreadIds.length > 0) {
            const newReadIds = new Set(prevIds);
            unreadIds.forEach(id => newReadIds.add(id));
            localStorage.setItem('readNotificationIds', JSON.stringify(Array.from(newReadIds)));
            return newReadIds;
          }
          return prevIds;
        });
      }, 2000); // 2 saniye

      return () => clearTimeout(timer);
    }
  }, [showNotifications, unreadCount]);

  // Bildirimi okundu olarak işaretle
  const markAsRead = (id: string) => {
    const newReadIds = new Set(readNotificationIds);
    newReadIds.add(id);
    setReadNotificationIds(newReadIds);
    localStorage.setItem('readNotificationIds', JSON.stringify(Array.from(newReadIds)));
  };

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadNotificationIds(allIds);
    localStorage.setItem('readNotificationIds', JSON.stringify(Array.from(allIds)));
  };

  const features = [
    {
      icon: Shield,
      title: "Risk Değerlendirme",
      description: "Fine Kinney metodolojisi ile hızlı ve kapsayıcı Risk Değerlendirme dosyanı hazırla. Sektöre özel tehlike listeleri.",
      color: "bg-purple-500",
      active: true,
      href: "/risk-degerlendirme"
    },
    {
      icon: AlertTriangle,
      title: "Acil Durum Planları",
      description: "İEYEP uyumlu planlar, tatbikat kayıtları, görevlendirmeler, krokiler.",
      color: "bg-orange-500",
      active: true,
      href: "/panel/acil-durum"
    },
    {
      icon: Flame,
      title: "İş İzin Formu",
      description: "Sıcak iş, yüksekte çalışma, kapalı alan ve elektrik çalışmaları için izin formları.",
      color: "bg-red-500",
      active: true,
      href: "/panel/is-izin-formu"
    },
    {
      icon: Building,
      title: "Çoklu Firma Yönetimi",
      description: "OSGB'ler ve İSG uzmanları için tüm müşteriler tek panelden yönetim.",
      color: "bg-pink-500",
      active: true,
      href: "/panel/firmalar"
    },
    {
      icon: CalendarDays,
      title: "Firma Ziyaret Programı",
      description: "Haftalık ve aylık ziyaret programları oluştur, takip et ve yönet.",
      color: "bg-blue-500",
      active: true,
      href: "/panel/ziyaret-programi"
    },
    {
      icon: StickyNote,
      title: "Not & Hatırlatma",
      description: "Firmaya özel notlar, görev takibi ve hatırlatmalar ile hiçbir şeyi unutma.",
      color: "bg-amber-500",
      active: true,
      href: "/panel/notlarim"
    },
    {
      icon: Search,
      title: "NACE Kod Sorgulama",
      description: "NACE kodunu girerek faaliyet alanı ve tehlike sınıfını anında öğrenin.",
      color: "bg-indigo-500",
      active: true,
      href: "/panel/nace-kod"
    },
    {
      icon: Eye,
      title: "Saha Gözlem Formları",
      description: "AI destekli gözlem raporları. Fotoğraf ekleme, DÖF atama.",
      color: "bg-cyan-500",
      active: false
    },
    {
      icon: FileCheck,
      title: "DÖF Yönetimi",
      description: "Düzeltici önleyici faaliyetler, görev atamaları, takip sistemi.",
      color: "bg-teal-500",
      active: false
    }
  ];

  // SEO için structured data - tüm aktif özellikleri dahil et
  const activeFeatures = features.filter(f => f.active);
  // Sabit değer kullanarak hydration mismatch'i önle
  const activeFeatureCount = 7;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "İSG Pratik - İş Güvenliği Risk Değerlendirme Sistemi",
    "description": "Fine-Kinney metoduyla profesyonel risk değerlendirmesi yapın. Ücretsiz online iş güvenliği risk analizi aracı.",
    "url": "https://isgpratik.com",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": activeFeatures.map((feature, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": feature.title,
        "description": feature.description
      }))
    }
  };

  const enterpriseFeatures = [
    {
      icon: Shield,
      title: "Risk Yönetimi",
      color: "bg-purple-100 text-purple-600",
      items: [
        "Fine Kinney metodu",
        "Sektöre özel tehlike kütüphanesi",
        "Otomatik risk skorlama",
        "AI destekli risk önerileri",
        "Profesyonel PDF çıktıları"
      ]
    },
    {
      icon: Building,
      title: "Firma Yönetimi",
      color: "bg-pink-100 text-pink-600",
      items: [
        "Sınırsız firma kaydı",
        "Tehlike sınıfı takibi",
        "İSG ekibi bilgileri",
        "Firma bazlı raporlama",
        "Ziyaret programı entegrasyonu",
        "NACE kod sorgulama"
      ]
    },
    {
      icon: CalendarDays,
      title: "Planlama & Takip",
      color: "bg-blue-100 text-blue-600",
      items: [
        "Haftalık/aylık ziyaret programı",
        "Firma bazlı notlar",
        "Hatırlatma sistemi",
        "Görev takibi",
        "Rapor arşivi"
      ]
    }
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-white">
      {/* NAVBAR */}
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-xl border-b border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center group">
                <div className="transition-transform duration-300 group-hover:scale-110">
                  <img src="/logo.png" alt="Logo" className="w-12 h-12 sm:w-20 sm:h-20 object-contain drop-shadow-md" />
                </div>
                <div className="ml-2 sm:ml-3 flex flex-col">
                  <span className="text-base sm:text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 group-hover:to-white transition-all">İSG Pratik</span>
                  <span className="hidden sm:block text-xs text-blue-300/80 tracking-widest uppercase group-hover:text-blue-200 transition-colors">Risk Yönetim Sistemi</span>
                </div>
              </Link>
            </div>



            {session ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-sm text-blue-100 hidden sm:inline-flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {session.user?.name || session.user?.email}
                </span>
                <Link
                  href="/panel"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 border border-blue-400/20"
                >
                  <span className="hidden sm:inline">Panele Git</span>
                  <span className="sm:hidden">Panel</span>
                </Link>
                {/* Bildirim Butonu */}
                <div className="relative">
                  <button
                    onClick={handleOpenNotifications}
                    className="relative p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    title="Bildirimler"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full text-[10px] font-bold bg-red-500 text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: 'https://www.isgpratik.com/' })}
                  className="p-2 text-white/70 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
                  title="Çıkış Yap"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4">
                <Link href="/login" className="hidden sm:block text-blue-100 hover:text-white text-sm font-medium transition-colors">
                  Giriş Yap
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 border border-blue-400/20"
                >
                  <span className="hidden sm:inline">Ücretsiz Başla</span>
                  <span className="sm:hidden">Başla</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-20 sm:pt-24 pb-12 sm:pb-16 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Sol: Başlık ve CTA */}
            <div className="text-white text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                <span className="text-xs sm:text-sm">Yapay Zeka Destekli İSG Platformu</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                İş Güvenliğine
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400">
                  Pratik Çözüm
                </span>
              </h1>

              <p className="text-base sm:text-lg text-gray-300 mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0">
                Risk analizi, acil durum planları, iş izin formları ve firma yönetimi.
                <strong className="text-white"> Tüm İSG ihtiyaçların tek platformda.</strong>
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 mb-4">
                <Link
                  href={session ? "/panel" : "/register"}
                  className="inline-flex items-center gap-2 bg-white text-indigo-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                  {session ? "Panele Git" : "Ücretsiz Başla"}
                </Link>
                {!session && (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 border-2 border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors"
                  >
                    <Users className="w-5 h-5" />
                    Giriş Yap
                  </Link>
                )}
              </div>


              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-300">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="ml-1">4.9/5</span>
                </div>
              </div>
            </div>

            {/* Sağ: Dashboard Mockup (Canlı Animasyon) */}
            <div className="relative hidden lg:block" suppressHydrationWarning>
              <LiveDashboard />
            </div>
          </div>
        </div>
      </section>



      {/* FEATURES SECTION */}
      <section id="moduller" className="py-20" itemScope itemType="https://schema.org/ItemList" suppressHydrationWarning>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wide">KAPSAMLI İSG YÖNETİM PLATFORMU</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2">
              Tek Platformda <span className="text-indigo-600">Tüm İSG İhtiyaçlarınız</span>
            </h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
              {activeFeatureCount} aktif modül ile İSG süreçlerinizi kolayca yönetin
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <article
                key={index}
                itemScope
                itemType="https://schema.org/SoftwareApplication"
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${feature.active
                  ? 'border-indigo-200 bg-white shadow-lg hover:shadow-xl cursor-pointer hover:border-indigo-400'
                  : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200'
                  }`}
                onClick={() => feature.active && feature.href && router.push(feature.href)}
              >
                {!feature.active && (
                  <span className="absolute -top-2 right-4 bg-gray-400 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    YAKINDA
                  </span>
                )}

                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2" itemProp="name">{feature.title}</h3>
                <p className="text-sm text-gray-600" itemProp="description">{feature.description}</p>

                {feature.active && (
                  <div className="mt-4 flex items-center text-indigo-600 font-semibold text-sm">
                    Hemen Başla <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ENTERPRISE FEATURES */}
      <section id="ozellikler" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2">
              <span className="text-indigo-600">Kapsamlı Özellikler</span>
            </h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
              İSG yönetiminin tüm ihtiyaçlarını karşılayan güçlü araçlar
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enterpriseFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <ul className="space-y-3">
                  {feature.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            İSG Süreçlerinizi Dijitalleştirin
          </h2>
          <p className="text-indigo-100 mb-8 text-lg">
            Risk analizi, acil durum planları, iş izin formları ve daha fazlası tek platformda.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors"
            >
              Ücretsiz Başla
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6 md:gap-8 text-center md:text-left">
            {/* Sol: Logo ve Copyright */}
            <div className="flex flex-col items-center md:items-start gap-3 sm:gap-4">
              <div className="flex items-center gap-2 group">
                <div className="transition-transform duration-300 group-hover:scale-110">
                  <img src="/logo.png" alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-gray-300 group-hover:text-white transition-colors">İSG Pratik</span>
              </div>
              <p className="text-xs sm:text-sm">© 2025 İSG Pratik. Tüm hakları saklıdır.</p>
            </div>

            {/* Orta: Bilgilendirme Linkleri */}
            <div className="flex flex-col items-center gap-2">
              <Link href="/risk-degerlendirme-nedir" className="hover:text-white text-sm">
                Risk Değerlendirme Nedir?
              </Link>
              <Link href="/acil-durum-eylem-plani-hakkinda" className="hover:text-white text-sm">
                Acil Durum Eylem Planı Hakkında
              </Link>
              <Link href="/is-ilanlari" className="hover:text-white text-sm">
                İş İlanları
              </Link>
            </div>

            {/* Sağ: Gizlilik, Kullanım, KVKK - mobilde yatay, masaüstünde dikey */}
            <div className="flex flex-row flex-wrap justify-center md:flex-col gap-3 md:gap-2 text-xs sm:text-sm md:text-right">
              <Link href="/gizlilik-politikasi" className="hover:text-white">Gizlilik Politikası</Link>
              <Link href="/kullanim-kosullari" className="hover:text-white">Kullanım Koşulları</Link>
              <Link href="/kvkk" className="hover:text-white">KVKK</Link>
              <Link href="/iletisim" className="hover:text-white">İletişim</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Bildirim Penceresi */}
      {showNotifications && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleCloseNotifications}
          />
          <div className="fixed right-4 top-20 md:right-8 md:top-20 w-[90vw] max-w-md max-h-[80vh] rounded-xl shadow-2xl z-50 overflow-hidden bg-white border border-slate-200">
            {/* Başlık */}
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-lg text-slate-900">
                  Bildirimler
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">
                    {unreadCount} yeni
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-2 py-1 text-xs font-medium rounded-lg transition-colors text-indigo-600 hover:bg-slate-100"
                  >
                    Tümünü okundu işaretle
                  </button>
                )}
                <button
                  onClick={handleCloseNotifications}
                  className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Bildirim Listesi */}
            <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Henüz bildirim yok</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {notifications.map((notification) => {
                    const isRead = readNotificationIds.has(notification.id);
                    return (
                      <div
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`p-4 cursor-pointer transition-colors ${isRead
                          ? 'bg-slate-50 hover:bg-slate-100'
                          : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 flex-shrink-0 ${isRead
                            ? 'text-slate-400'
                            : 'text-blue-600'
                            }`}>
                            <Info className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-bold text-sm text-slate-900">
                                {notification.title}
                              </h4>
                              {!isRead && (
                                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
                              )}
                            </div>
                            <p className="text-sm leading-relaxed text-slate-600">
                              {notification.description}
                            </p>
                            <p className="text-xs mt-2 text-slate-400">
                              {notification.date.toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
    </>
  );
}