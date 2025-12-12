// Risk Hesaplama Utility Fonksiyonları

import { RiskLevel } from './types';

/**
 * Fine-Kinney metoduna göre risk skoru hesaplar
 * @param p - Olasılık (Probability)
 * @param f - Frekans (Frequency)
 * @param s - Şiddet (Severity)
 * @returns Risk skoru (P x F x S)
 */
export const calculateRiskScore = (p: number | string, f: number | string, s: number | string): number => {
    const nP = parseFloat(String(p)) || 0;
    const nF = parseFloat(String(f)) || 0;
    const nS = parseFloat(String(s)) || 0;
    return nP * nF * nS;
};

/**
 * Risk skoruna göre risk seviyesini belirler
 * @param score - Risk skoru
 * @returns Risk seviyesi (label ve renk)
 */
export const getRiskLevel = (score: number): RiskLevel => {
    if (score >= 400) return { label: 'Tolerans Gösterilemez', color: 'bg-red-600 text-white border-red-700' };
    if (score >= 200) return { label: 'Esaslı Risk', color: 'bg-red-100 text-red-800 border-red-200' };
    if (score >= 70) return { label: 'Önemli Risk', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    if (score >= 20) return { label: 'Olası Risk', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    return { label: 'Kabul Edilebilir', color: 'bg-green-100 text-green-800 border-green-200' };
};

/**
 * Tarih formatını YYYY-MM-DD'den DD.MM.YYYY'ye çevirir
 * @param dateStr - YYYY-MM-DD formatında tarih
 * @returns DD.MM.YYYY formatında tarih
 */
export const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateStr;
};


// Değer Seçenekleri (Dropdown için)
export const P_VALUES = [
    { value: 0.2, label: '0.2 - Pratik olarak imkansız' },
    { value: 0.5, label: '0.5 - Zayıf ihtimal' },
    { value: 1, label: '1 - Oldukça düşük ihtimal' },
    { value: 3, label: '3 - Nadir' },
    { value: 6, label: '6 - Kuvvetle muhtemel' },
    { value: 10, label: '10 - Beklenir' }
];

export const F_VALUES = [
    { value: 0.5, label: '0.5 - Çok nadir (Yılda bir)' },
    { value: 1, label: '1 - Oldukça seyrek (Yılda birkaç)' },
    { value: 2, label: '2 - Seyrek (Ayda bir)' },
    { value: 3, label: '3 - Ara sıra (Haftada bir)' },
    { value: 6, label: '6 - Sıklıkla (Günde bir)' },
    { value: 10, label: '10 - Sürekli (Saatte bir)' }
];

export const S_VALUES = [
    { value: 1, label: '1 - Hafif' },
    { value: 3, label: '3 - Düşük' },
    { value: 7, label: '7 - Önemli' },
    { value: 15, label: '15 - Ciddi' },
    { value: 40, label: '40 - Çok Ciddi' },
    { value: 70, label: '70 - Yıkıcı' },
    { value: 100, label: '100 - Felaket' }
];
