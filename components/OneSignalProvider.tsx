'use client';

import { Bell, X } from 'lucide-react';
import { useOneSignal } from '@/lib/onesignal';

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
    const { isInitialized, isSubscribed, isStandalone, requestPermission } = useOneSignal();

    const handleAllow = async () => {
        await requestPermission();
    };

    const handleDismiss = () => {
        localStorage.setItem('notification-prompt-dismissed', new Date().toISOString());
        // Force re-render by dispatching custom event
        window.dispatchEvent(new Event('notification-dismissed'));
    };

    // Sadece standalone modda ve henüz abone değilse göster kontrolü
    const shouldShowPrompt = () => {
        if (!isStandalone || !isInitialized || isSubscribed) return false;

        // Daha önce kapatılmış mı kontrol et
        const dismissed = localStorage.getItem('notification-prompt-dismissed');
        if (dismissed) {
            const dismissedDate = new Date(dismissed);
            const now = new Date();
            const daysDiff = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysDiff < 30) return false; // 30 gün bekle
        }

        return true;
    };

    return (
        <>
            {children}

            {/* Notification Permission Prompt - Sadece Standalone PWA modunda */}
            {shouldShowPrompt() && (
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
                                    🔔 Bildirimleri Açın
                                </h3>
                                <p className="text-white/90 text-sm leading-snug mb-3">
                                    Yeni özellikler, özel günler ve önemli duyurulardan anında haberdar olun!
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
