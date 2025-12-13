"use client";

import React from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Send, ArrowLeft, MessageSquare } from "lucide-react";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
            {/* Navbar */}
            <nav className="bg-transparent py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3 group">
                            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                            <div>
                                <span className="text-xl font-bold text-white">İSG Pratik</span>
                                <span className="block text-xs text-blue-300/70 tracking-widest uppercase">Risk Yönetim Sistemi</span>
                            </div>
                        </Link>
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Ana Sayfa
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                        <MessageSquare className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm text-white/80">Bize Ulaşın</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                        İletişim
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                        Sorularınız, önerileriniz veya destek talepleriniz için bizimle iletişime geçin.
                    </p>
                </div>
            </section>

            {/* Contact Cards */}
            <section className="py-12 pb-24">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Email Card */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all group">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Mail className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">E-Posta</h3>
                            <p className="text-gray-400 mb-4">
                                Sorularınız için bize e-posta gönderin.
                            </p>
                            <a
                                href="mailto:info@isgpratik.com.tr"
                                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                            >
                                <Send className="w-4 h-4" />
                                info@isgpratik.com.tr
                            </a>
                        </div>

                        {/* Support Card */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all group">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <MessageSquare className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Destek</h3>
                            <p className="text-gray-400 mb-4">
                                Teknik destek ve yardım için bizimle iletişime geçin.
                            </p>
                            <Link
                                href="/destek"
                                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                            >
                                <Send className="w-4 h-4" />
                                Destek Talebi Gönder
                            </Link>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-12 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 backdrop-blur-md rounded-2xl p-8 border border-indigo-500/30">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <img src="/logo.png" alt="Logo" className="w-14 h-14 object-contain" />
                            </div>
                            <div className="text-center md:text-left">
                                <h3 className="text-xl font-bold text-white mb-2">İSG Pratik</h3>
                                <p className="text-gray-300">
                                    Türkiye'nin en kapsamlı iş sağlığı ve güvenliği yazılımı.
                                    Risk değerlendirme, acil durum planları ve daha fazlası için bizimle iletişime geçin.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* FAQ Link */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-400">
                            Sıkça sorulan sorular için{" "}
                            <Link href="/risk-degerlendirme-nedir" className="text-indigo-400 hover:text-indigo-300 underline">
                                Risk Değerlendirme Nedir?
                            </Link>
                            {" "}sayfamızı ziyaret edebilirsiniz.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black/30 py-8 border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-500 text-sm">
                        © 2025 İSG Pratik. Tüm hakları saklıdır.
                    </p>
                </div>
            </footer>
        </div>
    );
}
