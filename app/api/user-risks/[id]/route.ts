import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Tek risk maddesi getir
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { id } = await params;

        const { data, error } = await supabase
            .from('user_risks')
            .select('*')
            .eq('id', id)
            .eq('user_email', session.user.email)
            .single();

        if (error) throw error;
        if (!data) {
            return NextResponse.json({ error: 'Risk maddesi bulunamadı' }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT - Risk maddesini güncelle
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // Güncellenebilir alanlar (risk_no hariç - değiştirilemez)
        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        const allowedFields = [
            'category_name', 'sub_category', 'source', 'hazard', 'risk',
            'affected', 'probability', 'frequency', 'severity',
            'probability2', 'frequency2', 'severity2', 'measures'
        ];

        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        });

        const { data, error } = await supabase
            .from('user_risks')
            .update(updateData)
            .eq('id', id)
            .eq('user_email', session.user.email)
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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { id } = await params;

        const { error } = await supabase
            .from('user_risks')
            .delete()
            .eq('id', id)
            .eq('user_email', session.user.email);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
