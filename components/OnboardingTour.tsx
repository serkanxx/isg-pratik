"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Menu } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface TourStep {
    target: string; // CSS selector veya ID
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

// Mobile-specific hamburger step
const MOBILE_HAMBURGER_STEP: TourStep = {
    target: '[data-mobile-tour="hamburger-menu"]',
    title: '🍔 Menüyü Keşfedin',
    description: 'Tüm özelliklerine erişmek için bu menü butonuna tıklayın. Firmalar, riskler, raporlar ve daha fazlası menüde!',
    position: 'bottom'
};

const TOUR_STEPS: TourStep[] = [
    {
        target: '[data-tour="firmalar"]',
        title: '🏢 Firmalarım',
        description: 'Kayıtlı firmalarınızı burada görüntüleyebilir, yeni firma ekleyebilir ve firma bilgilerini düzenleyebilirsiniz.',
        position: 'right'
    },
    {
        target: '[data-tour="risklerim"]',
        title: '⚠️ Risklerim',
        description: 'Kendi risk maddelerinizi ekleyebilir ve yönetebilirsiniz. Bu maddeler risk değerlendirmelerinde kullanılabilir.',
        position: 'right'
    },
    {
        target: '[data-tour="raporlarim"]',
        title: '📄 Raporlarım',
        description: 'Oluşturduğunuz tüm raporları (Risk Değerlendirme, Acil Durum Planı vb.) burada görüntüleyebilirsiniz.',
        position: 'right'
    },
    {
        target: '[data-tour="notlarim"]',
        title: '📝 Notlarım',
        description: 'Firmalar veya genel konular hakkında not alabilir, hatırlatıcılar ekleyebilirsiniz.',
        position: 'right'
    },
    {
        target: '[data-tour="risk-degerlendirme"]',
        title: '🛡️ Risk Değerlendirmesi',
        description: 'Fine-Kinney metoduyla profesyonel risk değerlendirmesi yapın ve PDF rapor oluşturun.',
        position: 'right'
    },
    {
        target: '[data-tour="acil-durum"]',
        title: '🚨 Acil Durum Planı',
        description: 'İş yeriniz için acil durum eylem planı oluşturun.',
        position: 'right'
    },
    {
        target: '[data-tour="is-izin"]',
        title: '📋 İş İzin Formu',
        description: 'Tehlikeli işler için iş izin formu oluşturun ve PDF olarak indirin.',
        position: 'right'
    },
    {
        target: '[data-tour="ziyaret-programi"]',
        title: '📅 Firma Ziyaret Programı',
        description: 'Firmalarınız için haftalık ve aylık ziyaret programları oluşturun, takip edin ve yönetin.',
        position: 'right'
    },
    {
        target: '[data-tour="nace-kod"]',
        title: '🔍 NACE Kod Sorgulama',
        description: 'NACE kodunu girerek faaliyet alanı ve tehlike sınıfını anında öğrenin.',
        position: 'right'
    },
    {
        target: '[data-tour="is-ilanlari"]',
        title: '💼 İSG İş İlanları',
        description: 'İş sağlığı ve güvenliği alanındaki güncel iş ilanlarını görüntüleyin ve başvurun.',
        position: 'right'
    },
    {
        target: '[data-tour="arsiv"]',
        title: '📂 İSG Arşiv Dosyaları',
        description: 'Hazır İSG dokümanlarını, formları ve şablonları görüntüleyin ve indirin.',
        position: 'right'
    },
    {
        target: '[data-tour="dark-mode"]',
        title: '🌙 Karanlık Mod',
        description: 'Göz yorgunluğunu azaltmak için karanlık modu açıp kapatabilirsiniz. Tercihiniz kaydedilir.',
        position: 'top'
    }
];

const TOUR_STORAGE_KEY = 'isg_panel_tour_completed';

interface OnboardingTourProps {
    onComplete: () => void;
    isMobile?: boolean;
    isSidebarOpen?: boolean;
    onOpenSidebar?: () => void;
}

