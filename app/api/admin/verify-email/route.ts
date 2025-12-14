import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    // Only admin can verify emails manually
    if (!session || session.user?.email !== 'serkanxx@gmail.com') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await request.json();

    const { data, error } = await supabaseAdmin
        .from('User')
        .update({ emailVerified: new Date().toISOString() })
        .eq('email', email)
        .select();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
}
