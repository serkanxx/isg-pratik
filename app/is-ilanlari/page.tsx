"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useTheme } from '@/app/context/ThemeContext';
import {
  Briefcase, Search, Calendar, RefreshCw, Loader2,
  Image as ImageIcon, MessageSquare, Filter, X, ChevronLeft, ChevronRight,
  Trash2, Menu, Moon, Sun, Home, LayoutDashboard, LogOut,
  Building2, FileText, Shield, AlertTriangle, Eye, FileCheck,
  ChevronRight as ChevronRightIcon, StickyNote, Headphones as HeadphonesIcon, MapPin
} from 'lucide-react';
import { TURKIYE_ILLERI, findIlsInText } from '@/lib/turkiye-illeri';

const ADMIN_EMAIL = 'serkanxx@gmail.com';

const menuItems = [
  {
    name: 'Firmalarım',
    href: '/panel/firmalar',
    icon: Building2,
    active: true,
    dataTour: 'firmalar'
  },
  {
    name: 'Risklerim',
    href: '/panel/risk-maddelerim',
    icon: Shield,
    active: true,
    dataTour: 'risklerim'
  },
  {
    name: 'Raporlarım',
    href: '/panel/raporlarim',
    icon: FileText,
    active: true,
    dataTour: 'raporlarim'
  },
  {
    name: 'Notlarım',
    href: '/panel/notlarim',
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
    href: '/panel/acil-durum',
    icon: AlertTriangle,
    active: true,
    dataTour: 'acil-durum'
  },
  {
    name: 'İş İzin Formu',
    href: '/panel/is-izin-formu',
    icon: FileCheck,
    active: true,
    dataTour: 'is-izin'
  },
  {
    name: 'Firma Ziyaret Programı',
    href: '/panel/ziyaret-programi',
    icon: Calendar,
    active: true,
    dataTour: 'ziyaret-programi'
  },
  {
    name: 'Nace  Teh. Sınıf Sorgula',
    href: '/panel/nace-kod',
    icon: Search,
    active: true,
    dataTour: 'nace-kod'
  },
  {
    name: 'İş İlanları',
    href: '/is-ilanlari',
    icon: Briefcase,
    active: true,
    dataTour: 'is-ilanlari'
  },
  {
    name: 'Saha Gözlem Formları',
    href: '#',
    icon: Eye,
    active: false,
    badge: 'YAKINDA'
  },
  {
    name: 'DÖF Yönetimi',
    href: '#',
    icon: FileCheck,
    active: false,
    badge: 'YAKINDA'
  },
];

interface JobPosting {
  id: string;
  content: string;
  hasMedia: boolean;
  mediaUrl: string | null;
  postedAt: string;
  channelUsername: string;
  viewCount: number;
  createdAt: string;
}

// Vurgulanacak terimler (kalın yazılacak)
const HIGHLIGHT_TERMS = [
  'DSP',
  'Diğer Sağlık Personeli',
  'C sınıfı İş Güvenlik Uzmanı',
  'B sınıfı İş Güvenlik Uzmanı',
  'A sınıfı İş Güvenlik Uzmanı',
  'İşyeri Hekimi',
  'İş Sağlığı ve Güvenliği Teknikeri',
  'İSG Teknikeri',
  'A Sınıfı İSG Uzmanı',
  'B Sınıfı İSG Uzmanı',
  'C Sınıfı İSG Uzmanı',
  'A sınıfı İSG Uzmanı',
  'B sınıfı İSG Uzmanı',
  'C sınıfı İSG Uzmanı',
  'A Sınıfı İş Güvenlik Uzmanı',
  'B Sınıfı İş Güvenlik Uzmanı',
  'C Sınıfı İş Güvenlik Uzmanı'
];

