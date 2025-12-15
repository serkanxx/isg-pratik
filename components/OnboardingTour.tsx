"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

interface TourStep {
    target: string; // CSS selector veya ID
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

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
        target: '[data-tour="dark-mode"]',
        title: '🌙 Karanlık Mod',
        description: 'Göz yorgunluğunu azaltmak için karanlık modu açıp kapatabilirsiniz. Tercihiniz kaydedilir.',
        position: 'top'
    }
];

const TOUR_STORAGE_KEY = 'isg_panel_tour_completed';

interface OnboardingTourProps {
    onComplete: () => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

    const updateTooltipPosition = useCallback(() => {
        const step = TOUR_STEPS[currentStep];
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
    }, [currentStep]);

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
    }, [currentStep, updateTooltipPosition]);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
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

    if (!isVisible) return null;

    const step = TOUR_STEPS[currentStep];

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/50 z-[998]" onClick={handleSkip} />

            {/* Tooltip */}
            <div
                className="fixed z-[999] w-80 bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden animate-fade-in"
                style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-300" />
                        <span className="text-white font-bold text-sm">
                            Adım {currentStep + 1} / {TOUR_STEPS.length}
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
                    <h3 className="font-bold text-slate-800 text-lg mb-2">{step.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
                </div>

                {/* Footer */}
                <div className="px-4 pb-4 flex items-center justify-between">
                    <button
                        onClick={handleSkip}
                        className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        Atla
                    </button>
                    <div className="flex items-center gap-2">
                        {currentStep > 0 && (
                            <button
                                onClick={handlePrev}
                                className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Geri
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                            {currentStep === TOUR_STEPS.length - 1 ? 'Tamamla' : 'İleri'}
                            {currentStep < TOUR_STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Progress dots */}
                <div className="px-4 pb-3 flex justify-center gap-1.5">
                    {TOUR_STEPS.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors ${index === currentStep
                                    ? 'bg-indigo-600'
                                    : index < currentStep
                                        ? 'bg-indigo-300'
                                        : 'bg-slate-200'
                                }`}
                        />
                    ))}
                </div>
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
