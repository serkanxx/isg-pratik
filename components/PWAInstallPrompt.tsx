'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const TOUR_STORAGE_KEY = 'isg_panel_tour_completed';
const PWA_DISMISSED_KEY = 'pwa-install-dismissed';

export function PWAInstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Mobil cihaz kontrolü
        const checkMobile = () => {
            const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                window.innerWidth < 768;
            setIsMobile(isMobileDevice);
            return isMobileDevice;
        };

        const isMobileDevice = checkMobile();

        // Masaüstünde gösterme
        if (!isMobileDevice) {
            return;
        }

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
        const dismissed = localStorage.getItem(PWA_DISMISSED_KEY);
        if (dismissed) {
            const dismissedDate = new Date(dismissed);
            const now = new Date();
            const daysDiff = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
            // 7 gün sonra tekrar göster
            if (daysDiff < 7) {
                return;
            }
        }

        // Onboarding tour tamamlanmış mı kontrol et
        const checkTourAndShow = () => {
            const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);

            // Tour tamamlanmışsa göster
            if (tourCompleted === 'true') {
                setTimeout(() => setShowPrompt(true), 1000);
                return true;
            }
            return false;
        };

        // İlk kontrol
        if (checkTourAndShow()) {
            // Tour zaten tamamlanmış, göster
        } else {
            // Tour tamamlanana kadar dinle
            const handleStorageChange = (e: StorageEvent) => {
                if (e.key === TOUR_STORAGE_KEY && e.newValue === 'true') {
                    setTimeout(() => setShowPrompt(true), 1500);
                }
            };

            // Aynı pencerede değişiklikleri dinlemek için interval
            const checkInterval = setInterval(() => {
                if (checkTourAndShow()) {
                    clearInterval(checkInterval);
                }
            }, 2000);

            window.addEventListener('storage', handleStorageChange);

            // 30 saniye sonra kontrol etmeyi durdur
            setTimeout(() => {
                clearInterval(checkInterval);
                window.removeEventListener('storage', handleStorageChange);
            }, 30000);
        }

        // Android/Chrome için beforeinstallprompt event'i
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Resize listener
        const handleResize = () => {
            const newIsMobile = window.innerWidth < 768;
            if (!newIsMobile) {
                setShowPrompt(false);
            }
            setIsMobile(newIsMobile);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('resize', handleResize);
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
        localStorage.setItem(PWA_DISMISSED_KEY, new Date().toISOString());
    };

    // Masaüstünde, yüklüyse veya gösterilmeyecekse null döndür
    if (!isMobile || !showPrompt || isInstalled) {
        return null;
    }

    return (
        <div className="fixed bottom-20 left-4 right-4 z-[9998] animate-slide-up">
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
                            🎉 İSGPratik Uygulaması Yayında!
                        </h3>
                        <p className="text-white/90 text-sm leading-snug mb-3">
                            Tüm özellikleri çevrimdışı da kullanabilirsiniz. Ana ekrana ekleyerek hızlıca erişin!
                        </p>

                        {/* Action buttons */}
                        {isIOS ? (
                            <div className="flex items-center gap-2 text-white/90 text-sm bg-white/10 rounded-lg px-3 py-2">
                                <Share className="w-4 h-4 flex-shrink-0" />
                                <span>Paylaş menüsünden &quot;Ana Ekrana Ekle&quot;</span>
                            </div>
                        ) : (
                            <button
                                onClick={handleInstall}
                                className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-white/90 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                <span>Uygulamayı Yükle</span>
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
