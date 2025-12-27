"use client";

import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

interface AdBannerProps {
    slot: string;
    format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
    className?: string;
    style?: React.CSSProperties;
}

/**
 * AdSense Banner Reklam Komponenti
 * 
 * @param slot - AdSense'den alınan reklam slot ID'si
 * @param format - Reklam formatı (varsayılan: auto)
 * @param className - Ek CSS sınıfları
 * @param style - Inline stil
 * 
 * NOT: AdSense onayı olmadan reklamlar görünmez.
 * Onay sonrası AdSense panelinden slot ID almanız gerekir.
 */
export function AdBanner({
    slot,
    format = 'auto',
    className = '',
    style
}: AdBannerProps) {
    const adRef = useRef<HTMLModElement>(null);
    const isAdLoaded = useRef(false);

    useEffect(() => {
        // Sadece bir kez yükle
        if (isAdLoaded.current) return;

        try {
            if (typeof window !== 'undefined' && adRef.current) {
                // AdSense dizisini başlat
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                isAdLoaded.current = true;
            }
        } catch (error) {
            console.error('AdSense yükleme hatası:', error);
        }
    }, []);

    return (
        <ins
            ref={adRef}
            className={`adsbygoogle ${className}`}
            style={{
                display: 'block',
                ...style
            }}
            data-ad-client="ca-pub-4192356585823307"
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive="true"
        />
    );
}

/**
 * Placeholder banner - AdSense onayı beklerken gösterilir
 * Development ve test amaçlı kullanılır
 */
export function AdBannerPlaceholder({
    className = '',
    height = 90
}: {
    className?: string;
    height?: number;
}) {
    return (
        <div
            className={`bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg flex items-center justify-center ${className}`}
            style={{ height }}
        >
            <div className="text-center">
                <p className="text-xs text-slate-400 font-medium">Reklam Alanı</p>
                <p className="text-[10px] text-slate-300">AdSense onayı bekleniyor</p>
            </div>
        </div>
    );
}

export default AdBanner;
