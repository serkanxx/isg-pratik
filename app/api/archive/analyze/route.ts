import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// R2 S3 client oluştur
function getR2Client() {
    return new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
    });
}

export async function GET() {
    try {
        const bucketName = process.env.R2_BUCKET_NAME;

        if (!bucketName) {
            return NextResponse.json(
                { error: 'R2 bucket yapılandırması eksik' },
                { status: 500 }
            );
        }

        const s3Client = getR2Client();
        const allFiles: string[] = [];
        let continuationToken: string | undefined = undefined;
        let isTruncated = true;

        // Tüm dosyaları pagination ile çek
        while (isTruncated) {
            const command = new ListObjectsV2Command({
                Bucket: bucketName,
                ContinuationToken: continuationToken,
                MaxKeys: 1000,
            });

            const response = await s3Client.send(command);
            
            const files = (response.Contents || [])
                .filter(item => item.Key && !item.Key.endsWith('/'))
                .map(item => item.Key || '');

            allFiles.push(...files);

            isTruncated = response.IsTruncated || false;
            continuationToken = response.NextContinuationToken;
        }

        // Dosya isimlerini analiz et
        const analysis = analyzeFileNames(allFiles);

        return NextResponse.json({
            totalFiles: allFiles.length,
            analysis,
            sampleFiles: allFiles.slice(0, 100) // İlk 100 dosya örnek olarak
        });
    } catch (error: any) {
        console.error('R2 analiz hatası:', error);
        return NextResponse.json(
            { error: 'Analiz yapılamadı', details: error.message },
            { status: 500 }
        );
    }
}

