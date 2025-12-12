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
