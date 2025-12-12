import { NextRequest, NextResponse } from 'next/server';

// Sektör - Anahtar Kelime Eşleştirme Tablosu
const SECTOR_KEYWORDS: { [key: string]: string[] } = {
    // Genel (tüm sektörler için)
    '_GENEL': [
        'ELEKTRİK', 'YANGIN', 'ACİL', 'İLK YARDIM', 'TEMİZLİK', 'HİJYEN',
        'TERTİP', 'DÜZEN', 'PERSONEL', 'ÇALIŞAN', 'İŞÇİ', 'PSİKOSOSYAL',
        'ERGONOMİ', 'AYDINLATMA', 'HAVALANDIRMA', 'KİŞİSEL KORUYUCU', 'KKD',
        'EĞİTİM', 'DENETLEME', 'BAKIM', 'ONARIM', 'GENEL', 'ORTAK'
    ],

    // Otomotiv / Araç Servis
    'otomotiv': [
        'ARAÇ', 'OTOMOBİL', 'MOTOR', 'YAĞ', 'LASTİK', 'FREN', 'AKÜ',
        'KAYNAK', 'BOYA', 'BOYA KABİNİ', 'LİFT', 'KALDIRMA', 'GARAJj',
        'SERVİS', 'TAMİR', 'BAKIM', 'EGZOZ', 'YAKIIT', 'BENZİN', 'MAZOT',
        'KOMPRESÖR', 'PRES', 'TAŞLAMA', 'PARLATMA', 'DÖKÜM'
    ],

    // İnşaat
    'inşaat': [
        'İSKELE', 'VİNÇ', 'KALIP', 'BETON', 'DEMİR', 'KAZI', 'HAFRIYAT',
        'YÜKSEK', 'DÜŞME', 'ÇATtI', 'ÇUKUR', 'TEMEL', 'DUVAR', 'KIRIŞ',
        'KOLON', 'ASANSÖR', 'MERDİVEN', 'PLATFORM', 'KULE', 'KAMYON',
        'KEPÇE', 'DOZER', 'EKSKAVATÖR', 'BEKO', 'MIKSER', 'POMPA',
        'TAŞ', 'KUM', 'ÇİMENTO', 'TUĞLA', 'BLOK', 'ALÜMİNYUM', 'CAM',
        'SIVA', 'BOYA', 'TAVAN', 'ZEMİN', 'KAPLAMA', 'İZOLASYON'
    ],

    // Tekstil
    'tekstil': [
        'KUMAŞ', 'İPLİK', 'DOKUMA', 'ÖRME', 'DİKİŞ', 'MAKINE', 'MAKİNA',
        'İĞNE', 'BASKI', 'BOYA', 'KİMYASAL', 'TOZ', 'LİF', 'ELYAF',
        'KESME', 'SERİM', 'ÜTÜLEME', 'PAKETLEME', 'DEPO', 'GÜRÜLTÜ'
    ],

    // Gıda
    'gıda': [
        'GIDA', 'YİYECEK', 'MUTFAK', 'PİŞİRME', 'OCAK', 'FIRIN', 'SOĞUTMA',
        'BUZDOLABI', 'DONDURMA', 'KESME', 'BIÇAK', 'DİLİMLEME', 'KIYMA',
        'PAKETLEME', 'AMBALAJ', 'DEPOLAMA', 'RAF', 'HİJYEN', 'BULAŞIK',
        'TEMİZLİK', 'DEZENFEKTAN', 'UN', 'ŞEKER', 'YAĞ', 'SU', 'SICAK'
    ],

    // Restoran / Cafe
    'restoran': [
        'MUTFAK', 'OCAK', 'FIRIN', 'IZGARA', 'FRİTÖZ', 'SICAK', 'BUHAR',
        'BIÇAK', 'KESME', 'SERVİS', 'GARSON', 'KASA', 'BARDAK', 'TABAK',
        'BULAŞIK', 'TEMİZLİK', 'HİJYEN', 'GIDA', 'YİYECEK', 'İÇECEK',
        'SOĞUK', 'BUZDOLABI', 'RAF', 'DEPO', 'KAYGAN', 'ZEMİN'
    ],

    // Metal / Demir Çelik
    'metal': [
        'METAL', 'DEMİR', 'ÇELİK', 'ALÜMİNYUM', 'BAKIR', 'KAYNAK', 'KESME',
        'TORNALAMA', 'TORNA', 'FREZE', 'TAŞLAMA', 'DELME', 'PRESm', 'BÜKME',
        'ERİTME', 'DÖKÜM', 'HADDELEMEm', 'SICAK', 'SOĞUK', 'KIVILCIM',
        'PARLAMA', 'PATLAMA', 'GÜRÜLTÜ', 'TİTREŞİM', 'TOZ', 'DUMAN'
    ],

    // Ahşap / Mobilya
    'ahşap': [
        'AHŞAP', 'KERESTE', 'TABLA', 'MDF', 'SUNTA', 'KONTRPLAK', 'TESTERE',
        'PLANYA', 'FREZE', 'ZIMPARA', 'CİLA', 'VERNİK', 'BOYA', 'TUTKAL',
        'YAPISTIRICI', 'TOZ', 'TALAŞ', 'KESİM', 'MOBİLYA', 'DOLAP', 'MASA'
    ],

    // Nakliye / Lojistik
    'nakliye': [
        'ARAÇ', 'KAMYON', 'TIR', 'KAMYONET', 'FORKLİFT', 'TRANSPALET',
        'YÜKLEME', 'BOŞALTMA', 'İSTİF', 'RAF', 'DEPO', 'AMBAR', 'PALET',
        'KASA', 'KUTU', 'PAKET', 'TAŞIMA', 'KALDIRMA', 'ÇEKME', 'İTME',
        'TRAFİK', 'SÜRÜCÜ', 'ŞOFÖR', 'RAMPA', 'PLATFORM'
    ],

    // Temizlik / Hijyen
    'temizlik': [
        'TEMİZLİK', 'SÜPÜRGE', 'MOP', 'PASPAS', 'DETERJAN', 'KİMYASAL',
        'DEZENFEKTAN', 'ÇAMAŞIR', 'SU', 'ISLAK', 'KAYGAN', 'CAM', 'ZEMİN',
        'TUVALET', 'LAVABO', 'BANYO', 'ÇÖP', 'ATIK', 'GERİ DÖNÜŞÜM'
    ],

    // Sağlık / Hastane
    'sağlık': [
        'HASTA', 'TIBBİ', 'İLAÇ', 'ENJEKTÖR', 'İĞNE', 'KAN', 'ENFEKSİYON',
        'RADYASYON', 'RÖNTGEN', 'AMELİYAT', 'STERİL', 'DEZENFEKTAN',
        'ATIK', 'TIBBİ ATIK', 'LABORATUVAR', 'NUMUNEm', 'KİMYASAL',
        'SEDYE', 'TEKERLEKLİ', 'KALDIRMA', 'HASTA TAŞIMA'
    ],

    // Otel / Konaklama
    'otel': [
        'ODA', 'YATAK', 'TEMİZLİK', 'ÇAMAŞIR', 'ÜTÜ', 'HAVALANDIRMA',
        'KLİMA', 'ASANSÖR', 'MERDİVEN', 'LOBİ', 'RESEPSIYON', 'BAGAJ',
        'MUTFAK', 'RESTORAN', 'BAR', 'HAVUZ', 'SPA', 'FİTNESS', 'OTOPARK'
    ],

    // Market / Perakende
    'market': [
        'RAF', 'KASA', 'ÜRÜN', 'STOK', 'DEPO', 'SOĞUTUCU', 'DONDURUCU',
        'FORKLİFT', 'TRANSPALET', 'KALDIRMA', 'TAŞIMA', 'MÜŞTERİ',
        'KAYGAN', 'ZEMİN', 'MERDİVEN', 'PLATFORM', 'CAM', 'ETİKET'
    ],

    // Plastik / Kimya
    'plastik': [
        'PLASTİK', 'ENJEKSIYON', 'KALIP', 'EKSTRÜZYON', 'SICAK', 'ERİTME',
        'KİMYASAL', 'SOLVENT', 'BOYA', 'KOKU', 'GAZ', 'DUMAN', 'TOZ',
        'GRANÜL', 'HURDA', 'GERİ DÖNÜŞÜM', 'PRES', 'KESME', 'PAKETLEME'
    ],

    // Tarım / Hayvancılık
    'tarım': [
        'TARIM', 'TRAKTÖR', 'BİÇERDÖVER', 'PULLUK', 'EKİM', 'HASAT',
        'GÜBRE', 'İLAÇ', 'ZİRAİ', 'HAYVAN', 'AHIR', 'KÜMES', 'YEM',
        'SAMAN', 'OT', 'SULAMA', 'SERA', 'SOĞUK HAVA', 'DEPO'
    ],

    // Elektrik / Elektronik
    'elektrik': [
        'ELEKTRİK', 'KABLO', 'PANO', 'TRAFO', 'JENERATÖR', 'AKÜ', 'ŞARJ',
        'LEHİM', 'BASKI DEVRE', 'MONTAJ', 'TEST', 'ÖLÇÜMm', 'TOPRAKLAMA',
        'YÜKSEK GERİLİM', 'ALÇAK GERİLİM', 'SIGORTA', 'ANAHTAR', 'PRİZ'
    ]
};

