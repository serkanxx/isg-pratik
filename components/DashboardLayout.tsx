"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Building2, FileText, Shield, AlertTriangle, Eye, FileCheck,
    ChevronRight, LogOut, User, Settings, Home, LayoutDashboard,
    PlusCircle, Info, Clock, X, Check, RefreshCw, Edit, Save, Menu, StickyNote,
    Headphones as HeadphonesIcon, Moon, Sun, Calendar, Search, Briefcase, FolderOpen, Loader2, Bell, GraduationCap
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { P_VALUES, F_VALUES, S_VALUES } from '@/app/utils';
import { useTheme } from '@/app/context/ThemeContext';
import OnboardingTour, { useTourStatus } from '@/components/OnboardingTour';

const menuItems = [
    {
        name: 'Firmalarım',
        href: '/firmalar',
        icon: Building2,
        active: true,
        dataTour: 'firmalar'
    },
    {
        name: 'Risklerim',
        href: '/risk-maddelerim',
        icon: Shield,
        active: true,
        dataTour: 'risklerim'
    },
    {
        name: 'Raporlarım',
        href: '/raporlarim',
        icon: FileText,
        active: true,
        dataTour: 'raporlarim'
    },
    {
        name: 'Notlarım',
        href: '/notlarim',
        icon: StickyNote,
        active: true,
        dataTour: 'notlarim'
    },

    { type: 'divider' },
    {
        name: 'Risk Değerlendirmesi',
        href: '/risk-degerlendirme',
        icon: Shield,
        active: true,
        highlight: true,
        dataTour: 'risk-degerlendirme'
    },
    {
        name: 'Acil Durum Eylem Planı',
        href: '/acil-durum',
        icon: AlertTriangle,
        active: true,
        dataTour: 'acil-durum'
    },
    {
        name: 'Eğitim Katılım Formu',
        href: '/egitim-katilim',
        icon: GraduationCap,
        active: true,
        dataTour: 'egitim-katilim'
    },
    {
        name: 'İSG Sertifikası Oluştur',
        href: '/sertifika',
        icon: FileCheck,
        active: true,
        dataTour: 'sertifika'
    },
    {
        name: 'İş İzin Formu',
        href: '/is-izin-formu',
        icon: FileCheck,
        active: true,
        dataTour: 'is-izin'
    },
    {
        name: 'Firma Ziyaret Programı',
        href: '/ziyaret-programi',
        icon: Calendar,
        active: true,
        dataTour: 'ziyaret-programi'
    },
    {
        name: 'Nace  Teh. Sınıf Sorgula',
        href: '/nace-kod',
        icon: Search,
        active: true,
        dataTour: 'nace-kod'
    },
    {
        name: 'İSG İş İlanları',
        href: '/is-ilanlari',
        icon: Briefcase,
        active: true,
        dataTour: 'is-ilanlari'
    },
    {
        name: 'İSG Dosya Arşivi',
        href: '/arsiv',
        icon: FolderOpen,
        active: true,
        highlight: true,
        featured: true,
        dataTour: 'arsiv'
    },
];

const ADMIN_EMAIL = 'serkanxx@gmail.com';

// Re-export panel layout inner for use in other layouts
export { menuItems, ADMIN_EMAIL };

// This is a simplified wrapper - the actual layout is in panel/layout.tsx
// For moved pages, we import and use PanelLayout directly
import PanelLayout from '@/app/panel/layout';

export default PanelLayout;
