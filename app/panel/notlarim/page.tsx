"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, apiFetchers } from '@/lib/queries';
import {
    StickyNote, Plus, Clock, Check, Trash2, X, Building2,
    Calendar, ChevronRight, Filter
} from 'lucide-react';
import { Company } from '../../types';

interface Note {
    id: string;
    content: string;
    companyId: string | null;
    dueDate: string | null;
    isCompleted: boolean;
    createdAt: string;
}

export default function NotlarimPage() {
    const { data: session } = useSession();
    const [notes, setNotes] = useState<Note[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Yeni not state
    const [newNote, setNewNote] = useState('');
    const [newNoteCompanyId, setNewNoteCompanyId] = useState('');
    const [dueDateDay, setDueDateDay] = useState('');
    const [dueDateMonth, setDueDateMonth] = useState('');
    const [dueDateYear, setDueDateYear] = useState('');

    // Filtre
    const [filterCompany, setFilterCompany] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');

    const queryClient = useQueryClient();

    const { data: notesData, isLoading: notesLoading } = useQuery({
        queryKey: queryKeys.notes,
        queryFn: apiFetchers.notes,
    });

    const { data: companiesData, isLoading: companiesLoading } = useQuery({
        queryKey: queryKeys.companies,
        queryFn: apiFetchers.companies,
    });

    useEffect(() => {
        if (notesData) {
            setNotes(notesData);
        }
    }, [notesData]);

    useEffect(() => {
        if (companiesData) {
            setCompanies(companiesData);
        }
    }, [companiesData]);

    useEffect(() => {
        if ((notesData && companiesData) || (!notesLoading && !companiesLoading)) {
            setLoading(false);
        }
    }, [notesData, companiesData, notesLoading, companiesLoading]);

    const handleAddNote = async () => {
        if (!newNote.trim()) {
            alert('Not içeriği gerekli');
            return;
        }

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
                    companyId: newNoteCompanyId || null,
                    dueDate
                })
            });

            if (res.ok) {
                setNewNote('');
                setNewNoteCompanyId('');
                setDueDateDay('');
                setDueDateMonth('');
                setDueDateYear('');
                setShowForm(false);
                queryClient.invalidateQueries({ queryKey: queryKeys.notes });
            } else {
                const error = await res.json();
                alert('Hata: ' + (error.error || 'Not eklenemedi'));
            }
        } catch (error) {
            console.error('Not eklenemedi:', error);
            alert('Not eklenirken bir hata oluştu');
        }
    };

    const toggleNoteComplete = async (id: string, currentStatus: boolean) => {
        try {
            await fetch('/api/notes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isCompleted: !currentStatus })
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.notes });
        } catch (error) {
            console.error('Not güncellenemedi:', error);
        }
    };

    const handleDeleteNote = async (id: string) => {
        if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;
        try {
            await fetch(`/api/notes?id=${id}`, { method: 'DELETE' });
            queryClient.invalidateQueries({ queryKey: queryKeys.notes });
        } catch (error) {
            console.error('Not silinemedi:', error);
        }
    };

    const isOverdue = (dueDate: string | null) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getCompanyName = (companyId: string | null) => {
        if (!companyId) return 'Genel';
        const company = companies.find(c => c.id === companyId);
        return company?.title || 'Bilinmeyen Firma';
    };

    // Filtrelenmiş notlar
    const filteredNotes = notes.filter(note => {
        if (filterCompany && note.companyId !== filterCompany) return false;
        if (filterStatus === 'active' && note.isCompleted) return false;
        if (filterStatus === 'completed' && !note.isCompleted) return false;
        return true;
    });

    // Dropdown değerleri
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = [
        { value: '01', label: 'Ocak' },
        { value: '02', label: 'Şubat' },
        { value: '03', label: 'Mart' },
        { value: '04', label: 'Nisan' },
        { value: '05', label: 'Mayıs' },
        { value: '06', label: 'Haziran' },
        { value: '07', label: 'Temmuz' },
        { value: '08', label: 'Ağustos' },
        { value: '09', label: 'Eylül' },
        { value: '10', label: 'Ekim' },
        { value: '11', label: 'Kasım' },
        { value: '12', label: 'Aralık' }
    ];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
            {/* Başlık */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <StickyNote className="w-7 h-7 text-amber-500" />
                        Notlarım
                    </h1>
                    <p className="text-slate-500 mt-1">Tüm notlarınızı buradan yönetin</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25"
                >
                    {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {showForm ? 'İptal' : 'Yeni Not'}
                </button>
            </div>

            {/* Not Ekleme Formu */}
            {showForm && (
                <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 mb-6">
                    <h2 className="font-bold text-amber-800 mb-4">Yeni Not Ekle</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Not İçeriği *</label>
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Notunuzu yazın..."
                                className="w-full p-3 border border-amber-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Firma</label>
                                <select
                                    value={newNoteCompanyId}
                                    onChange={(e) => setNewNoteCompanyId(e.target.value)}
                                    className="w-full p-3 border border-amber-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                >
                                    <option value="">Genel Not</option>
                                    {companies.map((c) => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Hedef Tarih :</label>
                                <div className="flex gap-2">
                                    <select
                                        value={dueDateDay}
                                        onChange={(e) => setDueDateDay(e.target.value)}
                                        className="flex-1 p-3 border border-amber-200 rounded-xl text-sm bg-white"
                                    >
                                        <option value="">Gün</option>
                                        {days.map(d => (
                                            <option key={d} value={String(d)}>{d}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={dueDateMonth}
                                        onChange={(e) => setDueDateMonth(e.target.value)}
                                        className="flex-1 p-3 border border-amber-200 rounded-xl text-sm bg-white"
                                    >
                                        <option value="">Ay</option>
                                        {months.map(m => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={dueDateYear}
                                        onChange={(e) => setDueDateYear(e.target.value)}
                                        className="flex-1 p-3 border border-amber-200 rounded-xl text-sm bg-white"
                                    >
                                        <option value="">Yıl</option>
                                        {years.map(y => (
                                            <option key={y} value={String(y)}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleAddNote}
                                className="px-6 py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors"
                            >
                                Not Ekle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filtreler */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-500">Filtrele:</span>
                </div>
                <select
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                    <option value="">Tüm Firmalar</option>
                    <option value="__general__">Genel Notlar</option>
                    {companies.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                </select>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                    {[
                        { value: 'all', label: 'Tümü' },
                        { value: 'active', label: 'Aktif' },
                        { value: 'completed', label: 'Tamamlanan' }
                    ].map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setFilterStatus(opt.value as any)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filterStatus === opt.value
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                <span className="text-sm text-slate-400">
                    {filteredNotes.length} not
                </span>
            </div>

            {/* Not Listesi */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent"></div>
                </div>
            ) : filteredNotes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <StickyNote className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-4">Henüz not eklemediniz</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        İlk Notu Ekle
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredNotes.map((note) => (
                        <div
                            key={note.id}
                            className={`bg-white rounded-xl border p-4 transition-all ${note.isCompleted
                                    ? 'border-slate-200 opacity-60'
                                    : isOverdue(note.dueDate)
                                        ? 'border-red-200 bg-red-50'
                                        : 'border-slate-200 hover:border-amber-300 hover:shadow-md'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <button
                                    onClick={() => toggleNoteComplete(note.id, note.isCompleted)}
                                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${note.isCompleted
                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : 'border-slate-300 hover:border-emerald-500'
                                        }`}
                                >
                                    {note.isCompleted && <Check className="w-4 h-4" />}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <p className={`text-base ${note.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                        {note.content}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3 mt-2">
                                        <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                            <Building2 className="w-3 h-3" />
                                            {getCompanyName(note.companyId)}
                                        </span>
                                        {note.dueDate && (
                                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${isOverdue(note.dueDate) && !note.isCompleted
                                                    ? 'bg-red-100 text-red-700 font-medium'
                                                    : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(note.dueDate)}
                                            </span>
                                        )}
                                        <span className="text-xs text-slate-400">
                                            Eklendi: {formatDate(note.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
