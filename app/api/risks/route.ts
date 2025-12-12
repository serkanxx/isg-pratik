import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';

const dataFilePath = path.join(process.cwd(), 'app/data/risks.json');

export async function GET() {
    try {
        const fileContents = fs.readFileSync(dataFilePath, 'utf8');
        const data = JSON.parse(fileContents);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 1. JSON dosyasına kaydet
        fs.writeFileSync(dataFilePath, JSON.stringify(body, null, 2), 'utf8');

        // 2. Supabase'e senkronize et (arka planda)
        syncToSupabase(body).catch(err => {
            console.error('Supabase senkronizasyon hatası:', err);
        });

        return NextResponse.json({ message: 'Data updated successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update data' }, { status: 500 });
    }
}

// Supabase senkronizasyon fonksiyonu
async function syncToSupabase(categories: any[]) {
    console.log('=== Supabase Senkronizasyonu Başlıyor ===');

    // Tüm kategorilerdeki risk maddelerini düz liste haline getir
    const allItems: any[] = [];

    for (const category of categories) {
        const categoryCode = category.code;
        const mainCategory = category.category;

        for (const item of category.items || []) {
            allItems.push({
                riskNo: item.riskNo || `${categoryCode}.${String(allItems.filter(i => i.category_code === categoryCode).length + 1).padStart(2, '0')}`,
                category_code: categoryCode,
                main_category: mainCategory,
                sub_category: item.sub_category || '',
                source: item.source || '',
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
                sector_tags: item.sector_tags || []
            });
        }
    }

    console.log(`Toplam ${allItems.length} madde Supabase'e yüklenecek`);

    // Mevcut verileri sil
    const { error: deleteError } = await supabase
        .from('risk_items')
        .delete()
        .neq('riskNo', '00.00-IMPOSSIBLE-VALUE');

    if (deleteError) {
        console.error('Silme hatası:', deleteError);
        throw deleteError;
    }

    // Batch olarak yükle (100'lük gruplar halinde)
    const batchSize = 100;
    let uploaded = 0;

    for (let i = 0; i < allItems.length; i += batchSize) {
        const batch = allItems.slice(i, i + batchSize);

        const { error: insertError } = await supabase
            .from('risk_items')
            .insert(batch);

        if (insertError) {
            console.error(`Batch ${i / batchSize} yükleme hatası:`, insertError);
        } else {
            uploaded += batch.length;
        }
    }

    console.log(`Supabase senkronizasyonu tamamlandı: ${uploaded}/${allItems.length} madde yüklendi`);
}
