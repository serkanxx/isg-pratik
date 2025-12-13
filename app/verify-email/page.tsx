"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, Home } from "lucide-react";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Doğrulama linki geçersiz.");
            return;
        }

        verifyEmail();
    }, [token]);

    const verifyEmail = async () => {
        try {
            const res = await fetch(`/api/auth/verify-email?token=${token}`);
            const data = await res.json();

            if (res.ok) {
                setStatus("success");
                setMessage(data.message);
                // 3 saniye sonra login'e yönlendir
                setTimeout(() => {
                    router.push("/login?verified=true");
                }, 3000);
            } else {
                setStatus("error");
                setMessage(data.error || "Doğrulama başarısız");
            }
        } catch (error) {
            setStatus("error");
            setMessage("Bir hata oluştu. Lütfen tekrar deneyin.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
                {/* Logo */}
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl font-bold text-white">İSG</span>
                </div>

                {status === "loading" && (
                    <>
                        <Loader2 className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-spin" />
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            Email Doğrulanıyor...
                        </h1>
                        <p className="text-gray-500">Lütfen bekleyin</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            Email Doğrulandı! 🎉
                        </h1>
                        <p className="text-gray-500 mb-6">{message}</p>
                        <p className="text-sm text-gray-400 mb-4">
                            Giriş sayfasına yönlendiriliyorsunuz...
                        </p>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
                        >
                            Hemen Giriş Yap
                        </Link>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-12 h-12 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            Doğrulama Başarısız
                        </h1>
                        <p className="text-red-600 mb-6">{message}</p>
                        <div className="space-y-3">
                            <Link
                                href="/register"
                                className="block w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
                            >
                                Tekrar Kayıt Ol
                            </Link>
                            <Link
                                href="/"
                                className="flex items-center justify-center gap-2 w-full py-3 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                Ana Sayfaya Dön
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
