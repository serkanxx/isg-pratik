import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAIL = 'serkanxx@gmail.com';

// GET - Admin için tüm kullanıcı risk önerilerini listele
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'pending';

        let query = supabase
            .from('user_risks')
            .select('*')
            .order('created_at', { ascending: false });

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT - Admin risk maddesini onayla/reddet
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { id, status } = body;

        if (!id || !['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Geçersiz parametreler' }, { status: 400 });
        }

        // Risk maddesini güncelle
        const { data: riskData, error: updateError } = await supabase
            .from('user_risks')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // Eğer onaylandıysa, risk_items'a ekle
        if (status === 'approved' && riskData) {
            const { error: insertError } = await supabase
                .from('risk_items')
                .insert({
                    main_category: riskData.category_name,
                    sub_category: riskData.sub_category,
                    source: riskData.source,
                    hazard: riskData.hazard,
                    risk: riskData.risk,
                    affected: riskData.affected,
                    p: riskData.probability,
                    f: riskData.frequency,
                    s: riskData.severity,
                    p2: riskData.probability2,
                    f2: riskData.frequency2,
                    s2: riskData.severity2,
                    measures: riskData.measures,
                    sector_tags: ['GENEL']
                });

            if (insertError) {
                console.error('risk_items ekleme hatası:', insertError);
                // Hata olsa bile devam et, user_risks güncellendi
            }
        }

        return NextResponse.json({ success: true, data: riskData });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
