import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Sektör etiketleri listesi (veritabanında kullanılan)
const SECTOR_TAGS = [
    // Sanayi / Üretim
    "fabrika", "atölye", "tersane", "maden", "rafineri", "santral", "baraj", "enerji",
    "demirçelik", "döküm", "haddehane", "metal", "kaynak", "torna", "tesviye", "kaplama",
    "galvano", "otomotiv", "yedekparça", "lastik", "plastik", "kauçuk", "kimya", "boya",
    "vernik", "gübre", "ilaç", "kozmetik", "cam", "seramik", "porselen", "çimento", "beton",
    "tuğla", "kiremit", "mermer", "taşocağı", "tekstil", "konfeksiyon", "iplik", "dokuma",
    "örme", "boyahane", "tabakhane", "deri", "ayakkabı", "çanta", "saraciye", "mobilya",
    "kereste", "hızar", "marangoz", "doğrama", "kağıt", "selüloz", "matbaa", "ambalaj",
    "dolum", "şişeleme", "gıda", "enjeksiyon", "kalıp", "montaj", "geridönüşüm", "arıtma",
    "silah", "güvenlik", "havacılık",

    // İnşaat / Yapı
    "inşaat", "şantiye", "mimarlık", "mühendislik", "zemin", "hafriyat", "yıkım",
    "dekorasyon", "tadilat", "tamirhane", "servis", "otoservis", "kaporta",
    "elektrik", "tesisat", "doğalgaz", "iklimlendirme", "havalandırma", "asansör",
    "yürüyenmerdiven", "izolasyon", "yalıtım", "çatı", "cephe", "camcı", "alüminyum",
    "pvc", "demirci", "kaynakçı", "peyzaj", "bahçe", "havuz", "sondaj", "iskele",
    "vinç", "yol", "köprü", "tünel",

    // Sağlık / Bakım
    "hastane", "klinik", "poliklinik", "sağlıkocağı", "revir", "acil",
    "ambulans", "eczane", "laboratuvar", "röntgen", "dişçi", "ortodonti", "optik",
    "medikal", "ortopedi", "veteriner", "diyetisyen", "psikolog", "psikiyatri",
    "fiziktedavi", "rehabilitasyon", "huzurevi", "bakımevi", "kreş",
    "güzelliksalonu", "estetik", "saçekim", "kuaför", "berber", "ağda", "solaryum",
    "spa", "masaj", "hamam", "sauna", "kaplıca", "dövme",

    // Ticaret / Perakende
    "market", "kasap", "balıkçı", "fırın", "pastane", "tatlıcı", "çiçekçi", "kuyumcu",
    "gözlükçü", "butik", "mağaza", "avm", "showroom", "tuhafiye", "beyazeşya",
    "telefoncu", "bilgisayarcı", "kırtasiye", "kitapçı", "oyuncakçı", "spor", "av",
    "outdoor", "petshop", "akvaryum", "hırdavat", "nalbur", "boyacı", "ikinciel", "pazaryeri",

    // Konaklama / Yiyecek-İçecek
    "otel", "restoran", "kafe", "kantin", "yemekhane", "catering", "bar", "pub",
    "geceklübü", "düğünsalonu", "organizasyon",

    // Ofis / Hizmet
    "ofis", "büro", "banka", "sigorta", "eksper", "muhasebe", "hukuk", "noter",
    "danışmanlık", "osgb", "çevre", "kalite", "gümrük", "ajans", "medya",
    "bilişim", "çağrımerkezi", "emlak", "gayrimenkul", "yönetim", "siteyönetimi",
    "kooperatif", "dernek",

    // Lojistik / Ulaşım
    "lojistik", "nakliye", "taşımacılık", "kargo", "kurye", "dağıtım", "antrepo",
    "hangar", "soğukhava", "liman", "marina", "havalimanı", "apron", "terminal",
    "otogar", "gar", "istasyon", "metro", "tramvay", "teleferik", "otobüs", "minibüs",
    "taksi", "rentacar", "filo", "otopark", "vale", "yıkama", "otokuaför", "akaryakıt",

    // Eğitim / Kültür
    "okul", "enstitü", "dershane", "kurs", "sürücükursu", "tiyatro", "sinema",
    "müze", "galeri", "sergi", "kütüphane", "arşiv", "yayınevi", "basın",
    "tv", "radyo", "stüdyo",

    // Tarım / Hayvancılık
    "tarım", "çiftlik", "sera", "hayvancılık", "ahır", "tavukçuluk", "mandıra",
    "arıcılık", "balıkçılık", "binicilik",

    // Spor / Eğlence
    "sporsalonu", "stadyum", "halısaha", "plaj", "aquapark", "lunapark", "oyunsalonu",
    "internetkafe", "poligon", "karting", "paintball", "kayakmerkezi",

    // Diğer Hizmetler
    "temizlik", "çamaşırhane", "kurutemizleme", "ütücü", "halıyıkama", "terzi",
    "tamirci", "ayakkabıcı", "lostra", "anahtarcı", "çilingir", "fotoğrafçı",
    "fuar", "kongre",

    // Genel
    "genel"
];

