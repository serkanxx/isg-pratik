import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Belirli programı getir
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
        }

        const program = await prisma.visitProgram.findFirst({
            where: {
                id: id,
                userId: user.id
            }
        });

        if (!program) {
            return NextResponse.json({ error: 'Program bulunamadı' }, { status: 404 });
        }

        return NextResponse.json(program);
    } catch (error) {
        console.error('Visit program GET error:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

// Programı güncelle
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
        }

        const body = await request.json();
        const { name, type, visitsPerDay, schedule, companies, startDate, endDate } = body;

        const program = await prisma.visitProgram.updateMany({
            where: {
                id: id,
                userId: user.id
            },
            data: {
                ...(name && { name }),
                ...(type && { type }),
                ...(visitsPerDay && { visitsPerDay }),
                ...(schedule && { schedule }),
                ...(companies && { companies }),
                ...(startDate && { startDate: new Date(startDate) }),
                ...(endDate && { endDate: new Date(endDate) })
            }
        });

        if (program.count === 0) {
            return NextResponse.json({ error: 'Program bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Visit program PUT error:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

// Programı sil
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
        }

        const result = await prisma.visitProgram.deleteMany({
            where: {
                id: id,
                userId: user.id
            }
        });

        if (result.count === 0) {
            return NextResponse.json({ error: 'Program bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Visit program DELETE error:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
