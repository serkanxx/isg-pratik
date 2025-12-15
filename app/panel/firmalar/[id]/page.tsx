"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
    Building2, ArrowLeft, MapPin, Phone, FileText, Edit2,
    Calendar, Shield, Users, Navigation, ExternalLink,
    BarChart3, TrendingUp, Clock, AlertTriangle, StickyNote,
    Plus, Check, Trash2, X
} from 'lucide-react';
import { Company, DANGER_CLASS_LABELS, DangerClass } from '../../../types';

// Not tipi
interface Note {
    id: string;
    content: string;
    companyId: string | null;
    dueDate: string | null;
    isCompleted: boolean;
    createdAt: string;
}

// Google Maps embed için koordinat tipini tanımla
interface Coordinates {
    lat: number;
    lng: number;
}

export default function FirmaDetayPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const params = useParams();
    const companyId = params?.id as string;

    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState<any[]>([]);
    const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
    const [mapLoading, setMapLoading] = useState(false);

    // Notlar state
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');
    const [dueDateDay, setDueDateDay] = useState('');
    const [dueDateMonth, setDueDateMonth] = useState('');
    const [dueDateYear, setDueDateYear] = useState('');
    const [showNoteForm, setShowNoteForm] = useState(false);

    // Dropdown değerleri
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = [
        { value: '01', label: 'Ocak' }, { value: '02', label: 'Şubat' },
        { value: '03', label: 'Mart' }, { value: '04', label: 'Nisan' },
        { value: '05', label: 'Mayıs' }, { value: '06', label: 'Haziran' },
        { value: '07', label: 'Temmuz' }, { value: '08', label: 'Ağustos' },
        { value: '09', label: 'Eylül' }, { value: '10', label: 'Ekim' },
        { value: '11', label: 'Kasım' }, { value: '12', label: 'Aralık' }
    ];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

    useEffect(() => {
        if (companyId) {
            fetchCompany();
            fetchReports();
            fetchNotes();
        }
    }, [companyId]);

    const fetchCompany = async () => {
        try {
            const res = await fetch(`/api/companies/${companyId}`);
            if (res.ok) {
                const data = await res.json();
                setCompany(data);
                // Adres varsa geocoding yap
                if (data.address) {
                    geocodeAddress(data.address);
                }
            } else {
                router.push('/panel/firmalar');
            }
        } catch (error) {
            console.error('Firma bilgisi alınamadı:', error);
            router.push('/panel/firmalar');
        } finally {
            setLoading(false);
        }
    };

    const fetchReports = async () => {
        try {
            const res = await fetch(`/api/reports?company_id=${companyId}`);
            if (res.ok) {
                const data = await res.json();
                setReports(data);
            }
        } catch (error) {
            console.error('Raporlar alınamadı:', error);
        }
    };

    // Notları getir
    const fetchNotes = async () => {
        try {
            const res = await fetch(`/api/notes?company_id=${companyId}`);
            if (res.ok) {
                const data = await res.json();
                setNotes(data);
            }
        } catch (error) {
            console.error('Notlar alınamadı:', error);
        }
    };

    // Not ekle
    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        // Tarih oluştur
        let dueDate = null;
        if (dueDateDay && dueDateMonth && dueDateYear) {
            dueDate = `${dueDateYear}-${dueDateMonth.padStart(2, '0')}-${dueDateDay.padStart(2, '0')}`;
        }

        try {
            const res = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newNote,
                    companyId: companyId,
                    dueDate
                })
            });
            if (res.ok) {
                setNewNote('');
                setDueDateDay('');
                setDueDateMonth('');
                setDueDateYear('');
                setShowNoteForm(false);
                fetchNotes();
            }
        } catch (error) {
            console.error('Not eklenemedi:', error);
        }
    };

    // Not tamamla/geri al
    const toggleNoteComplete = async (id: string, currentStatus: boolean) => {
        try {
            await fetch('/api/notes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isCompleted: !currentStatus })
            });
            fetchNotes();
        } catch (error) {
            console.error('Not güncellenemedi:', error);
        }
    };

    // Not sil
    const handleDeleteNote = async (id: string) => {
        if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;
        try {
            await fetch(`/api/notes?id=${id}`, { method: 'DELETE' });
            fetchNotes();
        } catch (error) {
            console.error('Not silinemedi:', error);
        }
    };

    // Tarih yardımcı fonksiyonları
    const isOverdue = (dueDate: string | null) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    // Adres → Koordinat dönüşümü (Nominatim - ücretsiz)
    const geocodeAddress = async (address: string) => {
        setMapLoading(true);
        try {
            const encodedAddress = encodeURIComponent(address + ', Turkey');
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) {
                setCoordinates({
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                });
            }
        } catch (error) {
            console.error('Geocoding hatası:', error);
        } finally {
            setMapLoading(false);
        }
    };

    // Google Maps yol tarifi linki
    const getDirectionsUrl = () => {
        if (coordinates) {
            return `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
        }
        if (company?.address) {
            return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(company.address)}`;
        }
        return '#';
    };

    // Tarih formatlama
    const formatDate = (dateString: string | Date | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="p-8 text-center">
                <p className="text-slate-500">Firma bulunamadı</p>
                <Link href="/panel/firmalar" className="text-indigo-600 hover:underline mt-2 inline-block">
                    Firmalara Dön
                </Link>
            </div>
        );
    }

    const dangerClassColor = company.danger_class === 'az_tehlikeli'
        ? 'from-emerald-500 to-teal-600'
        : company.danger_class === 'tehlikeli'
            ? 'from-amber-500 to-orange-600'
            : 'from-red-500 to-rose-600';

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Geri Butonu */}
            <div className="mb-6">
                <button
                    onClick={() => router.push('/panel/firmalar')}
                    className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Firmalara Dön</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sol Kolon - Firma Bilgileri */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Ana Bilgi Kartı */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        {/* Header Gradient */}
                        <div className={`h-32 bg-gradient-to-br ${dangerClassColor} relative`}>
                            <div className="absolute -bottom-10 left-6">
                                {company.logo ? (
                                    <img
                                        src={company.logo}
                                        alt={company.title}
                                        className="w-20 h-20 rounded-2xl object-contain bg-white border-4 border-white shadow-xl"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-xl flex items-center justify-center">
                                        <Building2 className="w-8 h-8 text-slate-400" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute top-4 right-4">
                                <span className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold shadow-md">
                                    {DANGER_CLASS_LABELS[company.danger_class]}
                                </span>
                            </div>
                        </div>

                        {/* Firma Detayları */}
                        <div className="pt-14 pb-6 px-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-800 mb-2">{company.title}</h1>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm">{company.address || 'Adres bilgisi yok'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push(`/panel/firmalar?edit=${company.id}`)}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-700 rounded-xl transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    <span className="font-medium">Düzenle</span>
                                </button>
                            </div>

                            {/* Bilgi Grid - SGK Sicil No geniş, Rapor Sayısı küçük */}
                            <div className="grid grid-cols-12 gap-3 mt-6 pt-6 border-t border-slate-100">
                                <div className="col-span-5 bg-slate-50 rounded-xl p-4">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">SGK Sicil No</p>
                                    <p className="font-bold text-slate-700 text-sm break-all">{company.registration_number || '-'}</p>
                                </div>
                                <div className="col-span-3 bg-slate-50 rounded-xl p-4">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Tehlike Sınıfı</p>
                                    <p className="font-bold text-slate-700 text-sm">{DANGER_CLASS_LABELS[company.danger_class]}</p>
                                </div>
                                <div className="col-span-1 bg-slate-50 rounded-xl p-3 flex flex-col items-center justify-center">
                                    <p className="text-[10px] text-slate-400 uppercase">Rapor</p>
                                    <p className="font-bold text-slate-700 text-lg">{reports.length}</p>
                                </div>
                                <div className="col-span-3 bg-slate-50 rounded-xl p-4">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Kayıt Tarihi</p>
                                    <p className="font-bold text-slate-700 text-sm">{formatDate(company.created_at)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Risk Değerlendirme Ekibi */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" />
                            Risk Değerlendirme Ekibi
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[
                                { label: 'İşveren / Vekili', value: company.employer },
                                { label: 'İş Güvenliği Uzmanı', value: company.igu },
                                { label: 'İşyeri Hekimi', value: company.doctor },
                                { label: 'Çalışan Temsilcisi', value: company.representative },
                                { label: 'Destek Elemanı', value: company.support }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                                    <p className="font-medium text-slate-700">{item.value || '-'}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Rapor İstatistikleri */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                            Rapor Geçmişi
                        </h2>
                        {reports.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Henüz rapor oluşturulmamış</p>
                                <Link
                                    href={`/risk-degerlendirme?company=${companyId}`}
                                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                                >
                                    <Shield className="w-4 h-4" />
                                    İlk Raporu Oluştur
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {reports.slice(0, 5).map((report, idx) => {
                                    const reportData = report.data as any;
                                    const reportDate = reportData?.headerInfo?.date || report.createdAt;
                                    const riskCount = reportData?.risks?.length || 0;

                                    return (
                                        <Link
                                            key={report.id || idx}
                                            href={`/panel/raporlarim?view=${report.id}`}
                                            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                                                    <FileText className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-700 group-hover:text-indigo-700 transition-colors">
                                                        {report.title || 'Risk Değerlendirme Raporu'}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                                        <span>Rapor: {formatDate(reportDate)}</span>
                                                        <span>•</span>
                                                        <span>Kayıt: {formatDate(report.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
                                                    {riskCount} Risk
                                                </span>
                                                <ExternalLink className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sağ Kolon - Harita ve Hızlı İşlemler */}
                <div className="space-y-6">
                    {/* Konum Haritası */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-indigo-600" />
                                Konum
                            </h3>
                        </div>
                        <div className="aspect-square bg-slate-100 relative">
                            {mapLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
                                </div>
                            ) : coordinates ? (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    allowFullScreen
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${coordinates.lat},${coordinates.lng}&zoom=15`}
                                />
                            ) : company.address ? (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    allowFullScreen
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(company.address + ', Turkey')}&zoom=15`}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                    <div className="text-center">
                                        <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Adres bilgisi girilmemiş</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {company.address && (
                            <div className="p-4">
                                <a
                                    href={getDirectionsUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-600/25"
                                >
                                    <Navigation className="w-5 h-5" />
                                    Yol Tarifi Al
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Hızlı İşlemler */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4">Hızlı İşlemler</h3>
                        <div className="space-y-3">
                            <Link
                                href={`/risk-degerlendirme?company=${companyId}`}
                                className="flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors group"
                            >
                                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-700">Risk Değerlendirmesi</p>
                                    <p className="text-xs text-slate-400">Yeni rapor oluştur</p>
                                </div>
                            </Link>
                            <Link
                                href={`/panel/acil-durum?company=${companyId}`}
                                className="flex items-center gap-3 p-3 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors group"
                            >
                                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <AlertTriangle className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-700">Acil Durum Planı</p>
                                    <p className="text-xs text-slate-400">ADEP oluştur</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Firma Notları */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <StickyNote className="w-5 h-5 text-amber-500" />
                                Notlar
                            </h3>
                            <button
                                onClick={() => setShowNoteForm(!showNoteForm)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                                {showNoteForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Not Ekleme Formu */}
                        {showNoteForm && (
                            <div className="mb-4 p-3 bg-amber-50 rounded-xl space-y-3">
                                <textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Notunuzu yazın..."
                                    className="w-full p-2 border border-amber-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    rows={2}
                                />
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 whitespace-nowrap">Hedef Tarih :</span>
                                    <select
                                        value={dueDateDay}
                                        onChange={(e) => setDueDateDay(e.target.value)}
                                        className="w-14 p-1.5 border border-amber-200 rounded-lg text-xs bg-white"
                                    >
                                        <option value="">Gün</option>
                                        {days.map(d => <option key={d} value={String(d)}>{d}</option>)}
                                    </select>
                                    <select
                                        value={dueDateMonth}
                                        onChange={(e) => setDueDateMonth(e.target.value)}
                                        className="w-20 p-1.5 border border-amber-200 rounded-lg text-xs bg-white"
                                    >
                                        <option value="">Ay</option>
                                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                    <select
                                        value={dueDateYear}
                                        onChange={(e) => setDueDateYear(e.target.value)}
                                        className="w-16 p-1.5 border border-amber-200 rounded-lg text-xs bg-white"
                                    >
                                        <option value="">Yıl</option>
                                        {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                                    </select>
                                    <button
                                        onClick={handleAddNote}
                                        className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors"
                                    >
                                        Ekle
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Not Listesi */}
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {notes.length === 0 ? (
                                <p className="text-center text-slate-400 text-sm py-4">Henüz not yok</p>
                            ) : (
                                notes.map((note) => (
                                    <div
                                        key={note.id}
                                        className={`p-3 rounded-lg border transition-all ${note.isCompleted
                                            ? 'bg-slate-50 border-slate-200 opacity-60'
                                            : isOverdue(note.dueDate)
                                                ? 'bg-red-50 border-red-200'
                                                : 'bg-amber-50 border-amber-200'
                                            }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <button
                                                onClick={() => toggleNoteComplete(note.id, note.isCompleted)}
                                                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${note.isCompleted
                                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                                    : 'border-slate-300 hover:border-emerald-500'
                                                    }`}
                                            >
                                                {note.isCompleted && <Check className="w-3 h-3" />}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${note.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                                    {note.content}
                                                </p>
                                                {note.dueDate && (
                                                    <p className={`text-xs mt-1 ${isOverdue(note.dueDate) && !note.isCompleted
                                                        ? 'text-red-600 font-medium'
                                                        : 'text-slate-400'
                                                        }`}>
                                                        <Clock className="w-3 h-3 inline mr-1" />
                                                        {formatDate(note.dueDate)}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteNote(note.id)}
                                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
