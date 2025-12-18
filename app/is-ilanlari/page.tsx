"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Briefcase, Search, Calendar, ExternalLink, RefreshCw, Loader2,
  Image as ImageIcon, MessageSquare, Filter, X, ChevronLeft, ChevronRight
} from 'lucide-react';

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
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [channels, setChannels] = useState<string[]>([]);

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
      
      // Hata kontrolü
      if (!response.ok || data.error) {
        console.error('API hatası:', data.error || response.status);
        setChannels([]);
        return;
      }
      
      // Güvenli kontrol: data ve data.data var mı?
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
        // Boş array veya hata durumu
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
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center group">
                <div className="transition-transform duration-300 group-hover:scale-110">
                  <img src="/logo.png" alt="Logo" className="w-12 h-12 sm:w-20 sm:h-20 object-contain" />
                </div>
                <div className="ml-2 sm:ml-3 flex flex-col">
                  <span className="text-base sm:text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                    İSG Pratik
                  </span>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-blue-100 hover:text-white text-sm font-medium transition-colors"
              >
                Ana Sayfa
              </Link>
              {session ? (
                <Link
                  href="/panel"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
                >
                  Panel
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
                >
                  Giriş Yap
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Briefcase className="w-8 h-8 text-indigo-600" />
                İş İlanları
              </h1>
              <p className="text-gray-600 mt-2">
                Telegram kanallarından otomatik olarak çekilen güncel iş ilanları
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
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
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="İlan içeriğinde ara..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedChannel}
                onChange={(e) => {
                  setSelectedChannel(e.target.value);
                  setPage(1);
                }}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
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
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
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
          <div className="text-center py-20 bg-white rounded-lg shadow-sm">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">İlan bulunamadı</h3>
            <p className="text-gray-600">
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
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">@{posting.channelUsername}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatRelativeTime(posting.postedAt)}
                        </span>
                      </div>
                      {posting.hasMedia && (
                        <div className="flex items-center gap-2 text-sm text-indigo-600 mb-2">
                          <ImageIcon className="w-4 h-4" />
                          <span>Fotoğraf/Video içeriyor</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {posting.content}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                      {formatDate(posting.postedAt)}
                    </div>
                    <div className="text-xs text-gray-400">
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
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Sayfa {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">© 2025 İSG Pratik. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