function analyzeFileNames(fileNames: string[]): any {
    // Tüm kelimeleri topla
    const wordFrequency: { [key: string]: number } = {};
    const categoryPatterns: { [key: string]: number } = {};

    // Yaygın kategori kelimeleri
    const categoryKeywords = [
        'kanun', 'tebliğ', 'teblig',
        'kontrol', 'listesi', 'çeklist', 'checklist',
        'risk', 'değerlendirme', 'analiz',
        'talimat', 'yönetmelik', 'yönerge',
        'form', 'formu',
        'rehber', 'kılavuz', 'kilavuz',
        'sunum', 'presentation',
        'prosedür', 'prosedur',
        'rapor', 'raporu',
        'not', 'notları',
        'acil', 'durum', 'eylem', 'plan',
        'iş', 'güvenliği', 'guvenlik',
        'eğitim', 'egitim',
        'denetim', 'kontrol',
        'makine', 'ekipman',
        'kimyasal', 'madde',
        'yangın', 'yangin',
        'elektrik', 'elektrik',
        'yüksekte', 'yuksekte',
        'kapalı', 'kapali',
        'gürültü', 'gurultu',
        'toz', 'duman',
        'ergonomi',
        'psikososyal',
        'biyolojik',
        'fiziksel',
        'kimyasal',
        'gürültü',
        'vibrasyon',
        'radyasyon',
        'ağır', 'agir',
        'taşıma', 'tasima',
        'elle',
        'kaldırma', 'kaldirma',
        'vinç', 'vinc',
        'forklift',
        'kaynak',
        'kesme',
        'delme',
        'zımpara', 'zımpara',
        'boya',
        'temizlik',
        'bakım', 'bakim',
        'onarım', 'onarim',
        'montaj',
        'demontaj',
        'depolama',
        'sevkiyat',
        'lojistik',
        'üretim', 'uretim',
        'imalat',
        'fabrika',
        'atölye', 'atolye',
        'ofis',
        'laboratuvar',
        'hastane',
        'okul',
        'üniversite', 'universite',
        'otel',
        'restoran',
        'market',
        'mağaza', 'magaza',
        'inşaat', 'insaat',
        'yapı', 'yapi',
        'bina',
        'tünel', 'tunel',
        'köprü', 'kopru',
        'baraj',
        'enerji',
        'güneş', 'gunes',
        'rüzgar', 'ruzgar',
        'hidroelektrik',
        'nükleer', 'nukleer',
        'termik',
        'petrol',
        'doğalgaz', 'dogalgaz',
        'maden',
        'taş', 'tas',
        'kum',
        'çimento', 'cimento',
        'demir',
        'çelik', 'celik',
        'alüminyum', 'aluminyum',
        'plastik',
        'ahşap', 'ahsap',
        'tekstil',
        'gıda', 'gida',
        'ilaç', 'ilac',
        'kimya',
        'otomotiv',
        'havacılık', 'havacilik',
        'denizcilik',
        'demiryolu', 'demiryolu',
        'karayolu',
        'ulaşım', 'ulasim',
        'tarım', 'tarim',
        'hayvancılık', 'hayvancilik',
        'ormancılık', 'ormancilik',
        'balıkçılık', 'balikcilik',
        'turizm',
        'spor',
        'eğlence', 'eglence',
        'kültür', 'kultur',
        'sanat',
        'medya',
        'iletişim', 'iletisim',
        'bilişim', 'bilisim',
        'yazılım', 'yazilim',
        'donanım', 'donanim',
        'elektronik',
        'telekomünikasyon', 'telekomunikasyon',
        'finans',
        'bankacılık', 'bankacilik',
        'sigorta',
        'emlak',
        'hukuk',
        'avukat',
        'doktor',
        'hemşire', 'hemsire',
        'mühendis', 'muhendis',
        'mimar',
        'teknisyen',
        'operatör', 'operator',
        'şoför', 'sofor',
        'kaptan',
        'pilot',
        'güvenlik', 'guvenlik',
        'temizlik',
        'aşçı', 'asci',
        'garson',
        'barmen',
        'kuaför', 'kuafor',
        'berber',
        'terzi',
        'marangoz',
        'demirci',
        'elektrikçi', 'elektrikci',
        'tesisatçı', 'tesisatci',
        'boyacı', 'boyaci',
        'sıvacı', 'sivaci',
        'duvarcı', 'duvarci',
        'çatıcı', 'catici',
        'izolasyon', 'izolasyon',
        'alçı', 'alci',
        'fayans',
        'seramik',
        'mozaik',
        'mermer',
        'granit',
        'parke',
        'laminat',
        'halı', 'hali',
        'perde',
        'mobilya',
        'dolap',
        'masa',
        'sandalye',
        'koltuk',
        'kanepe',
        'yatak',
        'yastık', 'yastik',
        'battaniye',
        'çarşaf', 'carsaf',
        'yorgan',
        'pike',
        'nevresim',
        'havlu',
        'bornoz',
        'terlik',
        'ayakkabı', 'ayakkabi',
        'çorap', 'corap',
        'gömlek', 'gomlek',
        'pantolon',
        'ceket',
        'palto',
        'mont',
        'kaban',
        'şapka', 'sapka',
        'bere',
        'eldiven',
        'atkı', 'atki',
        'kaşkol', 'kaskol',
        'gözlük', 'gozluk',
        'maske',
        'eldiven',
        'önlük', 'onluk',
        'iş', 'is',
        'elbise',
        'üniforma', 'uniforma',
        'kıyafet', 'kiyafet',
        'giyim',
        'ayakkabı', 'ayakkabi',
        'çanta', 'canta',
        'cüzdan', 'cuzdan',
        'anahtar',
        'kilit',
        'kapı', 'kapi',
        'pencere',
        'cam',
        'çerçeve', 'cerceve',
        'pimapen',
        'alüminyum', 'aluminyum',
        'PVC',
        'ahşap', 'ahsap',
        'demir',
        'çelik', 'celik',
        'paslanmaz',
        'krom',
        'nikel',
        'altın', 'altin',
        'gümüş', 'gumus',
        'bakır', 'bakir',
        'bronz',
        'pirinç', 'pirinc',
        'kurşun', 'kursun',
        'kalay',
        'çinko', 'cinko',
        'titanyum',
        'tungsten',
        'molibden',
        'vanadyum',
        'krom',
        'mangan',
        'kobalt',
        'nikel',
        'bakır', 'bakir',
        'çinko', 'cinko',
        'kalay',
        'kurşun', 'kursun',
        'cıva', 'civa',
        'kadmiyum',
        'arsenik',
        'selenyum',
        'tellür', 'tellur',
        'iyot',
        'flor',
        'klor',
        'brom',
        'astatin',
        'helyum',
        'neon',
        'argon',
        'kripton',
        'ksenon',
        'radon',
        'hidrojen',
        'lityum',
        'sodyum',
        'potasyum',
        'rubidyum',
        'sezyum',
        'fransiyum',
        'berilyum',
        'magnezyum',
        'kalsiyum',
        'stronsiyum',
        'baryum',
        'radyum',
        'skandiyum',
        'itriyum',
        'lantan',
        'aktinyum',
        'toryum',
        'protaktinyum',
        'uranyum',
        'neptünyum', 'neptunium',
        'plütonyum', 'plutonyum',
        'amerikyum',
        'küriyum', 'kuriyum',
        'berkelyum',
        'kaliforniyum',
        'aynştaynyum', 'aynstaynyum',
        'fermiyum',
        'mendelevyum',
        'nobelyum',
        'lavrensiyum',
        'rutherfordyum',
        'dubniyum',
        'seaborgyum',
        'bohriyum',
        'hassiyum',
        'meitneriyum',
        'darmstadtiyum',
        'roentgenyum',
        'kopernikyum',
        'nihonyum',
        'flerovyum',
        'moskovyum',
        'livermoryum',
        'tennessin',
        'oganeson'
    ];

    fileNames.forEach(fileName => {
        const lowerName = fileName.toLowerCase();
        
        // Dosya uzantısını kaldır
        const nameWithoutExt = lowerName.replace(/\.[^/.]+$/, '');
        
        // Kelimeleri ayır
        const words = nameWithoutExt.split(/[\s\-_\.]+/);
        
        words.forEach(word => {
            if (word.length > 2) { // 2 karakterden uzun kelimeler
                wordFrequency[word] = (wordFrequency[word] || 0) + 1;
            }
        });

        // Kategori pattern'lerini kontrol et
        categoryKeywords.forEach(keyword => {
            if (lowerName.includes(keyword)) {
                categoryPatterns[keyword] = (categoryPatterns[keyword] || 0) + 1;
            }
        });
    });

    // En sık geçen kelimeleri sırala
    const topWords = Object.entries(wordFrequency)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 50)
        .map(([word, count]) => ({ word, count }));

    // En sık geçen kategori pattern'lerini sırala
    const topCategories = Object.entries(categoryPatterns)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .map(([keyword, count]) => ({ keyword, count }));

    return {
        topWords,
        topCategories,
        totalUniqueWords: Object.keys(wordFrequency).length
    };
}

