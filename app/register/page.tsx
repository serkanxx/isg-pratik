"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Form, 3: Email doğrulama bekleme
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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

            // Email doğrulama gerekiyorsa step 3'e geç
            if (data.requiresEmailVerification) {
                setStep(3); // Email doğrulama bekleme ekranı
            } else {
                router.push("/login?registered=true");
            }
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
                            ? "İSG Pratik'e hoş geldiniz!"
                            : "Telefonunuza gelen kodu girin"}
                    </p>
                </div>

                {/* Ana Sayfaya Dön */}
                <Link
                    href="/"
                    className="flex items-center justify-center gap-2 w-full py-2 mb-6 text-gray-600 hover:text-indigo-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <Home className="w-4 h-4" />
                    Ana Sayfaya Dön
                </Link>



                {/* Hata Mesajı */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {step === 1 && (
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

                        {/* Ayraç */}
                        <div className="flex items-center my-4">
                            <div className="flex-1 border-t border-gray-300"></div>
                            <span className="px-4 text-gray-500 text-sm">veya</span>
                            <div className="flex-1 border-t border-gray-300"></div>
                        </div>

                        {/* Google ile Kayıt */}
                        <button
                            type="button"
                            onClick={() => signIn("google", { callbackUrl: "/" })}
                            className="w-full py-3 border border-gray-300 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                            </svg>
                            Google ile Kayıt Ol
                        </button>
                    </form>
                )}

                {step === 3 && (
                    /* Email Doğrulama Bekleme Ekranı */
                    <div className="text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-3">
                            Email Adresinizi Kontrol Edin 📧
                        </h2>
                        <p className="text-gray-600 mb-2">
                            <strong>{formData.email}</strong> adresine doğrulama linki gönderdik.
                        </p>
                        <p className="text-gray-500 text-sm mb-6">
                            Gelen kutunuzu kontrol edin ve linke tıklayarak hesabınızı aktifleştirin.
                        </p>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                            <p className="text-amber-800 text-sm">
                                <strong>💡 İpucu:</strong> Email gelmediyse spam/istenmeyen klasörünü kontrol edin.
                            </p>
                        </div>

                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
                        >
                            Giriş Sayfasına Git
                        </Link>
                    </div>
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
