// ISG Uygulaması TypeScript Tip Tanımları

export interface RiskItem {
    id: number;
    riskNo: string;
    categoryCode: string;
    sub_category: string;
    source: string;
    hazard: string;
    risk: string;
    affected: string;
    responsible: string;
    probability: number;
    frequency: number;
    severity: number;
    probability2: number;
    frequency2: number;
    severity2: number;
    measures: string;
    score: number;
    score2: number;
    level: string;
    level2: string;
    color: string;
    color2: string;
    image: string | null;
}

export interface RiskCategory {
    code: string;
    category: string;
    items: RiskLibraryItem[];
}

export interface RiskLibraryItem {
    riskNo?: string;
    sub_category: string;
    source: string;
    hazard: string;
    risk: string;
    affected: string;
    p: number;
    f: number;
    s: number;
    p2: number;
    f2: number;
    s2: number;
    measures: string;
    responsible?: string;
    sector_tags?: string[];
}

export interface HeaderInfo {
    title: string;
    address: string;
    registrationNumber: string;
    date: string;
    validityDate: string;
    revision: string;
    logo: string | null;
    employer: string;
    igu: string;
    doctor: string;
    representative: string;
    support: string;
    dangerClass?: DangerClass; // Raporlama sayfasında görüntülemek için
}

export interface RiskForm {
    categoryCode: string;
    riskNo: string;
    sub_category: string;
    source: string;
    hazard: string;
    risk: string;
    affected: string;
    responsible: string;
    probability: number;
    frequency: number;
    severity: number;
    probability2: number;
    frequency2: number;
    severity2: number;
    measures: string;
    image: string | null;
}

export interface Notification {
    show: boolean;
    message: string;
    type: 'success' | 'error';
}

export interface RiskLevel {
    label: string;
    color: string;
}

// Tehlike Sınıfı
export type DangerClass = 'az_tehlikeli' | 'tehlikeli' | 'cok_tehlikeli';

// Firma (Company) Interface
export interface Company {
    id: string;
    user_id: string;
    title: string;
    address: string;
    registration_number: string;
    danger_class: DangerClass;
    logo: string | null;
    employer: string;
    igu: string; // İş Güvenliği Uzmanı
    doctor: string; // İşyeri Hekimi
    representative: string; // Çalışan Temsilcisi
    support: string; // Destek Elemanı
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// Risk Raporu Interface
export interface RiskReport {
    id: string;
    user_id: string;
    company_id: string;
    report_date: string;
    validity_date: string;
    revision_no: string | null;
    revision_date: string | null;
    risks: RiskItem[];
    created_at: string;
}

// Tehlike sınıfına göre geçerlilik süresi (yıl)
export const VALIDITY_YEARS: Record<DangerClass, number> = {
    'az_tehlikeli': 6,
    'tehlikeli': 4,
    'cok_tehlikeli': 2
};

// Tehlike sınıfı etiketleri
export const DANGER_CLASS_LABELS: Record<DangerClass, string> = {
    'az_tehlikeli': 'Az Tehlikeli',
    'tehlikeli': 'Tehlikeli',
    'cok_tehlikeli': 'Çok Tehlikeli'
};
