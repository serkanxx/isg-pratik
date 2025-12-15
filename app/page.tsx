"use client";
import { SpeedInsights } from "@vercel/speed-insights/next"
import React from 'react';
import Link from "next/link";
import {
  Shield, Brain, AlertTriangle, Calendar, BookOpen, Eye, FileText, Users, Building,
  CheckCircle, Clock, ChevronRight, Star, Zap, Target, BarChart3, FileCheck, Map, LogOut, User
} from 'lucide-react';
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import LiveDashboard from './components/LiveDashboard';

export default function LandingPage() {
  const router = useRouter();
  const { data: session } = useSession();
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
      icon: Eye,
      title: "Saha Gözlem Formları",
      description: "AI destekli gözlem raporları. Fotoğraf ekleme, DÖF atama.",
      color: "bg-blue-500",
      active: false
    },
    {
      icon: FileText,
      title: "İş Kazası Yönetimi",
      description: "Kaza kayıtları, istatistikler, SGK bildirimleri, kök neden analizi.",
      color: "bg-red-500",
      active: false
    },
    {
      icon: FileCheck,
      title: "DÖF Yönetimi",
      description: "Düzeltici önleyici faaliyetler, görev atamaları, takip sistemi.",
      color: "bg-teal-500",
      active: false
    },
    {
      icon: Building,
      title: "Çoklu Firma Desteği",
      description: "OSGB'ler için tüm müşteriler tek panelden yönetim.",
      color: "bg-pink-500",
      active: false
    }
  ];

  const enterpriseFeatures = [
    {
      icon: Shield,
      title: "Risk Yönetimi",
      color: "bg-purple-100 text-purple-600",
      items: [
        "Fine Kinney metodu",
        "Sektöre özel tehlike kütüphanesi",
        "Otomatik risk skorlama",
        "Çoklu firma yönetimi",
        "Risk analizi şablonları"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* NAVBAR */}
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-xl border-b border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center group">
                <div className="transition-transform duration-300 group-hover:scale-110">
                  <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain drop-shadow-md" />
                </div>
                <div className="ml-3 flex flex-col">
                  <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 group-hover:to-white transition-all">İSG Pratik</span>
                  <span className="text-xs text-blue-300/80 tracking-widest uppercase group-hover:text-blue-200 transition-colors">Risk Yönetim Sistemi</span>
                </div>
              </Link>
            </div>



            {session ? (
              <div className="flex items-center space-x-3 gap-2">
                <span className="text-sm text-blue-100 hidden sm:inline-flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {session.user?.name || session.user?.email}
                </span>
                <Link
                  href="/panel"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 border border-blue-400/20"
                >
                  Panele Git
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: 'https://www.isgpratik.com/' })}
                  className="p-2 text-white/70 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
                  title="Çıkış Yap"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-blue-100 hover:text-white text-sm font-medium transition-colors">
                  Giriş Yap
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 border border-blue-400/20"
                >
                  Ücretsiz Başla
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Sol: Başlık ve CTA */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">Yapay Zeka Destekli İSG Platformu</span>
              </div>

              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 leading-tight">
                İş Güvenliğine
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400">
                  Pratik Çözüm
                </span>
              </h1>

              <p className="text-lg text-gray-300 mb-8 max-w-xl">
                <strong className="text-white">Yapay Zeka</strong> destekli risk değerlendirme formu
                hızlı, pratik ve eksiksiz hazırla.
              </p>

              <div className="flex flex-wrap gap-4 mb-4">
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


              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300">
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
            <div className="relative hidden lg:block">
              <LiveDashboard />
            </div>
          </div>
        </div>
      </section>



      {/* FEATURES SECTION */}
      <section id="moduller" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wide">KAPSAMLI İSG YÖNETİM PLATFORMU</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2">
              Tek Platformda <span className="text-indigo-600">Tüm İSG İhtiyaçlarınız</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
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

                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>

                {feature.active && (
                  <div className="mt-4 flex items-center text-indigo-600 font-semibold text-sm">
                    Hemen Başla <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                )}
              </div>
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
          </div>

          <div className="flex justify-center">
            {enterpriseFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm max-w-md">
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
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Hemen Risk Analizlerinizi Oluşturmaya Başlayın
          </h2>



          <div>
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
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            {/* Sol: Logo ve Copyright */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 group">
                <div className="transition-transform duration-300 group-hover:scale-110">
                  <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                </div>
                <span className="text-xl font-bold text-gray-300 group-hover:text-white transition-colors">İSG Pratik</span>
              </div>
              <p className="text-sm">© 2025 İSG Pratik. Tüm hakları saklıdır.</p>
            </div>

            {/* Orta: Risk Değerlendirme Nedir? */}
            <div className="flex flex-col items-center">
              <Link href="/risk-degerlendirme-nedir" className="hover:text-white text-sm">
                Risk Değerlendirme Nedir?
              </Link>
            </div>

            {/* Sağ: Gizlilik, Kullanım, KVKK alt alta */}
            <div className="flex flex-col gap-2 text-sm text-right">
              <Link href="/gizlilik-politikasi" className="hover:text-white">Gizlilik Politikası</Link>
              <Link href="/kullanim-kosullari" className="hover:text-white">Kullanım Koşulları</Link>
              <Link href="/kvkk" className="hover:text-white">KVKK</Link>
              <Link href="/iletisim" className="hover:text-white">İletişim</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}