export async function POST(request: NextRequest) {
    try {
        const { query, limit = 10000 } = await request.json(); // Sınırsız - tüm sonuçları getir
        const sectorInput = query.trim().toLowerCase();

        if (!sectorInput || sectorInput.length < 2) {
            return NextResponse.json(
                { error: 'Arama sorgusu en az 2 karakter olmalıdır.' },
                { status: 400 }
            );
        }

        /*
        console.log('=== Sector Tags Arama ===');
        console.log('Aranan sektör:', sectorInput);
        */

        // Kullanıcı girdisine TAM eşleşen veya başlayan sektör etiketlerini bul
        // Önce tam eşleşme kontrolü
        let matchingTags = SECTOR_TAGS.filter(tag =>
            tag === sectorInput || tag.startsWith(sectorInput)
        );

        // Eğer tam eşleşme yoksa, içerenleri de kontrol et (daha esnek arama)
        if (matchingTags.length === 0) {
            matchingTags = SECTOR_TAGS.filter(tag => 
                tag.includes(sectorInput) || sectorInput.includes(tag)
            );
        }

        // Eğer hala eşleşme yoksa, benzerlik kontrolü yap (Türkçe karakterler için)
        if (matchingTags.length === 0) {
            // Türkçe karakterleri normalize et
            const normalize = (str: string) => str
                .toLowerCase()
                .replace(/ı/g, 'i').replace(/İ/g, 'i')
                .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
                .replace(/ü/g, 'u').replace(/Ü/g, 'u')
                .replace(/ş/g, 's').replace(/Ş/g, 's')
                .replace(/ö/g, 'o').replace(/Ö/g, 'o')
                .replace(/ç/g, 'c').replace(/Ç/g, 'c');

            const normalizedInput = normalize(sectorInput);
            matchingTags = SECTOR_TAGS.filter(tag => {
                const normalizedTag = normalize(tag);
                return normalizedTag === normalizedInput || 
                       normalizedTag.includes(normalizedInput) || 
                       normalizedInput.includes(normalizedTag);
            });
        }

        // Eğer hala eşleşme yoksa, kullanıcı girdisini doğrudan kullan
        if (matchingTags.length === 0) {
            matchingTags = [sectorInput];
        }

        // console.log('Eşleşen etiketler:', matchingTags);

        // 1. Sektör etiketleriyle eşleşen kayıtları bul
        let sectorResults: any[] = [];
        let searchMethod = 'overlaps';
        const seenIds = new Set<string | number>();

        try {
            // Önce overlaps ile dene (PostgreSQL array intersection)
            const { data: overlapsResults, error: overlapsError } = await supabase
                .from('risk_items')
                .select('*')
                .overlaps('sector_tags', matchingTags)
                .limit(limit);

            if (overlapsError || !overlapsResults || overlapsResults.length === 0) {
                console.log('Overlaps sorgu hatası veya sonuç yok:', overlapsError?.message || 'Sonuç bulunamadı');
                // Fallback: contains ile tek tek ara
                searchMethod = 'contains_fallback';

                // Tüm eşleşen tag'ler için arama yap (limit artırıldı)
                for (const tag of matchingTags.slice(0, 5)) { // İlk 5 tag ile ara
                    const { data: containsResults, error: containsError } = await supabase
                        .from('risk_items')
                        .select('*')
                        .contains('sector_tags', [tag])
                        .limit(1000);

                    if (!containsError && containsResults) {
                        containsResults.forEach((item: any) => {
                            // Duplicate kontrolü - ID bazında
                            if (item.id && !seenIds.has(item.id)) {
                                seenIds.add(item.id);
                                sectorResults.push(item);
                            } else if (!item.id && item.riskNo && !seenIds.has(item.riskNo)) {
                                seenIds.add(item.riskNo);
                                sectorResults.push(item);
                            }
                        });
                    }
                }

                // Eğer contains de başarısız olursa veya sonuç azsa, text search yap
                if (sectorResults.length === 0 || sectorResults.length < 10) {
                    searchMethod = 'text_search_fallback';
                    
                    // Her tag için ayrı ayrı text search yap
                    for (const tag of matchingTags.slice(0, 3)) {
                        const { data: textResults, error: textError } = await supabase
                            .from('risk_items')
                            .select('*')
                            .or(`main_category.ilike.%${tag}%,sub_category.ilike.%${tag}%,source.ilike.%${tag}%,hazard.ilike.%${tag}%,risk.ilike.%${tag}%`)
                            .limit(500);

                        if (!textError && textResults) {
                            textResults.forEach((item: any) => {
                                // Duplicate kontrolü
                                if (item.id && !seenIds.has(item.id)) {
                                    seenIds.add(item.id);
                                    sectorResults.push(item);
                                } else if (!item.id && item.riskNo && !seenIds.has(item.riskNo)) {
                                    seenIds.add(item.riskNo);
                                    sectorResults.push(item);
                                }
                            });
                        }
                    }
                }
            } else {
                sectorResults = overlapsResults || [];
                // Overlaps sonuçlarını da seenIds'e ekle
                sectorResults.forEach((item: any) => {
                    if (item.id) seenIds.add(item.id);
                    else if (item.riskNo) seenIds.add(item.riskNo);
                });
            }
        } catch (searchError) {
            console.error('Sektör arama genel hatası:', searchError);
            searchMethod = 'error_fallback';
        }

        console.log(`Arama yöntemi: ${searchMethod}, Sektör sonuç sayısı: ${sectorResults.length}`);

        // 2. sector_tags'de sadece "genel" olan maddeleri getir (tüm aramalar için)
        let generalTagResults: any[] = [];
        try {
            // sector_tags array'inde sadece "genel" string'i olan maddeleri bul
            const { data: generalTagData, error: generalTagError } = await supabase
                .from('risk_items')
                .select('*')
                .contains('sector_tags', ['genel'])
                .limit(limit);

            if (generalTagError) {
                console.error('Genel tag arama hatası:', generalTagError);
                // Fallback: overlaps ile dene
                try {
                    const { data: overlapsGeneralData, error: overlapsGeneralError } = await supabase
                        .from('risk_items')
                        .select('*')
                        .overlaps('sector_tags', ['genel'])
                        .limit(limit);

                    if (!overlapsGeneralError && overlapsGeneralData) {
                        // Sadece sector_tags'de sadece "genel" olanları filtrele
                        generalTagResults = overlapsGeneralData.filter((item: any) => {
                            const tags = item.sector_tags || [];
                            return tags.length === 1 && tags[0] === 'genel';
                        });
                    }
                } catch (fallbackError) {
                    console.error('Genel tag fallback hatası:', fallbackError);
                }
            } else if (generalTagData) {
                // contains ile gelen sonuçlarda sadece "genel" olanları filtrele
                generalTagResults = generalTagData.filter((item: any) => {
                    const tags = item.sector_tags || [];
                    // Sadece "genel" içeren ve başka tag olmayan maddeler
                    return tags.length === 1 && tags[0] === 'genel';
                });
            }

            console.log(`Sector_tags'de sadece "genel" olan maddeler: ${generalTagResults.length}`);
        } catch (generalTagSearchError) {
            console.error('Genel tag arama genel hatası:', generalTagSearchError);
        }

        // 3. Kategori 278 "GENEL (TÜM SEKTÖRLER)" içindeki TÜM maddeleri ayrıca getir
        // Hem string '278' hem de integer 278 olarak dene, ayrıca riskNo ile de kontrol et
        let generalResults: any[] = [];

        // İlk önce string olarak dene
        const { data: generalStringResults, error: generalStringError } = await supabase
            .from('risk_items')
            .select('id,riskNo,sub_category,source,hazard,risk,affected,responsible,p,f,s,p2,f2,s2,measures,category_code,main_category,sector_tags')
            .eq('category_code', '278');

        if (generalStringError) {
            console.error('Genel kategori (string) arama hatası:', generalStringError);
        } else if (generalStringResults && generalStringResults.length > 0) {
            generalResults = generalStringResults;
            // console.log('Genel sonuçları (string 278):', generalResults.length);
        }

        // Eğer string sonuç boşsa, integer olarak dene
        if (generalResults.length === 0) {
            const { data: generalIntResults, error: generalIntError } = await supabase
                .from('risk_items')
                .select('*')
                .eq('category_code', 278);

            if (generalIntError) {
                console.error('Genel kategori (int) arama hatası:', generalIntError);
            } else if (generalIntResults && generalIntResults.length > 0) {
                generalResults = generalIntResults;
                // console.log('Genel sonuçları (int 278):', generalResults.length);
            }
        }

        // Hala boşsa, riskNo ile başlayanları getir
        if (generalResults.length === 0) {
            const { data: riskNoResults, error: riskNoError } = await supabase
                .from('risk_items')
                .select('*')
                .ilike('riskNo', '278.%');

            if (riskNoError) {
                console.error('Genel kategori (riskNo) arama hatası:', riskNoError);
            } else if (riskNoResults && riskNoResults.length > 0) {
                generalResults = riskNoResults;
                // console.log('Genel sonuçları (riskNo 278.%):', generalResults.length);
            }
        }

        // Son çare: main_category'de GENEL geçenleri getir
        if (generalResults.length === 0) {
            const { data: mainCatResults, error: mainCatError } = await supabase
                .from('risk_items')
                .select('*')
                .ilike('main_category', '%GENEL%');

            if (mainCatError) {
                console.error('Genel kategori (main_category) arama hatası:', mainCatError);
            } else if (mainCatResults && mainCatResults.length > 0) {
                generalResults = mainCatResults;
                // console.log('Genel sonuçları (main_category GENEL):', generalResults.length);
            }
        }

        // Sonuçları birleştir - riskNo bazında tekrarları önle (ID değil)
        // Genel kategori maddelerini öncelikle ekle ki category_code korunsun
        const allResults: any[] = [];
        const existingRiskNos = new Set<string>();

        // 1. Önce genel kategori (278) sonuçlarını ekle - bunların category_code'u doğru
        (generalResults || []).forEach((item: any) => {
            const riskNo = item.riskNo || '';
            if (riskNo && !existingRiskNos.has(riskNo)) {
                existingRiskNos.add(riskNo);
                allResults.push(item);
            }
        });

        const generalCategoryCount = allResults.length;

        // 2. Sonra sector_tags'de sadece "genel" olan maddeleri ekle
        (generalTagResults || []).forEach((item: any) => {
            const riskNo = item.riskNo || '';
            // riskNo boşsa veya daha önce eklenmediyse ekle
            if (!riskNo || !existingRiskNos.has(riskNo)) {
                if (riskNo) existingRiskNos.add(riskNo);
                allResults.push(item);
            }
        });

        const generalTagCount = allResults.length - generalCategoryCount;

        // 3. Son olarak sektör sonuçlarını ekle (duplicateleri hariç tut)
        (sectorResults || []).forEach((item: any) => {
            const riskNo = item.riskNo || '';
            // riskNo boşsa veya daha önce eklenmediyse ekle
            if (!riskNo || !existingRiskNos.has(riskNo)) {
                if (riskNo) existingRiskNos.add(riskNo);
                allResults.push(item);
            }
        });

        /*
        console.log('Sektör sonuçları:', sectorResults?.length || 0);
        console.log('Genel sonuçları (final):', generalResults?.length || 0);
        console.log('Genel kategori eklenen:', generalAddedCount);
        console.log('Toplam sonuç:', allResults.length);
        */

        // Sonuçları düzenle
        const formattedResults = (allResults || []).map((item: any) => ({
            riskNo: item.riskNo || '',
            source: item.source || '',
            sub_category: item.sub_category || '',
            hazard: item.hazard || '',
            risk: item.risk || '',
            affected: item.affected || 'ÇALIŞANLAR',
            responsible: item.responsible || 'İŞVEREN / İŞVEREN VEKİLİ',
            p: parseFloat(item.p) || 1,
            f: parseFloat(item.f) || 1,
            s: parseFloat(item.s) || 1,
            p2: parseFloat(item.p2) || 1,
            f2: parseFloat(item.f2) || 1,
            s2: parseFloat(item.s2) || 1,
            measures: item.measures || '',
            category_code: item.category_code?.toString() || '99',
            main_category: item.main_category || '',
            sector_tags: item.sector_tags || []
        }));

        return NextResponse.json({
            results: formattedResults,
            method: searchMethod,
            matchedTags: matchingTags,
            count: formattedResults.length,
            sectorCount: sectorResults?.length || 0,
            generalCount: generalResults?.length || 0,
            generalTagCount: generalTagResults?.length || 0
        });

    } catch (error: any) {
        console.error('Arama hatası:', error);
        return NextResponse.json(
            { error: error.message || 'Arama sırasında bir hata oluştu' },
            { status: 500 }
        );
    }
}
