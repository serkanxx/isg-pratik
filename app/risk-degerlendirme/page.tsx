"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle, Download, Save, Plus, Trash2, CheckCircle, Shield,
  Lock, Menu, X, FileText, Calendar, User, ChevronRight, BookOpen, ArrowRightCircle, Search, Image as ImageIcon, Upload, PlusCircle, AlertCircle, RefreshCw, Briefcase, Printer, ChevronDown, ChevronUp, Zap, LogIn, UserPlus, LogOut, MinusCircle, Building2, Eye, FileCheck, LayoutDashboard
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RiskItem, RiskCategory, RiskLibraryItem, HeaderInfo, RiskForm, Notification, Company, VALIDITY_YEARS, DangerClass, DANGER_CLASS_LABELS } from '../types';
import { calculateRiskScore, getRiskLevel, formatDate, P_VALUES, F_VALUES, S_VALUES } from '../utils';
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { SECTOR_SUGGESTIONS } from '../data/constants';

// --- 1. RİSK KÜTÜPHANESİ ---
// --- 1. RİSK KÜTÜPHANESİ ---
// import { EXCEL_DATA } from './riskData'; // Artık API'den çekilecek

export default function Home() {
  const { data: session, status } = useSession();
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [riskCategories, setRiskCategories] = useState<RiskCategory[]>([]); // API'den gelen veriler için state

  // --- HEADER BİLGİLERİ ---
  const [headerInfo, setHeaderInfo] = useState<HeaderInfo>({
    title: '',
    address: '',
    registrationNumber: '',
    date: '',
    validityDate: '',
    revision: '',
    logo: null,
    // Ekip
    employer: '',
    igu: '',
    doctor: '',
    representative: '',
    support: '' // Destek Elemanı
  });

  const [form, setForm] = useState<RiskForm>({
    categoryCode: '99',
    riskNo: '', // Manuel Risk No
    sub_category: '',
    source: '',
    hazard: '',
    risk: '',
    affected: 'ÇALIŞANLAR',
    responsible: 'İşveren Vekili',
    probability: 1, frequency: 1, severity: 1,
    probability2: 1, frequency2: 1, severity2: 1,
    measures: '',
    image: null
  });

  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<RiskCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<Notification>({ show: false, message: '', type: 'success' });
  const [activeRowIdForImage, setActiveRowIdForImage] = useState(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0); // 0: Kapalı, 1: İlk Onay, 2: Son Onay
  const [isFormCollapsed, setIsFormCollapsed] = useState(true); // Formun açık/kapalı durumu - varsayılan kapalı
  const [includeProcedure, setIncludeProcedure] = useState(true); // Risk Prosedürü dahil mi?
  const [sectorSearch, setSectorSearch] = useState(''); // Sektör arama terimi
  const [sectorLoading, setSectorLoading] = useState(false); // Sektör analizi yükleniyor mu?
  const [severityFilter, setSeverityFilter] = useState(0); // 0: Tümü, 1: Orta+ (>=70), 2: Yüksek (>=200)
  const [showSectorSuggestions, setShowSectorSuggestions] = useState(false); // Öneri dropdown'u göster
  const [showAIPreview, setShowAIPreview] = useState(false); // AI önizleme modal
  const [previewRisks, setPreviewRisks] = useState<any[]>([]); // Önizleme risk listesi
  const [selectedPreviewRisks, setSelectedPreviewRisks] = useState<Set<number>>(new Set()); // Tikli olanlar

  // Firma seçimi için state'ler
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [showRevision, setShowRevision] = useState(false); // Revizyon eklemek ister misin?

  // Yaygın sektörler listesi
  // Yaygın sektörler listesi -> constants.ts dosyasından geliyor
  const sectorSuggestions = SECTOR_SUGGESTIONS;

  const [showScrollTop, setShowScrollTop] = useState(false); // Yukarı git butonu
  const [showPremiumModal, setShowPremiumModal] = useState(false); // Premium teşvik modal
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // Mobil sidebar açık/kapalı

  // Kullanıcı Riskleri State
  const [userRisks, setUserRisks] = useState<any[]>([]);
  const [showUserRisks, setShowUserRisks] = useState(false); // Risklerim paneli açık/kapalı

  // Free kullanıcı limiti
  const FREE_RISK_LIMIT = 20;

  const fileInputRef = useRef<any>(null);
  const logoInputRef = useRef<any>(null);
  const tableTopRef = useRef<HTMLDivElement>(null);

  // --- LOCAL STORAGE ---
  useEffect(() => {
    const savedData = localStorage.getItem('isgRisks_v10');
    const savedHeader = localStorage.getItem('isgHeader_v10');

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed)) setRisks(parsed);
      } catch (e) { setRisks([]); }
    }

    if (savedHeader) {
      try {
        setHeaderInfo(JSON.parse(savedHeader));
      } catch (e) { }
    }

    // API'den risk verilerini çek
    fetch('/api/risks')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRiskCategories(data);
        }
      })
      .catch(err => console.error('Risk verileri alınamadı:', err));

    // Firmaları çek (giriş yapmışsa)
    if (session?.user?.email) {
      fetch('/api/companies')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setCompanies(data);
          }
        })
        .catch(err => console.error('Firmalar alınamadı:', err));
    }
  }, [session]);

  useEffect(() => {
    try {
      if (risks.length > 0) localStorage.setItem('isgRisks_v10', JSON.stringify(risks));
      localStorage.setItem('isgHeader_v10', JSON.stringify(headerInfo));
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        showNotification("Hafıza doldu! Lütfen gereksiz resimleri silin.", "error");
      }
    }
  }, [risks, headerInfo]);

  // Scroll dinleyicisi - yukarı git butonu için
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message: msg, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
  };

  // Kullanıcı risklerini çek
  const fetchUserRisks = async () => {
    try {
      const res = await fetch('/api/user-risks');
      if (res.ok) {
        const data = await res.json();
        setUserRisks(data);
      }
    } catch (error) {
      console.error('Kullanıcı riskleri alınamadı:', error);
    }
  };

  // Kullanıcı riskini tabloya ekle
  const handleAddUserRisk = (userRisk: any) => {
    if (!canAddMoreRisks()) {
      showPremiumLimitWarning();
      return;
    }
    if (isRiskDuplicate(userRisk.hazard, userRisk.risk)) {
      showNotification("Bu madde zaten ekli!", "error");
      return;
    }

    const p = userRisk.probability || 1;
    const f = userRisk.frequency || 1;
    const s = userRisk.severity || 1;
    const p2 = userRisk.probability2 || 1;
    const f2 = userRisk.frequency2 || 1;
    const s2 = userRisk.severity2 || 1;

    const score = calculateRiskScore(p, f, s);
    const score2 = calculateRiskScore(p2, f2, s2);
    const { label, color } = getRiskLevel(score);
    const result2 = getRiskLevel(score2);

    const newRisk = {
      id: Date.now() + Math.floor(Math.random() * 100000),
      riskNo: userRisk.risk_no,
      categoryCode: '500',
      sub_category: userRisk.sub_category,
      source: userRisk.source,
      hazard: userRisk.hazard,
      risk: userRisk.risk,
      affected: userRisk.affected || "Çalışanlar",
      responsible: "İşveren Vekili",
      probability: p, frequency: f, severity: s,
      probability2: p2, frequency2: f2, severity2: s2,
      measures: userRisk.measures,
      score, level: label, color,
      score2, level2: result2.label, color2: result2.color,
      image: null
    };

    setRisks([...risks, newRisk]);
    showNotification("Risk maddesi eklendi.");
  };

  // Firma seçildiğinde headerInfo'yu güncelle
  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanyId(companyId);
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setHeaderInfo({
        ...headerInfo,
        title: company.title,
        address: company.address,
        registrationNumber: company.registration_number,
        logo: company.logo,
        employer: company.employer,
        igu: company.igu,
        doctor: company.doctor,
        representative: company.representative,
        support: company.support
      });
    }
  };

  // Rapor tarihi değiştiğinde geçerlilik tarihini hesapla
  const handleReportDateChange = (dateStr: string) => {
    setHeaderInfo(prev => {
      const newInfo = { ...prev, date: dateStr };

      // Seçili firma varsa geçerlilik tarihini hesapla
      const company = companies.find(c => c.id === selectedCompanyId);
      if (company && dateStr) {
        const reportDate = new Date(dateStr);
        // Geçerli bir tarih mi kontrol et
        if (!isNaN(reportDate.getTime())) {
          const years = VALIDITY_YEARS[company.danger_class];
          reportDate.setFullYear(reportDate.getFullYear() + years);
          newInfo.validityDate = reportDate.toISOString().split('T')[0];
        } else {
          // Geçersiz tarih ise geçerlilik tarihini temizle
          newInfo.validityDate = '';
        }
      }

      return newInfo;
    });
  };

  // Seçili firma bilgisi
  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  // Free kullanıcı kontrolü - Giriş yapmamışsa free
  const isFreeUser = !session;

  // Risk ekleme limiti kontrolü
  const canAddMoreRisks = (countToAdd: number = 1): boolean => {
    if (!isFreeUser) return true; // Premium kullanıcı - sınırsız
    return risks.length + countToAdd <= FREE_RISK_LIMIT;
  };

  // Premium modal göster
  const showPremiumLimitWarning = () => {
    setShowPremiumModal(true);
  };

  // --- HESAPLAMA FONKSİYONLARI utils.ts'den import ediliyor ---
  // calculateRiskScore ve getRiskLevel utils.ts'de tanımlı

  const updateRiskValue = (id: number, field: string, value: string | number) => {
    let inputValue: any = value;

    // Boş bırakmaya izin ver, değilse sayıya çevir ve 100 ile sınırla
    if (value !== "") {
      let parsed = parseInt(String(value));
      if (isNaN(parsed)) parsed = 0;
      if (parsed > 100) parsed = 100;
      inputValue = parsed;
    }

    const updatedRisks = risks.map(risk => {
      if (risk.id === id) {
        const newRisk = { ...risk, [field]: inputValue };

        // Hesaplama için boş değerleri 0 kabul et
        const valOrZero = (v: any) => (v === "" || v === null || v === undefined) ? 0 : v;

        const p = field === 'probability' ? valOrZero(inputValue) : valOrZero(risk.probability);
        const f = field === 'frequency' ? valOrZero(inputValue) : valOrZero(risk.frequency);
        const s = field === 'severity' ? valOrZero(inputValue) : valOrZero(risk.severity);

        const p2 = field === 'probability2' ? valOrZero(inputValue) : valOrZero(risk.probability2);
        const f2 = field === 'frequency2' ? valOrZero(inputValue) : valOrZero(risk.frequency2);
        const s2 = field === 'severity2' ? valOrZero(inputValue) : valOrZero(risk.severity2);

        if (['probability', 'frequency', 'severity'].includes(field)) {
          newRisk.score = calculateRiskScore(p, f, s);
          const result = getRiskLevel(newRisk.score);
          newRisk.level = result.label;
          newRisk.color = result.color;
        }
        if (['probability2', 'frequency2', 'severity2'].includes(field)) {
          newRisk.score2 = calculateRiskScore(p2, f2, s2);
          const result2 = getRiskLevel(newRisk.score2);
          newRisk.level2 = result2.label;
          newRisk.color2 = result2.color;
        }
        return newRisk;
      }
      return risk;
    });
    setRisks(updatedRisks);
  };

  const handleRiskBlur = (id: any, field: any, value: any) => {
    // Blur olduğunda boşsa veya 1'den küçükse 1 yap
    if (value === "" || value === null || value === undefined || parseInt(value) < 1) {
      updateRiskValue(id, field, 1);
    }
  };

  const handleSeverityKeyDown = (e: any, id: any, field: any, currentValue: any) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      let val = parseInt(currentValue);
      if (isNaN(val)) val = 1; // Boşsa 1'den başla

      if (e.key === 'ArrowUp') {
        val += 5;
        if (val > 100) val = 100;
      } else {
        val -= 5;
        if (val < 1) val = 1;
      }
      updateRiskValue(id, field, val);
    }
  };

  const handleImageUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        showNotification("Resim 1MB'dan büyük olamaz!", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (activeRowIdForImage) {
          setRisks(risks.map((r: any) => r.id === activeRowIdForImage ? { ...r, image: reader.result as string } : r));
          setActiveRowIdForImage(null);
        } else {
          setForm({ ...form, image: reader.result as string });
        }
        // Input değerini sıfırla ki aynı resim tekrar seçilebilsin
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) { showNotification("Logo 1MB'dan büyük olamaz!", "error"); return; }
      const reader = new FileReader();
      reader.onloadend = () => setHeaderInfo({ ...headerInfo, logo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const deleteLogo = () => {
    setHeaderInfo({ ...headerInfo, logo: null });
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  const deleteImageFromRow = (id: any) => {
    setRisks(risks.map((r: any) => r.id === id ? { ...r, image: null } : r));
    showNotification("Fotoğraf kaldırıldı.");
  };

  const triggerTableImageUpload = (id: any) => {
    setActiveRowIdForImage(id);
    fileInputRef.current.click();
  };

  const isRiskDuplicate = (newHazard: any, newRiskText: any) => {
    return risks.some((r: any) => r.hazard === newHazard && r.risk === newRiskText);
  };

  const handleAddRisk = async () => {
    // Free kullanıcı limit kontrolü
    if (!canAddMoreRisks()) {
      showPremiumLimitWarning();
      return;
    }
    if (isRiskDuplicate(form.hazard, form.risk)) {
      showNotification("Bu madde zaten ekli!", "error");
      return;
    }
    const score = calculateRiskScore(form.probability, form.frequency, form.severity);
    const score2 = calculateRiskScore(form.probability2, form.frequency2, form.severity2);
    const { label, color } = getRiskLevel(score);
    const result2 = getRiskLevel(score2);

    // Manuel Risk No - Otomatik atama ve kontrol yok
    const riskNo = form.riskNo || "";

    const newRisk = {
      id: Date.now() + Math.floor(Math.random() * 100000),
      ...form,
      riskNo, // form'daki riskNo'yu override et
      score, level: label, color,
      score2, level2: result2.label, color2: result2.color
    };

    setRisks([...risks, newRisk]);

    // Kullanıcı giriş yapmışsa user_risks'e de kaydet
    if (session) {
      try {
        await fetch('/api/user-risks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category_name: 'Manuel Eklenen',
            sub_category: form.sub_category,
            source: form.source,
            hazard: form.hazard,
            risk: form.risk,
            affected: form.affected,
            probability: form.probability,
            frequency: form.frequency,
            severity: form.severity,
            probability2: form.probability2,
            frequency2: form.frequency2,
            severity2: form.severity2,
            measures: form.measures
          })
        });
      } catch (err) {
        console.error('User risk kaydetme hatası:', err);
      }
    }

    setForm({ ...form, source: '', hazard: '', risk: '', measures: '', image: null, riskNo: '' });
    showNotification("Risk eklendi.");
  };

  const handleQuickAdd = (e: any, item: any, categoryCode: any) => {
    e.stopPropagation();
    // Free kullanıcı limit kontrolü
    if (!canAddMoreRisks()) {
      showPremiumLimitWarning();
      return;
    }
    if (isRiskDuplicate(item.hazard, item.risk)) {
      showNotification("Bu madde zaten ekli!", "error");
      return;
    }
    const currentCategoryCount = risks.filter((r: any) => r.riskNo && r.riskNo.startsWith(categoryCode + '.')).length;
    const riskNo = `${categoryCode}.${(currentCategoryCount + 1).toString().padStart(2, '0')}`;

    const p = item.p || 1; const f = item.f || 1; const s = item.s || 1;
    const p2 = item.p2 || 1; const f2 = item.f2 || 1; const s2 = item.s2 || 1;
    const score = calculateRiskScore(p, f, s);
    const score2 = calculateRiskScore(p2, f2, s2);
    const { label, color } = getRiskLevel(score);
    const result2 = getRiskLevel(score2);

    const newRisk = {
      id: Date.now() + Math.floor(Math.random() * 100000),
      riskNo,
      categoryCode: categoryCode,
      sub_category: item.sub_category,
      source: item.source,
      hazard: item.hazard,
      risk: item.risk,
      affected: item.affected || "ÇALIŞANLAR",
      responsible: "İşveren Vekili",
      probability: p, frequency: f, severity: s,
      probability2: p2, frequency2: f2, severity2: s2,
      measures: item.measures,
      score, level: label, color,
      score2, level2: result2.label, color2: result2.color,
      image: null
    };
    setRisks([...risks, newRisk]);
    showNotification("Madde eklendi.");
  };

  const handleAddAllFromCategory = (e: any, cat: any) => {
    if (e) e.stopPropagation();

    // Free kullanıcı için eklenebilecek madde sayısını hesapla
    const itemsToAdd = cat.items.filter((item: any) => !isRiskDuplicate(item.hazard, item.risk));
    if (!canAddMoreRisks(itemsToAdd.length)) {
      const remainingSlots = FREE_RISK_LIMIT - risks.length;
      if (remainingSlots <= 0) {
        showPremiumLimitWarning();
        return;
      }
    }

    let addedCount = 0;
    let currentCategoryCount = risks.filter((r: any) => r.riskNo && r.riskNo.startsWith(cat.code + '.')).length;
    const newRisks: any[] = [];

    cat.items.forEach((item: any) => {
      if (isRiskDuplicate(item.hazard, item.risk)) return;
      currentCategoryCount++;
      addedCount++;

      const riskNo = `${cat.code}.${currentCategoryCount.toString().padStart(2, '0')}`;
      const p = item.p || 1; const f = item.f || 1; const s = item.s || 1;
      const p2 = item.p2 || 1; const f2 = item.f2 || 1; const s2 = item.s2 || 1;
      const score = calculateRiskScore(p, f, s);
      const score2 = calculateRiskScore(p2, f2, s2);
      const { label, color } = getRiskLevel(score);
      const result2 = getRiskLevel(score2);

      newRisks.push({
        id: Date.now() + addedCount * 1000 + Math.floor(Math.random() * 100),
        riskNo,
        categoryCode: cat.code,
        sub_category: item.sub_category,
        source: item.source,
        hazard: item.hazard,
        risk: item.risk,
        affected: item.affected || "Çalışanlar",
        responsible: "İşveren Vekili",
        probability: p, frequency: f, severity: s,
        probability2: p2, frequency2: f2, severity2: s2,
        measures: item.measures,
        score, level: label, color,
        score2, level2: result2.label, color2: result2.color,
        image: null
      });
    });

    if (newRisks.length > 0) {
      setRisks([...risks, ...newRisks]);
      showNotification(`${addedCount} yeni madde eklendi.`);
    } else {
      showNotification("Eklenecek yeni madde yok.", "error");
    }
  };

  const deleteRisk = (id: any) => {
    setRisks(risks.filter((r: any) => r.id !== id));
  };

  // Kategorideki tüm riskleri sil
  const handleRemoveAllFromCategory = (e: any, cat: any) => {
    if (e) e.stopPropagation();
    const removedCount = risks.filter((r: any) => r.categoryCode === cat.code).length;
    if (removedCount === 0) {
      showNotification("Bu kategoride silinecek madde yok.", "error");
      return;
    }
    setRisks(risks.filter((r: any) => r.categoryCode !== cat.code));
    showNotification(`${removedCount} madde silindi.`);
  };


  // Sektör Analizi - OpenAI Vektör Arama ile
  const handleSectorAnalysis = async () => {
    if (!sectorSearch.trim()) {
      showNotification('Lütfen bir sektör adı girin.', 'error');
      return;
    }

    setSectorLoading(true);

    try {
      // Vektör arama API'sini çağır
      const response = await fetch('/api/vector-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: sectorSearch.trim(),
          limit: 10000 // Sınırsız - tüm sonuçları getir
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API hatası');
      }

      const data = await response.json();
      const { results, method, sectorCount, generalCount, matchedTags } = data;

      // Debug log - query ve matched tags
      console.log(`Query: "${sectorSearch}", Matched Tags: ${JSON.stringify(matchedTags)}, Yöntem: ${method}, Sektör: ${sectorCount || 0}, Genel: ${generalCount || 0}`);

      if (!results || results.length === 0) {
        showNotification(`"${sectorSearch}" için uygun risk bulunamadı.`, 'error');
        setSectorLoading(false);
        return;
      }

      // Supabase'den gelen sonuçları önizleme formatına çevir
      let tempId = 0;
      const previewList: any[] = [];

      results.forEach((item: any) => {
        // Duplicate kontrolü - tablodaki mevcut maddelerle karşılaştır
        if (isRiskDuplicate(item.hazard, item.risk)) return;

        const p = item.p || 1; const f = item.f || 1; const s = item.s || 1;
        const score = calculateRiskScore(p, f, s);

        // Ciddiyet filtresi kontrolü
        const minScore = severityFilter === 2 ? 200 : (severityFilter === 1 ? 70 : 0);
        if (score < minScore) return; // Eşiğin altındaki riskleri atla

        tempId++;
        const { label, color } = getRiskLevel(score);

        previewList.push({
          tempId,
          riskNo: item.riskNo || '', // API'den gelen orijinal riskNo
          categoryCode: item.category_code || '99',
          sub_category: item.sub_category || '',
          source: item.source || '',
          hazard: item.hazard || '',
          risk: item.risk || '',
          affected: item.affected || "ÇALIŞANLAR",
          responsible: item.responsible || "İŞVEREN / İŞVEREN VEKİLİ",
          probability: p, frequency: f, severity: s,
          probability2: item.p2 || 1, frequency2: item.f2 || 1, severity2: item.s2 || 1,
          measures: item.measures || '',
          score, level: label, color,
          similarity: item.similarity // Vektör benzerlik skoru
        });
      });

      if (previewList.length > 0) {
        setPreviewRisks(previewList);
        setSelectedPreviewRisks(new Set(previewList.map(r => r.tempId))); // Hepsi tikli başlasın
        setShowAIPreview(true);
        showNotification(`${previewList.length} risk maddesi bulundu.`, 'success');
      } else {
        showNotification(`"${sectorSearch}" için tabloda riskler zaten mevcut.`, 'error');
      }

    } catch (error: any) {
      console.error('Sektör analizi hatası:', error);
      showNotification(error.message || 'Sektör analizi yapılırken hata oluştu.', 'error');
    } finally {
      setSectorLoading(false);
    }
  };

  // AI önizlemeden maddeleri tabloya ekle
  const confirmAIPreview = () => {
    const selectedRisks = previewRisks.filter(r => selectedPreviewRisks.has(r.tempId));

    if (selectedRisks.length === 0) {
      showNotification('Lütfen en az bir madde seçin.', 'error');
      return;
    }

    // Free kullanıcı limit kontrolü
    if (!canAddMoreRisks(selectedRisks.length)) {
      const remainingSlots = FREE_RISK_LIMIT - risks.length;
      if (remainingSlots <= 0) {
        showPremiumLimitWarning();
        return;
      }
      showNotification(`Free kullanıcı olarak sadece ${remainingSlots} madde daha ekleyebilirsiniz.`, 'error');
      return;
    }

    let totalAdded = 0;
    const newRisks: any[] = [];

    // Kategori başına sayaç tut
    const categoryCounters: Record<string, number> = {};

    // Mevcut risklerdeki numaraları say
    risks.forEach((r: any) => {
      if (r.riskNo) {
        const parts = r.riskNo.split('.');
        if (parts.length >= 2) {
          const code = parts[0];
          const num = parseInt(parts[1]) || 0;
          categoryCounters[code] = Math.max(categoryCounters[code] || 0, num);
        }
      }
    });

    selectedRisks.forEach((item: any) => {
      totalAdded++;

      // API'den gelen orijinal riskNo'yu kullan
      const riskNo = item.riskNo || `${item.categoryCode}.${String(totalAdded).padStart(2, '0')}`;
      const score2 = calculateRiskScore(item.probability2, item.frequency2, item.severity2);
      const result2 = getRiskLevel(score2);

      newRisks.push({
        id: Date.now() + totalAdded * 1000 + Math.floor(Math.random() * 100),
        riskNo,
        categoryCode: item.categoryCode,
        sub_category: item.sub_category,
        source: item.source,
        hazard: item.hazard,
        risk: item.risk,
        affected: item.affected,
        responsible: item.responsible,
        probability: item.probability, frequency: item.frequency, severity: item.severity,
        probability2: item.probability2, frequency2: item.frequency2, severity2: item.severity2,
        measures: item.measures,
        score: item.score, level: item.level, color: item.color,
        score2, level2: result2.label, color2: result2.color,
        image: null
      });
    });

    setRisks([...risks, ...newRisks]);
    showNotification(`${totalAdded} risk maddesi tabloya eklendi.`);
    setShowAIPreview(false);
    setPreviewRisks([]);
    setSectorSearch('');
  };

  const handleDeleteAll = () => {
    setDeleteConfirmStep(1);
  };

  const confirmDeleteAll = () => {
    setRisks([]);
    setDeleteConfirmStep(0);
    showNotification('Tüm riskler silindi.', 'success');
  };

  const generatePDF = async () => {
    // Rapor tarihi kontrolü
    if (!headerInfo.date) {
      showNotification('Rapor tarihi girilmesi zorunludur!', 'error');
      return;
    }

    // Ana belge - önce dikey (portrait) prosedür sayfaları için başlat
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    let prosedurPageCount = 0;

    // Helper to convert buffer to base64
    const toBase64 = (buffer: ArrayBuffer) => {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    };

    // Türkçe karakter desteği için Roboto fontunu yüklüyoruz
    try {
      const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
      const fontUrlBold = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf';

      const [fontRes, fontBoldRes] = await Promise.all([
        fetch(fontUrl),
        fetch(fontUrlBold)
      ]);

      const fontBuffer = await fontRes.arrayBuffer();
      const fontBoldBuffer = await fontBoldRes.arrayBuffer();

      doc.addFileToVFS('Roboto-Regular.ttf', toBase64(fontBuffer));
      doc.addFileToVFS('Roboto-Bold.ttf', toBase64(fontBoldBuffer));

      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

      doc.setFont('Roboto');
    } catch (error) {
      console.error("Font yüklenirken hata oluştu:", error);
    }

    // ============ PROSEDÜR SAYFALARI (DİKEY) ============
    // 1. SAYFA - KAPAK SAYFASI
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Arka plan rengi - Beyaz
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Üst turuncu şerit
    doc.setFillColor(230, 150, 130);
    doc.rect(0, 0, 15, pageHeight, 'F'); // Sol şerit
    doc.rect(0, 0, pageWidth, 20, 'F'); // Üst şerit

    // Alt turuncu şerit
    doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');
    doc.rect(pageWidth - 15, 0, 15, pageHeight, 'F'); // Sağ şerit

    // Logo (varsa) - Üst orta
    let startY = 50;
    if (headerInfo.logo) {
      try {
        const logoWidth = 50;
        const logoHeight = 30;
        const logoX = (pageWidth - logoWidth) / 2;
        doc.addImage(headerInfo.logo, 'PNG', logoX, 35, logoWidth, logoHeight);
        startY = 75;
      } catch (e) { console.log('Logo eklenemedi'); }
    }

    // Firma İsmi - Metin kaydırma ile
    doc.setFont('Roboto', 'bold');
    doc.setTextColor(0, 0, 0); // Siyah metin
    const firmaText = headerInfo.title || '[FİRMA İSMİ]';
    const maxTextWidth = pageWidth - 50; // Sayfa kenarlarından 25mm boşluk

    // Firma ismini büyük fontla yazdır (60pt sabit)
    const firmaFontSize = 24;
    doc.setFontSize(firmaFontSize);

    // Metin uzunsa satır sar
    const splitFirma = doc.splitTextToSize(firmaText, maxTextWidth);
    doc.text(splitFirma, pageWidth / 2, startY, { align: 'center' });

    // Satır sayısına göre startY'yi ayarla
    if (splitFirma.length > 1) {
      startY += splitFirma.length * (firmaFontSize * 0.4) + 5;
    }

    // Firma Adresi
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(11);
    const adresText = headerInfo.address || '[FİRMA ADRES]';
    const splitAdres = doc.splitTextToSize(adresText, maxTextWidth);
    doc.text(splitAdres, pageWidth / 2, startY + 15, { align: 'center' });
    const adresHeight = splitAdres.length * 5;

    // SGK Sicil No
    doc.setFontSize(12);
    const sicilText = headerInfo.registrationNumber || '[SGK SİCİL NO]';
    doc.text(sicilText, pageWidth / 2, startY + 20 + adresHeight, { align: 'center' });

    // İş Sağlığı ve Güvenliği
    doc.setFontSize(14);
    doc.text('İŞ SAĞLIĞI VE GÜVENLİĞİ', pageWidth / 2, startY + 40 + adresHeight, { align: 'center' });

    // Prosedür Başlığı - Altı çizili kısımla
    doc.setFontSize(12);
    const prosedurBaslik = 'TEHLİKE TANIMLAMA VE RİSK DEĞERLENDİRMESİ PROSEDÜRÜ';
    doc.text(prosedurBaslik, pageWidth / 2, startY + 60 + adresHeight, { align: 'center' });

    // Altı çizili kısım için çizgi
    const underlineWidth = doc.getTextWidth('TEHLİKE TANIMLAMA VE RİSK DEĞERLENDİRMESİ PROSEDÜRÜ');
    doc.setDrawColor(0, 0, 0);
    const lineStartX = (pageWidth / 2) - (doc.getTextWidth(prosedurBaslik) / 2);
    doc.line(lineStartX, startY + 62 + adresHeight, lineStartX + underlineWidth, startY + 62 + adresHeight);

    // ===== TABLO: RİSK DEĞERLENDİRMESİNİN (sol sütun birleşik) =====
    // Tabloyu sayfanın alt kısmına al (en altta değil, biraz üstünde)
    const table1Y = pageHeight - 100; // Sayfanın altından 100mm yukarıda
    const tableWidth = 160;
    const tableX = (pageWidth - tableWidth) / 2;
    const col1Width = 55; // Sol sütun (birleşik)
    const col2Width = 55; // Orta sütun (etiketler)
    const col3Width = 50; // Sağ sütun (değerler)
    const rowHeight = 12;

    // Tablo arka planı beyaz - sadece çerçeve çiz

    // Tablo çerçeveleri
    doc.setDrawColor(150, 150, 150);
    doc.rect(tableX, table1Y, tableWidth, rowHeight * 3);
    doc.line(tableX + col1Width, table1Y, tableX + col1Width, table1Y + rowHeight * 3);
    doc.line(tableX + col1Width + col2Width, table1Y, tableX + col1Width + col2Width, table1Y + rowHeight * 3);
    // Yatay çizgiler (sadece orta ve sağ sütunlar için)
    doc.line(tableX + col1Width, table1Y + rowHeight, tableX + tableWidth, table1Y + rowHeight);
    doc.line(tableX + col1Width, table1Y + rowHeight * 2, tableX + tableWidth, table1Y + rowHeight * 2);

    // Tablo metinleri - siyah renk (beyaz arka plan için)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('Roboto', 'bold');

    // Sol sütun - birleşik hücrede ortalanmış "RİSK DEĞERLENDİRMESİNİN"
    doc.text('RİSK', tableX + col1Width / 2, table1Y + rowHeight * 1.3, { align: 'center' });
    doc.text('DEĞERLENDİRMESİNİN', tableX + col1Width / 2, table1Y + rowHeight * 1.8, { align: 'center' });

    // Orta sütun - etiketler
    doc.setFontSize(8);
    doc.text('YAPILDIĞI TARİH', tableX + col1Width + col2Width / 2, table1Y + rowHeight * 0.65, { align: 'center' });
    doc.text('GEÇERLİLİK TARİHİ', tableX + col1Width + col2Width / 2, table1Y + rowHeight * 1.65, { align: 'center' });
    doc.text('REVİZYON NO / TARİHİ', tableX + col1Width + col2Width / 2, table1Y + rowHeight * 2.65, { align: 'center' });

    // Sağ sütun - değerler
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    doc.text(formatDate(headerInfo.date) || '[YAPILDIĞI TARİH]', tableX + col1Width + col2Width + col3Width / 2, table1Y + rowHeight * 0.65, { align: 'center' });
    doc.text(formatDate(headerInfo.validityDate) || '[GEÇERLİLİK TARİHİ]', tableX + col1Width + col2Width + col3Width / 2, table1Y + rowHeight * 1.65, { align: 'center' });
    doc.text(headerInfo.revision || '[REVİZYON NO/TARİH]', tableX + col1Width + col2Width + col3Width / 2, table1Y + rowHeight * 2.65, { align: 'center' });

    prosedurPageCount = 1;

    // ============ 2. PROSEDÜR SAYFASI - İÇERİK SAYFASI ============
    doc.addPage('a4', 'portrait');

    // Beyaz arka plan
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = 8; // Yukarı yaslandı

    // ===== ÜST HEADER (kompakt) =====
    const headerHeight = 17.5; // Bilgi tablosu yüksekliği ile eşleştirildi (5 satır * 3.5)

    // Çizgi rengi ayarla
    doc.setDrawColor(150);

    // Sol: Logo bölümü - dikdörtgen çiz
    const logoWidth = 25;
    doc.rect(margin, yPos, logoWidth, headerHeight); // Logo dikdörtgeni

    if (headerInfo.logo) {
      try {
        doc.addImage(headerInfo.logo, 'PNG', margin + 2.5, yPos + 1.25, 20, 15);
      } catch (e) {
        // Logo yüklenemezse boş bırak
      }
    }

    // Orta: Başlık bölümü - dikdörtgen çiz
    const logoEndX = margin + logoWidth; // Logo bitişi
    const infoTableStartX = pageWidth - margin - 50; // Bilgi tablosu başlangıcı
    const titleWidth = infoTableStartX - logoEndX; // Başlık alanı genişliği
    const titleCenterX = logoEndX + titleWidth / 2; // Ortala

    // Başlık alanı dikdörtgeni
    doc.rect(logoEndX, yPos, titleWidth, headerHeight);

    doc.setFont('Roboto', 'bold');
    doc.setFontSize(9.6); // %20 azaltıldı (12 * 0.80)
    doc.setTextColor(0, 0, 0);
    // Dikey ortalama için y pozisyonu ayarlandı
    doc.text('TEHLİKE TANIMLAMA VE RİSK DEĞERLENDİRMESİ', titleCenterX, yPos + 6, { align: 'center' });
    doc.text('PROSEDÜRÜ', titleCenterX, yPos + 11, { align: 'center' });

    // Sağ: Bilgi Tablosu (kompakt)
    const infoTableX = pageWidth - margin - 50;
    const infoRowHeight = 3.5;

    doc.setDrawColor(150);
    doc.setFontSize(6.3); // %20 büyütüldü (5.25 * 1.2)
    doc.setFont('Roboto', 'normal');

    const infoRows = [
      ['Doküman No', 'İSG.PR.002'],
      ['Yayın Tarihi', formatDate(headerInfo.date) || '25.08.2021'],
      ['Revizyon Tarihi', '-'],
      ['Revizyon No', '-'],
      ['Sayfa No', '- 2 -']
    ];

    infoRows.forEach((row, i) => {
      const rowY = yPos + (i * infoRowHeight);
      doc.rect(infoTableX, rowY, 25, infoRowHeight);
      doc.rect(infoTableX + 25, rowY, 25, infoRowHeight);
      doc.text(row[0], infoTableX + 1, rowY + 2.5);
      doc.text(row[1], infoTableX + 26, rowY + 2.5);
    });

    yPos += headerHeight + 5;

    // ===== İÇERİK =====
    const firmaIsmi = headerInfo.title || '[FİRMA İSMİ]';

    // Yardımcı fonksiyon: Başlık yazma
    const writeHeading = (num: string, title: string, level: number = 1) => {
      if (yPos > pageHeight - 15) {
        doc.addPage('a4', 'portrait');
        yPos = 15;
      }
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(level === 1 ? 11.34 : 10.08); // %20 büyütüldü (9.45*1.2, 8.4*1.2)
      doc.setTextColor(0, 0, 0);
      const text = `${num}    ${title}`;
      doc.text(text, margin, yPos);
      yPos += 5;
    };

    // Yardımcı fonksiyon: Paragraf yazma (sola yaslı, düzgün satırlar)
    const writeParagraph = (text: string, indent: number = 0) => {
      doc.setTextColor(0, 0, 0);
      const processedText = text.replace(/\[FİRMA İSMİ\]/g, firmaIsmi);

      // Basit ve düzgün satır yazımı - tüm yazılar sola yaslı
      doc.setFont('Roboto', 'normal');
      doc.setFontSize(8.82); // %20 büyütüldü (7.35 * 1.2)
      const lines = doc.splitTextToSize(processedText, contentWidth - indent);

      lines.forEach((line: string) => {
        if (yPos > pageHeight - 12) {
          doc.addPage('a4', 'portrait');
          yPos = 15;
        }
        doc.text(line, margin + indent, yPos);
        yPos += 3.7;
      });
      yPos += 1;
    };

    // Yardımcı fonksiyon: Tanım yazma
    const writeDefinition = (term: string, definition: string) => {
      if (yPos > pageHeight - 15) {
        doc.addPage('a4', 'portrait');
        yPos = 15;
      }
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(8.82); // %20 büyütüldü (7.35 * 1.2)
      const termWidth = doc.getTextWidth(term + ': ');
      doc.text(term + ':', margin + 3, yPos);
      doc.setFont('Roboto', 'normal');
      const defLines = doc.splitTextToSize(definition, contentWidth - termWidth - 8);
      doc.text(defLines[0], margin + 3 + termWidth, yPos);
      yPos += 3.5;
      for (let i = 1; i < defLines.length; i++) {
        doc.text(defLines[i], margin + 3, yPos);
        yPos += 3.5;
      }
    };

    // 1. AMAÇ
    yPos += 5; // Üste bir satır boşluk
    writeHeading('1.', 'AMAÇ');
    writeParagraph(`[FİRMA İSMİ]'de var olan çalışma koşullarından kaynaklanan her türlü tehlike ve riskin tespiti, mevcut iş sağlığı ve güvenliği yasa ve yönetmeliklerine uygunluğunun değerlendirilmesi, insan sağlığını etkilemeyen seviyeye düşürmektir. Tehlike Tanımlama ve Risk Değerlendirmesi sonucunda ortaya çıkan risk değerlerinin iyileştirilmesi, önerilerde bulunmak ve İSG yönetim sisteminin disiplin altına alınması ve yönetim metodunun belirlenmesidir.`);

    // 2. KAPSAM
    yPos += 5; // Bir satır boşluk
    writeHeading('2.', 'KAPSAM');
    writeParagraph(`Bu rapor [FİRMA İSMİ]'nde yapılan gözlemlere göre hazırlanmıştır. Bu çalışma;`);
    writeParagraph(`[FİRMA İSMİ]'da bulunan; İşyerinde kullanılan tüm makine, tesisat, bina, eklenti ve sosyal tesisleri, işyerinde çalışan firma sorumlularını ve işçileri, ziyaretçi ve tedarikçilerini kapsar.`);

    // 3. REFERANSLAR
    yPos += 5; // Bir satır boşluk
    writeHeading('3.', 'REFERANSLAR');
    writeParagraph(`OHSAS 18001, İş Sağlığı ve Güvenliği Risk Değerlendirmesi Yönetmeliği, İş Sağlığı ve Güvenliği Kanunu`);

    // 4. TANIMLAR
    yPos += 5; // Bir satır boşluk
    writeHeading('4.', 'TANIMLAR');
    writeParagraph(`Bu çalışmada yer alan kelimeler ve bu kelimelerin tanımları aşağıda verilmiştir.`);

    writeDefinition('Tehlike', 'İşyerinde var olan ya da dışarıdan gelebilecek, çalışanı veya işyerini etkileyebilecek zarar veya hasar verme potansiyelidir.');
    writeDefinition('Önleme', 'İşyerinde yürütülen işlerin bütün safhalarında iş sağlığı ve güvenliği ile ilgili riskleri ortadan kaldırmak veya azaltmak için planlanan ve alınan tedbirlerin tümüdür.');
    writeDefinition('Ramak kala olay', 'İşyerinde meydana gelen; çalışan, işyeri ya da iş ekipmanını zarara uğratma potansiyeli olduğu halde zarara uğratmayan olaydır.');
    writeDefinition('Risk', 'Tehlikeden kaynaklanacak kayıp, yaralanma ya da başka zararlı sonuç meydana gelme ihtimalidir.');
    writeDefinition('Risk değerlendirmesi', 'İşyerinde var olan ya da dışarıdan gelebilecek tehlikelerin belirlenmesi, bu tehlikelerin riske dönüşmesine yol açan faktörler ile tehlikelerden kaynaklanan risklerin analiz edilerek derecelendirilmesi ve kontrol tedbirlerinin kararlaştırılması amacıyla yapılması gerekli çalışmalardır.');

    // 5. SORUMLULUKLAR VE PERSONEL
    yPos += 5; // Bir satır boşluk
    writeHeading('5.', 'SORUMLULUKLAR VE PERSONEL');
    writeParagraph(`İş kazalarına karşı gerekli önlemlerin alınmasından İşveren / İşveren vekili, risk değerlendirmesi çalışmalarının yürütülmesinden risk değerlendirmesi ekibi sorumludur. "İSG.PR.016 TEHLİKE TANIMLAMA VE RİSK DEĞERLENDİRMESİ FORMU" [FİRMA İSMİ] tarafından görevlendirilen "Risk Değerlendirme Ekibi" tarafından hazırlanacaktır. İş Güvenliği Uzmanı konu ile ilgili [FİRMA İSMİ] çalışan tüm personele İş Güvenliği eğitimi kapsamında bilgilendirme yapacak, tehlike bildirim formlarını da göz önüne alarak kontrol edecektir.`);

    // 5.1. İŞ SAĞLIĞI VE GÜVENLİĞİ KONUSUNDA İŞVERENİN GÖREVLERİ
    yPos += 5; // Bir satır boşluk
    writeHeading('5.1.', 'İŞ SAĞLIĞI VE GÜVENLİĞİ KONUSUNDA İŞVERENİN GÖREVLERİ', 2);
    writeParagraph(`İş Sağlığı ve Güvenliği Kanunu kapsamında İşveren'in genel yükümlülüğü aşağıdaki gibidir.`);
    writeParagraph(`MADDE 4 – (1) İşveren, çalışanların işle ilgili sağlık ve güvenliğini sağlamakla yükümlü olup bu çerçevede;`);
    writeParagraph(`a) Mesleki risklerin önlenmesi, eğitim ve bilgi verilmesi dâhil her türlü tedbirin alınması, organizasyonun yapılması, gerekli araç ve gereçlerin sağlanması, sağlık ve güvenlik tedbirlerinin değişen şartlara uygun hale getirilmesi ve mevcut durumun iyileştirilmesi için çalışmalar yapar.`, 3);
    writeParagraph(`b) İşyerinde alınan iş sağlığı ve güvenliği tedbirlerine uyulup uyulmadığını izler, denetler ve uygunsuzlukların giderilmesini sağlar.`, 3);
    writeParagraph(`c) Risk değerlendirmesi yapar veya yaptırır.`, 3);
    writeParagraph(`ç) Çalışana görev verirken, çalışanın sağlık ve güvenlik yönünden işe uygunluğunu göz önüne alır.`, 3);
    writeParagraph(`d) Yeterli bilgi ve talimat verilenler dışındaki çalışanların hayati ve özel tehlike bulunan yerlere girmemesi için gerekli tedbirleri alır.`, 3);
    writeParagraph(`(2) İşyeri dışındaki uzman kişi ve kuruluşlardan hizmet alınması, işverenin sorumluluklarını ortadan kaldırmaz.`, 0);
    writeParagraph(`(3) Çalışanların iş sağlığı ve güvenliği alanındaki yükümlülükleri, işverenin sorumluluklarını etkilemez.`, 0);
    writeParagraph(`(4) İşveren, iş sağlığı ve güvenliği tedbirlerinin maliyetini çalışanlara yansıtamaz.`, 0);

    // ============ 3. PROSEDÜR SAYFASI ============
    doc.addPage('a4', 'portrait');

    // Beyaz arka plan
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    yPos = 8; // Yukarı yaslandı

    // ===== ÜST HEADER (2. sayfa ile aynı) =====
    const headerHeight3 = 17.5;

    // Çizgi rengi ayarla
    doc.setDrawColor(150);

    // Sol: Logo bölümü - dikdörtgen çiz
    const logoWidth3 = 25;
    doc.rect(margin, yPos, logoWidth3, headerHeight3);

    if (headerInfo.logo) {
      try {
        doc.addImage(headerInfo.logo, 'PNG', margin + 2.5, yPos + 1.25, 20, 15);
      } catch (e) {
        // Logo yüklenemezse boş bırak
      }
    }

    // Orta: Başlık bölümü
    const logoEndX3 = margin + logoWidth3;
    const infoTableStartX3 = pageWidth - margin - 50;
    const titleWidth3 = infoTableStartX3 - logoEndX3;
    const titleCenterX3 = logoEndX3 + titleWidth3 / 2;

    doc.rect(logoEndX3, yPos, titleWidth3, headerHeight3);

    doc.setFont('Roboto', 'bold');
    doc.setFontSize(9.6);
    doc.setTextColor(0, 0, 0);
    doc.text('TEHLİKE TANIMLAMA VE RİSK DEĞERLENDİRMESİ', titleCenterX3, yPos + 6, { align: 'center' });
    doc.text('PROSEDÜRÜ', titleCenterX3, yPos + 11, { align: 'center' });

    // Sağ: Bilgi Tablosu
    const infoTableX3 = pageWidth - margin - 50;
    const infoRowHeight3 = 3.5;

    doc.setDrawColor(150);
    doc.setFontSize(6.3);
    doc.setFont('Roboto', 'normal');

    const infoRows3 = [
      ['Doküman No', 'İSG.PR.002'],
      ['Yayın Tarihi', formatDate(headerInfo.date) || '25.08.2021'],
      ['Revizyon Tarihi', '-'],
      ['Revizyon No', '-'],
      ['Sayfa No', '- 3 -']
    ];

    infoRows3.forEach((row, i) => {
      const rowY = yPos + (i * infoRowHeight3);
      doc.rect(infoTableX3, rowY, 25, infoRowHeight3);
      doc.rect(infoTableX3 + 25, rowY, 25, infoRowHeight3);
      doc.text(row[0], infoTableX3 + 1, rowY + 2.5);
      doc.text(row[1], infoTableX3 + 26, rowY + 2.5);
    });

    yPos += headerHeight3 + 5;

    // ===== 3. SAYFA İÇERİĞİ =====

    // 5.2. RİSK DEĞERLENDİRME EKİBİ'NİN GÖREVLERİ
    yPos += 3;
    writeHeading('5.2.', 'RİSK DEĞERLENDİRME EKİBİ\'NİN GÖREVLERİ', 2);
    writeParagraph(`İş Sağlığı ve Güvenliği Risk Değerlendirmesi Yönetmeliği'ne göre yapılacak çalışmalar için ekip oluşturulmalıdır, risk değerlendirmesi ekibinde söz konusu yönetmeliğin 6. Maddesine göre bulunması gereken kişiler aşağıdaki gibi tanımlanmıştır. "İSG.FR.017.RİSK DEĞERLENDİRME EKİBİ"nde görevlendirilen kişiler formu ile kayıt altına alınacak ve "İSG.EGT.002 RİSK DEĞERLENDİRME EKİBİ EĞİTİMİ" ve "İSG.FR.009.RİSK DEĞERLENDİRME EKİBİ EĞİTİM KATILIM FORMU" ile eğitimi tamamlanacaktır.`);
    writeParagraph(`- İşveren veya işveren vekili.`, 3);
    writeParagraph(`- İşyerinde sağlık ve güvenlik hizmetini yürüten iş güvenliği uzmanları ile işyeri hekimleri.`, 3);
    writeParagraph(`- İşyerindeki çalışan temsilcileri.`, 3);
    writeParagraph(`- İşyerindeki destek elemanları.`, 3);
    writeParagraph(`- İşyerindeki bütün birimleri temsil edecek şekilde belirlenen ve işyerinde yürütülen çalışmalar, mevcut veya muhtemel tehlike kaynakları ile riskler konusunda bilgi sahibi çalışanlar.`, 3);

    // 6. RİSK DEĞERLENDİRME SÜRECİ
    yPos += 5;
    writeHeading('6.', 'RİSK DEĞERLENDİRME SÜRECİ');

    // 6.1. RİSK DEĞERLENDİRMESİ
    yPos += 3;
    writeHeading('6.1.', 'RİSK DEĞERLENDİRMESİ', 2);
    writeParagraph(`Risk değerlendirmesi için "İSG.FR.016.TEHLİKE TANIMLAMA VE RİSK DEĞERLENDİRMESİ FORMU" kullanılır. Tüm işyerleri için tasarım veya kuruluş aşamasından başlamak üzere tehlikeleri tanımlama, riskleri belirleme ve analiz etme, risk kontrol tedbirlerinin kararlaştırılması, dokümantasyon, yapılan çalışmaların güncellenmesi ve gerektiğinde yenileme aşamaları izlenerek gerçekleştirilir. Çalışanların risk değerlendirmesi çalışması yapılırken ihtiyaç duyulan her aşamada sürece katılarak görüşlerinin alınması sağlanır. Bu süreçte "İSG.FR.018.RAMAK KALA / TEHLİKE BİLDİRİM FORMU" kullanılarak çalışanların görüşü kayıt altına alınır.`);

    // 6.2. TEHLİKELERİN TANIMLANMASI
    yPos += 5;
    writeHeading('6.2.', 'TEHLİKELERİN TANIMLANMASI', 2);
    writeParagraph(`Tehlikeler tanımlanırken çalışma ortamı, çalışanlar ve işyerine ilişkin ilgisine göre asgari olarak aşağıda belirtilen bilgiler toplanır.`);
    writeParagraph(`a) İşyeri bina ve eklentileri.`, 3);
    writeParagraph(`b) İşyerinde yürütülen faaliyetler ile iş ve işlemler.`, 3);
    writeParagraph(`c) Üretim süreç ve teknikleri.`, 3);
    writeParagraph(`ç) İş ekipmanları.`, 3);
    writeParagraph(`d) Kullanılan maddeler.`, 3);
    writeParagraph(`e) Artık ve atıklarla ilgili işlemler.`, 3);
    writeParagraph(`f) Organizasyon ve hiyerarşik yapı, görev, yetki ve sorumluluklar.`, 3);
    writeParagraph(`g) Çalışanların tecrübe ve düşünceleri.`, 3);
    writeParagraph(`ğ) İşe başlamadan önce ilgili mevzuat gereği alınacak çalışma izin belgeleri.`, 3);
    writeParagraph(`h) Çalışanların eğitim, yaş, cinsiyet ve benzeri özellikleri ile sağlık gözetimi kayıtları.`, 3);
    writeParagraph(`ı) Genç, yaşlı, engelli, gebe veya emziren çalışanlar gibi özel politika gerektiren gruplar ile kadın çalışanların durumu.`, 3);
    writeParagraph(`i) İşyerinin teftiş sonuçları.`, 3);
    writeParagraph(`j) Meslek hastalığı kayıtları.`, 3);
    writeParagraph(`k) İş kazası kayıtları.`, 3);
    writeParagraph(`l) İşyerinde meydana gelen ancak yaralanma veya ölüme neden olmadığı halde işyeri ya da iş ekipmanının zarara uğramasına yol açan olaylara ilişkin kayıtlar.`, 3);
    writeParagraph(`m) Ramak kala olay kayıtları.`, 3);
    writeParagraph(`n) Malzeme güvenlik bilgi formları.`, 3);
    writeParagraph(`o) Ortam ve kişisel maruziyet düzeyi ölçüm sonuçları.`, 3);
    writeParagraph(`ö) Varsa daha önce yapılmış risk değerlendirmesi çalışmaları.`, 3);
    writeParagraph(`p) Acil durum planları.`, 3);
    writeParagraph(`r) Sağlık ve güvenlik planı ve patlamadan korunma dokümanı gibi belirli işyerlerinde hazırlanması gereken dokümanlar.`, 3);
    writeParagraph(`Tehlikelere ilişkin bilgiler toplanırken aynı üretim, yöntem ve teknikleri ile üretim yapan benzer işyerlerinde meydana gelen iş kazaları ve ortaya çıkan meslek hastalıkları da değerlendirilebilir. Toplanan bilgiler ışığında; iş sağlığı ve güvenliği ile ilgili mevzuatta yer alan hükümler de dikkate alınarak, çalışma ortamında bulunan fiziksel, kimyasal, biyolojik, psikososyal, ergonomik ve benzeri`);

    // ============ 4. PROSEDÜR SAYFASI ============
    doc.addPage('a4', 'portrait');

    // Beyaz arka plan
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    yPos = 8; // Yukarı yaslandı

    // ===== ÜST HEADER (2-3. sayfa ile aynı) =====
    const headerHeight4 = 17.5;

    // Çizgi rengi ayarla
    doc.setDrawColor(150);

    // Sol: Logo bölümü - dikdörtgen çiz
    const logoWidth4 = 25;
    doc.rect(margin, yPos, logoWidth4, headerHeight4);

    if (headerInfo.logo) {
      try {
        doc.addImage(headerInfo.logo, 'PNG', margin + 2.5, yPos + 1.25, 20, 15);
      } catch (e) {
        // Logo yüklenemezse boş bırak
      }
    }

    // Orta: Başlık bölümü
    const logoEndX4 = margin + logoWidth4;
    const infoTableStartX4 = pageWidth - margin - 50;
    const titleWidth4 = infoTableStartX4 - logoEndX4;
    const titleCenterX4 = logoEndX4 + titleWidth4 / 2;

    doc.rect(logoEndX4, yPos, titleWidth4, headerHeight4);

    doc.setFont('Roboto', 'bold');
    doc.setFontSize(9.6);
    doc.setTextColor(0, 0, 0);
    doc.text('TEHLİKE TANIMLAMA VE RİSK DEĞERLENDİRMESİ', titleCenterX4, yPos + 6, { align: 'center' });
    doc.text('PROSEDÜRÜ', titleCenterX4, yPos + 11, { align: 'center' });

    // Sağ: Bilgi Tablosu
    const infoTableX4 = pageWidth - margin - 50;
    const infoRowHeight4 = 3.5;

    doc.setDrawColor(150);
    doc.setFontSize(6.3);
    doc.setFont('Roboto', 'normal');

    const infoRows4 = [
      ['Doküman No', 'İSG.PR.002'],
      ['Yayın Tarihi', formatDate(headerInfo.date) || '25.08.2021'],
      ['Revizyon Tarihi', '-'],
      ['Revizyon No', '-'],
      ['Sayfa No', '- 4 -']
    ];

    infoRows4.forEach((row, i) => {
      const rowY = yPos + (i * infoRowHeight4);
      doc.rect(infoTableX4, rowY, 25, infoRowHeight4);
      doc.rect(infoTableX4 + 25, rowY, 25, infoRowHeight4);
      doc.text(row[0], infoTableX4 + 1, rowY + 2.5);
      doc.text(row[1], infoTableX4 + 26, rowY + 2.5);
    });

    yPos += headerHeight4 + 5;

    // ===== 4. SAYFA İÇERİĞİ =====
    yPos += 8; // 2 satır boşluk
    // 6.2 devamı - tehlike kaynakları
    writeParagraph(`tehlike kaynaklarından oluşan veya bunların etkileşimi sonucu ortaya çıkabilecek tehlikeler belirlenir ve kayda alınır. Bu belirleme yapılırken aşağıdaki hususlar, bu hususlardan etkilenecekler ve ne şekilde etkilenebilecekleri göz önünde bulundurulur.`);
    writeParagraph(`a) İşletmenin yeri nedeniyle ortaya çıkabilecek tehlikeler.`, 3);
    writeParagraph(`b) Seçilen alanda, işyeri bina ve eklentilerinin plana uygun yerleştirilmemesi veya planda olmayan ilavelerin yapılmasından kaynaklanabilecek tehlikeler.`, 3);
    writeParagraph(`c) İşyeri bina ve eklentilerinin yapı ve yapım tarzı ile seçilen yapı malzemelerinden kaynaklanabilecek tehlikeler.`, 3);
    writeParagraph(`ç) Bakım ve onarım işleri de dahil işyerinde yürütülecek her türlü faaliyet esnasında çalışma usulleri, vardiya düzeni, ekip çalışması, organizasyon, nezaret sistemi, hiyerarşik düzen, ziyaretçi veya işyeri çalışanı olmayan diğer kişiler gibi faktörlerden kaynaklanabilecek tehlikeler.`, 3);
    writeParagraph(`d) İşin yürütümü, üretim teknikleri, kullanılan maddeler, makine ve ekipman, araç ve gereçler ile bunların çalışanların fiziksel özelliklerine uygun tasarlanmaması veya kullanılmamasından kaynaklanabilecek tehlikeler.`, 3);
    writeParagraph(`e) Kuvvetli akım, aydınlatma, paratoner, topraklama gibi elektrik tesisatının bileşenleri ile ısıtma, havalandırma, atmosferik ve çevresel şartlardan korunma, drenaj, arıtma, yangın önleme ve mücadele ekipmanı ile benzeri yardımcı tesisat ve donanımlardan kaynaklanabilecek tehlikeler.`, 3);
    writeParagraph(`f) İşyerinde yanma, parlama veya patlama ihtimali olan maddelerin işlenmesi, kullanılması, taşınması, depolanması ya da imha edilmesinden kaynaklanabilecek tehlikeler.`, 3);
    writeParagraph(`g) Çalışma ortamına ilişkin hijyen koşulları ile çalışanların kişisel hijyen alışkanlıklarından kaynaklanabilecek tehlikeler.`, 3);
    writeParagraph(`ğ) Çalışanın, işyeri içerisindeki ulaşım yollarının kullanımından kaynaklanabilecek tehlikeler.`, 3);
    writeParagraph(`h) Çalışanların iş sağlığı ve güvenliği ile ilgili yeterli eğitim almaması, bilgilendirilmemesi, çalışanlara uygun talimat verilmemesi veya çalışma izni prosedürü gereken durumlarda bu izin olmaksızın çalışılmasından kaynaklanabilecek tehlikeler.`, 3);

    writeParagraph(`Çalışma ortamında bulunan fiziksel, kimyasal, biyolojik, psikososyal, ergonomik ve benzeri tehlike kaynaklarının neden olduğu tehlikeler ile ilgili işyerinde daha önce kontrol, ölçüm, inceleme ve araştırma çalışması yapılmamış ise risk değerlendirmesi çalışmalarında kullanılmak üzere; bu tehlikelerin, nitelik ve niceliklerini ve çalışanların bunlara maruziyet seviyelerini belirlemek amacıyla gerekli bütün kontrol, ölçüm, inceleme ve araştırmalar yapılır.`);

    // 6.3. RİSK DEĞERLENDİRMESİ KONTROL ADIMLARI
    yPos += 5;
    writeHeading('6.3.', 'RİSK DEĞERLENDİRMESİ KONTROL ADIMLARI', 2);
    writeParagraph(`Risk Değerlendirmesi hazırlanırken izlenecek kontrol adımları aşağıdaki maddelerin yapılması ile sürdürülür.`);

    writeParagraph(`a) Planlama: Analiz edilerek etkilerinin büyüklüğüne ve önemine göre sıralı hale getirilen risklerin kontrolü amacıyla bir planlama yapılır.`, 3);

    writeParagraph(`b) Risk kontrol tedbirlerinin kararlaştırılması: Riskin tamamen bertaraf edilmesi, bu mümkün değil ise riskin kabul edilebilir seviyeye indirilmesi için aşağıdaki adımlar uygulanır.`, 3);
    writeParagraph(`1) Tehlike veya tehlike kaynaklarının ortadan kaldırılması.`, 6);
    writeParagraph(`2) Tehlikelinin, tehlikeli olmayanla veya daha az tehlikeli olanla değiştirilmesi.`, 6);
    writeParagraph(`3) Riskler ile kaynağında mücadele edilmesi.`, 6);

    writeParagraph(`c) Risk kontrol tedbirlerinin uygulanması: Kararlaştırılan tedbirlerin iş ve işlem basamakları, işlemi yapacak kişi ya da işyeri bölümü, sorumlu kişi ya da işyeri bölümü, başlama ve bitiş tarihi ile benzeri bilgileri içeren planlar hazırlanır. Bu planlar işverence uygulamaya konulur.`, 3);

    writeParagraph(`ç) Uygulamaların izlenmesi: Hazırlanan planların uygulama adımları düzenli olarak izlenir, denetlenir ve aksayan yönler tespit edilerek gerekli düzeltici ve önleyici işlemler tamamlanır.`, 3);

    writeParagraph(`Risk kontrol adımları uygulanırken toplu korunma önlemlerine, kişisel korunma önlemlerine göre öncelik verilmesi ve uygulanacak önlemlerin yeni risklere neden olmaması sağlanır. Belirlenen risk için kontrol tedbirlerinin hayata geçirilmesinden sonra yeniden risk seviyesi tespiti yapılır. Yeni seviye, kabul edilebilir risk seviyesinin üzerinde ise bu maddedeki adımlar tekrarlanır.`);

    // ============ 5. PROSEDÜR SAYFASI - AKIŞ ŞEMASI ============
    doc.addPage('a4', 'portrait');

    // Beyaz arka plan
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    yPos = 8; // Yukarı yaslandı

    // ===== ÜST HEADER (diğer sayfalarla aynı) =====
    const headerHeight5 = 17.5;

    // Çizgi rengi ayarla
    doc.setDrawColor(150);

    // Sol: Logo bölümü - dikdörtgen çiz
    const logoWidth5 = 25;
    doc.rect(margin, yPos, logoWidth5, headerHeight5);

    if (headerInfo.logo) {
      try {
        doc.addImage(headerInfo.logo, 'PNG', margin + 2.5, yPos + 1.25, 20, 15);
      } catch (e) {
        // Logo yüklenemezse boş bırak
      }
    }

    // Orta: Başlık bölümü
    const logoEndX5 = margin + logoWidth5;
    const infoTableStartX5 = pageWidth - margin - 50;
    const titleWidth5 = infoTableStartX5 - logoEndX5;
    const titleCenterX5 = logoEndX5 + titleWidth5 / 2;

    doc.rect(logoEndX5, yPos, titleWidth5, headerHeight5);

    doc.setFont('Roboto', 'bold');
    doc.setFontSize(9.6);
    doc.setTextColor(0, 0, 0);
    doc.text('TEHLİKE TANIMLAMA VE RİSK DEĞERLENDİRMESİ', titleCenterX5, yPos + 6, { align: 'center' });
    doc.text('PROSEDÜRÜ', titleCenterX5, yPos + 11, { align: 'center' });

    // Sağ: Bilgi Tablosu
    const infoTableX5 = pageWidth - margin - 50;
    const infoRowHeight5 = 3.5;

    doc.setDrawColor(150);
    doc.setFontSize(6.3);
    doc.setFont('Roboto', 'normal');

    const infoRows5 = [
      ['Doküman No', 'İSG.PR.002'],
      ['Yayın Tarihi', formatDate(headerInfo.date) || '25.08.2021'],
      ['Revizyon Tarihi', '-'],
      ['Revizyon No', '-'],
      ['Sayfa No', '- 5 -']
    ];

    infoRows5.forEach((row, i) => {
      const rowY = yPos + (i * infoRowHeight5);
      doc.rect(infoTableX5, rowY, 25, infoRowHeight5);
      doc.rect(infoTableX5 + 25, rowY, 25, infoRowHeight5);
      doc.text(row[0], infoTableX5 + 1, rowY + 2.5);
      doc.text(row[1], infoTableX5 + 26, rowY + 2.5);
    });

    // Header'ın altından bir satır boşluk bırakarak başla
    const imgStartY = yPos + headerHeight5 + 4; // 4mm = 1 satır boşluk

    // ===== 5. SAYFA İÇERİĞİ - RİSK DEĞERLENDİRME AKIŞ ŞEMASI =====
    // Akış şeması resmini yükle - Header'ın hemen altından başla
    try {
      const flowChartUrl = '/risk-flow-chart.png';
      const flowChartRes = await fetch(flowChartUrl);
      const flowChartBuffer = await flowChartRes.arrayBuffer();
      const flowChartBase64 = toBase64(flowChartBuffer);

      // Resim boyutları - sayfaya sığdır
      const imgWidth = pageWidth - 2 * margin; // Sayfa genişliği - kenar boşlukları
      const imgHeight = pageHeight - imgStartY - 24; // Kalan yükseklik (alt boşluk %50 daha artırıldı: 16 -> 24)

      // Resmi header'ın hemen altından başlat
      const imgX = margin;

      doc.addImage('data:image/png;base64,' + flowChartBase64, 'PNG', imgX, imgStartY, imgWidth, imgHeight);
    } catch (e) {
      console.log('Akış şeması resmi yüklenemedi:', e);
      // Resim yüklenemezse placeholder metin göster
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(100);
      doc.text('RİSK DEĞERLENDİRME AKIŞ ŞEMASI', pageWidth / 2, pageHeight / 2, { align: 'center' });
    }

    // ============ 6. PROSEDÜR SAYFASI ============
    doc.addPage('a4', 'portrait');

    // Beyaz arka plan
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    yPos = 8; // Yukarı yaslandı

    // ===== ÜST HEADER (diğer sayfalarla aynı) =====
    const headerHeight6 = 17.5;

    // Çizgi rengi ayarla
    doc.setDrawColor(150);

    // Sol: Logo bölümü - dikdörtgen çiz
    const logoWidth6 = 25;
    doc.rect(margin, yPos, logoWidth6, headerHeight6);

    if (headerInfo.logo) {
      try {
        doc.addImage(headerInfo.logo, 'PNG', margin + 2.5, yPos + 1.25, 20, 15);
      } catch (e) {
        // Logo yüklenemezse boş bırak
      }
    }

    // Orta: Başlık bölümü
    const logoEndX6 = margin + logoWidth6;
    const infoTableStartX6 = pageWidth - margin - 50;
    const titleWidth6 = infoTableStartX6 - logoEndX6;
    const titleCenterX6 = logoEndX6 + titleWidth6 / 2;

    doc.rect(logoEndX6, yPos, titleWidth6, headerHeight6);

    doc.setFont('Roboto', 'bold');
    doc.setFontSize(9.6);
    doc.setTextColor(0, 0, 0);
    doc.text('TEHLİKE TANIMLAMA VE RİSK DEĞERLENDİRMESİ', titleCenterX6, yPos + 6, { align: 'center' });
    doc.text('PROSEDÜRÜ', titleCenterX6, yPos + 11, { align: 'center' });

    // Sağ: Bilgi Tablosu
    const infoTableX6 = pageWidth - margin - 50;
    const infoRowHeight6 = 3.5;

    doc.setDrawColor(150);
    doc.setFontSize(6.3);
    doc.setFont('Roboto', 'normal');

    const infoRows6 = [
      ['Doküman No', 'İSG.PR.002'],
      ['Yayın Tarihi', formatDate(headerInfo.date) || '25.08.2021'],
      ['Revizyon Tarihi', '-'],
      ['Revizyon No', '-'],
      ['Sayfa No', '- 6 -']
    ];

    infoRows6.forEach((row, i) => {
      const rowY = yPos + (i * infoRowHeight6);
      doc.rect(infoTableX6, rowY, 25, infoRowHeight6);
      doc.rect(infoTableX6 + 25, rowY, 25, infoRowHeight6);
      doc.text(row[0], infoTableX6 + 1, rowY + 2.5);
      doc.text(row[1], infoTableX6 + 26, rowY + 2.5);
    });

    yPos += headerHeight6 + 5;

    // ===== 6. SAYFA İÇERİĞİ =====
    yPos += 8; // 2 satır boşluk (4. sayfa gibi)

    // 6.4. RİSK DEĞERLENDİRMESİ AKSİYON PLANI
    writeHeading('6.4.', 'RİSK DEĞERLENDİRMESİ AKSİYON PLANI', 2);
    writeParagraph(`[FİRMA İSMİ] risk değerlendirmesi ekibi tarafından risk değerlendirmesi sonrasında "İSG.FR.019.RİSK DEĞERLENDİRMESİ AKSİYON PLANI" oluşturulur ve aşağıdakilerin maddeler yapılır.`);
    writeParagraph(`a) Belirlenen aksiyonların öncelik derecesine göre aksiyonun kapatılması için planlanan tarih "hedef tarih" kolonuna yazılır.`, 3);
    writeParagraph(`b) Aksiyonları yerine getirecek sorumlular belirlenerek "sorumlu" kolonuna isimleri yazılır.`, 3);
    writeParagraph(`c) Aksiyon planını takip edecek ve planın "Durum" ve "Kapatma Tarihi" kolonlarını dolduracak kişi veya kişiler belirlenir.`, 3);
    writeParagraph(`d) "Durum" kolonuna aşağıdaki girişler yapılarak aksiyon planı ve performans takip edilir:`, 3);
    writeParagraph(`- Tamamlanan`, 6);
    writeParagraph(`- Hedef Tarihi Geçen`, 6);
    writeParagraph(`- Zaman Var`, 6);
    writeParagraph(`- Hedef Tarih Verilmemiş`, 6);
    writeParagraph(`e) Aksiyonlar kapatıldığında risk değerlendirmesinde bulunan "Kapatma Tarihi" kolonu doldurulur.`, 3);
    writeParagraph(`f) Aksiyonların belirlenen hedef tarihler içinde kapatılması sağlanır.`, 3);
    writeParagraph(`g) Oluşturulan "Risk Değerlendirmesi Aksiyon Planı" aksiyonları kapatacak kişiler ile paylaşılır.`, 3);
    writeParagraph(`h) Risk Değerlendirme çalışmasının yönetmelik haricinde belirtilen haller dışında yılda bir defa ve uzman değişikliği sonucunda ilk olarak aksiyon planı oluşturularak yıl sonunda risk analizinin revize edilmesi sağlanır.`, 3);
    writeParagraph(`i) Risk değerlendirmesi bu konuda eğitim almış [FİRMA İSMİ]tarafından görevlendirilmiş personeller tarafından güncellenebilir.`, 3);

    // 6.5. FINE – KINNEY METODU
    yPos += 5;
    writeHeading('6.5.', 'FINE – KINNEY METODU', 2);
    writeParagraph(`Kaza kontrolü için matematiksel değerlendirme anlamına gelir. Bu yöntem G.F. Kinney and A.D Wiruth tarafından 1976 yılında geliştirilmiştir. Çalışma ortamındaki tehlikelerin kazaya sebebiyet vermeden tespit edilmesini ve risk skoruna göre en öncelikli olandan başlayıp iyileştirilmesini sağlayan bir metot dur.`);
    writeParagraph(`Bu çalışmada; [FİRMA İSMİ]'ait gerçekleştirilen Kinney Risk Analizi yönetiminin konusu ele alınmıştır. Uygulamayla işletmede iş kazası ve meslek hastalığı oluşturabilecek riskler değerlendirilip, bunların en1gellenmesine yönelik iyileştirme önerilerinde bulunulmuştur.`);
    writeParagraph(`Analiz edilerek belirlenmiş tehlikeler, aşağıda açıklaması yapılan FINE KINNEY risk yöntemine göre değerlendirilir.`);
    writeParagraph(`RİSK = OLASILIK X FREKANS X ŞİDDET formülü kullanılarak hesaplanır.`);
    writeParagraph(`Olasılık: Olasılık değerlendirilirken, faaliyet esnasındaki tehlikelerden kaynaklanan zararın gerçekleşme olasılığı sorgulanır ve puanlandırılır.`);
    writeParagraph(`Frekans: Frekans değerlendirilirken, faaliyet esnasında tehlikeye maruz kalma sıklığı sorgulanır ve puanlandırılır.`);
    writeParagraph(`Şiddet: Şiddet değerlendirilirken, faaliyet esnasındaki tehlikelerden kaynaklanan zararın çalışan ve veya ekipman üzerinde yaratacağı tahmini etki sorgulanır ve puanlandırılır.`);
    yPos += 3;
    writeParagraph(`Risk Skoru;`);
    writeParagraph(`Olayın Meydana Gelme İhtimali(O) x Tehlike Maruziyet Sıklığı(F) x Şiddet(Ş)`);
    writeParagraph(`Bu yöntem sıkça uygulanmakta olup, işverenlerinde algılayabileceği bir yöntemdir. Sadece olasılık ya da şiddete bağlı kalmayıp firma içinde zarara maruz kalma sıklığı parametre olarak da değerlendirilmesinden dolayı daha etkin sonuçlar alınmaktadır. Kinney metodunda farklı üç parametre ile tehlike ve doğabilecek şiddetleri hesaplanarak risk skorları belirlenmekte ve ona göre önleyici aksiyon planları oluşturulması planlanmaktadır.`);

    // ============ 7. PROSEDÜR SAYFASI - RİSK TABLOSU ŞEMASI ============
    doc.addPage('a4', 'portrait');

    // Beyaz arka plan
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    yPos = 8; // Yukarı yaslandı

    // ===== ÜST HEADER (diğer sayfalarla aynı) =====
    const headerHeight7 = 17.5;

    // Çizgi rengi ayarla
    doc.setDrawColor(150);

    // Sol: Logo bölümü - dikdörtgen çiz
    const logoWidth7 = 25;
    doc.rect(margin, yPos, logoWidth7, headerHeight7);

    if (headerInfo.logo) {
      try {
        doc.addImage(headerInfo.logo, 'PNG', margin + 2.5, yPos + 1.25, 20, 15);
      } catch (e) {
        // Logo yüklenemezse boş bırak
      }
    }

    // Orta: Başlık bölümü
    const logoEndX7 = margin + logoWidth7;
    const infoTableStartX7 = pageWidth - margin - 50;
    const titleWidth7 = infoTableStartX7 - logoEndX7;
    const titleCenterX7 = logoEndX7 + titleWidth7 / 2;

    doc.rect(logoEndX7, yPos, titleWidth7, headerHeight7);

    doc.setFont('Roboto', 'bold');
    doc.setFontSize(9.6);
    doc.setTextColor(0, 0, 0);
    doc.text('TEHLİKE TANIMLAMA VE RİSK DEĞERLENDİRMESİ', titleCenterX7, yPos + 6, { align: 'center' });
    doc.text('PROSEDÜRÜ', titleCenterX7, yPos + 11, { align: 'center' });

    // Sağ: Bilgi Tablosu
    const infoTableX7 = pageWidth - margin - 50;
    const infoRowHeight7 = 3.5;

    doc.setDrawColor(150);
    doc.setFontSize(6.3);
    doc.setFont('Roboto', 'normal');

    const infoRows7 = [
      ['Doküman No', 'İSG.PR.002'],
      ['Yayın Tarihi', formatDate(headerInfo.date) || '25.08.2021'],
      ['Revizyon Tarihi', '-'],
      ['Revizyon No', '-'],
      ['Sayfa No', '- 7 -']
    ];

    infoRows7.forEach((row, i) => {
      const rowY = yPos + (i * infoRowHeight7);
      doc.rect(infoTableX7, rowY, 25, infoRowHeight7);
      doc.rect(infoTableX7 + 25, rowY, 25, infoRowHeight7);
      doc.text(row[0], infoTableX7 + 1, rowY + 2.5);
      doc.text(row[1], infoTableX7 + 26, rowY + 2.5);
    });

    // Header'ın altından bir satır boşluk bırakarak başla
    const imgStartY7 = yPos + headerHeight7 + 4; // 4mm = 1 satır boşluk

    // ===== 7. SAYFA İÇERİĞİ - RİSK TABLOSU ŞEMASI =====
    // Risk tablosu şeması resmini yükle
    try {
      const riskTableUrl = '/risk-table-chart.png';
      const riskTableRes = await fetch(riskTableUrl);
      const riskTableBuffer = await riskTableRes.arrayBuffer();
      const riskTableBase64 = toBase64(riskTableBuffer);

      // Resim boyutları - sayfaya sığdır
      const imgWidth7 = pageWidth - 2 * margin; // Sayfa genişliği - kenar boşlukları
      const imgHeight7 = pageHeight - imgStartY7 - 24; // Kalan yükseklik (alt boşluk %20 artırıldı: 20 -> 24)

      // Resmi header'ın altından başlat
      const imgX7 = margin;

      doc.addImage('data:image/png;base64,' + riskTableBase64, 'PNG', imgX7, imgStartY7, imgWidth7, imgHeight7);
    } catch (e) {
      console.log('Risk tablosu şeması resmi yüklenemedi:', e);
      // Resim yüklenemezse placeholder metin göster
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(100);
      doc.text('RİSK DEĞERLENDİRME TABLOSU', pageWidth / 2, pageHeight / 2, { align: 'center' });
    }

    // ============ 8. PROSEDÜR SAYFASI - RİSK DEĞERLENDİRME EKİBİ ============
    doc.addPage('a4', 'portrait');

    // Beyaz arka plan
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    yPos = 8; // Yukarı yaslandı

    // ===== ÜST HEADER (diğer sayfalarla aynı) =====
    const headerHeight8 = 17.5;

    // Çizgi rengi ayarla
    doc.setDrawColor(150);

    // Sol: Logo bölümü - dikdörtgen çiz
    const logoWidth8 = 25;
    doc.rect(margin, yPos, logoWidth8, headerHeight8);

    if (headerInfo.logo) {
      try {
        doc.addImage(headerInfo.logo, 'PNG', margin + 2.5, yPos + 1.25, 20, 15);
      } catch (e) {
        // Logo yüklenemezse boş bırak
      }
    }

    // Orta: Başlık bölümü
    const logoEndX8 = margin + logoWidth8;
    const infoTableStartX8 = pageWidth - margin - 50;
    const titleWidth8 = infoTableStartX8 - logoEndX8;
    const titleCenterX8 = logoEndX8 + titleWidth8 / 2;

    doc.rect(logoEndX8, yPos, titleWidth8, headerHeight8);

    doc.setFont('Roboto', 'bold');
    doc.setFontSize(9.6);
    doc.setTextColor(0, 0, 0);
    doc.text('TEHLİKE TANIMLAMA VE RİSK DEĞERLENDİRMESİ', titleCenterX8, yPos + 6, { align: 'center' });
    doc.text('PROSEDÜRÜ', titleCenterX8, yPos + 11, { align: 'center' });

    // Sağ: Bilgi Tablosu
    const infoTableX8 = pageWidth - margin - 50;
    const infoRowHeight8 = 3.5;

    doc.setDrawColor(150);
    doc.setFontSize(6.3);
    doc.setFont('Roboto', 'normal');

    const infoRows8 = [
      ['Doküman No', 'İSG.PR.002'],
      ['Yayın Tarihi', formatDate(headerInfo.date) || '25.08.2021'],
      ['Revizyon Tarihi', '-'],
      ['Revizyon No', '-'],
      ['Sayfa No', '- 8 -']
    ];

    infoRows8.forEach((row, i) => {
      const rowY = yPos + (i * infoRowHeight8);
      doc.rect(infoTableX8, rowY, 25, infoRowHeight8);
      doc.rect(infoTableX8 + 25, rowY, 25, infoRowHeight8);
      doc.text(row[0], infoTableX8 + 1, rowY + 2.5);
      doc.text(row[1], infoTableX8 + 26, rowY + 2.5);
    });

    yPos += headerHeight8 + 5;

    // ===== 8. SAYFA İÇERİĞİ =====
    yPos += 8; // 2 satır boşluk

    // 7. RİSK DEĞERLENDİRME EKİBİ
    writeHeading('7.', 'RİSK DEĞERLENDİRME EKİBİ');
    writeParagraph(`29.12.2012 tarihli ve 28512 sayılı Resmi Gazete'de yayımlanan "İŞ SAĞLIĞI VE GÜVENLİĞİ RİSK DEĞERLENDİRMESİ YÖNETMELİĞİ" Madde 6'ya göre belirlenen Risk Değerlendirme Ekibi aşağıdaki gibidir.`);

    yPos += 5;

    // Risk Değerlendirme Ekibi Tablosu - jsPDF ile çizim
    const tableStartY = yPos;
    const tableMargin = margin;
    const table8Width = pageWidth - 2 * tableMargin;

    // Sütun genişlikleri
    const col1W = 40; // RİSK DEĞERLENDİRME EKİBİ
    const col2W = 70; // Unvan
    const col3W = 50; // Ad-Soyad
    const col4W = table8Width - col1W - col2W - col3W; // İmza

    const rowH = 8; // Satır yüksekliği

    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    let currentY = tableStartY;

    // Alt başlık satırı - Beyaz arka plan
    doc.rect(tableMargin, currentY, col1W, rowH);
    doc.rect(tableMargin + col1W, currentY, col2W, rowH);
    doc.setFillColor(255, 255, 255); // Beyaz renk
    doc.rect(tableMargin + col1W, currentY, col2W, rowH, 'FD');
    doc.setTextColor(0, 0, 0); // Siyah yazı rengi
    doc.text('Unvan', tableMargin + col1W + col2W / 2, currentY + 5.5, { align: 'center' });

    doc.rect(tableMargin + col1W + col2W, currentY, col3W, rowH);
    doc.setFillColor(255, 255, 255);
    doc.rect(tableMargin + col1W + col2W, currentY, col3W, rowH, 'FD');
    doc.text('Ad –Soyad', tableMargin + col1W + col2W + col3W / 2, currentY + 5.5, { align: 'center' });

    doc.rect(tableMargin + col1W + col2W + col3W, currentY, col4W, rowH);
    doc.setFillColor(255, 255, 255);
    doc.rect(tableMargin + col1W + col2W + col3W, currentY, col4W, rowH, 'FD');
    doc.text('İmza', tableMargin + col1W + col2W + col3W + col4W / 2, currentY + 5.5, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    currentY += rowH;

    // Ekip üyeleri verileri (Formen hariç)
    const teamMembers = [
      { unvan: 'İŞVEREN / İŞVEREN VEKİLİ', adSoyad: headerInfo.employer || '' },
      { unvan: 'İŞ GÜVENLİĞİ UZMANI', adSoyad: headerInfo.igu || '' },
      { unvan: 'İŞ YERİ HEKİMİ', adSoyad: headerInfo.doctor || '' },
      { unvan: 'ÇALIŞAN TEMSİLCİSİ', adSoyad: headerInfo.representative || '' },
      { unvan: 'DESTEK ELEMANI', adSoyad: headerInfo.support || '' }
    ];

    // Sol sütun birleşik hücre yüksekliği
    const mergedCellHeight = teamMembers.length * rowH;

    // Sol birleşik hücre çerçevesi
    doc.rect(tableMargin, currentY, col1W, mergedCellHeight);

    // Sol birleşik hücre metni - dikey ortalı
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(8);
    const leftCellCenterY = currentY + mergedCellHeight / 2;
    doc.text('RİSK', tableMargin + col1W / 2, leftCellCenterY - 6, { align: 'center' });
    doc.text('DEĞERLENDİRME', tableMargin + col1W / 2, leftCellCenterY, { align: 'center' });
    doc.text('EKİBİ', tableMargin + col1W / 2, leftCellCenterY + 6, { align: 'center' });

    // Ekip üyeleri satırları
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);

    teamMembers.forEach((member, index) => {
      const rowY = currentY + index * rowH;

      // Unvan hücresi
      doc.rect(tableMargin + col1W, rowY, col2W, rowH);
      doc.text(member.unvan, tableMargin + col1W + 2, rowY + 5.5);

      // İki nokta üst üste hücresi (küçük)
      doc.text(':', tableMargin + col1W + col2W - 5, rowY + 5.5);

      // Ad-Soyad hücresi
      doc.rect(tableMargin + col1W + col2W, rowY, col3W, rowH);
      doc.text(member.adSoyad, tableMargin + col1W + col2W + 2, rowY + 5.5);

      // İmza hücresi
      doc.rect(tableMargin + col1W + col2W + col3W, rowY, col4W, rowH);
    });

    prosedurPageCount = doc.getNumberOfPages();

    // ============ TABLO SAYFALARI (YATAY) ============
    // Yeni yatay sayfa ekle (prosedür varsa)
    if (prosedurPageCount > 0) {
      doc.addPage('a4', 'landscape');
    } else {
      // Prosedür yoksa ilk sayfayı landscape yap
      doc.deletePage(1);
      doc.addPage('a4', 'landscape');
    }

    // formatDate zaten utils.ts'den import edildi

    const drawHeader = (doc: any) => {
      const pageWidth = doc.internal.pageSize.width;
      const margin = 10;
      const startY = 5; // Üst boşluk azaltıldı
      const headerHeight = 25;

      // Dış Çerçeve
      doc.setDrawColor(150);
      doc.rect(margin, startY, pageWidth - 2 * margin, headerHeight);

      // 1. Sol Blok: Yöntem & Hazırlayan (Genişlik: 35mm)
      const col1Width = 35;
      doc.line(margin + col1Width, startY, margin + col1Width, startY + headerHeight);

      // Yöntem
      doc.line(margin, startY + 12.5, margin + col1Width, startY + 12.5);
      doc.setFontSize(6); doc.setTextColor(100);
      doc.text("YÖNTEM", margin + 2, startY + 4);
      doc.setFontSize(8); doc.setTextColor(0);
      doc.text("FINE KINNEY", margin + 2, startY + 9);

      // Hazırlayan
      doc.setFontSize(6); doc.setTextColor(100);
      doc.text("HAZIRLAYAN", margin + 2, startY + 16.5);
      doc.setFontSize(8); doc.setTextColor(0);
      doc.text("İSG RİSK EKİBİ", margin + 2, startY + 21.5);

      // 2. Orta Blok: Logo & Firma
      // Firma alanı daha da kısaltıldı, sağ blok genişletildi
      const col3Width = 100; // Sağ blok genişliği azaltıldı (115 -> 100) - Tarih alanı kısaldı
      const col2Start = margin + col1Width;
      const col2Width = pageWidth - 2 * margin - col1Width - col3Width;
      const col2End = col2Start + col2Width;

      doc.line(col2End, startY, col2End, startY + headerHeight);

      // Logo Alanı (20mm)
      const logoWidth = 20;
      doc.line(col2Start + logoWidth, startY, col2Start + logoWidth, startY + headerHeight);

      if (headerInfo.logo) {
        try {
          // Logoyu ortala (Max 12x16mm) - Biraz küçültüldü
          const maxLogoW = 12;
          const maxLogoH = 16;
          const logoX = col2Start + (logoWidth - maxLogoW) / 2;
          const logoY = startY + (headerHeight - maxLogoH) / 2;
          doc.addImage(headerInfo.logo, 'JPEG', logoX, logoY, maxLogoW, maxLogoH, undefined, 'FAST');
        } catch (e) { }
      }

      // Firma Bilgileri
      const infoStart = col2Start + logoWidth;

      // Başlık - Beyaz Arkaplan, Daha Kısa
      // doc.setFillColor(245, 245, 245); // Kaldırıldı
      // doc.rect(infoStart, startY, col2Width - logoWidth, 5, 'F'); // Kaldırıldı
      doc.setFontSize(5); doc.setTextColor(50); // Font küçültüldü (6->5)
      doc.text("ANALİZ YAPILAN İŞYERİNİN", infoStart + 2, startY + 2.5); // Y koordinatı ayarlandı (3.5 -> 2.5)

      doc.line(infoStart, startY + 3, col2End, startY + 3); // Çizgi yukarı çekildi (5 -> 3)

      // Bilgiler (Daha kompakt)
      const rowH = 7.3; // Satır yüksekliği biraz artırıldı (6.6 -> 7.3) çünkü alan açıldı
      doc.line(infoStart, startY + 3 + rowH, col2End, startY + 3 + rowH);
      doc.line(infoStart, startY + 3 + rowH * 2, col2End, startY + 3 + rowH * 2);

      // Satır ortalaması için hesaplama (startY + 3 başlangıç, her satır rowH yüksekliğinde)
      const maxTextWidth = col2Width - logoWidth - 17;
      const lineHeight = 2.8; // Satır aralığı

      // Unvan - dikey ortalı (2 satır olabilir)
      doc.setFontSize(6); doc.setTextColor(100); doc.setFont("Roboto", "normal");
      const row1Top = startY + 3;
      doc.text("UNVANI:", infoStart + 2, row1Top + rowH / 2 + 1);
      doc.setFontSize(7); doc.setTextColor(0); doc.setFont("Roboto", "bold");
      const titleLines = doc.splitTextToSize(headerInfo.title || "", maxTextWidth);
      const titleStartY = row1Top + (rowH - titleLines.length * lineHeight) / 2 + lineHeight;
      titleLines.slice(0, 2).forEach((line: string, i: number) => {
        doc.text(line, infoStart + 15, titleStartY + i * lineHeight);
      });

      // Adres - dikey ortalı (2 satır olabilir)
      doc.setFontSize(6); doc.setTextColor(100); doc.setFont("Roboto", "normal");
      const row2Top = startY + 3 + rowH;
      doc.text("ADRESİ:", infoStart + 2, row2Top + rowH / 2 + 1);
      doc.setFontSize(6); doc.setTextColor(0); doc.setFont("Roboto", "bold");
      const addressLines = doc.splitTextToSize(headerInfo.address || "", maxTextWidth);
      const addressStartY = row2Top + (rowH - addressLines.length * lineHeight) / 2 + lineHeight;
      addressLines.slice(0, 2).forEach((line: string, i: number) => {
        doc.text(line, infoStart + 15, addressStartY + i * lineHeight);
      });

      // Sicil - dikey ortalı (tek satır)
      doc.setFontSize(6); doc.setTextColor(100); doc.setFont("Roboto", "normal");
      const row3Top = startY + 3 + rowH * 2;
      doc.text("SİCİL NO:", infoStart + 2, row3Top + rowH / 2 + 1);
      doc.setFontSize(8); doc.setTextColor(0); doc.setFont("Roboto", "bold");
      doc.text(headerInfo.registrationNumber || "", infoStart + 15, row3Top + rowH / 2 + 1);

      // 3. Sağ Blok: Tarihler & Ekip (Kompakt)
      const col3Start = col2End;
      const subColWidth = 55; // Tarih sütunu kısaltıldı (70 -> 55)
      doc.line(col3Start + subColWidth, startY, col3Start + subColWidth, startY + headerHeight);

      // Tarihler
      doc.setFontSize(6); doc.setTextColor(100);
      doc.text("YAPILIŞ TARİHİ:", col3Start + 2, startY + 5);
      doc.setFontSize(8); doc.setTextColor(0);
      doc.text(formatDate(headerInfo.date), col3Start + 22, startY + 5);

      doc.line(col3Start, startY + 8, col3Start + subColWidth, startY + 8);

      doc.setFontSize(6); doc.setTextColor(100);
      doc.text("GEÇERLİLİK TARİHİ:", col3Start + 2, startY + 13);
      doc.setFontSize(8); doc.setTextColor(0);
      doc.text(formatDate(headerInfo.validityDate), col3Start + 22, startY + 13);

      doc.line(col3Start, startY + 17, col3Start + subColWidth, startY + 17);

      doc.setFontSize(6); doc.setTextColor(100);
      doc.text("REVİZYON:", col3Start + 2, startY + 21);
      doc.setFontSize(8); doc.setTextColor(0);
      doc.text(headerInfo.revision || "", col3Start + 20, startY + 21);

      // Ekip
      const teamStart = col3Start + subColWidth;
      // doc.setFillColor(245, 245, 245); // Kaldırıldı
      // doc.rect(teamStart, startY, col3Width - subColWidth, 4, 'F'); // Kaldırıldı
      doc.setFontSize(5); doc.setTextColor(50); // Font küçültüldü (6->5)
      doc.text("RİSK DEĞERLENDİRME EKİBİ", teamStart + 2, startY + 2.5); // Y koordinatı ayarlandı (3->2.5)
      doc.line(teamStart, startY + 3, pageWidth - margin, startY + 3); // Çizgi yukarı çekildi (4->3)

      const teamRows = [
        { l: "İŞV:", v: headerInfo.employer },
        { l: "İGU:", v: headerInfo.igu },
        { l: "DR:", v: headerInfo.doctor },
        { l: "TEM:", v: headerInfo.representative },
        { l: "DES:", v: headerInfo.support }
      ];

      let teamY = startY + 6; // Başlangıç Y koordinatı yukarı çekildi (7->6)
      teamRows.forEach((row, i) => {
        doc.setFontSize(6); doc.setTextColor(100);
        doc.text(row.l, teamStart + 2, teamY);
        doc.setFontSize(7); doc.setTextColor(0);
        doc.text(row.v || "", teamStart + 10, teamY);
        teamY += 4.2; // Satır aralığı biraz artırıldı (4->4.2)
      });
    };

    autoTable(doc, {
      head: [
        [
          { content: 'No', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
          { content: 'Bölüm / Ortam', rowSpan: 2, styles: { valign: 'middle' } },
          { content: 'Foto', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
          { content: 'Tehlike', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
          { content: 'Risk', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
          { content: 'Etkilenen', rowSpan: 2, styles: { valign: 'middle', halign: 'center', cellWidth: 10, fontSize: 6 } }, // Başlık metni normal (yatay), font küçültüldü
          { content: '1. Aşama (Mevcut Durum)', colSpan: 5, styles: { halign: 'center', fillColor: [153, 27, 27], textColor: 255, fontStyle: 'bold' } },
          { content: 'Kontrol Tedbirleri', rowSpan: 2, styles: { valign: 'middle', cellWidth: 40, halign: 'center' } },
          { content: '2. Aşama (Tedbir Sonrası)', colSpan: 5, styles: { halign: 'center', fillColor: [20, 83, 45], textColor: 255, fontStyle: 'bold' } },
          { content: 'Sorumlu', rowSpan: 2, styles: { valign: 'middle', halign: 'center', cellWidth: 15 } } // Başlık metni normal (yatay)
        ],
        [
          { content: 'O', styles: { halign: 'center', cellWidth: 8, fillColor: [59, 130, 246], textColor: 255 } },
          { content: 'F', styles: { halign: 'center', cellWidth: 8, fillColor: [34, 197, 94], textColor: 255 } },
          { content: 'Ş', styles: { halign: 'center', cellWidth: 12, fillColor: [234, 179, 8], textColor: 255 } },
          { content: 'Skor', styles: { halign: 'center', cellWidth: 10, fillColor: [220, 38, 38], textColor: 255 } },
          { content: 'Sınıf', styles: { halign: 'center', cellWidth: 15, fillColor: [220, 38, 38], textColor: 255 } },
          { content: 'O', styles: { halign: 'center', cellWidth: 8, fillColor: [59, 130, 246], textColor: 255 } },
          { content: 'F', styles: { halign: 'center', cellWidth: 8, fillColor: [34, 197, 94], textColor: 255 } },
          { content: 'Ş', styles: { halign: 'center', cellWidth: 12, fillColor: [234, 179, 8], textColor: 255 } },
          { content: 'Skor', styles: { halign: 'center', cellWidth: 10, fillColor: [220, 38, 38], textColor: 255 } },
          { content: 'Sınıf', styles: { halign: 'center', cellWidth: 15, fillColor: [220, 38, 38], textColor: 255 } },
        ]
      ],
      body: risks.map(r => [
        r.riskNo,
        '', // Bölüm / Ortam (didDrawCell ile özel çizilecek)

        '', // Fotoğraf hücresi (didDrawCell ile doldurulacak)
        r.hazard,
        r.risk,
        r.affected,
        r.probability, r.frequency, r.severity, Math.round(r.score), r.level.split(' ')[0],
        r.measures,
        r.probability2, r.frequency2, r.severity2, Math.round(r.score2), r.level2.split(' ')[0],
        r.responsible
      ]),
      startY: 29.9, // Başlık 25mm + 5mm margin (Boşluk kalmaması için ince ayar)
      margin: { top: 29.9, left: 10, right: 10 },
      theme: 'grid',
      rowPageBreak: 'avoid', // Satırların bölünmesini engelle
      styles: {
        font: 'Roboto', // Yüklenen fontu kullan
        fontSize: 8, // Font boyutu küçültüldü
        cellPadding: 0.5, // Padding azaltıldı
        overflow: 'linebreak',
        lineColor: 200,
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [31, 41, 55],
        textColor: 255,
        fontSize: 7,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 6, halign: 'center', valign: 'middle' }, // No
        1: { cellWidth: 22, valign: 'middle', fontSize: 6.5 }, // Bölüm - Font küçüldü, genişlik azaldı (25->22)
        2: { cellWidth: 15, minCellHeight: 12, valign: 'middle' }, // Foto
        3: { cellWidth: 33, valign: 'middle' }, // Tehlike - Genişlik azaldı (35->33)
        4: { cellWidth: 33, valign: 'middle' }, // Risk - Genişlik azaldı (35->33)
        5: { cellWidth: 10, halign: 'center', valign: 'middle', fontSize: 3.8, overflow: 'linebreak' }, // Etkilenen

        // 1. Aşama
        6: { cellWidth: 7, halign: 'center', valign: 'middle' }, // O
        7: { cellWidth: 7, halign: 'center', valign: 'middle' }, // F
        8: { cellWidth: 12, halign: 'center', valign: 'middle' }, // Ş
        9: { cellWidth: 10, halign: 'center', valign: 'middle', fontStyle: 'bold' }, // Skor
        10: { cellWidth: 12, halign: 'center', valign: 'middle', fontSize: 7 }, // Sınıf

        11: { cellWidth: 43, valign: 'middle' }, // Önlemler - Genişlik azaldı (45->43)

        // 2. Aşama
        12: { cellWidth: 7, halign: 'center', valign: 'middle' }, // O
        13: { cellWidth: 7, halign: 'center', valign: 'middle' }, // F
        14: { cellWidth: 12, halign: 'center', valign: 'middle' }, // Ş
        15: { cellWidth: 10, halign: 'center', valign: 'middle', fontStyle: 'bold' }, // Skor
        16: { cellWidth: 12, halign: 'center', valign: 'middle', fontSize: 7 }, // Sınıf

        17: { cellWidth: 10, halign: 'center', valign: 'middle', fontSize: 4.1 } // Sorumlu
      },
      didDrawPage: (data) => {
        drawHeader(doc);
      },
      willDrawCell: (data) => {
        // Yatay yazıları gizle (No ve Etkilenen) - Sadece gövde
        // Ayrıca Bölüm/Ortam (1) sütununu da gizle, çünkü didDrawCell ile kendimiz yazacağız
        if (data.section === 'body' && (data.column.index === 0 || data.column.index === 1)) {
          data.cell.text = [];
        }
      },
      didDrawCell: (data) => {
        // Resim Ekleme
        if (data.section === 'body' && data.column.index === 2) {
          const risk = risks[data.row.index];
          if (risk && risk.image) {
            try {
              const imgWidth = 12;
              const imgHeight = 12;
              const x = data.cell.x + (data.cell.width - imgWidth) / 2;
              const y = data.cell.y + (data.cell.height - imgHeight) / 2;
              doc.addImage(risk.image, 'JPEG', x, y, imgWidth, imgHeight);
            } catch (err) { }
          }
        }

        // Bölüm / Ortam (Index 1) - Özel Çizim
        if (data.section === 'body' && data.column.index === 1) {
          const risk = risks[data.row.index];
          const cellCenterX = data.cell.x + data.cell.width / 2; // Yatay ortala

          // İçerik Yüksekliğini Hesapla
          doc.setFontSize(7); doc.setFont("Roboto", "bold");
          const splitSub = doc.splitTextToSize(risk.sub_category || "", data.cell.width - 2);

          doc.setFontSize(6); doc.setFont("Roboto", "normal");
          const splitSource = doc.splitTextToSize(risk.source || "", data.cell.width - 2);

          const subHeight = splitSub.length * 3; // Satır yüksekliği approx 3mm
          const sourceHeight = splitSource.length * 2.5; // Satır yüksekliği approx 2.5mm
          const totalTextHeight = subHeight + 1 + sourceHeight; // Arada 1mm boşluk

          // Dikey Ortala
          let y = data.cell.y + (data.cell.height - totalTextHeight) / 2 + 2; // +2mm üst boşluk (font baseline için)

          // Sub Category - Kalın (Ortalı)
          doc.setFontSize(7);
          doc.setFont("Roboto", "bold");
          doc.setTextColor(0);
          doc.text(splitSub, cellCenterX, y, { align: 'center' });

          y += subHeight + 1;

          // Source - İnce ve Küçük (Ortalı)
          doc.setFontSize(6);
          doc.setFont("Roboto", "normal");
          doc.setTextColor(80);
          doc.text(splitSource, cellCenterX, y, { align: 'center' });
        }

        // Dikey Metin (İçerik): Sadece No (0)
        if (data.section === 'body' && data.column.index === 0) {
          const text = (data.cell.raw as string || "").trim();
          let x = data.cell.x + data.cell.width / 2;
          let y = data.cell.y + data.cell.height / 2;
          x += 3.1; // 1mm sağa kaydırıldı
          y += 0.5;
          doc.setFontSize(3.8);
          doc.setTextColor(0);
          doc.text(text, x, y, { angle: 90, align: 'center', baseline: 'middle' });
        }
      }
    });

    // Dosya İsmi Oluşturma
    const titleWords = (headerInfo.title || "Firma").trim().split(/\s+/);
    const safeTitle = titleWords.slice(0, 2).join(' ').replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ ]/g, "") || 'Firma';
    const filename = `${safeTitle} RİSK DEĞERLENDİRME FORMU.pdf`;

    // Risk Prosedürü tikli değilse, prosedür sayfalarını (1-8) sil
    if (!includeProcedure && prosedurPageCount > 0) {
      // Prosedür sayfalarını sondan başa doğru sil (sayfa numaraları kaymaması için)
      for (let p = prosedurPageCount; p >= 1; p--) {
        doc.deletePage(p);
      }
    }

    // Sayfa numaralarını ve prosedür sayfalarına alt bilgi (imza alanı) ekle
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const pgWidth = doc.internal.pageSize.width;
      const pgHeight = doc.internal.pageSize.height;

      // Alt bilgi - İmza Alanı
      // includeProcedure true ise: 2+ sayfalar (1. sayfa kapak)
      // includeProcedure false ise: Tüm sayfalar (prosedür silindi)
      const showFooter = includeProcedure ? (i >= 2) : true;
      if (showFooter) {
        const footerY = pgHeight - 15;
        const footerMargin = 15;
        const footerWidth = pgWidth - 2 * footerMargin;
        const colWidth = footerWidth / 5;

        // Beyaz arka plan
        doc.setFillColor(255, 255, 255);
        doc.rect(footerMargin, footerY - 2, footerWidth, 10, 'F');

        doc.setFont('Roboto', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100);

        const footerLabels = [
          'İŞ GÜVENLİK UZMANI',
          'İŞYERİ HEKİMİ',
          'ÇALIŞAN TEM.',
          'DESTEK ELEMANI',
          'İŞVEREN/VEKİLİ'
        ];

        footerLabels.forEach((label, idx) => {
          const x = footerMargin + idx * colWidth + colWidth / 2;
          doc.text(label, x, footerY + 3, { align: 'center' });
        });
      }

      // Sayfa numarası (sadece includeProcedure tikli ise göster, 1. sayfa kapak hariç)
      if (includeProcedure && i >= 2) {
        doc.setFontSize(6); // %25 küçültüldü (8 -> 6)
        doc.setTextColor(100);
        doc.text(`Sayfa ${i} / ${totalPages}`, pgWidth - 25, pgHeight - 8);
      }
    }

    // Free kullanıcı için filigran ekle
    if (isFreeUser) {
      const totalPdfPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPdfPages; i++) {
        doc.setPage(i);
        const pgWidth = doc.internal.pageSize.width;
        const pgHeight = doc.internal.pageSize.height;

        doc.setFont('Roboto', 'bold');
        doc.setFontSize(40);
        doc.setTextColor(200, 200, 200); // Açık gri

        // Köşegen filigran
        doc.text('www.isgpratik.com', pgWidth / 2, pgHeight / 2, {
          angle: 45,
          align: 'center',
          baseline: 'middle'
        });
      }
    }

    doc.save(filename);
  };

  const handleSelectPreset = (item: any, categoryCode: any) => {
    setForm({
      ...form,
      categoryCode: categoryCode,
      sub_category: item.sub_category,
      source: item.source,
      hazard: item.hazard,
      risk: item.risk,
      affected: item.affected || "Çalışanlar",
      responsible: "İşveren Vekili",
      probability: item.p || 1,
      frequency: item.f || 1,
      severity: item.s || 1,
      probability2: item.p2 || 1,
      frequency2: item.f2 || 1,
      severity2: item.s2 || 1,
      measures: item.measures
    });
    (document.getElementById('risk-form') as any).scrollIntoView({ behavior: 'smooth' });
  };

  const filteredCategories = riskCategories.filter((cat: any) =>
    cat.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans flex flex-col relative">

      {notification.show && (
        <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-2xl z-[100] flex items-center animate-bounce-in ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {notification.type === 'error' ? <AlertCircle className="w-5 h-5 mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
          <span className="font-bold text-sm">{notification.message}</span>
        </div>
      )}

      {/* GİZLİ INPUTLAR */}
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
      <input type="file" accept="image/*" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" />

      {/* NAVBAR */}
      {/* NAVBAR */}
      <nav className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-xl border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {/* Mobil Hamburger Menü Butonu */}
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="md:hidden mr-3 p-2 rounded-xl text-blue-100 hover:bg-white/10 transition-colors"
                aria-label="Menüyü Aç"
              >
                {isMobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Logo Alanı */}
              <Link href="/" className="flex items-center group">
                <div className="transition-transform duration-300 group-hover:scale-105">
                  <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
                </div>
                <div className="ml-3 flex flex-col">
                  <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 group-hover:to-white transition-all">İSG Pratik</span>
                  <span className="text-[10px] text-blue-300/80 font-medium tracking-widest uppercase">Risk Yönetim Sistemi</span>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-4">
              <div className="hidden md:flex items-center space-x-1.5">
                {/* Panel Dashboard */}
                <Link href="/panel" className="px-3 py-2 rounded-xl text-sm font-semibold text-white hover:bg-white/20 transition-all border border-white/10 bg-white/5 flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                {/* Firmalarım */}
                <Link href="/panel/firmalar" className="px-3 py-2 rounded-xl text-sm font-semibold text-white hover:bg-white/20 transition-all border border-white/10 bg-white/5 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>Firmalarım</span>
                </Link>
                {/* Risklerim */}
                <Link href="/panel/risk-maddelerim" className="px-3 py-2 rounded-xl text-sm font-semibold text-white hover:bg-white/20 transition-all border border-white/10 bg-white/5 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Risklerim</span>
                </Link>
                {/* Risk Değerlendirmesi - Aktif */}
                <Link href="/risk-degerlendirme" className="px-3 py-2 rounded-xl bg-indigo-600/80 text-sm font-semibold text-white border border-indigo-500 shadow-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Risk Değerlendirmesi</span>
                </Link>
                {/* Acil Durum Eylem Planı */}
                <div className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-400 border border-white/10 bg-white/5 flex items-center gap-2 cursor-not-allowed opacity-60"><AlertTriangle className="w-4 h-4" /><span>Acil Durum Planı</span><span className="text-[9px] px-1.5 py-0.5 bg-white/10 rounded-full font-bold">YAKINDA</span></div>
              </div>

              {session ? (
                <div className="flex items-center space-x-3 pl-4 md:border-l md:border-white/10">
                  <Link
                    href="/panel"
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                  >
                    Panel
                  </Link>
                  <div className="hidden sm:flex flex-col items-end mr-2">
                    <span className="text-xs font-bold text-blue-100">
                      {session.user?.name || session.user?.email}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: 'https://www.isgpratik.com/' })}
                    className="bg-white/10 hover:bg-red-500/20 text-blue-200 hover:text-red-200 p-2 rounded-xl transition-all border border-white/10 hover:border-red-400/30 shadow-sm group"
                    title="Çıkış Yap"
                  >
                    <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    className="text-sm font-medium text-blue-100 hover:text-white transition-colors"
                  >
                    Giriş
                  </Link>
                  <Link
                    href="/register"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
                  >
                    Kayıt Ol
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)] bg-slate-100">

        {/* Mobil Sidebar Overlay Arka Plan */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* --- SOL MENÜ --- */}
        <aside className={`
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          fixed md:relative
          top-16 md:top-0
          left-0
          h-[calc(100vh-64px)] md:h-auto md:min-h-[calc(100vh-64px)]
          w-72 md:w-72
          bg-indigo-50/30 shadow-xl md:shadow-none flex flex-col 
          border-r border-slate-200 overflow-y-auto md:overflow-visible
          transition-transform duration-300 ease-in-out
          z-50 md:z-auto
        `}>

          {/* SEKTÖR SEÇ BÖLÜMÜ */}
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-xs font-bold text-indigo-600 uppercase flex items-center mb-3 tracking-wider">
              <Zap className="w-4 h-4 mr-2" />
              Yapay Zeka Risk Analiz (Beta)
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Sektör yazın (örn: İnşaat)"
                className="w-full pl-4 pr-16 py-3 text-sm border-0 bg-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-700 placeholder:text-slate-400 font-medium transition-all"
                value={sectorSearch}
                onChange={(e) => {
                  setSectorSearch(e.target.value);
                  setShowSectorSuggestions(e.target.value.length >= 3);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSectorAnalysis()}
                onFocus={() => setShowSectorSuggestions(sectorSearch.length >= 3)}
                onBlur={() => setTimeout(() => setShowSectorSuggestions(false), 200)}
                disabled={sectorLoading}
              />
              <button
                onClick={handleSectorAnalysis}
                disabled={sectorLoading || !sectorSearch.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-200"
              >
                {sectorLoading ? '...' : 'Ekle'}
              </button>

              {/* Sektör Önerileri Dropdown */}
              {showSectorSuggestions && sectorSearch.length >= 3 && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 max-h-48 overflow-y-auto overflow-hidden">
                  {sectorSuggestions
                    .filter(s => s.toLowerCase().includes(sectorSearch.toLowerCase()))
                    .slice(0, 8)
                    .map((suggestion, idx) => (
                      <button
                        key={idx}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors border-b border-slate-50 last:border-0"
                        onClick={() => {
                          setSectorSearch(suggestion);
                          setShowSectorSuggestions(false);
                        }}
                      >
                        {suggestion}
                      </button>
                    ))
                  }
                  {sectorSuggestions.filter(s => s.toLowerCase().includes(sectorSearch.toLowerCase())).length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-400 italic">Öneri bulunamadı</div>
                  )}
                </div>
              )}
            </div>

            {/* Risk Ciddiyet Filtresi */}
            <div className="flex items-center gap-3 mt-4">
              <span className="text-[10px] uppercase font-bold text-slate-400">Filtrele:</span>
              <div className="flex bg-slate-100 rounded-lg p-1 w-full">
                <button
                  onClick={() => setSeverityFilter(0)}
                  className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${severityFilter === 0
                    ? 'bg-white text-slate-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Tümü
                </button>
                <button
                  onClick={() => setSeverityFilter(1)}
                  className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${severityFilter === 1
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-slate-500 hover:text-orange-600'
                    }`}
                >
                  Orta+
                </button>
                <button
                  onClick={() => setSeverityFilter(2)}
                  className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${severityFilter === 2
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-slate-500 hover:text-red-600'
                    }`}
                >
                  Yüksek
                </button>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 mt-3 font-medium flex items-start">
              <span className="mr-1.5 mt-0.5">•</span>
              Seçilen sektöre uygun riskler otomatik listelenir.
            </p>
          </div>


          {/* RİSK SINIFLARI BÖLÜMÜ */}
          <div className="px-5 py-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase flex items-center mb-3 tracking-wider">
              <BookOpen className="w-4 h-4 mr-2" />
              Risk Kütüphanesi
            </h2>
            <div className="relative group">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Risk ara..."
                className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4">
            {filteredCategories.map((cat: any, index: any) => (
              <li key={index} className="mb-0.5">
                <div className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all group cursor-pointer border border-transparent ${risks.some((r: any) => r.categoryCode === cat.code)
                  ? 'bg-green-50 border-green-200'
                  : selectedCategory?.category === cat.category
                    ? 'bg-indigo-50 border-indigo-100'
                    : 'hover:bg-slate-50 hover:border-slate-200'
                  }`}>
                  <button
                    onClick={() => setSelectedCategory(cat)}
                    className="flex-1 text-left flex items-center"
                  >
                    <span className={`inline-flex items-center justify-center w-6 h-6 text-[10px] font-bold rounded-md mr-2 ${risks.some((r: any) => r.categoryCode === cat.code) ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{cat.code}</span>
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold uppercase line-clamp-1 ${risks.some((r: any) => r.categoryCode === cat.code) ? 'text-green-800' : 'text-slate-700'}`}>{cat.category}</span>
                      <span className="text-[9px] text-slate-400 font-medium">{cat.items.length} Risk Maddesi</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-0.5">
                    {/* - Butonu: Kategoride ekli risk varsa göster */}
                    {risks.some((r: any) => r.categoryCode === cat.code) && (
                      <button
                        onClick={(e) => handleRemoveAllFromCategory(e, cat)}
                        title="Tümünü Çıkar"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all"
                      >
                        <MinusCircle className="w-4 h-4" />
                      </button>
                    )}
                    {/* + Butonu: Kategoride eklenecek madde varsa göster */}
                    {cat.items.some((item: any) => !risks.some((r: any) => r.hazard === item.hazard && r.risk === item.risk)) && (
                      <button
                        onClick={(e) => handleAddAllFromCategory(e, cat)}
                        title="Tümünü Ekle"
                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-100 rounded-lg transition-all"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* --- 1. FİRMA VE RAPOR BİLGİLERİ --- */}
            <div className="bg-white shadow-sm shadow-slate-200/50 rounded-xl border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 px-6 py-4 flex items-center justify-between rounded-t-xl">
                <div className="flex items-center">
                  <div className="bg-white/10 p-2 rounded-lg mr-3">
                    <Briefcase className="w-5 h-5 text-blue-200" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">1. Firma & Rapor Bilgileri</h3>
                    <p className="text-xs text-blue-200 mt-0.5">Kayıtlı firmalarınızdan birini seçin ve rapor tarihini girin</p>
                  </div>
                </div>
                {session && (
                  <Link
                    href="/panel/firmalar?new=true"
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-bold hover:bg-white/20 transition-colors border border-white/20"
                  >
                    <Plus className="w-4 h-4" />
                    Yeni Firma Ekle
                  </Link>
                )}
              </div>

              {!session ? (
                <div className="text-center py-8 mx-6 my-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Lock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-4">Firma seçimi için giriş yapmanız gerekiyor</p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Giriş Yap
                  </Link>
                </div>
              ) : companies.length === 0 ? (
                <div className="text-center py-8 mx-6 my-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-4">Henüz kayıtlı firmanız yok</p>
                  <Link
                    href="/panel/firmalar?new=true"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    İlk Firmayı Ekle
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                  {/* Sol: Firma Seçimi */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Firma Seçin *</label>
                      <select
                        value={selectedCompanyId}
                        onChange={(e) => handleCompanySelect(e.target.value)}
                        className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all focus:bg-white"
                      >
                        <option value="">-- Firma Seçin --</option>
                        {companies.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.title} ({DANGER_CLASS_LABELS[c.danger_class]})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedCompany && (
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                        <div className="flex items-center gap-3 mb-3">
                          {selectedCompany.logo ? (
                            <img src={selectedCompany.logo} alt="" className="w-12 h-12 rounded-lg object-contain border border-slate-200" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                              {selectedCompany.title.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-800">{selectedCompany.title}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${selectedCompany.danger_class === 'az_tehlikeli'
                              ? 'bg-emerald-100 text-emerald-700'
                              : selectedCompany.danger_class === 'tehlikeli'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                              }`}>
                              {DANGER_CLASS_LABELS[selectedCompany.danger_class]}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500">{selectedCompany.address || 'Adres girilmemiş'}</p>
                        {selectedCompany.registration_number && (
                          <p className="text-xs text-slate-500">Sicil No: {selectedCompany.registration_number}</p>
                        )}
                      </div>
                    )}

                    {/* Risk Değerlendirme Ekibi (Salt Okunur) */}
                    {selectedCompany && (
                      <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100">
                        <h4 className="text-xs font-bold text-indigo-900 border-b border-indigo-100 pb-2 mb-3 flex items-center">
                          <User className="w-3 h-3 mr-2" />
                          Risk Değerlendirme Ekibi
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">İşveren:</span>
                            <span className="ml-1 font-medium text-slate-700">{selectedCompany.employer || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">İGU:</span>
                            <span className="ml-1 font-medium text-slate-700">{selectedCompany.igu || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Hekim:</span>
                            <span className="ml-1 font-medium text-slate-700">{selectedCompany.doctor || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Temsilci:</span>
                            <span className="ml-1 font-medium text-slate-700">{selectedCompany.representative || '-'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sağ: Rapor Bilgileri */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Rapor Tarihi *</label>
                      <input
                        type="date"
                        className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all focus:bg-white"
                        value={headerInfo.date}
                        onChange={(e) => handleReportDateChange(e.target.value)}
                      />
                      {headerInfo.date && (
                        <p className="text-xs text-slate-500 mt-1">Seçilen tarih: <span className="font-medium text-slate-700">{formatDate(headerInfo.date)}</span></p>
                      )}
                    </div>

                    {/* Geçerlilik Tarihi (Otomatik) */}
                    {selectedCompany && headerInfo.date && (
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-emerald-800 uppercase">Geçerlilik Tarihi</p>
                            <p className="text-lg font-bold text-emerald-700 mt-1">
                              {headerInfo.validityDate ? formatDate(headerInfo.validityDate) : '-'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-emerald-600">
                              {DANGER_CLASS_LABELS[selectedCompany.danger_class]} = +{VALIDITY_YEARS[selectedCompany.danger_class]} yıl
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Revizyon Opsiyonel */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowRevision(!showRevision)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <span className="text-sm font-medium text-slate-700">Revizyon eklemek ister misiniz?</span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showRevision ? 'rotate-180' : ''}`} />
                      </button>
                      {showRevision && (
                        <div className="p-4 border-t border-slate-200">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Revizyon No / Tarih</label>
                          <input
                            type="text"
                            className="w-full border border-slate-200 bg-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            value={headerInfo.revision}
                            onChange={(e) => setHeaderInfo({ ...headerInfo, revision: e.target.value })}
                            placeholder="Örn: 01 / 15.01.2025"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* --- 2. KATEGORİ DETAYLARI --- */}
            {selectedCategory && (
              <div className="bg-white border border-indigo-100 rounded-xl p-6 shadow-lg shadow-indigo-100/50 animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 z-0 opacity-50"></div>
                <div className="relative z-10 flex justify-between items-center mb-6 border-b border-indigo-50 pb-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <BookOpen className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        {selectedCategory.category}
                        <span className="text-sm bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 font-mono">{selectedCategory.code}</span>
                      </h3>
                      <p className="text-sm text-slate-500">Kütüphaneden seçim yapın veya tümünü bir kerede ekleyin.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e: any) => handleAddAllFromCategory(e, selectedCategory)}
                      className="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg shadow-sm shadow-emerald-200 transition-all font-bold group"
                    >
                      <PlusCircle className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                      Tümünü Ekle
                    </button>
                    <button onClick={() => setSelectedCategory(null)} className="p-2 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                  </div>
                </div>

                {selectedCategory.items.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                    <p className="text-slate-400 italic">Bu kategori için henüz hazır veri girişi yapılmamış.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedCategory.items.map((item: any, idx: any) => (
                      <div key={idx} onClick={() => handleSelectPreset(item, selectedCategory.code)} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100/50 cursor-pointer transition-all group relative">
                        <button
                          onClick={(e: any) => handleQuickAdd(e, item, selectedCategory.code)}
                          className="absolute top-3 right-3 p-1.5 bg-slate-50 border border-slate-200 rounded-full text-emerald-600 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white shadow-sm transition-all z-10 opacity-0 group-hover:opacity-100"
                          title="Direkt Ekle"
                        >
                          <Plus className="w-4 h-4" />
                        </button>

                        <div className="flex justify-between pr-8 mb-2">
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">{item.source}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 line-clamp-2 mb-1 group-hover:text-indigo-700 transition-colors">
                          <span className="text-slate-400 mr-2 font-mono text-xs font-normal">{selectedCategory.code}.{(idx + 1).toString().padStart(2, '0')}</span>
                          {item.hazard}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-2 border-l-2 border-slate-200 pl-2 ml-1">{item.risk}</p>
                        <div className="mt-3 pt-2 border-t border-slate-50 flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-mono">Skor</span>
                          <span className="text-xs font-bold text-white bg-slate-400 px-2 py-0.5 rounded-full">{item.p * item.f * item.s}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --- 3. DÜZENLEME FORMU --- */}
            <div id="risk-form" className="bg-white shadow-lg shadow-slate-200/50 rounded-xl border border-slate-200 overflow-hidden mb-8 transition-all duration-300">
              <div
                className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 px-6 py-4 flex items-center justify-between cursor-pointer hover:from-slate-800 hover:via-blue-800 hover:to-slate-800 transition-colors"
                onClick={() => setIsFormCollapsed(!isFormCollapsed)}
              >
                <div className="flex items-center">
                  <div className="bg-white/10 p-1.5 rounded-lg mr-3">
                    <Plus className="w-5 h-5 text-blue-200" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">2. Risk Giriş Paneli</h3>
                    <p className="text-xs text-blue-200">Manuel risk ekleme veya düzenleme</p>
                  </div>
                </div>
                <div className="bg-white/10 p-1 rounded-full border border-white/20 text-blue-200">
                  {isFormCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                </div>
              </div>

              {/* Risklerim - Hızlı Ekleme Bölümü */}
              {session && (
                <div className="px-6 py-4 border-b border-slate-200 bg-amber-50/50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-amber-600" />
                      <span className="font-bold text-slate-700 text-sm">Risklerim</span>
                    </div>
                    <select
                      className="flex-1 border border-amber-200 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                      id="userRiskSelect"
                      defaultValue=""
                      onChange={() => {
                        if (userRisks.length === 0) fetchUserRisks();
                      }}
                      onFocus={() => {
                        if (userRisks.length === 0) fetchUserRisks();
                      }}
                    >
                      <option value="">Ekleyeceğiniz riski seçin...</option>
                      {userRisks.map((r: any) => (
                        <option key={r.id} value={r.id}>
                          {r.risk_no} - {r.hazard?.substring(0, 35)}{r.hazard?.length > 35 ? '...' : ''} | {r.risk?.substring(0, 25)}{r.risk?.length > 25 ? '...' : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const select = document.getElementById('userRiskSelect') as HTMLSelectElement;
                        const selectedId = select?.value;
                        if (selectedId) {
                          const risk = userRisks.find((r: any) => r.id === selectedId);
                          if (risk) {
                            handleAddUserRisk(risk);
                            select.value = '';
                          }
                        } else {
                          showNotification("Lütfen bir risk seçin.", "error");
                        }
                      }}
                      className="px-4 py-2 bg-amber-500 text-white font-bold text-sm rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Tabloya Ekle
                    </button>
                    <Link
                      href="/panel/risk-maddelerim"
                      className="text-xs text-amber-700 hover:text-amber-900 hover:underline"
                    >
                      Düzenle
                    </Link>
                  </div>
                  {userRisks.length === 0 && (
                    <p className="text-xs text-amber-600 mt-2">
                      Henüz risk eklemediniz. <Link href="/panel/risk-maddelerim" className="underline font-medium">Risk Maddelerim</Link> sayfasından ekleyebilirsiniz.
                    </p>
                  )}
                </div>
              )}

              <div className={`transition-all duration-300 ease-in-out bg-white ${isFormCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
                <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Sol Kısım */}
                  <div className="lg:col-span-7 space-y-5">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Risk No</label>
                        <input type="text" className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" value={form.riskNo || ''} onChange={(e: any) => setForm({ ...form, riskNo: e.target.value })} placeholder="Otomatik" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Bölüm</label>
                        <input type="text" className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" value={form.sub_category} onChange={(e: any) => setForm({ ...form, sub_category: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Ortam</label>
                        <input type="text" className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" value={form.source} onChange={(e: any) => setForm({ ...form, source: e.target.value })} />
                      </div>
                    </div>

                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors group">
                      {form.image ? (
                        <div className="flex items-center w-full">
                          <img src={form.image} alt="Risk Fotoğrafı" className="h-16 w-16 object-cover rounded-lg mr-4 border border-slate-200 shadow-sm" />
                          <div className="flex-1">
                            <span className="text-emerald-600 font-bold block flex items-center mb-1"><CheckCircle className="w-4 h-4 mr-1" /> Fotoğraf Eklendi</span>
                            <span className="text-slate-400 text-xs">Risk analiz tablosuna eklenecek</span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => { setActiveRowIdForImage(null); fileInputRef.current.click(); }}
                              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:border-blue-500 hover:text-blue-600 shadow-sm transition-all"
                            >
                              Değiştir
                            </button>
                            <button
                              onClick={() => { setForm({ ...form, image: null }); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                              className="p-2 bg-white border border-slate-200 text-red-500 rounded-lg hover:bg-red-50 hover:border-red-200 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => { setActiveRowIdForImage(null); fileInputRef.current.click(); }}
                          className="flex flex-col items-center justify-center w-full cursor-pointer py-4 text-slate-400 group-hover:text-blue-600 transition-colors"
                        >
                          <div className="p-3 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                          <span className="text-sm font-medium">Fotoğraf Yüklemek İçin Tıklayın</span>
                          <span className="text-xs opacity-60 mt-1">İsterseniz sürükleyip bırakın (Max 1MB)</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Tehlike</label>
                      <input type="text" className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" value={form.hazard} onChange={(e: any) => setForm({ ...form, hazard: e.target.value })} placeholder="Tehlike kaynağını tanımlayın..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Risk</label>
                        <textarea rows={3} className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 text-sm resize-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" value={form.risk} onChange={(e: any) => setForm({ ...form, risk: e.target.value })} placeholder="Olası riskleri açıklayın..." />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Etkilenenler</label>
                        <textarea rows={3} className="w-full border border-slate-200 bg-slate-100 text-slate-500 rounded-lg p-3 text-sm resize-none cursor-not-allowed font-medium" value={form.affected} readOnly />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Sorumlu Kişi / Bölüm</label>
                      <input type="text" className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" value={form.responsible} onChange={(e: any) => setForm({ ...form, responsible: e.target.value })} placeholder="Örn: İdari İşler, İşveren Vekili" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Alınacak Önlemler</label>
                      <textarea rows={4} className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" value={form.measures} onChange={(e: any) => setForm({ ...form, measures: e.target.value })} placeholder="Mevcut ve alınması gereken önlemleri sıralayın..." />
                    </div>
                  </div>

                  {/* Sağ Kısım: Puanlama */}
                  <div className="lg:col-span-5 grid grid-cols-2 gap-4 content-start">
                    {/* 1. Aşama */}
                    <div className="bg-red-50/50 p-5 rounded-xl border border-red-100 shadow-sm">
                      <h4 className="text-sm font-black text-red-900 mb-4 text-center border-b border-red-200 pb-2 uppercase tracking-wide">1. Mevcut Durum</h4>
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold text-red-800 uppercase">Olasılık</span>
                            <span className="font-mono text-sm font-bold bg-white px-2 py-0.5 rounded border border-red-100 text-red-600">{form.probability}</span>
                          </div>
                          <input type="range" min={0.2} max={10} step={0.1} value={form.probability} onChange={(e: any) => setForm({ ...form, probability: e.target.value as any })} className="w-full h-1.5 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-600" />
                          <div className="flex justify-between text-[9px] text-red-300 mt-1"><span>Düşük</span><span>Yüksek</span></div>
                        </div>
                        <div>
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold text-red-800 uppercase">Frekans</span>
                            <span className="font-mono text-sm font-bold bg-white px-2 py-0.5 rounded border border-red-100 text-red-600">{form.frequency}</span>
                          </div>
                          <input type="range" min={0.5} max={10} step={0.5} value={form.frequency} onChange={(e: any) => setForm({ ...form, frequency: e.target.value as any })} className="w-full h-1.5 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-600" />
                        </div>
                        <div>
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold text-red-800 uppercase">Şiddet</span>
                            <span className="font-mono text-sm font-bold bg-white px-2 py-0.5 rounded border border-red-100 text-red-600">{form.severity}</span>
                          </div>
                          <input type="range" min={1} max={100} step={1} value={form.severity} onChange={(e: any) => setForm({ ...form, severity: e.target.value as any })} className="w-full h-1.5 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-600" />
                        </div>

                        <div className="mt-6 pt-4 border-t border-red-200/60 text-center">
                          <span className="text-[10px] uppercase font-bold text-red-400 tracking-widest block mb-1">RİSK SKORU</span>
                          <div className="text-4xl font-black text-red-600 tracking-tight leading-none">
                            {(form.probability * form.frequency * form.severity).toFixed(0)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Aşama */}
                    <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 shadow-sm">
                      <h4 className="text-sm font-black text-emerald-900 mb-4 text-center border-b border-emerald-200 pb-2 uppercase tracking-wide">2. Önlem Sonrası</h4>
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold text-emerald-800 uppercase">Olasılık</span>
                            <span className="font-mono text-sm font-bold bg-white px-2 py-0.5 rounded border border-emerald-100 text-emerald-600">{form.probability2}</span>
                          </div>
                          <input type="range" min={0.2} max={10} step={0.1} value={form.probability2} onChange={(e: any) => setForm({ ...form, probability2: e.target.value as any })} className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                        </div>
                        <div>
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold text-emerald-800 uppercase">Frekans</span>
                            <span className="font-mono text-sm font-bold bg-white px-2 py-0.5 rounded border border-emerald-100 text-emerald-600">{form.frequency2}</span>
                          </div>
                          <input type="range" min={0.5} max={10} step={0.5} value={form.frequency2} onChange={(e: any) => setForm({ ...form, frequency2: e.target.value as any })} className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                        </div>
                        <div>
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold text-emerald-800 uppercase">Şiddet</span>
                            <span className="font-mono text-sm font-bold bg-white px-2 py-0.5 rounded border border-emerald-100 text-emerald-600">{form.severity2}</span>
                          </div>
                          <input type="range" min={1} max={100} step={1} value={form.severity2} onChange={(e: any) => setForm({ ...form, severity2: e.target.value as any })} className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                        </div>

                        <div className="mt-6 pt-4 border-t border-emerald-200/60 text-center">
                          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest block mb-1">HEDEF SKOR</span>
                          <div className="text-4xl font-black text-emerald-600 tracking-tight leading-none">
                            {(form.probability2 * form.frequency2 * form.severity2).toFixed(0)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 mt-2">
                      <button onClick={handleAddRisk} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <Save className="w-5 h-5 mr-2" />
                        Listeye Ekle
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* --- ACTION BAR --- */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 p-4 rounded-t-xl md:rounded-xl shadow-sm gap-4">
              <div className="flex items-center" ref={tableTopRef}>
                <div className="bg-white/10 p-2 rounded-lg mr-3">
                  <FileText className="w-6 h-6 text-blue-200" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">3. Risk Analiz Tablosu</h2>
                  <p className="text-xs text-blue-200">Hazırlanan raporun önizlemesi</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleDeleteAll}
                  className="inline-flex items-center px-4 py-2 border border-red-400/50 shadow-sm text-sm font-medium rounded-lg bg-red-500/20 text-red-200 hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Tümünü Sil
                </button>
                <label className="inline-flex items-center cursor-pointer px-4 py-2 border border-white/20 rounded-lg bg-white/10 hover:bg-white/20 select-none transition-colors">
                  <input
                    type="checkbox"
                    checked={includeProcedure}
                    onChange={(e) => setIncludeProcedure(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="ml-2 text-sm font-bold text-white">Prosedür Ekle</span>
                </label>
                <button
                  onClick={generatePDF}
                  className="inline-flex items-center px-5 py-2 border border-emerald-400/50 shadow-lg shadow-emerald-500/20 text-sm font-bold rounded-lg text-white bg-emerald-500 hover:bg-emerald-600 transition-all hover:scale-105"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF İndir
                </button>
              </div>
            </div>

            {/* --- BİRLEŞİK TABLO (BAŞLIK + RİSK LİSTESİ) --- */}
            {/* --- BİRLEŞİK TABLO (BAŞLIK + RİSK LİSTESİ) --- */}
            <div className="bg-white border md:rounded-b-xl border-slate-300 shadow-2xl overflow-hidden mb-10">

              {/* 1. BAŞLIK TABLOSU (HEADER - FINAL DÜZEN) */}
              <div className="border-b border-slate-400 bg-white">
                <div className="flex border-b border-gray-400 text-[9px]">

                  {/* SOL BLOK: DEĞERLENDİRME & YÖNTEM */}
                  <div className="w-4 bg-slate-100 border-r border-gray-400 flex items-center justify-center p-1 font-bold rotate-180 [writing-mode:vertical-rl] text-slate-700 tracking-wider">
                    RİSK DEĞERLENDİRMESİ
                  </div>
                  <div className="w-48 border-r border-gray-400 flex flex-col">
                    <div className="flex-1 border-b border-gray-400 flex items-stretch">
                      <div className="w-20 bg-slate-50 font-bold p-1 flex items-center border-r border-gray-300 text-slate-600">YÖNTEM</div>
                      <div className="p-1 flex items-center flex-1 font-bold text-indigo-900 bg-indigo-50/30">FINE KINNEY</div>
                    </div>
                    <div className="flex-1 flex items-stretch">
                      <div className="w-20 bg-slate-50 font-bold p-1 flex items-center border-r border-gray-300 text-slate-600">HAZIRLAYAN</div>
                      <div className="p-1 flex items-center flex-1 font-semibold">İSG RİSK EKİBİ</div>
                    </div>
                  </div>

                  {/* ORTA BLOK: LOGO + FİRMA BİLGİLERİ */}
                  <div className="flex-1 border-r border-gray-400 flex">
                    <div className="w-24 border-r border-gray-400 flex items-center justify-center p-1 bg-white relative group">
                      {headerInfo.logo ? (
                        <>
                          <img src={headerInfo.logo} className="max-h-12 max-w-full object-contain" />
                          <button onClick={deleteLogo} className="absolute top-0 right-0 p-0.5 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100" title="Logoyu Sil"><X className="w-3 h-3" /></button>
                        </>
                      ) : (
                        <div className="text-[7px] text-slate-300 text-center leading-tight w-full h-full flex items-center justify-center bg-slate-50/50">Logo Yok</div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="bg-slate-100 text-center border-b border-gray-400 py-0.5 font-bold text-slate-700 text-[8px] tracking-wider">
                        ANALİZ YAPILAN İŞYERİNİN
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="flex border-b border-gray-300 min-h-[30px]">
                          <div className="w-14 bg-slate-50 font-bold p-1 border-r border-gray-300 flex items-center text-slate-600">UNVANI</div>
                          <div className="p-1 flex-1 font-bold uppercase flex items-center text-slate-800">{headerInfo.title}</div>
                        </div>
                        <div className="flex border-b border-gray-300 flex-1">
                          <div className="w-14 bg-slate-50 font-bold p-1 border-r border-gray-300 flex items-center text-slate-600">ADRESİ</div>
                          <div className="p-1 flex-1 uppercase flex items-center text-slate-700 leading-tight">{headerInfo.address}</div>
                        </div>
                        <div className="flex h-5">
                          <div className="w-14 bg-slate-50 font-bold p-1 border-r border-gray-300 flex items-center text-slate-600">SİCİL NO</div>
                          <div className="p-1 flex-1 font-mono flex items-center text-slate-700 tracking-wider">{headerInfo.registrationNumber}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SAĞ BLOK: TARİHLER & EKİP */}
                  <div className="w-[480px] flex text-[8px]">
                    <div className="w-[240px] border-r border-gray-400">
                      <div className="flex flex-col h-full">
                        <div className="flex-1 border-b border-gray-300 flex items-center justify-between p-2">
                          <span className="font-bold bg-slate-50 text-slate-600 mr-2">YAPILDIĞI TARİH:</span>
                          <span className="font-black text-[11px] text-slate-900">{formatDate(headerInfo.date)}</span>
                        </div>
                        <div className="flex-1 border-b border-gray-300 flex items-center justify-between p-2">
                          <span className="font-bold bg-slate-50 text-slate-600 mr-2">GEÇERLİLİK:</span>
                          <span className="font-black text-[11px] text-slate-900">{formatDate(headerInfo.validityDate)}</span>
                        </div>
                        <div className="flex-1 flex items-center justify-between p-2">
                          <span className="font-bold bg-slate-50 text-slate-600 mr-2">REVİZYON:</span>
                          <span className="font-black text-[11px] text-slate-900">{headerInfo.revision}</span>
                        </div>
                      </div>
                    </div>
                    {/* Ekip Üyeleri Grid */}
                    <div className="flex-1 text-[7px] flex flex-col h-full bg-white">
                      <div className="bg-slate-100 text-center border-b border-gray-300 py-0.5 font-bold text-slate-700 text-[8px] tracking-wider">
                        RİSK DEĞERLENDİRME EKİBİ
                      </div>
                      <div className="flex items-center border-b border-gray-300 px-1 py-1 flex-1">
                        <span className="font-bold w-16 text-slate-500">İŞVEREN:</span>
                        <span className="uppercase truncate flex-1 font-semibold text-slate-800">{headerInfo.employer}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-300 px-1 py-1 flex-1">
                        <span className="font-bold w-16 text-slate-500">İSG UZMANI:</span>
                        <span className="uppercase truncate flex-1 font-semibold text-slate-800">{headerInfo.igu}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-300 px-1 py-1 flex-1">
                        <span className="font-bold w-16 text-slate-500">HEKİM:</span>
                        <span className="uppercase truncate flex-1 font-semibold text-slate-800">{headerInfo.doctor}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-300 px-1 py-1 flex-1">
                        <span className="font-bold w-16 text-slate-500">TEMSİLCİ:</span>
                        <span className="uppercase truncate flex-1 font-semibold text-slate-800">{headerInfo.representative}</span>
                      </div>
                      <div className="flex items-center px-1 py-1 flex-1">
                        <span className="font-bold w-16 text-slate-500">DESTEK EL.:</span>
                        <span className="uppercase truncate flex-1 font-semibold text-slate-800">{headerInfo.support}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. RİSK TABLOSU (TEK PARÇA) */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b-2 border-slate-200">
                    <tr>
                      <th rowSpan={2} className="px-2 py-3 border border-slate-200 w-8 text-center text-[10px] uppercase tracking-wider">No</th>
                      <th rowSpan={2} className="px-2 py-3 border border-slate-200 w-24 text-left text-[10px] uppercase tracking-wider">Bölüm / Ortam</th>
                      <th rowSpan={2} className="px-2 py-3 border border-slate-200 w-20 text-center text-[10px] uppercase tracking-wider">Foto</th>
                      <th rowSpan={2} className="px-2 py-3 border border-slate-200 text-left text-[10px] uppercase tracking-wider">Tehlike</th>
                      <th rowSpan={2} className="px-2 py-3 border border-slate-200 text-left text-[10px] uppercase tracking-wider">Risk</th>
                      <th rowSpan={2} className="px-1 py-3 border border-slate-200 w-6 align-middle text-center uppercase font-bold text-[9px] [writing-mode:vertical-rl] rotate-180 text-slate-500 tracking-widest">Etkilenen</th>
                      <th colSpan={5} className="px-2 py-1.5 border border-red-200 text-center bg-red-50 text-red-700 text-[10px] uppercase tracking-wider">1. Aşama (Mevcut Durum)</th>
                      <th rowSpan={2} className="px-2 py-3 border border-slate-200 text-left w-48 bg-yellow-50/50 text-yellow-800 text-[10px] uppercase tracking-wider">Kontrol Tedbirleri (Önlemler)</th>
                      <th colSpan={5} className="px-2 py-1.5 border border-emerald-200 text-center bg-emerald-50 text-emerald-700 text-[10px] uppercase tracking-wider">2. Aşama (Tedbir Sonrası)</th>
                      <th rowSpan={2} className="px-1 py-3 border border-slate-200 w-6 align-middle text-center uppercase font-bold text-[9px] [writing-mode:vertical-rl] rotate-180 text-slate-500 tracking-widest">Sorumlu</th>
                      <th rowSpan={2} className="px-2 py-3 border border-slate-200 w-8"></th>
                    </tr>
                    <tr>
                      <th className="px-1 py-1 border border-red-200 w-12 text-center bg-red-100/50 text-red-800 text-[9px]">O</th>
                      <th className="px-1 py-1 border border-red-200 w-12 text-center bg-red-100/50 text-red-800 text-[9px]">F</th>
                      <th className="px-1 py-1 border border-red-200 w-14 text-center bg-red-100/50 text-red-800 text-[9px]">Ş</th>
                      <th className="px-1 py-1 border border-red-200 w-10 text-center bg-red-100 text-red-900 font-bold text-[9px]">Skor</th>
                      <th className="px-1 py-1 border border-red-200 w-16 text-center bg-red-100 text-red-900 font-bold text-[9px]">Sınıf</th>

                      <th className="px-1 py-1 border border-emerald-200 w-12 text-center bg-emerald-100/50 text-emerald-800 text-[9px]">O</th>
                      <th className="px-1 py-1 border border-emerald-200 w-12 text-center bg-emerald-100/50 text-emerald-800 text-[9px]">F</th>
                      <th className="px-1 py-1 border border-emerald-200 w-14 text-center bg-emerald-100/50 text-emerald-800 text-[9px]">Ş</th>
                      <th className="px-1 py-1 border border-emerald-200 w-10 text-center bg-emerald-100 text-emerald-900 font-bold text-[9px]">Skor</th>
                      <th className="px-1 py-1 border border-emerald-200 w-16 text-center bg-emerald-100 text-emerald-900 font-bold text-[9px]">Sınıf</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {risks.map((r, idx) => (
                      <tr key={`${r.id}-${idx}`} className="hover:bg-indigo-50/10 transition-colors">
                        <td className="px-2 py-3 border border-slate-200 font-mono font-bold text-slate-600 text-center text-xs">{r.riskNo}</td>
                        <td className="px-2 py-3 border border-slate-200 align-top">
                          <div className="font-bold text-slate-800 text-xs mb-0.5">{r.sub_category}</div>
                          <div className="text-slate-500 text-[9px] uppercase tracking-wide">{r.source}</div>
                        </td>

                        {/* FOTOĞRAF */}
                        <td className="px-1 py-1 border border-slate-200 align-top text-center">
                          <div className="flex justify-center items-center h-full w-full">
                            {r.image ? (
                              <div className="relative group">
                                <img src={r.image} alt="Risk" className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-sm mx-auto" />
                                <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center rounded-lg transition-opacity">
                                  <button onClick={() => triggerTableImageUpload(r.id)} className="text-[10px] text-white hover:text-blue-300 mb-1 flex items-center font-bold"><RefreshCw className="w-3 h-3 mr-1" /> Değiş</button>
                                  <button onClick={() => deleteImageFromRow(r.id)} className="text-[10px] text-white hover:text-red-300 flex items-center font-bold"><Trash2 className="w-3 h-3 mr-1" /> Sil</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => triggerTableImageUpload(r.id)} className="w-12 h-12 bg-slate-50 rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-blue-500 transition-colors mx-auto group">
                                <Upload className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform" />
                                <span className="text-[8px] font-bold">Resim</span>
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-2 py-3 border border-slate-200 align-top font-medium text-slate-700 text-xs">{r.hazard}</td>
                        <td className="px-2 py-3 border border-slate-200 align-top text-red-700 font-medium text-xs">{r.risk}</td>

                        <td className="px-1 py-2 border border-slate-200 align-middle text-center uppercase font-bold text-[9px] [writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-slate-500 bg-slate-50">
                          {r.affected}
                        </td>

                        {/* 1. AŞAMA SKORLAMA */}
                        <td className="px-1 py-1 border border-red-100 text-center p-0 bg-red-50/30">
                          <select
                            className="w-full h-full text-center bg-transparent outline-none text-xs font-mono font-bold cursor-pointer text-red-800"
                            value={r.probability}
                            onChange={(e) => {
                              updateRiskValue(r.id, 'probability', e.target.value);
                              handleRiskBlur(r.id, 'probability', e.target.value);
                            }}
                          >
                            {P_VALUES.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
                          </select>
                        </td>
                        <td className="px-1 py-1 border border-red-100 text-center p-0 bg-red-50/30">
                          <select
                            className="w-full h-full text-center bg-transparent outline-none text-xs font-mono font-bold cursor-pointer text-red-800"
                            value={r.frequency}
                            onChange={(e) => {
                              updateRiskValue(r.id, 'frequency', e.target.value);
                              handleRiskBlur(r.id, 'frequency', e.target.value);
                            }}
                          >
                            {F_VALUES.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
                          </select>
                        </td>
                        <td className="px-1 py-1 border border-red-100 text-center p-0 bg-red-50/30">
                          <select
                            className="w-full h-full text-center bg-transparent outline-none text-xs font-mono font-bold cursor-pointer text-red-800"
                            value={r.severity}
                            onChange={(e) => {
                              updateRiskValue(r.id, 'severity', e.target.value);
                              handleRiskBlur(r.id, 'severity', e.target.value);
                            }}
                          >
                            {S_VALUES.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
                          </select>
                        </td>
                        <td className="px-1 py-1 border border-red-100 text-center font-bold bg-red-100 text-red-900 text-xs">{Math.round(r.score)}</td>
                        <td className="px-1 py-1 border border-red-100 text-center p-1 bg-red-50/50">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold block shadow-sm ${r.color} text-white`}>{r.level?.split(' ')[0]}</span>
                        </td>

                        <td className="px-2 py-3 border border-slate-200 align-top text-slate-700 bg-yellow-50/30 text-xs font-medium">{r.measures}</td>

                        {/* 2. AŞAMA SKORLAMA (HEDEF) */}
                        <td className="px-1 py-1 border border-emerald-100 text-center p-0 bg-emerald-50/30">
                          <select
                            className="w-full h-full text-center bg-transparent outline-none text-xs font-mono font-bold cursor-pointer text-emerald-800"
                            value={r.probability2}
                            onChange={(e) => {
                              updateRiskValue(r.id, 'probability2', e.target.value);
                              handleRiskBlur(r.id, 'probability2', e.target.value);
                            }}
                          >
                            {P_VALUES.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
                          </select>
                        </td>
                        <td className="px-1 py-1 border border-emerald-100 text-center p-0 bg-emerald-50/30">
                          <select
                            className="w-full h-full text-center bg-transparent outline-none text-xs font-mono font-bold cursor-pointer text-emerald-800"
                            value={r.frequency2}
                            onChange={(e) => {
                              updateRiskValue(r.id, 'frequency2', e.target.value);
                              handleRiskBlur(r.id, 'frequency2', e.target.value);
                            }}
                          >
                            {F_VALUES.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
                          </select>
                        </td>
                        <td className="px-1 py-1 border border-emerald-100 text-center p-0 bg-emerald-50/30">
                          <select
                            className="w-full h-full text-center bg-transparent outline-none text-xs font-mono font-bold cursor-pointer text-emerald-800"
                            value={r.severity2}
                            onChange={(e) => {
                              updateRiskValue(r.id, 'severity2', e.target.value);
                              handleRiskBlur(r.id, 'severity2', e.target.value);
                            }}
                          >
                            {S_VALUES.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
                          </select>
                        </td>
                        <td className="px-1 py-1 border border-emerald-100 text-center font-bold bg-emerald-100 text-emerald-900 text-xs">{Math.round(r.score2)}</td>
                        <td className="px-1 py-1 border border-emerald-100 text-center p-1 bg-emerald-50/50">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold block shadow-sm ${r.color2} text-white`}>{r.level2?.split(' ')[0]}</span>
                        </td>

                        <td className="px-1 py-2 border border-slate-200 align-middle text-center uppercase font-bold text-[9px] [writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-slate-500 bg-slate-50">
                          {r.responsible}
                        </td>
                        <td className="px-1 py-1 border border-slate-200 text-center w-8">
                          <button
                            onClick={() => deleteRisk(r.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors mx-auto block"
                            title="Bu satırı sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div >

          </div >
        </main >
      </div >

      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-80 p-4">
          <div className="bg-white rounded-lg p-8 max-w-sm text-center">
            <Lock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="font-bold text-xl mb-2">Pro Özellik</h3>
            <p className="text-gray-600 mb-6">Rapor çıktısı almak için abonelik gereklidir.</p>
            <button onClick={() => setShowPaywall(false)} className="bg-gray-200 px-4 py-2 rounded text-gray-800 font-bold">Kapat</button>
          </div>
        </div>
      )
      }

      {/* SİLME ONAY MODALI */}
      {
        deleteConfirmStep > 0 && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-gray-200 transform transition-all scale-100">
              <div className="flex flex-col items-center text-center">
                <div className="bg-red-100 p-3 rounded-full mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">Tümünü Silmek İstiyor musunuz?</h3>
                <p className="text-gray-500 mb-6">
                  Tablodaki <span className="font-bold text-gray-800">TÜM VERİLER</span> silinecek ve bu işlem geri alınamaz.
                </p>
                <div className="flex space-x-3 w-full">
                  <button
                    onClick={() => setDeleteConfirmStep(0)}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={confirmDeleteAll}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Evet, Hepsini Sil
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* AI ÖNİZLEME MODAL */}
      {
        showAIPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-4 border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    🤖 AI Bulduğu Riskler - "{sectorSearch}"
                  </h3>
                  <button
                    onClick={() => { setShowAIPreview(false); setPreviewRisks([]); }}
                    className="text-white hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-indigo-100 mt-1">
                  {selectedPreviewRisks.size} / {previewRisks.length} madde seçili
                </p>
              </div>

              {/* Modal Body - Liste */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-3 flex gap-2">
                  <button
                    onClick={() => setSelectedPreviewRisks(new Set(previewRisks.map(r => r.tempId)))}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                  >
                    ✓ Tümünü Seç
                  </button>
                  <button
                    onClick={() => setSelectedPreviewRisks(new Set())}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    ✗ Tümünü Kaldır
                  </button>
                </div>

                <div className="space-y-1">
                  {previewRisks.map((risk) => (
                    <div
                      key={risk.tempId}
                      className={`p-2 border rounded cursor-pointer transition-all ${selectedPreviewRisks.has(risk.tempId)
                        ? 'bg-green-50 border-green-300'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      onClick={() => {
                        const newSet = new Set(selectedPreviewRisks);
                        if (newSet.has(risk.tempId)) {
                          newSet.delete(risk.tempId);
                        } else {
                          newSet.add(risk.tempId);
                        }
                        setSelectedPreviewRisks(newSet);
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-1">
                          <input
                            type="checkbox"
                            checked={selectedPreviewRisks.has(risk.tempId)}
                            onChange={() => { }}
                            className="w-3 h-3 text-green-600 rounded"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="px-1 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded">
                              {risk.categoryCode}
                            </span>
                            <span className="px-1 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded">
                              {risk.source}
                            </span>
                            <span className={`px-1 py-0.5 text-[10px] font-bold rounded text-white`} style={{ backgroundColor: risk.color }}>
                              {risk.level}
                            </span>
                          </div>
                          <div className="text-xs font-medium text-gray-800">
                            {risk.hazard}
                          </div>
                          <div className="text-[10px] text-gray-500 truncate">
                            {risk.risk}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-between items-center">
                <button
                  onClick={() => { setShowAIPreview(false); setPreviewRisks([]); }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  İptal
                </button>
                <button
                  onClick={confirmAIPreview}
                  disabled={selectedPreviewRisks.size === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {selectedPreviewRisks.size} Maddeyi Tabloya Ekle
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* PREMIUM TEŞVİK MODAL */}
      {
        showPremiumModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Premium Üyelik Gerekli</h2>
              <p className="text-gray-600 mb-4">
                Free kullanıcılar maksimum <span className="font-bold text-orange-600">{FREE_RISK_LIMIT} risk maddesi</span> ekleyebilir.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Premium üyelik ile sınırsız risk maddesi ekleyebilir, filigransız PDF alabilir ve tüm özelliklere erişebilirsiniz.
              </p>
              <div className="space-y-3">
                <Link
                  href="/register"
                  className="block w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all"
                >
                  🎁 3 Ay Ücretsiz Premium - Kayıt Ol
                </Link>
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  Daha Sonra
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* YUKARI GİT BUTONU */}
      {
        showScrollTop && (
          <button
            onClick={() => tableTopRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-50 bg-indigo-600 bg-opacity-70 hover:bg-opacity-100 text-white p-3 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2 group"
            title="Başa Dön"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            <span className="text-xs font-medium opacity-70 group-hover:opacity-100">Başa Dön</span>
          </button>
        )
      }
    </div >
  );
}
