"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronRight as ChevronRightIcon, StickyNote, Headphones as HeadphonesIcon, MapPin,
  Send, MessageCircle, AlertCircle, CheckCircle, FolderOpen, Bell, Info, GraduationCap,
  Plus, User as UserIcon
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
    name: 'Eğitim Katılım Formu',
    href: '/panel/egitim-katilim',
    icon: GraduationCap,
    active: true,
    dataTour: 'egitim-katilim'
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
    name: 'İSG İş İlanları',
    href: '/is-ilanlari',
    icon: Briefcase,
    active: true,
    dataTour: 'is-ilanlari'
  },
  {
    name: 'İSG Dosya Arşivi',
    href: '/panel/arsiv',
    icon: FolderOpen,
    active: true,
    highlight: true,
    featured: true,
    dataTour: 'arsiv'
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

interface JobComment {
  id: string;
  content: string;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
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
  'C Sınıfı İş Güvenlik Uzmanı',
  // Yeni eklenen terimler
  'A Sınıfı İş Güvenliği',
  'A Sınıfı İş Güvenlik',
  'B Sınıfı İş Güvenliği',
  'B Sınıfı İş Güvenlik',
  'C Sınıfı İş Güvenliği',
  'C Sınıfı İş Güvenlik',
  'İş Güvenliği Uzmanı',
  'A sınıfı İsg uzmanı',
  'B sınıfı İsg uzmanı',
  'C sınıfı İsg uzmanı'
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

  // Yorum state'leri
  const [comments, setComments] = useState<Record<string, JobComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [showCommentModal, setShowCommentModal] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [archiveFileCount, setArchiveFileCount] = useState<number | null>(null);

  // Kullanıcı ilanı state'leri
  const [showJobPostingModal, setShowJobPostingModal] = useState(false);
  const [jobPostingContent, setJobPostingContent] = useState('');
  const [jobPostingCity, setJobPostingCity] = useState('Tüm Türkiye');
  const [submittingJobPosting, setSubmittingJobPosting] = useState(false);
  const [userJobPostings, setUserJobPostings] = useState<any[]>([]);

  // Notification state
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Bildirim state'leri
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());

  const isAdmin = session?.user?.email === ADMIN_EMAIL || (session?.user as any)?.role === 'ADMIN';

  // Tüm ilanları birleştir ve tarihe göre sırala (en yeni en üstte)
  const allPostings = useMemo(() => {
    const telegramPosts = jobPostings.map(p => ({
      ...p,
      _type: 'telegram' as const,
      _sortDate: new Date(p.postedAt || p.createdAt).getTime()
    }));

    const userPosts = userJobPostings.map(p => ({
      ...p,
      _type: 'user' as const,
      _sortDate: new Date(p.createdAt).getTime()
    }));

    return [...telegramPosts, ...userPosts].sort((a, b) => b._sortDate - a._sortDate);
  }, [jobPostings, userJobPostings]);

  // Notification göster
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 5000);
  };

  // R2'den arşiv dosya sayısını çek
  useEffect(() => {
    const fetchArchiveFileCount = async () => {
      try {
        const res = await fetch('/api/archive/list');
        if (res.ok) {
          const data = await res.json();
          if (data.files && Array.isArray(data.files)) {
            setArchiveFileCount(data.files.length);
          }
        }
      } catch (err) {
        console.error("Arşiv dosya sayısı alınamadı:", err);
      }
    };
    fetchArchiveFileCount();
  }, []);

  // Bildirimleri localStorage'dan yükle
  useEffect(() => {
    const stored = localStorage.getItem('readNotificationIds');
    if (stored) {
      try {
        setReadNotificationIds(new Set(JSON.parse(stored)));
      } catch (err) {
        console.error("Bildirim verileri yüklenemedi:", err);
      }
    }
  }, []);

  // Tüm ilanları çek - filtreler değiştiğinde (paralel)
  useEffect(() => {
    const fetchAllPostings = async () => {
      setLoading(true);
      try {
        // Her iki API çağrısını paralel yap
        await Promise.all([fetchJobPostings(), fetchUserJobPostings()]);
      } finally {
        setLoading(false);
      }
    };
    fetchAllPostings();
  }, [page, searchTerm, selectedCity]);

  // Bildirim verileri
  const today = new Date();
  const notifications = [
    {
      id: 'is-ilanlari',
      title: 'İSG İş İlanları Eklendi',
      description: 'İSG iş ilanları bölümü eklendi, iş arayanlar ve işverenler için platform oluşturuldu.',
      date: new Date(today)
    },
    {
      id: 'mobil-iyilestirme',
      title: 'Mobil Görünümde İyileştirmeler Yapıldı',
      description: 'Mobil cihazlarda daha iyi bir deneyim için arayüz iyileştirmeleri yapıldı.',
      date: new Date(today)
    },
    {
      id: 'dosya-arsivi',
      title: 'İSG Dev Dosya Arşivi Eklendi',
      description: 'Kapsamlı İSG dosya arşivi eklendi, binlerce dokümana kolayca erişebilirsiniz.',
      date: new Date(today)
    }
  ];

  // Okunmamış bildirim sayısı
  const unreadCount = notifications.filter(n => !readNotificationIds.has(n.id)).length;

  // Bildirim penceresini aç
  const handleOpenNotifications = () => {
    setShowNotifications(true);
  };

  // Bildirim penceresini kapat
  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };

  // Bildirim penceresi açıldığında 2 saniye sonra otomatik okundu işaretle
  useEffect(() => {
    if (showNotifications && unreadCount > 0) {
      const timer = setTimeout(() => {
        // Tüm okunmamış bildirimleri okundu olarak işaretle
        setReadNotificationIds(prevIds => {
          const unreadIds = notifications
            .filter(n => !prevIds.has(n.id))
            .map(n => n.id);

          if (unreadIds.length > 0) {
            const newReadIds = new Set(prevIds);
            unreadIds.forEach(id => newReadIds.add(id));
            localStorage.setItem('readNotificationIds', JSON.stringify(Array.from(newReadIds)));
            return newReadIds;
          }
          return prevIds;
        });
      }, 2000); // 2 saniye

      return () => clearTimeout(timer);
    }
  }, [showNotifications, unreadCount]);

  // Bildirimi okundu olarak işaretle
  const markAsRead = (id: string) => {
    const newReadIds = new Set(readNotificationIds);
    newReadIds.add(id);
    setReadNotificationIds(newReadIds);
    localStorage.setItem('readNotificationIds', JSON.stringify(Array.from(newReadIds)));
  };

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadNotificationIds(allIds);
    localStorage.setItem('readNotificationIds', JSON.stringify(Array.from(allIds)));
  };

  const fetchJobPostings = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15'
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
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchJobPostings(), fetchUserJobPostings()]);
    } finally {
      setRefreshing(false);
    }
  };

  // Kullanıcı ilanlarını çek
  const fetchUserJobPostings = async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50'
      });

      if (selectedCity) {
        params.append('city', selectedCity);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/user-job-postings?${params}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setUserJobPostings(data.data || []);
      }
    } catch (error) {
      console.error('Kullanıcı ilanları yüklenemedi:', error);
    }
  };

  // İlan gönder
  const handleSubmitJobPosting = async () => {
    if (!jobPostingContent.trim()) {
      showNotification('Lütfen ilan içeriği yazın', 'error');
      return;
    }

    if (!session) {
      showNotification('İlan vermek için giriş yapmalısınız', 'error');
      return;
    }

    try {
      setSubmittingJobPosting(true);
      const response = await fetch('/api/user-job-postings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: jobPostingContent.trim(),
          city: jobPostingCity
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showNotification(data.message || 'İlanınız başarıyla gönderildi. Admin onayından sonra yayınlanacaktır.', 'success');
        setShowJobPostingModal(false);
        setJobPostingContent('');
        setJobPostingCity('Tüm Türkiye');
      } else {
        showNotification(data.error || 'İlan gönderilirken bir hata oluştu', 'error');
      }
    } catch (error: any) {
      console.error('İlan gönderme hatası:', error);
      showNotification('İlan gönderilirken bir hata oluştu', 'error');
    } finally {
      setSubmittingJobPosting(false);
    }
  };

  // fetchUserJobPostings yukarıdaki useEffect'te çağrılıyor (Promise.all ile paralel)


  const fetchComments = async (jobPostingId: string) => {
    if (loadingComments[jobPostingId]) return;

    try {
      setLoadingComments(prev => ({ ...prev, [jobPostingId]: true }));
      const response = await fetch(`/api/job-postings/${jobPostingId}/comments`);
      const data = await response.json();

      if (response.ok && data.success) {
        setComments(prev => ({ ...prev, [jobPostingId]: data.data || [] }));
      }
    } catch (error) {
      console.error('Yorumlar yüklenemedi:', error);
    } finally {
      setLoadingComments(prev => ({ ...prev, [jobPostingId]: false }));
    }
  };

  const handleToggleComments = (jobPostingId: string) => {
    setExpandedComments(prev => {
      const isExpanded = !prev[jobPostingId];
      if (isExpanded && !comments[jobPostingId]) {
        fetchComments(jobPostingId);
      }
      return { ...prev, [jobPostingId]: isExpanded };
    });
  };

  const handleOpenCommentModal = (jobPostingId: string) => {
    if (!session) {
      alert('Yorum yapmak için giriş yapmalısınız');
      return;
    }
    setShowCommentModal(jobPostingId);
    setCommentContent('');
    setIsAnonymous(false);
  };

  const handleSubmitComment = async (jobPostingId: string) => {
    if (!commentContent.trim()) {
      showNotification('Lütfen yorum içeriği girin', 'error');
      return;
    }

    try {
      setSubmittingComment(true);
      const response = await fetch(`/api/job-postings/${jobPostingId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: commentContent.trim(),
          isAnonymous
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // JSON parse hatası
        showNotification('Sunucudan geçersiz yanıt alındı', 'error');
        return;
      }

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || 'Yorum eklenirken bir hata oluştu';
        showNotification(errorMessage, 'error');
        return;
      }

      if (data.success) {
        showNotification(data.message || 'Yorumunuz admin onayına sunuldu. Onaylandıktan sonra görünecektir.', 'success');
        setShowCommentModal(null);
        setCommentContent('');
        setIsAnonymous(false);
      } else {
        showNotification(data.error || 'Yorum eklenirken bir hata oluştu', 'error');
      }
    } catch (error: any) {
      console.error('Yorum eklenemedi:', error);
      const errorMessage = error?.message || 'Yorum eklenirken bir hata oluştu. Lütfen tekrar deneyin.';
      showNotification(errorMessage, 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async (id: string, isUserPosting: boolean = false) => {
    if (!isAdmin) return;

    if (!confirm('Bu iş ilanını silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setDeletingId(id);

      // İlan türüne göre farklı API endpoint kullan
      const endpoint = isUserPosting
        ? `/api/admin/user-job-postings/${id}`
        : `/api/job-postings/${id}`;

      const response = await fetch(endpoint, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        showNotification(data.error || 'İlan silinirken bir hata oluştu', 'error');
        return;
      }

      // İlan türüne göre doğru state'i güncelle
      if (isUserPosting) {
        setUserJobPostings(prev => prev.filter(p => p.id !== id));
      } else {
        setJobPostings(prev => prev.filter(p => p.id !== id));
      }

      showNotification('İlan başarıyla silindi', 'success');
    } catch (error) {
      console.error('Silme hatası:', error);
      showNotification('İlan silinirken bir hata oluştu', 'error');
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
      {/* Notification */}
      {notification.show && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-2xl z-[100] flex items-center animate-fade-in ${notification.type === 'error'
            ? 'bg-red-600 text-white'
            : 'bg-green-600 text-white'
            }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-5 h-5 mr-2" />
          ) : (
            <CheckCircle className="w-5 h-5 mr-2" />
          )}
          <span className="font-bold text-sm">{notification.message}</span>
        </div>
      )}

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
        {/* Logo + Premium Bilgisi */}
        <div className={`p-6 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <Link
              href="/panel"
              className="flex items-center group"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
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
            {/* Mobil Kapat Butonu */}
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
            {menuItems.map((item, index) => {
              if (item.type === 'divider') {
                return <li key={index} className={`my-4 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`} />;
              }

              const isActive = pathname === item.href;
              const Icon = item.icon;

              // Özel stillendirme: İSG Dosya Arşivi
              const isFeatured = (item as any).featured === true;

              return (
                <li key={index}>
                  <Link
                    href={item.active ? item.href : '#'}
                    data-tour={item.dataTour}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                      ${isActive
                        ? isFeatured
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/50 ring-2 ring-purple-400/50'
                          : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : item.active
                          ? isFeatured
                            ? isDark
                              ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-300 hover:from-purple-600/30 hover:to-indigo-600/30 border-2 border-purple-500/50 hover:border-purple-400 shadow-lg shadow-purple-600/20 font-bold'
                              : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-700 hover:from-purple-500/30 hover:to-indigo-500/30 border-2 border-purple-400 hover:border-purple-500 shadow-lg shadow-purple-500/20 font-bold'
                            : item.highlight
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
                    {Icon && <Icon className={`w-5 h-5 ${isFeatured && !isActive ? 'text-purple-600 dark:text-purple-400' : ''}`} />}
                    <span className="flex-1">{item.name}</span>
                    {isFeatured && archiveFileCount !== null && (
                      <span className={`
                        px-2 py-0.5 rounded-full text-xs font-bold
                        ${isActive || isFeatured
                          ? isDark
                            ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50'
                            : 'bg-purple-500 text-white'
                          : isDark
                            ? 'bg-purple-600/40 text-purple-300 border border-purple-500/50'
                            : 'bg-purple-600 text-white'
                        }
                      `}>
                        {archiveFileCount.toLocaleString('tr-TR')} dosya
                      </span>
                    )}
                    {isFeatured && archiveFileCount === null && (
                      <span className={`
                        px-2 py-0.5 rounded-full text-xs font-bold
                        ${isDark
                          ? 'bg-slate-700/40 text-slate-400 border border-slate-600/50'
                          : 'bg-slate-300 text-slate-600'
                        }
                      `}>
                        <Loader2 className="w-3 h-3 animate-spin inline" />
                      </span>
                    )}
                    {item.active && !isFeatured && (
                      <ChevronRightIcon className="w-4 h-4 opacity-50" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Alt Menü - Dark Mode Toggle + Destek (Desktop only) */}
        <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="hidden md:flex items-center justify-center gap-2">
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
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <HeadphonesIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Ana İçerik */}
      <main className={`flex-1 md:ml-72 min-h-screen ${isDark ? 'dark-content bg-slate-900' : 'bg-slate-100'}`}>
        {/* Üst Navbar - Panel ile aynı */}
        <nav className={`shadow-xl backdrop-blur-md sticky top-0 z-40 transition-all duration-300 ${isDark
          ? 'bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 border-b border-white/10'
          : 'bg-gradient-to-r from-white via-indigo-50 to-white border-b border-slate-200'
          }`}>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              {/* Mobil Hamburger Menü */}
              <div className="relative md:hidden">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className={`p-2 rounded-lg relative z-10 transition-colors ${isDark
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

              {/* Sağ taraf - Kullanıcı bilgisi - Layout shift önleme için min-width */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-[120px] sm:min-w-[280px] justify-end">
                {session ? (
                  <>
                    {/* Mobile Panel Button */}
                    <Link
                      href="/panel"
                      className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Panel</span>
                    </Link>
                    {/* Desktop Panel Button */}
                    <Link
                      href="/panel"
                      className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 whitespace-nowrap"
                    >
                      <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                      <span>Panel</span>
                    </Link>
                    {/* Bildirim Butonu */}
                    <div className="relative">
                      <button
                        onClick={handleOpenNotifications}
                        className={`relative p-2 rounded-xl transition-all flex-shrink-0 ${isDark
                          ? 'text-blue-200 hover:bg-white/10 hover:text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        title="Bildirimler"
                      >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                          <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full text-[10px] font-bold ${isDark
                            ? 'bg-red-500 text-white'
                            : 'bg-red-500 text-white'
                            }`}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </button>
                    </div>
                    {/* Mobile Dark Mode Toggle */}
                    <button
                      onClick={toggleTheme}
                      className={`md:hidden p-2 rounded-lg transition-all ${isDark
                        ? 'text-yellow-400 hover:bg-white/10'
                        : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      title={isDark ? 'Açık Mod' : 'Karanlık Mod'}
                    >
                      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <div className="hidden sm:flex flex-col items-end mr-2 min-w-[120px]">
                      <span className={`text-xs font-bold truncate max-w-[120px] ${isDark ? 'text-blue-100' : 'text-slate-700'}`}>
                        {session?.user?.name || session?.user?.email || ''}
                      </span>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: 'https://www.isgpratik.com/' })}
                      className={`p-2 rounded-xl transition-all shadow-sm flex-shrink-0 ${isDark
                        ? 'bg-white/10 hover:bg-red-500/20 text-blue-200 hover:text-red-200 border border-white/10 hover:border-red-400/30'
                        : 'bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-300'
                        }`}
                      title="Çıkış Yap"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <div className="w-full sm:w-auto flex justify-end">
                    <Link
                      href="/login"
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg whitespace-nowrap ${isDark
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                    >
                      Giriş Yap
                    </Link>
                  </div>
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
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!session) {
                      showNotification('İlan vermek için giriş yapmalısınız', 'error');
                      return;
                    }
                    setShowJobPostingModal(true);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-bold ${isDark
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20'
                    }`}
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Ücretsiz İlan Ver</span>
                  <span className="sm:hidden">İlan Ver</span>
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${isDark
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
            </div>

            {/* Filters */}
            <div className={`flex flex-col sm:flex-row gap-4 p-4 rounded-lg shadow-sm ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
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
                  className={`w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isDark
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
                  className={`pl-10 pr-8 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none ${isDark
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-white border-gray-300 text-slate-900'
                    }`}
                >
                  <option value="">Tüm İller</option>
                  {(() => {
                    // İstanbul, Ankara, İzmir'i en üste al, diğerlerini alfabetik sırala
                    const priorityIls = ['İstanbul', 'Ankara', 'İzmir'];
                    const otherIls = TURKIYE_ILLERI
                      .filter(il => !priorityIls.includes(il))
                      .sort();
                    const sortedIls = [...priorityIls, ...otherIls];
                    return sortedIls.map((il) => (
                      <option key={il} value={il}>
                        {il}
                      </option>
                    ));
                  })()}
                </select>
              </div>
              {(searchTerm || selectedCity) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCity('');
                    setPage(1);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isDark
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
            <div className="flex flex-col justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
              <p className={`text-lg font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                İlanlar Hazırlanıyor
              </p>
            </div>
          ) : allPostings.length === 0 ? (
            <div className={`text-center py-20 rounded-lg shadow-sm ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
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
                {allPostings.map((posting) => {
                  const contentParts = parseContent(posting.content);
                  const isUserPosting = posting._type === 'user';

                  return (
                    <div
                      key={posting.id}
                      className={`rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow ${isDark
                        ? 'bg-slate-800 border-slate-700'
                        : 'bg-white border-gray-200'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {isUserPosting ? (
                              <>
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                                  <UserIcon className="w-3 h-3" />
                                  Kullanıcı ilanı
                                </span>
                                {posting.city && (
                                  <>
                                    <span className={isDark ? 'text-slate-600' : 'text-gray-300'}>•</span>
                                    <span className={`text-sm flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                      <MapPin className="w-4 h-4" />
                                      {posting.city}
                                    </span>
                                  </>
                                )}
                              </>
                            ) : (
                              <>
                                <MessageSquare className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                  @{posting.channelUsername}
                                </span>
                              </>
                            )}
                            <span className={isDark ? 'text-slate-600' : 'text-gray-300'}>•</span>
                            <span className={`text-sm flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                              <Calendar className="w-4 h-4" />
                              {formatRelativeTime(isUserPosting ? posting.createdAt : posting.postedAt)}
                            </span>
                          </div>
                          {!isUserPosting && posting.hasMedia && (
                            <div className={`flex items-center gap-2 text-sm mb-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                              <ImageIcon className="w-4 h-4" />
                              <span>Fotoğraf/Video içeriyor</span>
                            </div>
                          )}
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(posting.id, isUserPosting)}
                            disabled={deletingId === posting.id}
                            className={`p-2 rounded-lg transition-colors ${isDark
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
                        <p className={`whitespace-pre-wrap leading-relaxed ${isDark ? 'text-slate-200' : 'text-gray-800'
                          }`}>
                          {contentParts.map((part, index) => {
                            if (part.type === 'text') {
                              return <span key={index}>{part.content}</span>;
                            } else if (part.type === 'phone') {
                              return (
                                <a
                                  key={index}
                                  href={part.link}
                                  className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md transition-all ${isDark
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
                                  className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md transition-all ${isDark
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
                                  className={`font-bold ${isDark
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
                                  className={`font-bold ${isDark
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

                      {!isUserPosting && (
                        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-100'
                          }`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                              {formatDate(posting.postedAt)}
                            </div>
                            <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                              {posting.viewCount} görüntülenme
                            </div>
                          </div>

                          {/* Yorum Butonu */}
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleToggleComments(posting.id)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isDark
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>Yorumlar</span>
                              {comments[posting.id] && comments[posting.id].length > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-indigo-500' : 'bg-indigo-500'
                                  }`}>
                                  {comments[posting.id].length}
                                </span>
                              )}
                            </button>
                            {session && (
                              <button
                                onClick={() => handleOpenCommentModal(posting.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isDark
                                  ? 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
                                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
                                  }`}
                              >
                                <Send className="w-4 h-4" />
                                <span>Yorum Yap</span>
                              </button>
                            )}
                          </div>

                          {/* Yorumlar Bölümü */}
                          {expandedComments[posting.id] && (
                            <div className={`mt-4 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'
                              }`}>
                              {loadingComments[posting.id] ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                                </div>
                              ) : comments[posting.id] && comments[posting.id].length > 0 ? (
                                <div className="space-y-3">
                                  {comments[posting.id].map((comment) => (
                                    <div
                                      key={comment.id}
                                      className={`p-3 rounded-lg ${isDark
                                        ? 'bg-slate-700/50 border border-slate-600'
                                        : 'bg-gray-50 border border-gray-200'
                                        }`}
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className={`font-semibold text-sm ${isDark ? 'text-slate-200' : 'text-gray-800'
                                            }`}>
                                            {comment.userName || 'Anonim'}
                                          </span>
                                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'
                                            }`}>
                                            {formatRelativeTime(comment.createdAt)}
                                          </span>
                                        </div>
                                      </div>
                                      <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'
                                        }`}>
                                        {comment.content}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className={`text-center py-4 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'
                                  }`}>
                                  Henüz yorum yok
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
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
                    className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark
                      ? 'border border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'border border-gray-300 text-slate-700 hover:bg-gray-50'
                      }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className={`px-4 py-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'
                    }`}>
                    Sayfa {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark
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

      {/* Yorum Yapma Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl w-full max-w-lg ${isDark ? 'bg-slate-800' : 'bg-white'
            }`}>
            <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-slate-700' : 'border-gray-200'
              }`}>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'
                }`}>
                Yorum Yap
              </h3>
              <button
                onClick={() => setShowCommentModal(null)}
                className={`p-1 rounded-lg transition-colors ${isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                  Yorumunuz
                </label>
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2 rounded-lg border ${isDark
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="Yorumunuzu buraya yazın..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAnonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label
                  htmlFor="isAnonymous"
                  className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'
                    }`}
                >
                  Adımı gizle (Anonim olarak göster)
                </label>
              </div>

              <div className={`p-3 rounded-lg text-sm ${isDark
                ? 'bg-blue-900/30 border border-blue-800 text-blue-200'
                : 'bg-blue-50 border border-blue-200 text-blue-800'
                }`}>
                <p>
                  Yorumunuz admin onayından sonra yayınlanacaktır.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowCommentModal(null)}
                  className={`px-4 py-2 rounded-lg transition-colors ${isDark
                    ? 'text-slate-300 hover:bg-slate-700'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  İptal
                </button>
                <button
                  onClick={() => handleSubmitComment(showCommentModal)}
                  disabled={submittingComment || !commentContent.trim()}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${submittingComment || !commentContent.trim()
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                >
                  {submittingComment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gönderiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Gönder</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bildirim Penceresi */}
      {showNotifications && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleCloseNotifications}
          />
          <div className={`fixed right-4 top-20 md:right-8 md:top-20 w-[90vw] max-w-md max-h-[80vh] rounded-xl shadow-2xl z-50 overflow-hidden ${isDark
            ? 'bg-slate-800 border border-white/10'
            : 'bg-white border border-slate-200'
            }`}>
            {/* Başlık */}
            <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <Bell className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-indigo-600'}`} />
                <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Bildirimler
                </h3>
                {unreadCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isDark
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-red-100 text-red-600'
                    }`}>
                    {unreadCount} yeni
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${isDark
                      ? 'text-blue-400 hover:bg-white/10'
                      : 'text-indigo-600 hover:bg-slate-100'
                      }`}
                  >
                    Tümünü okundu işaretle
                  </button>
                )}
                <button
                  onClick={handleCloseNotifications}
                  className={`p-1.5 rounded-lg transition-colors ${isDark
                    ? 'text-slate-400 hover:text-white hover:bg-white/10'
                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Bildirim Listesi */}
            <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
              {notifications.length === 0 ? (
                <div className={`p-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Henüz bildirim yok</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-white/10">
                  {notifications.map((notification) => {
                    const isRead = readNotificationIds.has(notification.id);
                    return (
                      <div
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`p-4 cursor-pointer transition-colors ${isRead
                          ? isDark
                            ? 'bg-slate-800/50 hover:bg-slate-800'
                            : 'bg-slate-50 hover:bg-slate-100'
                          : isDark
                            ? 'bg-blue-500/10 hover:bg-blue-500/15 border-l-4 border-blue-500'
                            : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 flex-shrink-0 ${isRead
                            ? isDark ? 'text-slate-500' : 'text-slate-400'
                            : isDark ? 'text-blue-400' : 'text-blue-600'
                            }`}>
                            <Info className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {notification.title}
                              </h4>
                              {!isRead && (
                                <span className={`flex-shrink-0 w-2 h-2 rounded-full ${isDark
                                  ? 'bg-blue-400'
                                  : 'bg-blue-500'
                                  }`} />
                              )}
                            </div>
                            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                              {notification.description}
                            </p>
                            <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {notification.date.toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Ücretsiz İlan Ver Modal */}
      {showJobPostingModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setShowJobPostingModal(false)}
          />
          <div className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[70] rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white'
            }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Ücretsiz İlan Ver
              </h2>
              <button
                onClick={() => setShowJobPostingModal(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* İl Seçimi */}
              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  İl Seçimi
                </label>
                <div className="relative">
                  <MapPin className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                  <select
                    value={jobPostingCity}
                    onChange={(e) => setJobPostingCity(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none ${isDark
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-gray-300 text-slate-900'
                      }`}
                  >
                    <option value="Tüm Türkiye">Tüm Türkiye</option>
                    {(() => {
                      const priorityIls = ['İstanbul', 'Ankara', 'İzmir'];
                      const otherIls = TURKIYE_ILLERI
                        .filter(il => !priorityIls.includes(il))
                        .sort();
                      const sortedIls = [...priorityIls, ...otherIls];
                      return sortedIls.map((il) => (
                        <option key={il} value={il}>
                          {il}
                        </option>
                      ));
                    })()}
                  </select>
                </div>
              </div>

              {/* İlan Metni */}
              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  İlan Metni
                </label>
                <textarea
                  value={jobPostingContent}
                  onChange={(e) => setJobPostingContent(e.target.value)}
                  placeholder="İlanınızı buraya yazın... (İletişim bilgilerinizi eklemeyi unutmayın)"
                  className={`w-full p-4 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none ${isDark
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-white border-gray-300 text-slate-900 placeholder-gray-400'
                    }`}
                  rows={8}
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  İstediğiniz uzunlukta yazabilirsiniz. İlan admin onayından sonra yayınlanacaktır.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className={`flex justify-end gap-3 p-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setShowJobPostingModal(false)}
                className={`px-4 py-2 rounded-lg font-bold transition-colors ${isDark
                  ? 'text-slate-300 hover:bg-slate-700'
                  : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                İptal
              </button>
              <button
                onClick={handleSubmitJobPosting}
                disabled={submittingJobPosting || !jobPostingContent.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-bold hover:from-emerald-500 hover:to-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingJobPosting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Gönder
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
