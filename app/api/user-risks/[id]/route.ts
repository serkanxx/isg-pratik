import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        db: {
            schema: 'public',
        },
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    }
);

// PUT - Risk maddesini güncelle
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { id } = await context.params;

        // Önce riskin bu kullanıcıya ait olduğunu kontrol et
        const { data: existingRisk, error: checkError } = await supabase
            .from('user_risks')
            .select('id, user_email')
            .eq('id', id)
            .single();

        if (checkError || !existingRisk) {
            return NextResponse.json({ error: 'Risk bulunamadı' }, { status: 404 });
        }

        if (existingRisk.user_email !== session.user.email) {
            return NextResponse.json({ error: 'Bu riski düzenleme yetkiniz yok' }, { status: 403 });
        }

        const { data, error } = await supabase
            .from('user_risks')
            .update({
                category_name: body.category_name,
                sub_category: body.sub_category,
                source: body.source,
                hazard: body.hazard,
                risk: body.risk,
                affected: body.affected,
                probability: body.probability,
                frequency: body.frequency,
                severity: body.severity,
                probability2: body.probability2,
                frequency2: body.frequency2,
                severity2: body.severity2,
                measures: body.measures,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Risk maddesini sil
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { id } = await context.params;

        // Önce riskin bu kullanıcıya ait olduğunu kontrol et
        const { data: existingRisk, error: checkError } = await supabase
            .from('user_risks')
            .select('id, user_email')
            .eq('id', id)
            .single();

        if (checkError || !existingRisk) {
            return NextResponse.json({ error: 'Risk bulunamadı' }, { status: 404 });
        }

        if (existingRisk.user_email !== session.user.email) {
            return NextResponse.json({ error: 'Bu riski silme yetkiniz yok' }, { status: 403 });
        }

        const { error } = await supabase
            .from('user_risks')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Risk maddesi silindi' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
