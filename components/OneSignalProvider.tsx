'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useOneSignal } from '@/lib/onesignal';

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
    const { isInitialized, isSubscribed, requestPermission } = useOneSignal();
    const [showPrompt, setShowPrompt] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Mobil kontrol
        const checkMobile = () => {
            const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                window.innerWidth < 768;
            setIsMobile(mobile);
            return mobile;
        };

        const mobile = checkMobile();

        // Sadece mobilde ve initialize olduktan sonra göster
        if (!mobile) return;

        // Daha önce reddedilmiş mi kontrol et
        const dismissed = localStorage.getItem('notification-prompt-dismissed');
        if (dismissed) {
            const dismissedDate = new Date(dismissed);
            const now = new Date();
            const daysDiff = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysDiff < 30) return; // 30 gün bekle
        }

        // OneSignal hazır ve abone değilse göster
        if (isInitialized && !isSubscribed) {
            // PWA install prompt'tan sonra göster
            const pwaPromptDismissed = localStorage.getItem('pwa-install-dismissed');
            const delay = pwaPromptDismissed ? 3000 : 10000; // PWA kapatılmışsa 3sn, değilse 10sn

            setTimeout(() => setShowPrompt(true), delay);
        }
    }, [isInitialized, isSubscribed]);

    const handleAllow = async () => {
        await requestPermission();
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('notification-prompt-dismissed', new Date().toISOString());
    };

    return (
        <>
            {children}

            {/* Notification Permission Prompt - Sadece Mobil */}
            {isMobile && showPrompt && !isSubscribed && (
                <div className="fixed bottom-20 left-4 right-4 z-[9997] animate-slide-up">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-2xl p-4 relative overflow-hidden">
                        {/* Decorative background */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full blur-2xl" />
                        </div>

                        {/* Close button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            aria-label="Kapat"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>

                        <div className="relative flex items-start gap-3">
                            {/* Icon */}
                            <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Bell className="w-6 h-6 text-white" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pr-6">
                                <h3 className="text-white font-semibold text-base mb-1">
                                    🔔 Bildirimleri Aç
                                </h3>
                                <p className="text-white/90 text-sm leading-snug mb-3">
                                    Yeni özellikler ve önemli duyurulardan haberdar olun!
                                </p>

                                <button
                                    onClick={handleAllow}
                                    className="flex items-center gap-2 bg-white text-emerald-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-white/90 transition-colors"
                                >
                                    <Bell className="w-4 h-4" />
                                    <span>Bildirimlere İzin Ver</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <style jsx>{`
            @keyframes slide-up {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-slide-up {
              animation: slide-up 0.3s ease-out forwards;
            }
          `}</style>
                </div>
            )}
        </>
    );
}
