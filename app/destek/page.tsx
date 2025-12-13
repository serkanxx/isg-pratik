"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle, Loader2 } from "lucide-react";

export default function SupportPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        reason: "",
        message: "",
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const reasons = [
        "Teknik Destek",
        "Ödeme / Fatura",
        "Hesap Sorunu",
        "Özellik Talebi",
        "Hata Bildirimi",
        "Diğer"
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Email validasyonu
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError("Lütfen geçerli bir e-posta adresi giriniz. (örn: ornek@email.com)");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Bir hata oluştu");
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-md text-center">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Talebiniz Alındı!</h2>
                    <p className="text-gray-300 mb-6">
                        Destek talebiniz başarıyla gönderildi. En kısa sürede size dönüş yapacağız.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-500 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Ana Sayfaya Dön
                    </Link>
                </div>
            </div>
        );
    }

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
                            href="/iletisim"
                            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            İletişim
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Form */}
            <section className="py-12">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Destek Talebi</h1>
                        <p className="text-gray-400">Formu doldurun, size en kısa sürede dönüş yapalım.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6">
                                {error}
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            {/* İsim Soyisim */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    İsim Soyisim *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Adınız Soyadınız"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    E-Posta *
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="ornek@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            {/* Telefon */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Telefon
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="5XX XXX XX XX"
                                />
                            </div>

                            {/* İletişim Sebebi */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    İletişim Sebebi *
                                </label>
                                <select
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    required
                                >
                                    <option value="" className="bg-slate-800">Seçiniz...</option>
                                    {reasons.map((reason) => (
                                        <option key={reason} value={reason} className="bg-slate-800">
                                            {reason}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Mesaj */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Mesajınız *
                            </label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                rows={5}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                placeholder="Destek talebinizi detaylı olarak açıklayınız..."
                                required
                            />
                        </div>

                        {/* Gönder Butonu */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-lg font-bold text-lg hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Gönderiliyor...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Destek Talebini Gönder
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
}
