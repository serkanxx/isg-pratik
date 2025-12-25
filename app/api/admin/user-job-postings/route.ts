import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADMIN_EMAIL = 'serkanxx@gmail.com';

// GET - Admin için kullanıcı ilanlarını listele
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email ||
            (session.user.email !== ADMIN_EMAIL && (session.user as any)?.role !== 'ADMIN')) {
            return NextResponse.json(
                { success: false, error: 'Yetkisiz erişim' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'pending';

        const where: any = {};
        if (status !== 'all') {
            where.status = status;
        }

        const postings = await prisma.userJobPosting.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: postings
        });
    } catch (error: any) {
        console.error('Admin ilanları listeleme hatası:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
