import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADMIN_EMAIL = 'serkanxx@gmail.com';

// PUT - Admin yorumu onayla/reddet
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    // Admin kontrolü
    if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
      const userRole = (session?.user as any)?.role;
      if (userRole !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Yetkisiz erişim - Sadece admin yorumları onaylayabilir' },
          { status: 403 }
        );
      }
    }

    // Admin kullanıcıyı bul
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Geçersiz durum. approved veya rejected olmalı' },
        { status: 400 }
      );
    }

    // Yorumu bul
    const comment = await prisma.jobComment.findUnique({
      where: { id }
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Yorum bulunamadı' },
        { status: 404 }
      );
    }

    // Yorumu güncelle
    const updatedComment = await prisma.jobComment.update({
      where: { id },
      data: {
        status,
        approvedAt: status === 'approved' ? new Date() : null,
        approvedBy: status === 'approved' ? adminUser.id : null
      },
      include: {
        user: {
          select: {
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
      }
    });

    return NextResponse.json({
      success: true,
      message: status === 'approved' ? 'Yorum onaylandı' : 'Yorum reddedildi',
      data: updatedComment
    });

  } catch (error: any) {
    console.error('Yorum güncellenemedi:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Yorum bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: `Sunucu hatası: ${error.message}` },
      { status: 500 }
    );
  }
}
