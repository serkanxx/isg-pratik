"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Menu, Zap, BookOpen } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface TourStep {
    target: string; // CSS selector veya ID
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
    waitForElement?: boolean; // Element görünene kadar bekle
    waitForAction?: string; // Belirli bir action sonrası göster (örn: 'sidebar-open')
}

const MOBILE_TOUR_STEPS: TourStep[] = [
    {
        target: '[data-mobile-tour="hamburger-menu"]',
        title: '🍔 Menü',
        description: 'Bu butona tıklayarak sol menüyü açabilirsiniz. Risk maddeleri ve diğer özellikler bu menüde bulunur.',
        position: 'bottom',
        waitForAction: undefined
    },
    {
        target: '[data-mobile-tour="ai-search"]',
        title: '🤖 Yapay Zeka Risk Analizi (Beta)',
        description: 'Sektör adını yazarak yapay zeka ile o sektöre özel riskleri otomatik olarak tarayıp tabloya ekleyebilirsiniz. Bu özellik şu anda Beta sürümündedir.',
        position: 'bottom',
        waitForAction: 'sidebar-open'
    },
    {
        target: '[data-mobile-tour="risk-library-first"]',
        title: '📚 Risk Kütüphanesi',
        description: 'Risk sınıfı başlığına tıklayarak içindeki risk maddelerini inceleyebilir ve ayrı ayrı ekleyebilirsiniz. + butonuna tıklayarak ise o sınıftaki tüm riskleri bir kerede ekleyebilirsiniz.',
        position: 'right',
        waitForAction: 'sidebar-open'
    }
];

const TOUR_STORAGE_KEY = 'isg_mobile_risk_tour_completed';

interface MobileRiskTourProps {
    onComplete: () => void;
    isSidebarOpen?: boolean;
    onSidebarOpen?: () => void;
}

