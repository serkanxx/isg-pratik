"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTheme } from '@/app/context/ThemeContext';
import {
  Briefcase, Search, Calendar, RefreshCw, Loader2,
  Image as ImageIcon, MessageSquare, Filter, X, ChevronLeft, ChevronRight,
  Trash2, Menu, Moon, Sun, Home, LayoutDashboard
} from 'lucide-react';

const ADMIN_EMAIL = 'serkanxx@gmail.com';

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

export default function IsIlanlariPage() {
  const { data: session } = useSession();
  const { isDark, toggleTheme } = useTheme();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [channels, setChannels] = useState<string[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = session?.user?.email === ADMIN_EMAIL || (session?.user as any)?.role === 'ADMIN';

  // İş ilanlarını çek - filtreler değiştiğinde
  useEffect(() => {
    fetchJobPostings();
  }, [page, searchTerm, selectedChannel]);

  // Kanalları sadece bir kez çek
  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/job-postings?limit=1000');
      const data = await response.json();
      
      if (!response.ok || data.error) {
        console.error('API hatası:', data.error || response.status);
        setChannels([]);
        return;
      }
      
      if (data && Array.isArray(data.data)) {
        const uniqueChannels: string[] = Array.from(new Set(
          data.data
            .map((post: JobPosting) => post.channelUsername)
            .filter((channel: string | null | undefined): channel is string => 
              typeof channel === 'string' && channel.length > 0
            )
        ));
        setChannels(uniqueChannels);
      } else {
        setChannels([]);
      }
    } catch (error) {
      console.error('Kanal listesi alınamadı:', error);
      setChannels([]);
    }
  };

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

      if (selectedChannel) {
        params.append('channel', selectedChannel);
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

      {/* Sidebar */}
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
                  İş İlanları
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

        {/* Menü */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-1">
            <li>
              <Link
                href="/"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isDark
                    ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Home className="w-5 h-5" />
                <span>Ana Sayfa</span>
              </Link>
            </li>
            {session && (
              <li>
                <Link
                  href="/panel"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isDark
                      ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Panel</span>
                </Link>
              </li>
            )}
            <li>
              <Link
                href="/is-ilanlari"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-600/30`}
              >
                <Briefcase className="w-5 h-5" />
                <span>İş İlanları</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Alt Menü - Dark Mode Toggle */}
        <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="flex items-center justify-center">
            <button
              onClick={toggleTheme}
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}
              title={isDark ? 'Açık Mod' : 'Karanlık Mod'}
            >
              {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Ana İçerik */}
      <main className="flex-1 md:ml-72 min-h-screen">
        {/* Üst Navbar */}
        <nav className={`shadow-xl backdrop-blur-md sticky top-0 z-40 transition-all duration-300 ${
          isDark 
            ? 'bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 border-b border-white/10' 
            : 'bg-gradient-to-r from-white via-indigo-50 to-white border-b border-slate-200'
        }`}>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className={`md:hidden p-2 rounded-lg transition-colors ${isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex-1" />
              {!session && (
                <Link
                  href="/login"
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  Giriş Yap
                </Link>
              )}
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
                <Filter className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                <select
                  value={selectedChannel}
                  onChange={(e) => {
                    setSelectedChannel(e.target.value);
                    setPage(1);
                  }}
                  className={`pl-10 pr-8 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-gray-300 text-slate-900'
                  }`}
                >
                  <option value="">Tüm Kanallar</option>
                  {channels.map((channel) => (
                    <option key={channel} value={channel}>
                      @{channel}
                    </option>
                  ))}
                </select>
              </div>
              {(searchTerm || selectedChannel) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedChannel('');
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
                {searchTerm || selectedChannel
                  ? 'Arama kriterlerinize uygun ilan bulunamadı.'
                  : 'Henüz hiç ilan eklenmemiş.'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-8">
                {jobPostings.map((posting) => (
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
                        {posting.content}
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
                ))}
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
