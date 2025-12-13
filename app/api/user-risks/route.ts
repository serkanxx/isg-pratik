import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Sonraki risk numarasını hesapla
async function getNextRiskNo(): Promise<string> {
    const { data, error } = await supabase
        .from('user_risks')
        .select('risk_no')
        .order('risk_no', { ascending: false })
        .limit(1);

    if (error || !data || data.length === 0) {
        return '500.01';
    }

    const lastRiskNo = data[0].risk_no;
    const [major, minor] = lastRiskNo.split('.').map(Number);

    if (minor >= 99) {
        return `${major + 1}.01`;
    } else {
        return `${major}.${String(minor + 1).padStart(2, '0')}`;
    }
}

// GET - Kullanıcının kendi risk maddelerini listele
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('user_risks')
            .select('*')
            .eq('user_email', session.user.email)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Yeni risk maddesi ekle
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const nextRiskNo = await getNextRiskNo();

        const { data, error } = await supabase
            .from('user_risks')
            .insert({
                user_id: session.user.email,
                user_email: session.user.email,
                risk_no: nextRiskNo,
                category_name: body.category_name || 'Önerilen',
                sub_category: body.sub_category || '',
                source: body.source || '',
                hazard: body.hazard,
                risk: body.risk,
                affected: body.affected || 'Çalışanlar',
                probability: body.probability || 1,
                frequency: body.frequency || 1,
                severity: body.severity || 1,
                probability2: body.probability2 || 1,
                frequency2: body.frequency2 || 1,
                severity2: body.severity2 || 1,
                measures: body.measures || '',
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
