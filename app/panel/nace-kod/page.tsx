"use client";

import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle, Loader2, Info } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface NaceResult {
    code: string;
    activity: string;
    dangerClass: string;
}

interface NaceSuggestion {
    code: string;
    activity: string;
    dangerClass: string;
}

export default function NaceKodPage() {
    const { isDark } = useTheme();
    const [naceCode, setNaceCode] = useState<string>('');
    const [result, setResult] = useState<NaceResult | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [suggestions, setSuggestions] = useState<NaceSuggestion[]>([]);

    // NACE kodunu formatla (xx.xx.xx)
    const formatNaceCode = (value: string): string => {
        // Sadece rakamları al
        const numbers = value.replace(/\D/g, '');
        
        // Maksimum 6 haneli
        const limited = numbers.slice(0, 6);
        
        // Formatla: xx.xx.xx
        if (limited.length <= 2) {
            return limited;
        } else if (limited.length <= 4) {
            return `${limited.slice(0, 2)}.${limited.slice(2)}`;
        } else {
            return `${limited.slice(0, 2)}.${limited.slice(2, 4)}.${limited.slice(4)}`;
        }
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const formatted = formatNaceCode(value);
        setNaceCode(formatted);
        setResult(null);
        setError('');
        setSuggestions([]);
    };

    const handleSearch = async (codeToSearch?: string) => {
        const code = codeToSearch || naceCode;
        if (!code || code.replace(/\./g, '').length !== 6) {
            setError('Lütfen 6 haneli NACE kodu giriniz (örn: 01.11.14)');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);
        setSuggestions([]);

        try {
            // Noktaları kaldır ve API'ye gönder
            const codeWithoutDots = code.replace(/\./g, '');
            const response = await fetch(`/api/nace-kod?code=${codeWithoutDots}`);
            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'NACE kodu bulunamadı');
                setSuggestions(data.suggestions || []);
            } else {
                setResult(data);
                setSuggestions([]);
            }
        } catch (err: any) {
            setError('Sorgulama sırasında bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const getDangerClassColor = (dangerClass: string) => {
        const normalized = dangerClass.toLowerCase();
        if (normalized.includes('az')) {
            return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        } else if (normalized.includes('çok') || normalized.includes('cok')) {
            return 'bg-red-100 text-red-700 border-red-200';
        } else if (normalized.includes('tehlikeli')) {
            return 'bg-amber-100 text-amber-700 border-amber-200';
        }
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Başlık */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
                    <Search className="w-6 h-6 text-indigo-600" />
                    NACE Kod Tehlike Sınıfı Sorgula
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    NACE kodunu girerek faaliyet alanı ve tehlike sınıfını öğrenin
                </p>
            </div>

            {/* Arama Kutusu */}
            <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6 shadow-sm`}>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    NACE Kodu
                </label>
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={naceCode}
                            onChange={handleCodeChange}
                            onKeyPress={handleKeyPress}
                            placeholder="Örn: 01.11.14 veya 011114"
                            maxLength={8} // xx.xx.xx formatı için maksimum 8 karakter
                            className={`w-full px-4 py-3 pl-10 pr-4 border rounded-lg text-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                                isDark 
                                    ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400' 
                                    : 'bg-white border-slate-300 text-slate-800'
                            }`}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={loading || !naceCode}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Sorgula</span>
                            </>
                        ) : (
                            <>
                                <Search className="w-5 h-5" />
                                <span>Sorgula</span>
                            </>
                        )}
                    </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    6 haneli rakam giriniz (nokta otomatik eklenecektir)
                </p>
            </div>

            {/* Hata Mesajı */}
            {error && (
                <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6`}>
                    <div className="flex items-start gap-3 mb-3">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-red-800 dark:text-red-300 mb-1">Hata</h3>
                            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                        </div>
                    </div>
                    
                    {/* Öneriler */}
                    {suggestions && suggestions.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                            <h4 className="text-sm font-bold text-red-800 dark:text-red-300 mb-3">
                                Bunu mu aramıştınız?
                            </h4>
                            <div className="space-y-2">
                                {suggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setNaceCode(suggestion.code);
                                            setError('');
                                            setSuggestions([]);
                                            // Otomatik sorgula
                                            handleSearch(suggestion.code);
                                        }}
                                        className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                                            isDark
                                                ? 'bg-slate-700 border-slate-600 hover:border-indigo-500 hover:bg-slate-600'
                                                : 'bg-white border-slate-200 hover:border-indigo-500 hover:bg-indigo-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-lg">
                                                        {suggestion.code}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getDangerClassColor(suggestion.dangerClass)}`}>
                                                        {suggestion.dangerClass}
                                                    </span>
                                                </div>
                                                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {suggestion.activity}
                                                </p>
                                            </div>
                                            <Search className="w-5 h-5 text-indigo-500 ml-3 flex-shrink-0" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Sonuç */}
            {result && (
                <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm`}>
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                            Sorgulama Sonucu
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {/* NACE Kodu */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                NACE Kodu
                            </label>
                            <p className="text-lg font-mono font-bold text-slate-800 dark:text-slate-100">
                                {result.code}
                            </p>
                        </div>

                        {/* Faaliyet Alanı */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                Faaliyet Alanı
                            </label>
                            <p className={`text-base font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                {result.activity}
                            </p>
                        </div>

                        {/* Tehlike Sınıfı */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                Tehlike Sınıfı
                            </label>
                            <span className={`inline-block px-4 py-2 rounded-lg font-bold text-sm border-2 ${getDangerClassColor(result.dangerClass)}`}>
                                {result.dangerClass}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Bilgi Kutusu */}
            <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mt-6`}>
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-1">NACE Kodu Hakkında</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                            NACE (Nomenclature statistique des activités économiques dans la Communauté européenne) kodu, 
                            işletmelerin faaliyet alanlarını sınıflandırmak için kullanılan uluslararası bir kodlama sistemidir. 
                            Bu kod, işyerinizin tehlike sınıfını belirlemek için kullanılır.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

