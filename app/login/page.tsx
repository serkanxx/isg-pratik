"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                if (result.error?.includes("EMAIL_NOT_VERIFIED")) {
                    setError("Email adresiniz doğrulanmamış. Lütfen email'inizi kontrol edin ve doğrulama linkine tıklayın.");
                } else {
                    setError(result.error);
                }
            } else {
                router.push("/panel");
                router.refresh();
            }
        } catch (err) {
            setError("Giriş yapılırken bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        signIn("google", { callbackUrl: "/panel" });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                {/* Logo ve Başlık */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-bold text-white">İSG</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Hoş Geldiniz</h1>
                    <p className="text-gray-500 mt-2">İSG Pratik İş Güvenliği Sistemi</p>
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

                {/* Giriş Formu */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="ornek@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Şifre
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                        {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
                    </button>
                </form>

                {/* Ayraç */}
                <div className="flex items-center my-6">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="px-4 text-gray-500 text-sm">veya</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                </div>

                {/* Google ile Giriş */}
                <button
                    onClick={handleGoogleSignIn}
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
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    Google ile Giriş Yap
                </button>

                {/* Kayıt Ol Linki */}
                <p className="text-center text-gray-600 mt-6">
                    Hesabınız yok mu?{" "}
                    <Link href="/register" className="text-indigo-600 font-medium hover:underline">
                        Kayıt Ol
                    </Link>
                </p>
            </div>
        </div>
    );
}
