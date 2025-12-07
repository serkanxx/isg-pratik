import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
    try {
        const { sector, categories } = await request.json();

        if (!GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'Gemini API anahtarı yapılandırılmamış' },
                { status: 500 }
            );
        }

        // Tüm benzersiz source'ları topla
        const allSources: string[] = [];
        categories.forEach((cat: any) => {
            cat.items?.forEach((item: any) => {
                if (item.source && !allSources.includes(item.source)) {
                    allSources.push(item.source);
                }
            });
        });

        const sourceList = allSources.map((s, i) => `${i + 1}. ${s}`).join('\n');

        const prompt = `Sen bir iş sağlığı ve güvenliği (İSG) uzmanısın.

Kullanıcı "${sector}" sektörü için risk analizi yapmak istiyor.

Aşağıda risk kütüphanesindeki TÜM kaynak (source) isimleri var. 
"${sector}" sektöründe karşılaşılabilecek KAYNAKLARI seç.

SEÇME KURALLARI:
1. GENEL KAYNAKLARI MUTLAKA SEÇ: ELEKTRİK, YANGIN, TEMİZLİK, HİJYEN, ACİL DURUM, PERSONEL, TERTİP DÜZEN, BAKIM ONARIM - bunlar her sektör için geçerli.
2. "${sector}" sektörüne ÖZEL kaynakları seç.
3. Örneğin:
   - "nakliye" için: ARAÇ, TRAFİK, YÜKLEME, FORKLİFT, KAMYON, TIR, SÜRÜCÜ + genel kaynaklar
   - "inşaat" için: İSKELE, VİNÇ, KALIP, BETON, KAZIK, YÜKSEKTE ÇALIŞMA + genel kaynaklar
   - "restoran" için: MUTFAK, GIDA, BULAŞIK, PİŞİRME, SERVİS + genel kaynaklar
4. "${sector}" ile hiç ilgisi olmayan kaynakları SEÇME.

Kaynak Listesi:
${sourceList}

Yanıtını SADECE kaynak numaraları olarak ver (örn: 1, 3, 5, 12, 25), virgülle ayır.
Eğer hiçbir kaynak uygun değilse "YOK" yaz.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 500,
                    }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API hatası:', response.status, errorText);

            let errorMessage = 'Gemini API hatası';
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error?.message || errorMessage;
            } catch {
                errorMessage = errorText.substring(0, 200);
            }

            return NextResponse.json(
                { error: errorMessage },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Gemini yanıtından kaynak numaralarını çıkar
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // DEBUG
        console.log('=== AI DEBUG ===');
        console.log('Sektör:', sector);
        console.log('Toplam kaynak sayısı:', allSources.length);
        console.log('AI Yanıtı:', aiResponse);

        // Yanıtı temizle
        const cleanedResponse = aiResponse.trim().toUpperCase();

        if (cleanedResponse === 'YOK' || cleanedResponse === '') {
            return NextResponse.json({ selectedSources: [] });
        }

        // Kaynak numaralarını bul
        const numberMatches = cleanedResponse.match(/\d+/g) || [];
        const selectedIndices: number[] = Array.from(new Set(numberMatches.map((n: string) => parseInt(n) - 1)));

        // Seçilen kaynakları döndür
        const selectedSources = selectedIndices
            .filter(i => i >= 0 && i < allSources.length)
            .map(i => allSources[i]);

        console.log('Seçilen kaynaklar:', selectedSources);

        return NextResponse.json({
            selectedSources,
            rawResponse: aiResponse
        });

    } catch (error) {
        console.error('Sektör analizi hatası:', error);
        return NextResponse.json(
            { error: 'Sektör analizi yapılırken hata oluştu' },
            { status: 500 }
        );
    }
}
