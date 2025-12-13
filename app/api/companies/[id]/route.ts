import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Tek firma getir
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: company, error } = await supabase
            .from('companies')
            .select('*')
            .eq('id', id)
            .eq('user_id', session.user.email)
            .single();

        if (error || !company) {
            return NextResponse.json({ error: 'Firma bulunamadı' }, { status: 404 });
        }

        return NextResponse.json(company);
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

// PUT - Firma güncelle
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Gereksiz alanları çıkar
        const { id: _, user_id, created_at, ...updateData } = body;

        const { data: company, error } = await supabase
            .from('companies')
            .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', session.user.email)
            .select()
            .single();

        if (error) {
            console.error('Supabase update error:', error);
            return NextResponse.json({ error: 'Firma güncellenemedi: ' + error.message }, { status: 500 });
        }

        return NextResponse.json(company);
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

// DELETE - Firma sil (soft delete)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error } = await supabase
            .from('companies')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', session.user.email);

        if (error) {
            console.error('Supabase delete error:', error);
            return NextResponse.json({ error: 'Firma silinemedi' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