// Sektör eşanlamlıları
const SECTOR_ALIASES: { [key: string]: string } = {
    'oto': 'otomotiv',
    'araç': 'otomotiv',
    'araba': 'otomotiv',
    'servis': 'otomotiv',
    'tamirhane': 'otomotiv',
    'yapı': 'inşaat',
    'müteahhit': 'inşaat',
    'yemek': 'restoran',
    'cafe': 'restoran',
    'kafe': 'restoran',
    'lokanta': 'restoran',
    'fabrika': 'metal',
    'demir': 'metal',
    'çelik': 'metal',
    'mobilya': 'ahşap',
    'marangoz': 'ahşap',
    'ağaç': 'ahşap',
    'lojistik': 'nakliye',
    'kargo': 'nakliye',
    'taşıma': 'nakliye',
    'depo': 'nakliye',
    'hastane': 'sağlık',
    'klinik': 'sağlık',
    'doktor': 'sağlık',
    'hemşire': 'sağlık',
    'pansiyon': 'otel',
    'motel': 'otel',
    'konaklama': 'otel',
    'süpermarket': 'market',
    'mağaza': 'market',
    'dükkan': 'market',
    'bakkal': 'market',
    'kimya': 'plastik',
    'petrokimya': 'plastik',
    'çiftlik': 'tarım',
    'hayvancılık': 'tarım',
    'sera': 'tarım',
    'elektrikçi': 'elektrik',
    'elektronik': 'elektrik',
    'kuaför': 'temizlik',
    'berber': 'temizlik',
    'güzellik': 'temizlik',
    'konfeksiyon': 'tekstil',
    'hazır giyim': 'tekstil',
    'dikimevi': 'tekstil',
    'unlu mamul': 'gıda',
    'fırın': 'gıda',
    'pastane': 'gıda',
    'kasap': 'gıda',
    'şarküteri': 'gıda'
};

