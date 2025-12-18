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
        setMounted(true);
        // LocalStorage'dan tercihi oku, yoksa default karanlık mod
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            setIsDark(false);
        } else if (savedTheme === 'dark') {
            setIsDark(true);
        }
        // Eğer hiç kayıtlı tercih yoksa, default olarak karanlık mod (zaten true)
    }, []);

    useEffect(() => {
        if (mounted) {
            // LocalStorage'a kaydet
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        }
    }, [isDark, mounted]);

    const toggleTheme = () => {
        setIsDark(prev => !prev);
    };

    // SSR uyumluluğu için mount olana kadar bekle
    if (!mounted) {
        return <>{children}</>;
    }

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