export default function MobileRiskTour({ onComplete, isSidebarOpen = false, onSidebarOpen }: MobileRiskTourProps) {
    const { isDark } = useTheme();
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [isMobile, setIsMobile] = useState(false);
    const [pendingSidebarOpen, setPendingSidebarOpen] = useState(false);

    // Mobil kontrolü
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768); // md breakpoint
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Tour başlatma kontrolü
    useEffect(() => {
        if (!isMobile) return;
        
        const completed = localStorage.getItem(TOUR_STORAGE_KEY);
        if (!completed) {
            // Sayfa yüklendikten 1 saniye sonra turu başlat
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isMobile]);

    // Sidebar açıldığında bir sonraki adıma geç (ilk adımdan ikinci adıma)
    useEffect(() => {
        if (!isVisible || !isMobile) return;
        
        // İlk adımdan "İleri" butonuna tıklandığında sidebar açıldıysa bir sonraki adıma geç
        if (pendingSidebarOpen && isSidebarOpen && currentStep === 0) {
            const timer = setTimeout(() => {
                setCurrentStep(1);
                setPendingSidebarOpen(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isSidebarOpen, currentStep, isVisible, isMobile, pendingSidebarOpen]);

    const updateTooltipPosition = useCallback(() => {
        if (!isMobile) return;
        
        const step = MOBILE_TOUR_STEPS[currentStep];
        if (!step) return;

        const targetElement = document.querySelector(step.target);

        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            let top = 0;
            let left = 0;

            switch (step.position) {
                case 'right':
                    top = rect.top + (rect.height / 2) - 100;
                    left = rect.right + 16;
                    break;
                case 'left':
                    top = rect.top + (rect.height / 2) - 100;
                    left = rect.left - 320;
                    break;
                case 'top':
                    top = rect.top - 200;
                    left = rect.left + (rect.width / 2) - 150;
                    break;
                case 'bottom':
                    top = rect.bottom + 16;
                    left = rect.left + (rect.width / 2) - 150;
                    break;
            }

            // Ekran sınırları kontrolü (mobil için optimize)
            if (left < 10) left = 10;
            if (left > window.innerWidth - 320) left = window.innerWidth - 320;
            if (top < 10) top = 10;
            if (top > window.innerHeight - 250) top = window.innerHeight - 250;

            setTooltipPosition({ top, left });

            // Target elementi vurgula
            targetElement.classList.add('tour-highlight');
        }
    }, [currentStep, isMobile]);

    useEffect(() => {
        if (!isVisible || !isMobile) return;

        // Önceki highlight'ı kaldır
        document.querySelectorAll('.tour-highlight').forEach(el => {
            el.classList.remove('tour-highlight');
        });

        // Element görünene kadar bekle
        const step = MOBILE_TOUR_STEPS[currentStep];
        if (step?.waitForElement) {
            const checkElement = setInterval(() => {
                const targetElement = document.querySelector(step.target);
                if (targetElement) {
                    clearInterval(checkElement);
                    updateTooltipPosition();
                }
            }, 100);
            return () => clearInterval(checkElement);
        }

        updateTooltipPosition();

        // Resize event listener
        window.addEventListener('resize', updateTooltipPosition);
        return () => {
            window.removeEventListener('resize', updateTooltipPosition);
            document.querySelectorAll('.tour-highlight').forEach(el => {
                el.classList.remove('tour-highlight');
            });
        };
    }, [currentStep, updateTooltipPosition, isVisible, isMobile]);

    const handleNext = () => {
        // İlk adımdaysa ve sidebar açık değilse, önce sidebar'ı aç
        if (currentStep === 0 && !isSidebarOpen && onSidebarOpen) {
            setPendingSidebarOpen(true);
            onSidebarOpen();
            // Sidebar açıldıktan sonra useEffect ile bir sonraki adıma geçilecek
            return;
        }
        
        // Diğer durumlarda normal şekilde bir sonraki adıma geç
        if (currentStep < MOBILE_TOUR_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleComplete = () => {
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
        setIsVisible(false);
        document.querySelectorAll('.tour-highlight').forEach(el => {
            el.classList.remove('tour-highlight');
        });
        onComplete();
    };

    const handleSkip = () => {
        handleComplete();
    };

    // Hamburger menü tıklama için özel işlem
    const handleHamburgerClick = () => {
        if (currentStep === 0 && onSidebarOpen) {
            onSidebarOpen();
        }
    };

    if (!isVisible || !isMobile) return null;

    const step = MOBILE_TOUR_STEPS[currentStep];

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/50 z-[998] md:hidden" onClick={handleSkip} />

            {/* Tooltip */}
            <div
                className={`fixed z-[999] w-[90vw] max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-fade-in transition-colors md:hidden ${
                    isDark 
                        ? 'bg-slate-800 border border-slate-700' 
                        : 'bg-white border border-indigo-100'
                }`}
                style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-300" />
                        <span className="text-white font-bold text-sm">
                            Adım {currentStep + 1} / {MOBILE_TOUR_STEPS.length}
                        </span>
                    </div>
                    <button
                        onClick={handleSkip}
                        className="text-white/70 hover:text-white transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                        title="Turu Atla"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    <h3 className={`font-bold text-base mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>{step.title}</h3>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{step.description}</p>
                </div>

                {/* Footer */}
                <div className="px-4 pb-4 flex items-center justify-between">
                    <button
                        onClick={handleSkip}
                        className={`text-sm transition-colors min-h-[44px] px-2 ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Atla
                    </button>
                    <div className="flex items-center gap-2">
                        {currentStep > 0 && (
                            <button
                                onClick={handlePrev}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 min-h-[44px] ${
                                    isDark 
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
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-1 min-h-[44px]"
                        >
                            {currentStep === MOBILE_TOUR_STEPS.length - 1 ? 'Tamamla' : 'İleri'}
                            {currentStep < MOBILE_TOUR_STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Progress dots */}
                <div className="px-4 pb-3 flex justify-center gap-1.5">
                    {MOBILE_TOUR_STEPS.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentStep
                                    ? 'bg-indigo-600'
                                    : index < currentStep
                                        ? isDark ? 'bg-indigo-400' : 'bg-indigo-300'
                                        : isDark ? 'bg-slate-600' : 'bg-slate-200'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}

// Turun tamamlanıp tamamlanmadığını kontrol eden hook
export function useMobileRiskTourStatus() {
    const [showTour, setShowTour] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            if (window.innerWidth < 768) {
                const completed = localStorage.getItem(TOUR_STORAGE_KEY);
                if (!completed) {
                    setShowTour(true);
                }
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
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

