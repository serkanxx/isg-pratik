import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADMIN_EMAIL = 'serkanxx@gmail.com';

// DELETE - İş ilanını sil (sadece admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    // Admin kontrolü
    if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
      // Role kontrolü de yap
      const userRole = (session?.user as any)?.role;
      if (userRole !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Yetkisiz erişim - Sadece admin iş ilanlarını silebilir' },
          { status: 403 }
        );
      }
    }

    // İlanı bul ve sil
    const deleted = await prisma.jobPosting.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'İş ilanı başarıyla silindi',
      data: deleted
    });

  } catch (error: any) {
    console.error('Error:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'İş ilanı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: `Sunucu hatası: ${error.message}` },
      { status: 500 }
    );
  }
}