// Telefon numarası, email, il isimleri ve özel terimleri tespit ve formatla
const parseContent = (content: string) => {
  // Telefon numarası regex (Türk formatı: 05XX XXX XX XX, 0XXX XXX XX XX, +90 5XX XXX XX XX, (0XXX) XXX XX XX)
  const phoneRegex = /(\+?90\s?)?(\(?0?[5][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2})|(\(?0?[1-9][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2})/g;
  
  // Email regex
  const emailRegex = /([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  
  // İl isimlerini bul
  const foundIls = findIlsInText(content);
  
  // Özel terimleri bul (case-insensitive)
  const foundTerms: Array<{ index: number; length: number; value: string }> = [];
  for (const term of HIGHLIGHT_TERMS) {
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let match;
    while ((match = regex.exec(content)) !== null) {
      foundTerms.push({
        index: match.index,
        length: match[0].length,
        value: match[0]
      });
    }
  }
  
  // İl isimlerini bul
  const foundIlMatches: Array<{ index: number; length: number; value: string }> = [];
  for (const il of foundIls) {
    const regex = new RegExp(il.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let match;
    while ((match = regex.exec(content)) !== null) {
      foundIlMatches.push({
        index: match.index,
        length: match[0].length,
        value: match[0]
      });
    }
  }

  const parts: Array<{ type: 'text' | 'phone' | 'email' | 'highlight' | 'city'; content: string; link?: string }> = [];
  let lastIndex = 0;
  let match;

  // Tüm eşleşmeleri bul ve sırala
  const matches: Array<{ index: number; length: number; type: 'phone' | 'email' | 'highlight' | 'city'; value: string }> = [];

  // Telefon numaralarını bul
  while ((match = phoneRegex.exec(content)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'phone',
      value: match[0]
    });
  }

  // Email'leri bul
  while ((match = emailRegex.exec(content)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'email',
      value: match[0]
    });
  }

  // Özel terimleri ekle
  for (const term of foundTerms) {
    matches.push({
      index: term.index,
      length: term.length,
      type: 'highlight',
      value: term.value
    });
  }

  // İl isimlerini ekle
  for (const il of foundIlMatches) {
    matches.push({
      index: il.index,
      length: il.length,
      type: 'city',
      value: il.value
    });
  }

  // Eşleşmeleri index'e göre sırala
  matches.sort((a, b) => a.index - b.index);

  // Çakışmaları önle (öncelik sırası: email > phone > highlight > city > text)
  const filteredMatches: typeof matches = [];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const overlaps = filteredMatches.some(m => 
      (current.index >= m.index && current.index < m.index + m.length) ||
      (m.index >= current.index && m.index < current.index + current.length)
    );
    if (!overlaps) {
      filteredMatches.push(current);
    } else {
      // Öncelik kontrolü
      const priority: Record<string, number> = { email: 4, phone: 3, highlight: 2, city: 1 };
      const currentPriority = priority[current.type] || 0;
      const overlappingIndex = filteredMatches.findIndex(m => 
        (current.index >= m.index && current.index < m.index + m.length) ||
        (m.index >= current.index && m.index < current.index + current.length)
      );
      if (overlappingIndex !== -1) {
        const overlapping = filteredMatches[overlappingIndex];
        const overlappingPriority = priority[overlapping.type] || 0;
        if (currentPriority > overlappingPriority) {
          filteredMatches.splice(overlappingIndex, 1);
          filteredMatches.push(current);
        }
      }
    }
  }

  // Parçaları oluştur
  for (const match of filteredMatches) {
    // Önceki metin
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex, match.index)
      });
    }

    // Eşleşme
    if (match.type === 'phone') {
      // Telefon numarasını temizle ve tel: link'e çevir
      let cleanPhone = match.value.replace(/[\s\-\(\)]/g, '').replace(/^\+?90/, '');
      if (!cleanPhone.startsWith('0')) {
        cleanPhone = '0' + cleanPhone;
      }
      parts.push({
        type: 'phone',
        content: match.value,
        link: `tel:${cleanPhone}`
      });
    } else if (match.type === 'email') {
      parts.push({
        type: 'email',
        content: match.value,
        link: `mailto:${match.value}`
      });
    } else if (match.type === 'highlight') {
      parts.push({
        type: 'highlight',
        content: match.value
      });
    } else if (match.type === 'city') {
      parts.push({
        type: 'city',
        content: match.value
      });
    }

    lastIndex = match.index + match.length;
  }

  // Kalan metin
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.substring(lastIndex)
    });
  }

  // Eğer hiç eşleşme yoksa, tüm metni döndür
  if (parts.length === 0) {
    return [{ type: 'text' as const, content }];
  }

  return parts;
};

