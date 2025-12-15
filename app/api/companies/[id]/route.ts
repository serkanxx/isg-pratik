import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
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

        // Kullanıcı ID'sini bul
        let userId = (session.user as any).id;
        if (!userId) {
            const user = await prisma.user.findUnique({ where: { email: session.user.email } });
            if (user) userId = user.id;
            else return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const company = await prisma.company.findFirst({
            where: {
                id: id,
                user_id: userId
            }
        });

        if (!company) {
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

        // Kullanıcı ID'sini bul
        let userId = (session.user as any).id;
        if (!userId) {
            const user = await prisma.user.findUnique({ where: { email: session.user.email } });
            if (user) userId = user.id;
            else return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();

        // Gereksiz alanları çıkar ve güvenli güncelleme yap
        const { id: _, user_id: __, created_at: ___, updated_at: ____, ...updateData } = body;

        // Önce firma var mı kontrol et (ve kullanıcıya ait mi)
        const existingCompany = await prisma.company.findFirst({
            where: { id, user_id: userId }
        });

        if (!existingCompany) {
            return NextResponse.json({ error: 'Firma bulunamadı veya yetkiniz yok' }, { status: 404 });
        }

        const company = await prisma.company.update({
            where: { id },
            data: {
                ...updateData
            }
        });

        return NextResponse.json(company);
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Sunucu hatası: ' + (error as Error).message }, { status: 500 });
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

        // Kullanıcı ID'sini bul
        let userId = (session.user as any).id;
        if (!userId) {
            const user = await prisma.user.findUnique({ where: { email: session.user.email } });
            if (user) userId = user.id;
            else return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Önce firma var mı kontrol et
        const existingCompany = await prisma.company.findFirst({
            where: { id, user_id: userId }
        });

        if (!existingCompany) {
            return NextResponse.json({ error: 'Firma bulunamadı veya yetkiniz yok' }, { status: 404 });
        }

        await prisma.company.update({
            where: { id },
            data: { is_active: false }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
