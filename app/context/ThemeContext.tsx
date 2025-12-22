"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isDark, setIsDark] = useState(true); // Default olarak karanlık mod
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // LocalStorage'dan tercihi oku, yoksa default karanlık mod
        const savedTheme = localStorage.getItem('theme');
        let initialIsDark = true; // Default karanlık mod
        
        if (savedTheme === 'light') {
            initialIsDark = false;
            setIsDark(false);
        } else if (savedTheme === 'dark') {
            initialIsDark = true;
            setIsDark(true);
        }
        // Eğer hiç kayıtlı tercih yoksa, default olarak karanlık mod (zaten true)
        
        // İlk yüklemede HTML elementine dark class'ını ekle/kaldır (SSR öncesi)
        const htmlElement = document.documentElement;
        if (initialIsDark) {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
        }
        
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            // LocalStorage'a kaydet
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            
            // HTML elementine dark class'ını ekle/kaldır (Tailwind dark mode için)
            const htmlElement = document.documentElement;
            if (isDark) {
                htmlElement.classList.add('dark');
            } else {
                htmlElement.classList.remove('dark');
            }
        }
    }, [isDark, mounted]);

    const toggleTheme = () => {
        setIsDark(prev => !prev);
    };

    // Her zaman Provider'ı render et (SSR uyumluluğu için)
    // Context her zaman mevcut olmalı, sadece değerler mount olana kadar default olabilir
    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
