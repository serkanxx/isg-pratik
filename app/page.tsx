"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from "next/link";
import {
  Shield, Brain, AlertTriangle, Calendar, BookOpen, Eye, FileText, Users, Building,
  CheckCircle, Clock, ChevronRight, Star, Zap, Target, BarChart3, FileCheck, Map, LogOut, User,
  StickyNote, CalendarDays, Flame, Moon, Search, Bell, Info, X, ArrowRight, Sparkles,
  TrendingUp, Award, Play, Lock, Folder, Briefcase
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

  // Ana özellikler - dikkat çekici kartlar için
  const mainFeatures = [
    {
      icon: Shield,
      title: "Risk Değerlendirme",
      description: "Fine Kinney metodolojisi ile profesyonel risk analizi. Yapay zeka destekli tehlike tespiti ve otomatik önlem önerileri.",
      color: "from-purple-500 to-indigo-600",
      bgColor: "bg-purple-500/10",
      iconBg: "bg-purple-500",
      href: "/risk-degerlendirme",
      badge: "Popüler"
    },
    {
      icon: AlertTriangle,
      title: "Acil Durum Planları",
      description: "Yangın, deprem, iş kazası, kimyasal döküntü senaryoları. İYEP uyumlu planlar ve tatbikat formları.",
      color: "from-orange-500 to-red-600",
      bgColor: "bg-orange-500/10",
      iconBg: "bg-orange-500",
      href: "/panel/acil-durum",
      badge: null
    },
    {
      icon: Flame,
      title: "İş İzin Formları",
      description: "Sıcak çalışma, yüksekte çalışma, kapalı alan ve elektrik izin formları. Tek tıkla PDF çıktısı.",
      color: "from-red-500 to-pink-600",
      bgColor: "bg-red-500/10",
      iconBg: "bg-red-500",
      href: "/panel/is-izin-formu",
      badge: null
    },
    {
      icon: Briefcase,
      title: "İSG İş İlanları",
      description: "İSG profesyonelleri için güncel iş ilanları. İş arayanlar ve işverenler için özel platform.",
      color: "from-pink-500 to-rose-600",
      bgColor: "bg-pink-500/10",
      iconBg: "bg-pink-500",
      href: "/is-ilanlari",
      badge: "Yeni"
    },
    {
      icon: CalendarDays,
      title: "Ziyaret Programı",
      description: "Haftalık ve aylık ziyaret planları. Takvim görünümü ile kolay takip ve yönetim.",
      color: "from-blue-500 to-cyan-600",
      bgColor: "bg-blue-500/10",
      iconBg: "bg-blue-500",
      href: "/panel/ziyaret-programi",
      badge: null
    },
    {
      icon: Folder,
      title: "İSG Dosya Arşivi",
      description: "Binlerce hazır İSG dokümanı. Talimatlar, prosedürler, formlar ve eğitim materyalleri.",
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-500/10",
      iconBg: "bg-emerald-500",
      href: "/panel/arsiv",
      badge: "Yeni",
      highlight: "2000'den Fazla Dosya"
    }
  ];

  // Hızlı erişim özellikleri
  const quickFeatures = [
    { icon: Search, title: "NACE Kod Sorgulama", href: "/panel/nace-kod" },
    { icon: StickyNote, title: "Not & Hatırlatma", href: "/panel/notlarim" },
    { icon: Briefcase, title: "İş İlanları", href: "/is-ilanlari" },
    { icon: FileText, title: "Rapor Arşivi", href: "/panel/raporlarim" }
  ];

  // İstatistikler
  const stats = [
    { value: "10.000+", label: "Hazır Risk Maddesi", icon: Shield },
    { value: "1000+", label: "İSG Profesyoneli", icon: Users },
    { value: "50.000+", label: "Oluşturulan Rapor", icon: FileText },
    { value: "7/24", label: "Erişim", icon: Clock }
  ];

  // SEO için structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "İSG Pratik - İş Güvenliği Risk Değerlendirme Sistemi",
    "description": "Fine-Kinney metoduyla profesyonel risk değerlendirmesi yapın. Ücretsiz online iş güvenliği risk analizi aracı.",
    "url": "https://isgpratik.com",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": mainFeatures.map((feature, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": feature.title,
        "description": feature.description
      }))
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-slate-950">
        {/* NAVBAR */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center gap-2">
                <Link href="/" className="flex items-center group">
                  <div className="transition-transform duration-300 group-hover:scale-110">
                    <img src="/logo.png" alt="Logo" className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md" />
                  </div>
                  <div className="ml-2 sm:ml-3 flex flex-col">
                    <span className="text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">İSG Pratik</span>
                    <span className="hidden sm:block text-xs text-slate-400 tracking-wide">Risk Yönetim Sistemi</span>
                  </div>
                </Link>
              </div>

              {session ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-sm text-slate-300 hidden sm:inline-flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {session.user?.name || session.user?.email}
                  </span>
                  <Link
                    href="/panel"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95"
                  >
                    <span className="hidden sm:inline">Panele Git</span>
                    <span className="sm:hidden">Panel</span>
                  </Link>
                  {/* Bildirim Butonu */}
                  <div className="relative">
                    <button
                      onClick={handleOpenNotifications}
                      className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                      title="Bildirimler"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: 'https://www.isgpratik.com/' })}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
                    title="Çıkış Yap"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-4">
                  <Link href="/login" className="hidden sm:block text-slate-300 hover:text-white text-sm font-medium transition-colors">
                    Giriş Yap
                  </Link>
                  <Link
                    href="/register"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95"
                  >
                    <span className="hidden sm:inline">Ücretsiz Başla</span>
                    <span className="sm:hidden">Başla</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* HERO SECTION - Yeniden Tasarlanmış */}
        <section className="relative pt-24 sm:pt-32 pb-20 sm:pb-32 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 via-purple-600/10 to-transparent" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Sol: Başlık ve CTA */}
              <div className="text-center lg:text-left">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/10">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-slate-200 font-medium">Yapay Zeka Destekli İSG Platformu</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black mb-6 leading-[1.1] tracking-tight">
                  <span className="text-white">İş Güvenliğini</span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                    Kolaylaştırıyoruz
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-slate-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Risk analizi, acil durum planları, iş izin formları ve firma yönetimi.
                  <strong className="text-white"> Tüm İSG süreçleriniz tek platformda.</strong>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                  <Link
                    href={session ? "/panel" : "/register"}
                    className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-blue-500/25 transition-all hover:scale-105"
                  >
                    {session ? "Panele Git" : "Ücretsiz Başla"}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  {!session && (
                    <Link
                      href="/login"
                      className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-semibold text-lg border border-white/10 transition-all"
                    >
                      <User className="w-5 h-5" />
                      Giriş Yap
                    </Link>
                  )}
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <span>4.9/5 Puan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-400" />
                    <span>KVKK Uyumlu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    <span>Tamamen Ücretsiz</span>
                  </div>
                </div>
              </div>

              {/* Sağ: Dashboard Mockup */}
              <div className="relative hidden lg:block" suppressHydrationWarning>
                <LiveDashboard />
              </div>
            </div>
          </div>
        </section>

        {/* QUICK STATS SECTION */}
        <section className="relative py-12 border-y border-white/5 bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-3 group-hover:scale-110 transition-transform">
                    <stat.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES SECTION - Ne Yapabilirsiniz? */}
        <section id="ozellikler" className="relative py-20 sm:py-32" suppressHydrationWarning>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-full mb-4">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-400 font-medium">Kapsamlı İSG Yönetimi</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
                Platformda Neler <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Yapabilirsiniz?</span>
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                İSG süreçlerinizi dijitalleştirin, zaman kazanın ve profesyonel raporlar oluşturun
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mainFeatures.map((feature, index) => (
                <div
                  key={index}
                  onClick={() => router.push(feature.href)}
                  className="group relative bg-slate-900/50 hover:bg-slate-800/50 border border-white/5 hover:border-white/10 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/5"
                >
                  {feature.badge && (
                    <span className="absolute -top-2 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                      {feature.badge}
                    </span>
                  )}

                  <div className={`w-14 h-14 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    {feature.description}
                  </p>

                  {(feature as any).highlight && (
                    <div className="mb-4 inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full">
                      <Sparkles className="w-3 h-3" />
                      {(feature as any).highlight}
                    </div>
                  )}

                  <div className="flex items-center text-blue-400 font-semibold text-sm group-hover:text-blue-300">
                    <span>Keşfet</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Access Features */}
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              {quickFeatures.map((feature, index) => (
                <Link
                  key={index}
                  href={feature.href}
                  className="inline-flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 hover:border-white/10 px-5 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all"
                >
                  <feature.icon className="w-4 h-4 text-slate-400" />
                  {feature.title}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* WHY US SECTION */}
        <section className="relative py-20 sm:py-32 bg-gradient-to-b from-slate-900/50 to-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Sol: Başlık ve Özellikler */}
              <div>
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-full mb-4">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-400 font-medium">Neden İSG Pratik?</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">
                  İSG Profesyonelleri İçin <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Tasarlandı</span>
                </h2>
                <p className="text-lg text-slate-400 mb-8">
                  Yıllarca sahada edinilen tecrübelerle geliştirilen, gerçek ihtiyaçlara cevap veren bir platform.
                </p>

                <div className="space-y-4">
                  {[
                    { icon: Zap, title: "Hızlı ve Kolay", desc: "Dakikalar içinde profesyonel raporlar oluşturun" },
                    { icon: Brain, title: "Yapay Zeka Destekli", desc: "Akıllı risk önerileri ve otomatik analiz" },
                    { icon: Lock, title: "Güvenli ve KVKK Uyumlu", desc: "Verileriniz Türkiye'de güvenle saklanır" },
                    { icon: TrendingUp, title: "Sürekli Güncelleme", desc: "Mevzuat değişikliklerine anında uyum" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-4 group">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <item.icon className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                        <p className="text-slate-400 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sağ: Görsel/İstatistik */}
              <div className="relative">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 border border-white/5 shadow-2xl">
                  {/* Mock Stats */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5">
                      <div className="text-4xl font-black text-white mb-2">%95</div>
                      <div className="text-sm text-slate-400">Müşteri Memnuniyeti</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5">
                      <div className="text-4xl font-black text-emerald-400 mb-2">10x</div>
                      <div className="text-sm text-slate-400">Daha Hızlı</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5">
                      <div className="text-4xl font-black text-blue-400 mb-2">7/24</div>
                      <div className="text-sm text-slate-400">Erişim</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5">
                      <div className="text-4xl font-black text-purple-400 mb-2">0₺</div>
                      <div className="text-sm text-slate-400">Başlangıç Ücreti</div>
                    </div>
                  </div>

                  {/* Testimonial */}
                  <div className="mt-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-white/5">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-slate-300 text-sm italic mb-4">
                      "İSG Pratik sayesinde risk değerlendirme süremiz yarıya indi. Artık daha fazla firmaya hizmet verebiliyoruz."
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        A
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">Ahmet Y.</div>
                        <div className="text-slate-400 text-xs">İSG Uzmanı, OSGB</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="relative py-20 sm:py-32 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzIiBjeT0iMyIgcj0iMyIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-sm text-white font-medium">Hemen Başlayın</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6">
              İSG Süreçlerinizi
              <br />
              <span className="text-cyan-300">Dijitalleştirin</span>
            </h2>

            <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Risk analizi, acil durum planları, iş izin formları ve daha fazlası.
              Ücretsiz deneyin, farkı görün.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:bg-gray-100 transition-all hover:scale-105"
              >
                Ücretsiz Başla
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-semibold text-lg border border-white/20 hover:bg-white/20 transition-all"
              >
                <User className="w-5 h-5" />
                Giriş Yap
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Kredi kartı gerekmez</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Anında erişim</span>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-slate-950 border-t border-white/5 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 text-center md:text-left">
              {/* Sol: Logo ve Copyright */}
              <div className="flex flex-col items-center md:items-start gap-4">
                <div className="flex items-center gap-2 group">
                  <div className="transition-transform duration-300 group-hover:scale-110">
                    <img src="/logo.png" alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-slate-300 group-hover:text-white transition-colors">İSG Pratik</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500">© 2025 İSG Pratik. Tüm hakları saklıdır.</p>
              </div>

              {/* Orta: Bilgilendirme Linkleri */}
              <div className="flex flex-col items-center gap-2">
                <Link href="/risk-degerlendirme-nedir" className="text-slate-400 hover:text-white text-sm transition-colors">
                  Risk Değerlendirme Nedir?
                </Link>
                <Link href="/acil-durum-eylem-plani-hakkinda" className="text-slate-400 hover:text-white text-sm transition-colors">
                  Acil Durum Eylem Planı Hakkında
                </Link>
                <Link href="/is-ilanlari" className="text-slate-400 hover:text-white text-sm transition-colors">
                  İş İlanları
                </Link>
              </div>

              {/* Sağ: Gizlilik, Kullanım, KVKK */}
              <div className="flex flex-row flex-wrap justify-center md:flex-col gap-3 md:gap-2 text-xs sm:text-sm md:text-right">
                <Link href="/gizlilik-politikasi" className="text-slate-400 hover:text-white transition-colors">Gizlilik Politikası</Link>
                <Link href="/kullanim-kosullari" className="text-slate-400 hover:text-white transition-colors">Kullanım Koşulları</Link>
                <Link href="/kvkk" className="text-slate-400 hover:text-white transition-colors">KVKK</Link>
                <Link href="/iletisim" className="text-slate-400 hover:text-white transition-colors">İletişim</Link>
              </div>
            </div>
          </div>
        </footer>

        {/* Bildirim Penceresi */}
        {showNotifications && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={handleCloseNotifications}
            />
            <div className="fixed right-4 top-20 md:right-8 md:top-20 w-[90vw] max-w-md max-h-[80vh] rounded-2xl shadow-2xl z-50 overflow-hidden bg-slate-900 border border-white/10">
              {/* Başlık */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-lg text-white">
                    Bildirimler
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400">
                      {unreadCount} yeni
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="px-2 py-1 text-xs font-medium rounded-lg transition-colors text-blue-400 hover:bg-white/5"
                    >
                      Tümünü okundu işaretle
                    </button>
                  )}
                  <button
                    onClick={handleCloseNotifications}
                    className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-white hover:bg-white/5"
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
                  <div className="divide-y divide-white/5">
                    {notifications.map((notification) => {
                      const isRead = readNotificationIds.has(notification.id);
                      return (
                        <div
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className={`p-4 cursor-pointer transition-colors ${isRead
                            ? 'bg-slate-900/50 hover:bg-slate-800/50'
                            : 'bg-blue-500/10 hover:bg-blue-500/20 border-l-4 border-blue-500'
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 flex-shrink-0 ${isRead
                              ? 'text-slate-500'
                              : 'text-blue-400'
                              }`}>
                              <Info className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-bold text-sm text-white">
                                  {notification.title}
                                </h4>
                                {!isRead && (
                                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
                                )}
                              </div>
                              <p className="text-sm leading-relaxed text-slate-400">
                                {notification.description}
                              </p>
                              <p className="text-xs mt-2 text-slate-500">
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