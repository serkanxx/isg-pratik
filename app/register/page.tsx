"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Form, 2: SMS doğrulama
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
    });
    const [smsCode, setSmsCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Şifreler eşleşmiyor");
            return;
        }

        if (formData.password.length < 6) {
            setError("Şifre en az 6 karakter olmalı");
            return;
        }

        // Telefon numarası formatı kontrolü
        const phoneRegex = /^5\d{9}$/;
        if (!phoneRegex.test(formData.phone)) {
            setError("Geçerli bir telefon numarası girin (5XXXXXXXXX)");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Kayıt başarısız");
            }

            // SMS devre dışı - direkt login sayfasına yönlendir
            if (data.skipSms) {
                router.push("/login?registered=true");
            } else {
                setUserId(data.userId);
                setStep(2); // SMS doğrulama adımına geç
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySms = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/verify-phone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, code: smsCode }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Doğrulama başarısız");
            }

            // Başarılı doğrulama, login sayfasına yönlendir
            router.push("/login?registered=true");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendSms = async () => {
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/resend-sms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "SMS gönderilemedi");
            }

            setError(""); // Hata temizle
            alert("SMS tekrar gönderildi!");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                {/* Logo ve Başlık */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-bold text-white">İSG</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {step === 1 ? "Kayıt Ol" : "Telefon Doğrulama"}
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {step === 1
                            ? "3 Ay Premium ile başlayın!"
                            : "Telefonunuza gelen kodu girin"}
                    </p>
                </div>

                {/* Premium Badge */}
                {step === 1 && (
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-lg text-center mb-6">
                        <span className="font-bold">🎁 3 Ay Premium</span>
                        <span className="text-sm block">Tüm özelliklere erişim!</span>
                    </div>
                )}

                {/* Hata Mesajı */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {step === 1 ? (
                    /* Kayıt Formu */
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ad Soyad
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Ad Soyad"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="ornek@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Telefon (SMS Doğrulama için)
                            </label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600">
                                    +90
                                </span>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                                        })
                                    }
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="5XX XXX XX XX"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Şifre
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Şifre Tekrar
                            </label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) =>
                                    setFormData({ ...formData, confirmPassword: e.target.value })
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all"
                        >
                            {loading ? "Kaydediliyor..." : "Kayıt Ol"}
                        </button>
                    </form>
                ) : (
                    /* SMS Doğrulama */
                    <form onSubmit={handleVerifySms} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                SMS Kodu (6 haneli)
                            </label>
                            <input
                                type="text"
                                value={smsCode}
                                onChange={(e) =>
                                    setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl tracking-widest"
                                placeholder="000000"
                                maxLength={6}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || smsCode.length !== 6}
                            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all"
                        >
                            {loading ? "Doğrulanıyor..." : "Doğrula ve Kayıt Tamamla"}
                        </button>

                        <button
                            type="button"
                            onClick={handleResendSms}
                            disabled={loading}
                            className="w-full py-2 text-indigo-600 hover:underline"
                        >
                            SMS tekrar gönder
                        </button>
                    </form>
                )}

                {/* Giriş Yap Linki */}
                <p className="text-center text-gray-600 mt-6">
                    Zaten hesabınız var mı?{" "}
                    <Link href="/login" className="text-indigo-600 font-medium hover:underline">
                        Giriş Yap
                    </Link>
                </p>
            </div>
        </div>
    );
}
