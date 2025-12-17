import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Tüm ziyaret programlarını getir
export async function GET() {
    try {
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

        const programs = await prisma.visitProgram.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(programs, {
            headers: {
                'Cache-Control': 'private, s-maxage=120, stale-while-revalidate=600',
            },
        });
    } catch (error) {
        console.error('Visit programs GET error:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

// Yeni ziyaret programı oluştur
export async function POST(request: Request) {
    try {
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

        if (!name || !type || !schedule || !companies) {
            return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });
        }

        const program = await prisma.visitProgram.create({
            data: {
                userId: userId,
                name,
                type,
                visitsPerDay: visitsPerDay || 3,
                schedule,
                companies,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null
            }
        });

        return NextResponse.json(program, { status: 201 });
    } catch (error) {
        console.error('Visit program POST error:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