export async function POST(request: NextRequest) {
    try {
        const { sector, categories } = await request.json();

        /*
        console.log('=== Sektör Analizi ===');
        console.log('Aranan sektör:', sector);
        */

        // Sektörü normalize et
        const normalizedSector = sector.toLowerCase().trim();

        // Sektör eşanlamlısını bul
        const mainSector = SECTOR_ALIASES[normalizedSector] || normalizedSector;

        // Bu sektör için anahtar kelimeleri al
        const sectorKeywords = SECTOR_KEYWORDS[mainSector] || [];
        const generalKeywords = SECTOR_KEYWORDS['_GENEL'] || [];

        // Tüm anahtar kelimeleri birleştir
        const allKeywords = [...sectorKeywords, ...generalKeywords];

        /*
        console.log('Eşleşen sektör:', mainSector);
        console.log('Anahtar kelime sayısı:', allKeywords.length);
        */

        // Benzersiz source'ları topla ve eşleştir
        const matchedSources: string[] = [];

        // Sabit kategori kodları - her sektöre eklenir
        // Kullanıcı admin'den isimleri değiştirse bile kod değişmez
        const FIXED_CATEGORY_CODES = ['01', '02', '04', '05', '06', '07', '09'];
        // 01: OFİS/ÇALIŞMA ALANI, 02: ELEKTRİK, 04: ÇALIŞANLAR, 05: HİJYEN/TEMİZLİK
        // 06: ACİL DURUM, 07: YANGIN, 09: ELLE TAŞIMA

        categories.forEach((cat: any) => {
            const isFixedCategory = FIXED_CATEGORY_CODES.includes(cat.code);

            cat.items?.forEach((item: any) => {
                const source = typeof item.source === 'string' ? item.source : '';
                const risk = typeof item.risk === 'string' ? item.risk : '';

                if (source && !matchedSources.includes(source)) {
                    // Sabit kategorilerdeki TÜM kaynakları ekle
                    if (isFixedCategory) {
                        matchedSources.push(source);
                        return;
                    }

                    // Diğer kategoriler için anahtar kelime eşleştirmesi yap
                    const sourceUpper = source.toUpperCase();
                    const riskUpper = risk.toUpperCase();

                    const isMatch = allKeywords.some(keyword =>
                        sourceUpper.includes(keyword) || riskUpper.includes(keyword)
                    );

                    if (isMatch) {
                        matchedSources.push(source);
                    }
                }
            });
        });

        // console.log('Eşleşen kaynak sayısı:', matchedSources.length);

        return NextResponse.json({ selectedSources: matchedSources });

    } catch (error: any) {
        console.error('Analiz hatası:', error);
        return NextResponse.json(
            { error: error.message || 'Sektör analizi sırasında bir hata oluştu' },
            { status: 500 }
        );
    }
}
