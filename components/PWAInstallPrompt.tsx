'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // iOS kontrolü
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(isIOSDevice);

        // Zaten yüklü mü kontrolü
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        // @ts-expect-error - iOS Safari specific
        const isIOSStandalone = window.navigator.standalone === true;

        if (isStandalone || isIOSStandalone) {
            setIsInstalled(true);
            return;
        }

        // Local storage kontrolü - kullanıcı daha önce kapatmış mı?
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const dismissedDate = new Date(dismissed);
            const now = new Date();
            const daysDiff = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
            // 7 gün sonra tekrar göster
            if (daysDiff < 7) {
                return;
            }
        }

        // Android/Chrome için beforeinstallprompt event'i
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Küçük bir gecikme ile göster
            setTimeout(() => setShowPrompt(true), 2000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // iOS için 3 saniye sonra göster
        if (isIOSDevice && !isStandalone && !isIOSStandalone) {
            setTimeout(() => setShowPrompt(true), 3000);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowPrompt(false);
                setDeferredPrompt(null);
            }
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    };

    if (!showPrompt || isInstalled) {
        return null;
    }

    return (
        <div className="fixed bottom-20 left-4 right-4 z-[9998] md:left-auto md:right-4 md:max-w-sm animate-slide-up">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-4 relative overflow-hidden">
                {/* Decorative background */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full blur-2xl" />
                    <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white rounded-full blur-xl" />
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
                        <Smartphone className="w-6 h-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                        <h3 className="text-white font-semibold text-base mb-1">
                            Uygulamayı Yükle
                        </h3>
                        <p className="text-white/80 text-sm leading-snug mb-3">
                            {isIOS
                                ? 'Ana ekrana ekleyerek çevrimdışı kullanın! Menüden "Ana Ekrana Ekle" seçin.'
                                : 'Ana ekrana ekleyerek hızlıca açın ve çevrimdışı kullanın!'
                            }
                        </p>

                        {/* Action buttons */}
                        {isIOS ? (
                            <div className="flex items-center gap-2 text-white/90 text-sm">
                                <Share className="w-4 h-4" />
                                <span>Paylaş → Ana Ekrana Ekle</span>
                            </div>
                        ) : (
                            <button
                                onClick={handleInstall}
                                className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-white/90 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                <span>Şimdi Yükle</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* CSS Animation */}
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
    );
}
