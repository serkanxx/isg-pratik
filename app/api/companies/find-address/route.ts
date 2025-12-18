import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Türkiye il kodları mapping (01-81)
const IL_KODLARI: Record<string, string> = {
    '01': 'Adana', '02': 'Adıyaman', '03': 'Afyonkarahisar', '04': 'Ağrı',
    '05': 'Amasya', '06': 'Ankara', '07': 'Antalya', '08': 'Artvin',
    '09': 'Aydın', '10': 'Balıkesir', '11': 'Bilecik', '12': 'Bingöl',
    '13': 'Bitlis', '14': 'Bolu', '15': 'Burdur', '16': 'Bursa',
    '17': 'Çanakkale', '18': 'Çankırı', '19': 'Çorum', '20': 'Denizli',
    '21': 'Diyarbakır', '22': 'Edirne', '23': 'Elazığ', '24': 'Erzincan',
    '25': 'Erzurum', '26': 'Eskişehir', '27': 'Gaziantep', '28': 'Giresun',
    '29': 'Gümüşhane', '30': 'Hakkari', '31': 'Hatay', '32': 'Isparta',
    '33': 'Mersin', '34': 'İstanbul', '35': 'İzmir', '36': 'Kars',
    '37': 'Kastamonu', '38': 'Kayseri', '39': 'Kırklareli', '40': 'Kırşehir',
    '41': 'Kocaeli', '42': 'Konya', '43': 'Kütahya', '44': 'Malatya',
    '45': 'Manisa', '46': 'Kahramanmaraş', '47': 'Mardin', '48': 'Muğla',
    '49': 'Muş', '50': 'Nevşehir', '51': 'Niğde', '52': 'Ordu',
    '53': 'Rize', '54': 'Sakarya', '55': 'Samsun', '56': 'Siirt',
    '57': 'Sinop', '58': 'Sivas', '59': 'Tekirdağ', '60': 'Tokat',
    '61': 'Trabzon', '62': 'Tunceli', '63': 'Şanlıurfa', '64': 'Uşak',
    '65': 'Van', '66': 'Yozgat', '67': 'Zonguldak', '68': 'Aksaray',
    '69': 'Bayburt', '70': 'Karaman', '71': 'Kırıkkale', '72': 'Batman',
    '73': 'Şırnak', '74': 'Bartın', '75': 'Ardahan', '76': 'Iğdır',
    '77': 'Yalova', '78': 'Karabük', '79': 'Kilis', '80': 'Osmaniye',
    '81': 'Düzce'
};

// SGK sicil numarasından il kodunu çıkar (ilçe kontrolü yapılmıyor)
function extractLocationFromRegistration(registrationNumber: string): { ilKodu: string | null; ilAdi: string | null } {
    if (!registrationNumber || registrationNumber.length < 21) {
        return { ilKodu: null, ilAdi: null };
    }

    // Sadece rakamları al
    const cleanNum = registrationNumber.replace(/\D/g, '');
    
    if (cleanNum.length < 21) {
        return { ilKodu: null, ilAdi: null };
    }

    // 17-18-19. basamaklar (index 16-18) = il kodu
    const ilKodu = cleanNum.substring(16, 19);
    
    // İl kodunu il adına çevir
    const ilAdi = IL_KODLARI[ilKodu] || null;

    return { ilKodu, ilAdi };
}

// PositionStack API ile adres arama (daha iyi sonuçlar)
async function searchAddressPositionStack(query: string, apiKey: string, searchQuery: string, ilAdi: string | null): Promise<string | null> {
    try {
        let url = `https://api.positionstack.com/v1/forward?` +
            `access_key=${apiKey}&` +
            `query=${encodeURIComponent(searchQuery)}&` +
            `limit=1&` +
            `country=TR`;
        
        // İl bilgisi varsa region parametresine ekle
        if (ilAdi) {
            url += `&region=${encodeURIComponent(ilAdi)}`;
        }
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        
        // PositionStack API hata kontrolü
        if (data.error) {
            console.error('PositionStack API error:', data.error);
            return null;
        }
        
        if (data.data && data.data.length > 0) {
            const result = data.data[0];
            // Adres bilgilerini birleştir
            const addressParts = [
                result.street,
                result.district,
                result.locality,
                result.region,
                result.country
            ].filter(Boolean);
            
            if (addressParts.length > 0) {
                return addressParts.join(', ');
            }
        }
        
        return null;
    } catch (error) {
        console.error('PositionStack address search error:', error);
        return null;
    }
}

// Google Places API ile adres arama (en iyi sonuçlar)
async function searchAddressGooglePlaces(query: string, apiKey: string, searchQuery: string, ilAdi: string | null): Promise<string | null> {
    try {
        // Text Search API kullan
        let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
            `query=${encodeURIComponent(searchQuery)}&` +
            `key=${apiKey}&` +
            `language=tr&` +
            `region=tr`;
        
        // İl bilgisi varsa components parametresine ekle (daha spesifik arama)
        // Not: Google Places API components parametresi sınırlı, bu yüzden sorguya eklemek daha iyi
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        
        // Google Places API hata kontrolü
        if (data.status && data.status !== 'OK') {
            console.error('Google Places API error:', data.status, data.error_message);
            return null;
        }
        
        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            return result.formatted_address || null;
        }
        
        return null;
    } catch (error) {
        console.error('Google Places address search error:', error);
        return null;
    }
}

