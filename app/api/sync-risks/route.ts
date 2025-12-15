import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const dataFilePath = path.join(process.cwd(), 'app/data/risks.json');

interface RiskItem {
    riskNo: string;
    category_code: string;
    main_category: string;
    sub_category: string;
    source: string;
    hazard: string;
    risk: string;
    affected: string;
    responsible?: string;
    p: number;
    f: number;
    s: number;
    p2: number;
    f2: number;
    s2: number;
    measures: string;
    sector_tags: string[];
}

interface Category {
    code: string;
    category: string;
    items: any[];
}

export async function POST() {
    const session = await getServerSession(authOptions);

    // @ts-ignore
    if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('=== Çift Yönlü Senkronizasyon Başlıyor ===');

        // 1. Local JSON'dan veri oku
        const fileContents = await fs.promises.readFile(dataFilePath, 'utf8');
        const localCategories: Category[] = JSON.parse(fileContents);

        // Local verileri düz listeye çevir
        const localItems: Map<string, { item: any; categoryCode: string; mainCategory: string }> = new Map();
        for (const category of localCategories) {
            for (const item of category.items || []) {
                const riskNo = item.riskNo || '';
                if (riskNo) {
                    localItems.set(riskNo, {
                        item,
                        categoryCode: category.code,
                        mainCategory: category.category
                    });
                }
            }
        }
        console.log(`Local'de ${localItems.size} adet risk maddesi var`);

        // 2. Supabase'den tüm verileri çek
        const { data: supabaseData, error: fetchError } = await supabase
            .from('risk_items')
            .select('*');

        if (fetchError) {
            console.error('Supabase veri çekme hatası:', fetchError);
            throw fetchError;
        }

        const supabaseItems: Map<string, any> = new Map();
        for (const item of supabaseData || []) {
            // Supabase'de kolon adı risk_no (snake_case)
            const riskNo = item.risk_no || item.riskNo || '';
            if (riskNo) {
                supabaseItems.set(riskNo, item);
            }
        }
        console.log(`Supabase'de ${supabaseItems.size} adet risk maddesi var`);

        // 3. Karşılaştırma ve merge işlemi
        let supabaseToLocal = 0;  // Supabase'den local'e eklenen
        let localToSupabase = 0;  // Local'den Supabase'e eklenen
        let alreadyExists = 0;    // Zaten her ikisinde de var

        // Supabase'de olup local'de olmayan maddeleri bul ve local'e ekle
        const newLocalItems: { categoryCode: string; mainCategory: string; item: any }[] = [];

        for (const [riskNo, supaItem] of supabaseItems) {
            if (!localItems.has(riskNo)) {
                // Bu madde local'de yok, ekle (Supabase'de risk_no, local'de riskNo)
                newLocalItems.push({
                    categoryCode: supaItem.category_code || '99',
                    mainCategory: supaItem.main_category || 'DİĞER',
                    item: {
                        riskNo: riskNo,  // Map'ten gelen key'i kullan
                        sub_category: supaItem.sub_category || '',
                        source: supaItem.source || '',
                        hazard: supaItem.hazard || '',
                        risk: supaItem.risk || '',
                        affected: supaItem.affected || 'ÇALIŞANLAR',
                        p: supaItem.p || 1,
                        f: supaItem.f || 1,
                        s: supaItem.s || 1,
                        p2: supaItem.p2 || 1,
                        f2: supaItem.f2 || 1,
                        s2: supaItem.s2 || 1,
                        measures: supaItem.measures || '',
                        sector_tags: supaItem.sector_tags || []
                    }
                });
                supabaseToLocal++;
            } else {
                alreadyExists++;
            }
        }

        // Yeni maddeleri local kategorilere ekle
        for (const newItem of newLocalItems) {
            let categoryFound = false;

            for (const category of localCategories) {
                if (category.code === newItem.categoryCode) {
                    category.items.push(newItem.item);
                    categoryFound = true;
                    break;
                }
            }

            // Kategori bulunamazsa yeni kategori oluştur
            if (!categoryFound) {
                localCategories.push({
                    code: newItem.categoryCode,
                    category: newItem.mainCategory,
                    items: [newItem.item]
                });
            }
        }

        // 4. Local'de olup Supabase'de olmayan maddeleri bul
        const newSupabaseItems: any[] = [];

        for (const [riskNo, localData] of localItems) {
            if (!supabaseItems.has(riskNo)) {
                // Bu madde Supabase'de yok, ekle - SNAKE_CASE kolon isimleri kullan
                newSupabaseItems.push({
                    risk_no: riskNo,  // riskNo değil, risk_no
                    category_code: localData.categoryCode,
                    main_category: localData.mainCategory,
                    sub_category: localData.item.sub_category || '',
                    source: localData.item.source || '',
                    hazard: localData.item.hazard || '',
                    risk: localData.item.risk || '',
                    affected: localData.item.affected || 'ÇALIŞANLAR',
                    responsible: localData.item.responsible || 'İŞVEREN / İŞVEREN VEKİLİ',
                    p: parseFloat(localData.item.p) || 1,
                    f: parseFloat(localData.item.f) || 1,
                    s: parseFloat(localData.item.s) || 1,
                    p2: parseFloat(localData.item.p2) || 1,
                    f2: parseFloat(localData.item.f2) || 1,
                    s2: parseFloat(localData.item.s2) || 1,
                    measures: localData.item.measures || '',
                    sector_tags: localData.item.sector_tags || []
                });
                localToSupabase++;
            }
        }

        // 5. Local JSON dosyasını güncelle
        if (supabaseToLocal > 0) {
            await fs.promises.writeFile(dataFilePath, JSON.stringify(localCategories, null, 2), 'utf8');
            console.log(`Local JSON güncellendi: ${supabaseToLocal} yeni madde eklendi`);
        }

        // 6. Supabase'e yeni maddeleri ekle (batch olarak)
        let uploaded = 0;
        let insertErrors: string[] = [];

        if (newSupabaseItems.length > 0) {
            const batchSize = 100;

            // İlk batch'i logla - debugging için
            console.log('İlk batch örnek veri:', JSON.stringify(newSupabaseItems[0], null, 2));

            for (let i = 0; i < newSupabaseItems.length; i += batchSize) {
                const batch = newSupabaseItems.slice(i, i + batchSize);

                const { error: insertError, data: insertData } = await supabase
                    .from('risk_items')
                    .insert(batch)
                    .select();

                if (insertError) {
                    console.error(`Batch ${Math.floor(i / batchSize) + 1} yükleme hatası:`, insertError);
                    insertErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${insertError.message}`);
                } else {
                    uploaded += batch.length;
                    if (i === 0) {
                        console.log('İlk batch başarıyla yüklendi, örnek:', insertData?.[0]);
                    }
                }
            }
            console.log(`Supabase'e ${uploaded}/${newSupabaseItems.length} yeni madde eklendi`);
        }

        // Sonuç raporu - gerçek değerleri göster
        const report = {
            localToSupabase,
            supabaseToLocal,
            alreadyExists,
            uploaded,  // Gerçekten yüklenen sayı
            totalLocal: localItems.size + supabaseToLocal,
            totalSupabase: supabaseItems.size + uploaded,  // uploaded kullan, localToSupabase değil
            errors: insertErrors.length > 0 ? insertErrors : undefined
        };

        console.log('=== Senkronizasyon Tamamlandı ===');
        console.log(report);

        return NextResponse.json({
            success: insertErrors.length === 0,
            message: insertErrors.length > 0
                ? `Senkronizasyon tamamlandı ama bazı hatalar oluştu`
                : 'Senkronizasyon başarıyla tamamlandı',
            report
        });

    } catch (error: any) {
        console.error('Senkronizasyon hatası:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Senkronizasyon sırasında hata oluştu' },
            { status: 500 }
        );
    }
}
