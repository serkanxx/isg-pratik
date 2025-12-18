"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home, CheckCircle, Shield, FileText, Building2, BarChart3, Users, Zap } from "lucide-react";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Form, 3: Email doğrulama bekleme
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
                // Email doğrulaması kontrolü için polling başlat
                startEmailVerificationPolling();
            } else {
                router.push("/login?registered=true");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Email doğrulaması kontrolü için polling
    const startEmailVerificationPolling = () => {
        // Önceki interval'i temizle
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        // Her 2 saniyede bir email doğrulamasını kontrol et
        pollingIntervalRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/auth/check-email-verified?email=${encodeURIComponent(formData.email)}`);
                const data = await res.json();

                if (res.ok && data.verified) {
                    // Email doğrulandı, polling'i durdur
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }

                    // Otomatik giriş yap
                    try {
                        const signInResult = await signIn("credentials", {
                            email: formData.email,
                            password: formData.password,
                            redirect: false,
                        });

                        if (signInResult?.error) {
                            setError("Otomatik giriş başarısız. Lütfen manuel olarak giriş yapın.");
                            return;
                        }

                        // Başarılı giriş, panel'e yönlendir
                        router.push("/panel");
                        router.refresh();
                    } catch (err) {
                        console.error("Auto login error:", err);
                        setError("Otomatik giriş başarısız. Lütfen manuel olarak giriş yapın.");
                    }
                }
            } catch (error) {
                console.error("Email verification check error:", error);
            }
        }, 2000); // 2 saniyede bir kontrol et
    };

    // Component unmount olduğunda polling'i temizle
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    const features = [
        {
            icon: Shield,
            title: "Risk Değerlendirme",
            description: "Kapsamlı risk analizi ve değerlendirme araçları"
        },
        {
            icon: FileText,
            title: "Rapor Oluşturma",
            description: "Profesyonel PDF raporları ve belgeler"
        },
        {
            icon: Building2,
            title: "Firma Yönetimi",
            description: "Çoklu firma desteği ve detaylı firma takibi"
        },
        {
            icon: BarChart3,
            title: "İstatistikler",
            description: "Görsel analizler ve performans metrikleri"
        },
        {
            icon: Users,
            title: "Ekip Yönetimi",
            description: "Risk değerlendirme ekibi koordinasyonu"
        },
        {
            icon: Zap,
            title: "Hızlı Erişim",
            description: "Anında erişim ve kolay kullanım"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
                {/* Sol Taraf - Özellikler */}
                <div className="hidden md:block space-y-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-800">İSG Pratik</h1>
                                <p className="text-slate-600">İş Güvenliği Yönetim Sistemi</p>
                            </div>
                        </div>
                        <p className="text-lg text-slate-700 mb-8">
                            Kayıt olarak aşağıdaki özelliklere erişebilirsiniz:
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={index}
                                    className="flex items-start gap-3 p-4 bg-gradient-to-r from-white to-indigo-50/30 rounded-xl border border-indigo-200/50 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-200/50 hover:from-indigo-50 hover:to-indigo-100/50 transition-all cursor-default"
                                >
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-200/50">
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-800 mb-1 text-base">{feature.title}</h3>
                                        <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sağ Taraf - Kayıt Formu */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                    {/* Logo ve Başlık - Mobil için */}
                    <div className="text-center mb-8 md:hidden">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800">Kayıt Ol</h1>
                        <p className="text-slate-500 mt-2">İSG Pratik'e hoş geldiniz!</p>
                    </div>

                    {/* Desktop için başlık */}
                    <div className="hidden md:block mb-8">
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Hesap Oluştur</h1>
                        <p className="text-slate-600">Hemen başlayın ve tüm özelliklere erişin</p>
                    </div>

                    {/* Ana Sayfaya Dön */}
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 w-full py-2 mb-6 text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Ana Sayfaya Dön
                    </Link>

                    {/* Hata Mesajı */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                            <span className="text-red-600">⚠</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {step === 1 && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Ad Soyad <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="Adınız ve Soyadınız"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    E-Posta Adresi <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="ornek@email.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Şifre <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="En az 6 karakter"
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                    autoFocus={false}
                                />
                                <p className="text-xs text-slate-500 mt-1">Şifreniz en az 6 karakter olmalıdır</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Şifre Tekrar <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) =>
                                        setFormData({ ...formData, confirmPassword: e.target.value })
                                    }
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="Şifrenizi tekrar girin"
                                    required
                                    autoComplete="new-password"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/30"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        Kaydediliyor...
                                    </span>
                                ) : (
                                    "Kayıt Ol"
                                )}
                            </button>

                            {/* Ayraç */}
                            <div className="flex items-center my-6">
                                <div className="flex-1 border-t border-slate-300"></div>
                                <span className="px-4 text-slate-500 text-sm">veya</span>
                                <div className="flex-1 border-t border-slate-300"></div>
                            </div>

                            {/* Google ile Kayıt */}
                            <button
                                type="button"
                                onClick={() => signIn("google", { callbackUrl: "/" })}
                                className="w-full py-3 border-2 border-slate-300 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-400 transition-all font-medium text-slate-700"
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
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Google ile Kayıt Ol
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        <div className="text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-3">
                                Email Adresinizi Kontrol Edin 📧
                            </h2>
                            <p className="text-slate-600 mb-2">
                                <strong>{formData.email}</strong> adresine doğrulama linki gönderdik.
                            </p>
                            <p className="text-slate-500 text-sm mb-4">
                                Gelen kutunuzu kontrol edin ve linke tıklayarak hesabınızı aktifleştirin.
                            </p>
                            <p className="text-indigo-600 text-sm font-semibold mb-6">
                                Email doğrulaması yapıldığında otomatik olarak giriş yapıp panel sayfasına yönlendirileceksiniz.
                            </p>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                                <p className="text-amber-800 text-sm">
                                    <strong>💡 İpucu:</strong> Email gelmediyse spam/istenmeyen klasörünü kontrol edin.
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-2 mb-4">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                                <span className="text-sm text-slate-600">Email doğrulaması bekleniyor...</span>
                            </div>

                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all"
                            >
                                Giriş Sayfasına Git
                            </Link>
                        </div>
                    )}

                    {/* Giriş Yap Linki */}
                    <p className="text-center text-slate-600 mt-6">
                        Zaten hesabınız var mı?{" "}
                        <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
                            Giriş Yap
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
