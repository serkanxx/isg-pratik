// API query functions ve React Query keys

export const queryKeys = {
  companies: ['companies'] as const,
  company: (id: string) => ['companies', id] as const,
  reports: ['reports'] as const,
  reportsByCompany: (companyId: string) => ['reports', 'company', companyId] as const,
  notes: ['notes'] as const,
  notesByCompany: (companyId: string) => ['notes', 'company', companyId] as const,
  upcomingNotes: ['notes', 'upcoming'] as const,
  userRisks: ['user-risks'] as const,
  visitPrograms: ['visit-programs'] as const,
  visitProgram: (id: string) => ['visit-programs', id] as const,
};

// API fetch fonksiyonları
export const apiFetchers = {
  companies: async () => {
    const res = await fetch('/api/companies');
    if (!res.ok) throw new Error('Firmalar alınamadı');
    return res.json();
  },

  company: async (id: string) => {
    const res = await fetch(`/api/companies/${id}`);
    if (!res.ok) throw new Error('Firma alınamadı');
    return res.json();
  },

  reports: async () => {
    const res = await fetch('/api/reports');
    if (!res.ok) throw new Error('Raporlar alınamadı');
    return res.json();
  },

  reportsByCompany: async (companyId: string) => {
    const res = await fetch(`/api/reports?company_id=${companyId}`);
    if (!res.ok) throw new Error('Raporlar alınamadı');
    return res.json();
  },

  notes: async () => {
    const res = await fetch('/api/notes');
    if (!res.ok) throw new Error('Notlar alınamadı');
    return res.json();
  },

  notesByCompany: async (companyId: string) => {
    const res = await fetch(`/api/notes?company_id=${companyId}`);
    if (!res.ok) throw new Error('Notlar alınamadı');
    return res.json();
  },

  upcomingNotes: async () => {
    const res = await fetch('/api/notes?upcoming=true');
    if (!res.ok) throw new Error('Yaklaşan notlar alınamadı');
    return res.json();
  },

  userRisks: async () => {
    const res = await fetch('/api/user-risks');
    if (!res.ok) throw new Error('Riskler alınamadı');
    return res.json();
  },

  visitPrograms: async () => {
    const res = await fetch('/api/visit-programs');
    if (!res.ok) throw new Error('Ziyaret programları alınamadı');
    return res.json();
  },

  visitProgram: async (id: string) => {
    const res = await fetch(`/api/visit-programs/${id}`);
    if (!res.ok) throw new Error('Ziyaret programı alınamadı');
    return res.json();
  },
};