export default function IsIlanlariPage() {
  const { data: session } = useSession();
  const { isDark, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = session?.user?.email === ADMIN_EMAIL || (session?.user as any)?.role === 'ADMIN';

  // İş ilanlarını çek - filtreler değiştiğinde
  useEffect(() => {
    fetchJobPostings();
  }, [page, searchTerm, selectedCity]);

  const fetchJobPostings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (selectedCity) {
        params.append('city', selectedCity);
      }

      const response = await fetch(`/api/job-postings?${params}`);
      const data = await response.json();

      if (!response.ok || data.error) {
        console.error('API hatası:', data.error || response.status);
        setJobPostings([]);
        setTotalPages(1);
        return;
      }

      setJobPostings(Array.isArray(data.data) ? data.data : []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('İş ilanları yüklenemedi:', error);
      setJobPostings([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchJobPostings();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    
    if (!confirm('Bu iş ilanını silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/job-postings/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'İlan silinirken bir hata oluştu');
        return;
      }

      // Listeden kaldır
      setJobPostings(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('İlan silinirken bir hata oluştu');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Az önce';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} gün önce`;
    return formatDate(dateString);
  };

  return (
    <div className={`min-h-screen flex ${isDark ? 'dark-content bg-slate-900' : 'bg-slate-100'}`}>
      {/* Mobil Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Panel ile aynı */}
      <aside className={`
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        w-72 flex flex-col fixed h-screen z-50 transition-all duration-300
        ${isDark 
          ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white' 
          : 'bg-gradient-to-b from-white via-slate-50 to-white text-slate-900 border-r border-slate-200'
        }
      `}>
        {/* Logo */}
        <div className={`p-6 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center group">
              <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
              <div className="ml-3">
                <span className={`text-xl font-bold bg-clip-text text-transparent ${isDark ? 'bg-gradient-to-r from-white to-blue-200' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
                  İSG Pratik
                </span>
                <span className={`block text-[10px] tracking-widest uppercase ${isDark ? 'text-blue-300/70' : 'text-slate-500'}`}>
                  Yönetim Paneli
                </span>
              </div>
            </Link>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className={`md:hidden p-2 rounded-lg transition-colors ${isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Kullanıcı Bilgisi */}
        {session && (
          <div className={`px-6 py-4 border-b ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'} transition-colors cursor-pointer`}>
            <Link href="/panel" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {session.user?.name || session.user?.email}
                </p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Kullanıcı</p>
              </div>
            </Link>
          </div>
        )}

        {/* Menü */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item, index) => {
              if (item.type === 'divider') {
                return <li key={index} className={`my-4 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`} />;
              }

              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={index}>
                  <Link
                    href={item.active ? item.href : '#'}
                    data-tour={item.dataTour}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                      ${isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : item.active
                          ? item.highlight
                            ? isDark
                              ? 'text-emerald-400 hover:bg-white/5'
                              : 'text-emerald-600 hover:bg-slate-100'
                            : isDark
                              ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          : isDark
                            ? 'text-slate-500 cursor-not-allowed'
                            : 'text-slate-400 cursor-not-allowed'
                      }
                    `}
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
                        {item.badge}
                      </span>
                    )}
                    {item.active && !item.badge && (
                      <ChevronRightIcon className="w-4 h-4 opacity-50" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Alt Menü - Dark Mode Toggle + Destek */}
        <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={toggleTheme}
              data-tour="dark-mode"
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}
              title={isDark ? 'Açık Mod' : 'Karanlık Mod'}
            >
              {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link
              href="/destek"
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}
              title="Destek"
            >
              <HeadphonesIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Ana İçerik */}
      <main className={`flex-1 md:ml-72 min-h-screen ${isDark ? 'dark-content bg-slate-900' : 'bg-slate-100'}`}>
        {/* Üst Navbar - Panel ile aynı */}
        <nav className={`shadow-xl backdrop-blur-md sticky top-0 z-40 transition-all duration-300 ${
          isDark 
            ? 'bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 border-b border-white/10' 
            : 'bg-gradient-to-r from-white via-indigo-50 to-white border-b border-slate-200'
        }`}>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              {/* Mobil Hamburger Menü */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className={`p-2 rounded-lg relative z-10 transition-colors ${
                    isDark 
                      ? 'text-blue-100 hover:bg-white/10' 
                      : 'text-indigo-600 hover:bg-indigo-100'
                  }`}
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>

              {/* Desktop Nav Links */}
              <div className="hidden md:flex items-center space-x-1.5">
              </div>

              {/* Sağ taraf - Kullanıcı bilgisi */}
              <div className="flex items-center gap-3">
                {session ? (
                  <>
                    <Link
                      href="/panel"
                      className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Panel
                    </Link>
                    <div className="hidden sm:flex flex-col items-end mr-2">
                      <span className={`text-xs font-bold ${isDark ? 'text-blue-100' : 'text-slate-700'}`}>
                        {session?.user?.name || session?.user?.email}
                      </span>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: 'https://www.isgpratik.com/' })}
                      className={`p-2 rounded-xl transition-all shadow-sm ${
                        isDark 
                          ? 'bg-white/10 hover:bg-red-500/20 text-blue-200 hover:text-red-200 border border-white/10 hover:border-red-400/30' 
                          : 'bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-300'
                      }`}
                      title="Çıkış Yap"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg ${
                      isDark
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    Giriş Yap
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* İçerik */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Briefcase className="w-8 h-8 text-indigo-600" />
                  İş İlanları
                </h1>
                <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Telegram kanallarından otomatik olarak çekilen güncel iş ilanları
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                  isDark
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Yenile</span>
              </button>
            </div>

            {/* Filters */}
            <div className={`flex flex-col sm:flex-row gap-4 p-4 rounded-lg shadow-sm ${
              isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
            }`}>
              <div className="flex-1 relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="İlan içeriğinde ara..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                      : 'bg-white border-gray-300 text-slate-900'
                  }`}
                />
              </div>
              <div className="relative">
                <MapPin className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setPage(1);
                  }}
                  className={`pl-10 pr-8 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-gray-300 text-slate-900'
                  }`}
                >
                  <option value="">Tüm İller</option>
                  {TURKIYE_ILLERI.sort().map((il) => (
                    <option key={il} value={il}>
                      {il}
                    </option>
                  ))}
                </select>
              </div>
              {(searchTerm || selectedCity) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCity('');
                    setPage(1);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-slate-100'
                  }`}
                >
                  <X className="w-4 h-4" />
                  Temizle
                </button>
              )}
            </div>
          </div>

          {/* Job Postings List */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : jobPostings.length === 0 ? (
            <div className={`text-center py-20 rounded-lg shadow-sm ${
              isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
            }`}>
              <Briefcase className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
              <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                İlan bulunamadı
              </h3>
              <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                {searchTerm || selectedCity
                  ? 'Arama kriterlerinize uygun ilan bulunamadı.'
                  : 'Henüz hiç ilan eklenmemiş.'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-8">
                {jobPostings.map((posting) => {
                  const contentParts = parseContent(posting.content);
                  
                  return (
                    <div
                      key={posting.id}
                      className={`rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow ${
                        isDark
                          ? 'bg-slate-800 border-slate-700'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                              @{posting.channelUsername}
                            </span>
                            <span className={isDark ? 'text-slate-600' : 'text-gray-300'}>•</span>
                            <span className={`text-sm flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                              <Calendar className="w-4 h-4" />
                              {formatRelativeTime(posting.postedAt)}
                            </span>
                          </div>
                          {posting.hasMedia && (
                            <div className={`flex items-center gap-2 text-sm mb-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                              <ImageIcon className="w-4 h-4" />
                              <span>Fotoğraf/Video içeriyor</span>
                            </div>
                          )}
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(posting.id)}
                            disabled={deletingId === posting.id}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark
                                ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300'
                                : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                            } disabled:opacity-50`}
                            title="İlanı Sil"
                          >
                            {deletingId === posting.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>

                      <div className="prose max-w-none">
                        <p className={`whitespace-pre-wrap leading-relaxed ${
                          isDark ? 'text-slate-200' : 'text-gray-800'
                        }`}>
                          {contentParts.map((part, index) => {
                            if (part.type === 'text') {
                              return <span key={index}>{part.content}</span>;
                            } else if (part.type === 'phone') {
                              return (
                                <a
                                  key={index}
                                  href={part.link}
                                  className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md transition-all ${
                                    isDark
                                      ? 'text-blue-300 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 hover:border-blue-400/50'
                                      : 'text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-300 hover:border-blue-400'
                                  }`}
                                >
                                  📞 {part.content}
                                </a>
                              );
                            } else if (part.type === 'email') {
                              return (
                                <a
                                  key={index}
                                  href={part.link}
                                  className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md transition-all ${
                                    isDark
                                      ? 'text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 hover:border-emerald-400/50'
                                      : 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 hover:border-emerald-400'
                                  }`}
                                >
                                  ✉️ {part.content}
                                </a>
                              );
                            } else if (part.type === 'highlight') {
                              return (
                                <strong
                                  key={index}
                                  className={`font-bold ${
                                    isDark
                                      ? 'text-yellow-300'
                                      : 'text-yellow-700'
                                  }`}
                                >
                                  {part.content}
                                </strong>
                              );
                            } else if (part.type === 'city') {
                              return (
                                <strong
                                  key={index}
                                  className={`font-bold ${
                                    isDark
                                      ? 'text-purple-300'
                                      : 'text-purple-700'
                                  }`}
                                >
                                  {part.content}
                                </strong>
                              );
                            }
                            return null;
                          })}
                        </p>
                      </div>

                      <div className={`mt-4 pt-4 border-t flex items-center justify-between ${
                        isDark ? 'border-slate-700' : 'border-gray-100'
                      }`}>
                        <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                          {formatDate(posting.postedAt)}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                          {posting.viewCount} görüntülenme
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark
                        ? 'border border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'border border-gray-300 text-slate-700 hover:bg-gray-50'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className={`px-4 py-2 text-sm ${
                    isDark ? 'text-slate-400' : 'text-gray-600'
                  }`}>
                    Sayfa {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark
                        ? 'border border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'border border-gray-300 text-slate-700 hover:bg-gray-50'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
