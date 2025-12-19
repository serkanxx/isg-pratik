import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADMIN_EMAIL = 'serkanxx@gmail.com';

// GET - Admin için bekleyen yorumları listele
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Admin kontrolü
    if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
      const userRole = (session?.user as any)?.role;
      if (userRole !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Yetkisiz erişim - Sadece admin yorumları görebilir' },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    // Bekleyen yorumları getir (admin için kullanıcı bilgileri dahil)
    const comments = await prisma.jobComment.findMany({
      where: {
        status: status === 'all' ? undefined : status
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        jobPosting: {
          select: {
            id: true,
            content: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: comments
    });

  } catch (error: any) {
    console.error('Yorumlar yüklenemedi:', error);
    return NextResponse.json(
      { error: `Sunucu hatası: ${error.message}` },
      { status: 500 }
    );
  }
}
