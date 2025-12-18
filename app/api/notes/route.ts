import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET - Notları getir
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // @ts-ignore
        const userId = session.user.id;
        if (!userId) {
            return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('company_id');
        const upcoming = searchParams.get('upcoming'); // 5 gün içindeki notlar

        let whereClause: any = { userId };

        // Firma bazlı filtreleme
        if (companyId) {
            whereClause.companyId = companyId;
        }

        // Yaklaşan hatırlatmalar (5 gün içinde, tamamlanmamış)
        if (upcoming === 'true') {
            const today = new Date();
            const fiveDaysLater = new Date();
            fiveDaysLater.setDate(today.getDate() + 5);

            whereClause.dueDate = {
                lte: fiveDaysLater,
                not: null
            };
            whereClause.isCompleted = false;
        }

        const notes = await prisma.note.findMany({
            where: whereClause,
            select: {
                id: true,
                companyId: true,
                content: true,
                dueDate: true,
                isCompleted: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: [
                { isCompleted: 'asc' },
                { dueDate: 'asc' },
                { createdAt: 'desc' }
            ]
        });

        return NextResponse.json(notes, {
            headers: {
                'Cache-Control': 'private, s-maxage=120, stale-while-revalidate=600',
            },
        });
    } catch (error) {
        console.error('Notları getirme hatası:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST - Yeni not ekle
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // @ts-ignore
        let userId = session.user.id;
        if (!userId) {
            const user = await prisma.user.findUnique({ where: { email: session.user.email } });
            if (user) userId = user.id;
            else return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        const { content, companyId, dueDate } = body;

        if (!content || content.trim() === '') {
            return NextResponse.json({ error: 'Not içeriği gerekli' }, { status: 400 });
        }

        const note = await prisma.note.create({
            data: {
                userId,
                content: content.trim(),
                companyId: companyId || null,
                dueDate: dueDate ? new Date(dueDate) : null
            }
        });

        return NextResponse.json(note);
    } catch (error) {
        console.error('Not ekleme hatası:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT - Not güncelle (tamamlandı işareti)
export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // @ts-ignore
        let userId = session.user.id;
        if (!userId) {
            const user = await prisma.user.findUnique({ where: { email: session.user.email } });
            if (user) userId = user.id;
            else return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        const { id, isCompleted, content, dueDate, companyId } = body;

        if (!id) {
            return NextResponse.json({ error: 'Not ID gerekli' }, { status: 400 });
        }

        const updateData: any = {};
        if (typeof isCompleted === 'boolean') updateData.isCompleted = isCompleted;
        if (content !== undefined) updateData.content = content.trim();
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
        if (companyId !== undefined) updateData.companyId = companyId || null;

        const note = await prisma.note.updateMany({
            where: { id, userId },
            data: updateData
        });

        return NextResponse.json({ success: true, updated: note.count });
    } catch (error) {
        console.error('Not güncelleme hatası:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE - Not sil
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // @ts-ignore
        let userId = session.user.id;
        if (!userId) {
            const user = await prisma.user.findUnique({ where: { email: session.user.email } });
            if (user) userId = user.id;
            else return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Not ID gerekli' }, { status: 400 });
        }

        const result = await prisma.note.deleteMany({
            where: { id, userId }
        });

        return NextResponse.json({ success: true, deleted: result.count });
    } catch (error) {
        console.error('Not silme hatası:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