export default function OnboardingTour({ onComplete, isMobile = false, isSidebarOpen = false, onOpenSidebar }: OnboardingTourProps) {
    const { isDark } = useTheme();
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [isMobileDevice, setIsMobileDevice] = useState(false);
    const [showingHamburgerStep, setShowingHamburgerStep] = useState(false);
    const [waitingForSidebar, setWaitingForSidebar] = useState(false);

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobileDevice(mobile);
            // On mobile, start with hamburger step
            if (mobile && !localStorage.getItem('hamburger_menu_tooltip_seen')) {
                setShowingHamburgerStep(true);
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Auto-open sidebar after showing hamburger step for 3 seconds
    useEffect(() => {
        if (showingHamburgerStep && isMobileDevice && onOpenSidebar && !isSidebarOpen) {
            const timer = setTimeout(() => {
                onOpenSidebar();
                setWaitingForSidebar(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showingHamburgerStep, isMobileDevice, onOpenSidebar, isSidebarOpen]);

    // After sidebar opens, transition to normal tour
    useEffect(() => {
        if (waitingForSidebar && isSidebarOpen) {
            const timer = setTimeout(() => {
                setShowingHamburgerStep(false);
                setWaitingForSidebar(false);
                localStorage.setItem('hamburger_menu_tooltip_seen', 'true');
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [waitingForSidebar, isSidebarOpen]);

    // Get current step data
    const getCurrentStep = useCallback(() => {
        if (showingHamburgerStep && isMobileDevice) {
            return MOBILE_HAMBURGER_STEP;
        }
        // On mobile, skip the dark-mode step since it's now in navbar
        if (isMobileDevice && TOUR_STEPS[currentStep]?.target === '[data-tour="dark-mode"]') {
            return null; // Will be skipped
        }
        return TOUR_STEPS[currentStep];
    }, [showingHamburgerStep, isMobileDevice, currentStep]);

    const updateTooltipPosition = useCallback(() => {
        const step = getCurrentStep();
        if (!step) return;

        const targetElement = document.querySelector(step.target);

        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            let top = 0;
            let left = 0;

            switch (step.position) {
                case 'right':
                    top = rect.top + (rect.height / 2) - 80;
                    left = rect.right + 16;
                    break;
                case 'left':
                    top = rect.top + (rect.height / 2) - 80;
                    left = rect.left - 320;
                    break;
                case 'top':
                    top = rect.top - 180;
                    left = rect.left + (rect.width / 2) - 150;
                    break;
                case 'bottom':
                    top = rect.bottom + 16;
                    left = rect.left + (rect.width / 2) - 150;
                    break;
            }

            // Ekran sınırları kontrolü
            if (left < 10) left = 10;
            if (left > window.innerWidth - 320) left = window.innerWidth - 320;
            if (top < 10) top = 10;
            if (top > window.innerHeight - 200) top = window.innerHeight - 200;

            setTooltipPosition({ top, left });

            // Target elementi vurgula
            targetElement.classList.add('tour-highlight');
        }
    }, [getCurrentStep]);

    useEffect(() => {
        // Önceki highlight'ı kaldır
        document.querySelectorAll('.tour-highlight').forEach(el => {
            el.classList.remove('tour-highlight');
        });

        updateTooltipPosition();

        // Resize event listener
        window.addEventListener('resize', updateTooltipPosition);
        return () => {
            window.removeEventListener('resize', updateTooltipPosition);
            document.querySelectorAll('.tour-highlight').forEach(el => {
                el.classList.remove('tour-highlight');
            });
        };
    }, [currentStep, updateTooltipPosition, showingHamburgerStep]);

    const handleNext = () => {
        // If showing hamburger step, trigger sidebar open and wait
        if (showingHamburgerStep && isMobileDevice) {
            if (onOpenSidebar && !isSidebarOpen) {
                onOpenSidebar();
                setWaitingForSidebar(true);
            } else {
                setShowingHamburgerStep(false);
                localStorage.setItem('hamburger_menu_tooltip_seen', 'true');
            }
            return;
        }

        // Skip dark-mode step on mobile
        let nextStep = currentStep + 1;
        if (isMobileDevice && TOUR_STEPS[nextStep]?.target === '[data-tour="dark-mode"]') {
            nextStep++;
        }

        if (nextStep < TOUR_STEPS.length) {
            setCurrentStep(nextStep);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            let prevStep = currentStep - 1;
            // Skip dark-mode step on mobile
            if (isMobileDevice && TOUR_STEPS[prevStep]?.target === '[data-tour="dark-mode"]') {
                prevStep--;
            }
            if (prevStep >= 0) {
                setCurrentStep(prevStep);
            }
        }
    };

    const handleComplete = () => {
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
        localStorage.setItem('hamburger_menu_tooltip_seen', 'true');
        setIsVisible(false);
        document.querySelectorAll('.tour-highlight').forEach(el => {
            el.classList.remove('tour-highlight');
        });
        onComplete();
    };

    const handleSkip = () => {
        handleComplete();
    };

    if (!isVisible) return null;

    const step = getCurrentStep();
    if (!step) {
        // Skip to next step if current is null
        handleNext();
        return null;
    }

    // Calculate total steps (excluding dark-mode on mobile)
    const totalSteps = isMobileDevice
        ? TOUR_STEPS.filter(s => s.target !== '[data-tour="dark-mode"]').length
        : TOUR_STEPS.length;

    // Calculate current step number for display
    const displayStepNumber = showingHamburgerStep ? 0 : (currentStep + 1);

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/50 z-[998]" onClick={handleSkip} />

            {/* Tooltip */}
            <div
                className={`fixed z-[999] w-80 rounded-2xl shadow-2xl overflow-hidden animate-fade-in transition-colors ${isDark
                    ? 'bg-slate-800 border border-slate-700'
                    : 'bg-white border border-indigo-100'
                    }`}
                style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {showingHamburgerStep ? (
                            <Menu className="w-5 h-5 text-white" />
                        ) : (
                            <Sparkles className="w-5 h-5 text-yellow-300" />
                        )}
                        <span className="text-white font-bold text-sm">
                            {showingHamburgerStep
                                ? 'Hoş Geldiniz!'
                                : `Adım ${displayStepNumber} / ${totalSteps}`
                            }
                        </span>
                    </div>
                    <button
                        onClick={handleSkip}
                        className="text-white/70 hover:text-white transition-colors"
                        title="Turu Atla"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>{step.title}</h3>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{step.description}</p>
                </div>

                {/* Footer */}
                <div className="px-4 pb-4 flex items-center justify-between">
                    <button
                        onClick={handleSkip}
                        className={`text-sm transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Atla
                    </button>
                    <div className="flex items-center gap-2">
                        {!showingHamburgerStep && currentStep > 0 && (
                            <button
                                onClick={handlePrev}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${isDark
                                    ? 'text-slate-300 hover:bg-slate-700'
                                    : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Geri
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                            {showingHamburgerStep
                                ? 'Menüyü Aç'
                                : currentStep === TOUR_STEPS.length - 1 || (isMobileDevice && currentStep === TOUR_STEPS.length - 2)
                                    ? 'Tamamla'
                                    : 'İleri'
                            }
                            {!showingHamburgerStep && currentStep < TOUR_STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Progress dots */}
                {!showingHamburgerStep && (
                    <div className="px-4 pb-3 flex justify-center gap-1.5">
                        {TOUR_STEPS.filter(s => !isMobileDevice || s.target !== '[data-tour="dark-mode"]').map((_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-colors ${index === currentStep
                                    ? 'bg-indigo-600'
                                    : index < currentStep
                                        ? isDark ? 'bg-indigo-400' : 'bg-indigo-300'
                                        : isDark ? 'bg-slate-600' : 'bg-slate-200'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

// Turun tamamlanıp tamamlanmadığını kontrol eden hook
export function useTourStatus() {
    const [showTour, setShowTour] = useState(false);

    useEffect(() => {
        const completed = localStorage.getItem(TOUR_STORAGE_KEY);
        if (!completed) {
            // Sayfa yüklendikten 1 saniye sonra turu başlat
            const timer = setTimeout(() => {
                setShowTour(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const completeTour = () => {
        setShowTour(false);
    };

    const resetTour = () => {
        localStorage.removeItem(TOUR_STORAGE_KEY);
        setShowTour(true);
    };

    return { showTour, completeTour, resetTour };
}

