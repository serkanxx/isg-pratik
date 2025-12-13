import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Kullanıcının firmalarını listele
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: companies, error } = await supabase
            .from('companies')
            .select('*')
            .eq('user_id', session.user.email)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: 'Firmalar alınamadı' }, { status: 500 });
        }

        return NextResponse.json(companies || []);
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

// POST - Yeni firma ekle
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            title,
            address,
            registration_number,
            danger_class,
            logo,
            employer,
            igu,
            doctor,
            representative,
            support
        } = body;

        if (!title || !danger_class) {
            return NextResponse.json({ error: 'Firma unvanı ve tehlike sınıfı zorunludur' }, { status: 400 });
        }

        const { data: company, error } = await supabase
            .from('companies')
            .insert({
                user_id: session.user.email,
                title,
                address: address || '',
                registration_number: registration_number || '',
                danger_class,
                logo: logo || null,
                employer: employer || '',
                igu: igu || '',
                doctor: doctor || '',
                representative: representative || '',
                support: support || '',
                is_active: true
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return NextResponse.json({ error: 'Firma eklenemedi' }, { status: 500 });
        }

        return NextResponse.json(company);
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
