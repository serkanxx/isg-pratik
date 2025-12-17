import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

interface NaceData {
    code: string;
    activity: string;
    dangerClass: string;
}

// Excel dosyasını oku ve cache'le
let naceDataCache: NaceData[] | null = null;

// Benzer kodları bul (Levenshtein distance ve prefix matching kullanarak)
function findSimilarCodes(searchCode: string, allCodes: NaceData[], limit: number = 3): NaceData[] {
    const searchCodeWithoutDots = searchCode.replace(/\./g, '');
    
    // Her kod için benzerlik skoru hesapla
    const scored = allCodes.map(item => {
        const itemCodeWithoutDots = item.code.replace(/\./g, '');
        
        // Levenshtein distance hesapla
        const distance = levenshteinDistance(searchCodeWithoutDots, itemCodeWithoutDots);
        
        // Prefix matching bonusu (başlangıç haneleri aynıysa)
        let prefixBonus = 0;
        for (let i = 1; i <= 6; i++) {
            if (searchCodeWithoutDots.slice(0, i) === itemCodeWithoutDots.slice(0, i)) {
                prefixBonus = i; // Kaç hanesi aynıysa o kadar bonus
            } else {
                break;
            }
        }
        
        // Skor: distance ne kadar küçükse o kadar iyi, prefix bonusu ne kadar büyükse o kadar iyi
        // Prefix bonusunu distance'tan çıkararak öncelik ver
        const score = distance - (prefixBonus * 0.5);
        
        return {
            ...item,
            score,
            distance,
            prefixMatch: prefixBonus
        };
    });
    
    // Skora göre sırala ve ilk N tanesini al
    return scored
        .sort((a, b) => {
            // Önce prefix match'e göre, sonra distance'a göre
            if (a.prefixMatch !== b.prefixMatch) {
                return b.prefixMatch - a.prefixMatch;
            }
            return a.score - b.score;
        })
        .slice(0, limit)
        .map(({ score, distance, prefixMatch, ...item }) => item);
}

// Levenshtein distance hesaplama
function levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = [];
    
    for (let i = 0; i <= m; i++) {
        dp[i] = [i];
    }
    for (let j = 0; j <= n; j++) {
        dp[0][j] = j;
    }
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,     // deletion
                    dp[i][j - 1] + 1,     // insertion
                    dp[i - 1][j - 1] + 1  // substitution
                );
            }
        }
    }
    
    return dp[m][n];
}

function loadNaceData(): NaceData[] {
    if (naceDataCache) {
        return naceDataCache;
    }

    try {
        const filePath = path.join(process.cwd(), 'public', 'Nacekod.xlsx');
        console.log('NACE Excel dosya yolu:', filePath);
        
        // Dosyanın varlığını kontrol et
        if (!fs.existsSync(filePath)) {
            console.error('Excel dosyası bulunamadı:', filePath);
            return [];
        }
        
        // Buffer olarak oku ve XLSX'e ver
        const fileBuffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        console.log('Excel toplam satır sayısı:', data.length);

        const naceData: NaceData[] = [];

        // İlk satır başlık, ikinci satır kategori başlığı, 3. satırdan itibaren veri
        for (let i = 2; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length < 3) continue;

            const code = String(row[0] || '').trim();
            const activity = String(row[1] || '').trim();
            const dangerClass = String(row[2] || '').trim();

            // Sadece 6 haneli kodları al (xx.xx.xx formatında)
            if (code && code.match(/^\d{2}\.\d{2}\.\d{2}$/)) {
                naceData.push({
                    code,
                    activity,
                    dangerClass: dangerClass || 'Belirtilmemiş'
                });
            }
        }

        console.log('Yüklenen NACE kod sayısı:', naceData.length);
        if (naceData.length > 0) {
            console.log('İlk kod örneği:', naceData[0]);
        }

        naceDataCache = naceData;
        return naceData;
    } catch (error) {
        console.error('NACE Excel okuma hatası:', error);
        return [];
    }
}

// GET - NACE kodunu sorgula
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json({ error: 'NACE kodu gerekli' }, { status: 400 });
        }

        // Kodu normalize et (noktaları kaldır, sonra formatla)
        const normalizedCode = code.replace(/\./g, '');
        if (normalizedCode.length !== 6 || !/^\d+$/.test(normalizedCode)) {
            return NextResponse.json({ error: 'Geçersiz NACE kodu formatı. 6 haneli rakam giriniz (örn: 01.11.14)' }, { status: 400 });
        }

        // Formatla: xx.xx.xx
        const formattedCode = `${normalizedCode.slice(0, 2)}.${normalizedCode.slice(2, 4)}.${normalizedCode.slice(4, 6)}`;

        console.log('Aranan kod:', formattedCode);
        const naceData = loadNaceData();
        console.log('Toplam kod sayısı:', naceData.length);
        
        const result = naceData.find(item => item.code === formattedCode);
        console.log('Bulunan sonuç:', result ? 'EVET' : 'HAYIR');

        if (!result) {
            // En yakın 3 kodu bul
            const suggestions = findSimilarCodes(formattedCode, naceData, 3);
            console.log('Önerilen kodlar:', suggestions);
            return NextResponse.json({ 
                error: 'NACE kodu bulunamadı',
                code: formattedCode,
                suggestions
            }, { status: 404 });
        }

        return NextResponse.json({
            code: result.code,
            activity: result.activity,
            dangerClass: result.dangerClass
        });
    } catch (error: any) {
        console.error('NACE sorgulama hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası: ' + error.message }, { status: 500 });
    }
}

