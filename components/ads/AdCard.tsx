"use client";

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { AdBanner, AdBannerPlaceholder } from './AdBanner';

interface AdCardProps {
    slot?: string;
    className?: string;
    showPlaceholder?: boolean;
}

/**
 * Panel sayfası için kart formatında reklam komponenti
 * Diğer kartlarla (Firma Sayısı, Arşiv, Risklerim) uyumlu tasarım
 * 
 * @param slot - AdSense slot ID (onay sonrası alınacak)
 * @param showPlaceholder - Placeholder göster (development için)
 */
export function AdCard({
    slot,
    className = '',
    showPlaceholder = true
}: AdCardProps) {
    // AdSense henüz onaylanmadıysa placeholder göster
    if (showPlaceholder || !slot) {
        return (
            <div className={`bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-all h-full flex flex-col justify-between ${className}`}>
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <ExternalLink className="w-6 h-6 text-indigo-500" />
                    </div>
                    <span className="px-2 py-1 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-medium">
                        Reklam
                    </span>
                </div>
                <div className="flex-1 flex items-center justify-center min-h-[60px]">
                    <AdBannerPlaceholder height={60} className="w-full" />
                </div>
                <p className="text-[10px] text-slate-300 text-center mt-2">
                    Sponsorlu İçerik
                </p>
            </div>
        );
    }

    // AdSense onaylıysa gerçek reklam göster
    return (
        <div className={`bg-white rounded-xl p-4 border border-slate-200 hover:shadow-lg transition-all h-full ${className}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px] font-medium">
                    Reklam
                </span>
            </div>
            <AdBanner
                slot={slot}
                format="rectangle"
                style={{ minHeight: 100 }}
            />
        </div>
    );
}

export default AdCard;