// Farklı arama stratejileri oluştur (sadece il bilgisi ile)
function generateSearchQueries(query: string, ilAdi: string | null): string[] {
    const trimmed = query.trim();
    const words = trimmed.split(/\s+/);
    
    const queries: string[] = [];
    
    // İl bilgisi varsa, arama sorgularına ekle
    const locationSuffix = ilAdi ? ` ${ilAdi}` : ' Türkiye';
    
    // 1. Tam firma adı + il adı + "adres"
    if (ilAdi) {
        queries.push(`${trimmed} adres ${ilAdi}`);
        queries.push(`${trimmed} ${ilAdi}`);
    } else {
        queries.push(`${trimmed} adres Türkiye`);
    }
    
    // 2. Tam firma adı + il adı
    queries.push(`${trimmed}${locationSuffix}`);
    
    // 3. İlk 5-6 kelime (uzun firma adları için)
    if (words.length > 5) {
        const firstWords = words.slice(0, 6).join(' ');
        if (ilAdi) {
            queries.push(`${firstWords} adres ${ilAdi}`);
            queries.push(`${firstWords} ${ilAdi}`);
        } else {
            queries.push(`${firstWords} adres Türkiye`);
            queries.push(`${firstWords} Türkiye`);
        }
    }
    
    // 4. İlk 3 kelime (kısa arama)
    if (words.length > 3) {
        const firstThree = words.slice(0, 3).join(' ');
        if (ilAdi) {
            queries.push(`${firstThree} adres ${ilAdi}`);
        } else {
            queries.push(`${firstThree} adres Türkiye`);
        }
    }
    
    // 5. Sadece firma adı (son çare)
    queries.push(trimmed);
    
    return queries;
}

// Ana adres arama fonksiyonu - önce PositionStack, sonra Google Places
async function searchAddress(query: string, registrationNumber?: string): Promise<string | null> {
    // Sicil numarasından il bilgisini çıkar (ilçe kontrolü yapılmıyor)
    const locationInfo = registrationNumber ? extractLocationFromRegistration(registrationNumber) : { ilKodu: null, ilAdi: null };
    
    const searchQueries = generateSearchQueries(query, locationInfo.ilAdi);
    
    // PositionStack API key kontrolü (öncelikli)
    const positionStackKey = process.env.POSITIONSTACK_API_KEY;
    if (positionStackKey) {
        for (const searchQuery of searchQueries) {
            const positionStackResult = await searchAddressPositionStack(query, positionStackKey, searchQuery, locationInfo.ilAdi);
            if (positionStackResult) return positionStackResult;
            // Her arama arasında kısa bir bekleme (rate limiting)
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    // Google Places API key kontrolü (fallback)
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (googleApiKey) {
        for (const searchQuery of searchQueries) {
            const googleResult = await searchAddressGooglePlaces(query, googleApiKey, searchQuery, locationInfo.ilAdi);
            if (googleResult) return googleResult;
            // Her arama arasında kısa bir bekleme (rate limiting)
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    // Fallback: Nominatim (ücretsiz ama daha az doğru)
    for (const searchQuery of searchQueries.slice(0, 2)) { // İlk 2 stratejiyi dene
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(searchQuery)}&` +
                `format=json&` +
                `limit=1&` +
                `addressdetails=1&` +
                `countrycodes=tr`,
                {
                    headers: {
                        'User-Agent': 'ISG-Uygulamasi/1.0'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    return data[0].display_name || null;
                }
            }
            
            // Rate limiting için bekle (Nominatim 1 req/sn)
            await new Promise(resolve => setTimeout(resolve, 1100));
        } catch (error) {
            console.error('Nominatim fallback error:', error);
        }
    }

    return null;
}

// POST - Toplu adres bulma
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { companies } = body as { companies: Array<{ title: string; address: string; registration_number?: string }> };

        if (!companies || !Array.isArray(companies) || companies.length === 0) {
            return NextResponse.json({
                error: 'Firma listesi bulunamadı'
            }, { status: 400 });
        }

        const results: Array<{ index: number; address: string | null; status: 'found' | 'not_found' | 'error' }> = [];

        // Her firma için adres ara (rate limiting için delay ekle)
        for (let i = 0; i < companies.length; i++) {
            const company = companies[i];
            
            // Eğer zaten adres varsa, atla
            if (company.address && company.address.trim() !== '') {
                results.push({
                    index: i,
                    address: company.address,
                    status: 'found'
                });
                continue;
            }

            try {
                // Rate limiting: Her firma için birden fazla arama stratejisi denendiği için
                // API'lere göre değişir: Google Places: 50 req/sn, PositionStack: 25 req/sn, Nominatim: 1 req/sn
                // Güvenli olması için 300ms bekle (birden fazla arama yapıldığı için)
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                const address = await searchAddress(company.title, company.registration_number);
                
                if (address) {
                    results.push({
                        index: i,
                        address: address,
                        status: 'found'
                    });
                } else {
                    results.push({
                        index: i,
                        address: null,
                        status: 'not_found'
                    });
                }
            } catch (error) {
                console.error(`Error searching address for company ${i}:`, error);
                results.push({
                    index: i,
                    address: null,
                    status: 'error'
                });
            }
        }

        return NextResponse.json({
            success: true,
            results: results
        });
    } catch (error) {
        console.error('Bulk address search error:', error);
        return NextResponse.json({
            error: 'Adres arama hatası'
        }, { status: 500 });
    }
}
