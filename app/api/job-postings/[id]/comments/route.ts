import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - İş ilanına ait onaylanmış yorumları listele
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // İlanın var olup olmadığını kontrol et
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id }
    });

    if (!jobPosting) {
      return NextResponse.json(
        { error: 'İş ilanı bulunamadı' },
        { status: 404 }
      );
    }

    // Sadece onaylanmış yorumları getir
    const comments = await prisma.jobComment.findMany({
      where: {
        jobPostingId: id,
        status: 'approved'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Kullanıcı adını gizleme kontrolü
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      userName: comment.isAnonymous ? 'Anonim' : comment.user.name || 'Kullanıcı',
      userEmail: comment.isAnonymous ? null : comment.user.email
    }));

    return NextResponse.json({
      success: true,
      data: formattedComments
    });

  } catch (error: any) {
    console.error('Yorumlar yüklenemedi:', error);
    return NextResponse.json(
      { error: `Sunucu hatası: ${error.message}` },
      { status: 500 }
    );
  }
}

// POST - İş ilanına yorum ekle
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    // Giriş kontrolü
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Yorum yapmak için giriş yapmalısınız' },
        { status: 401 }
      );
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // İlanın var olup olmadığını kontrol et
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id }
    });

    if (!jobPosting) {
      return NextResponse.json(
        { error: 'İş ilanı bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { content, isAnonymous } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Yorum içeriği boş olamaz' },
        { status: 400 }
      );
    }

    // Yorumu oluştur (pending durumunda)
    const comment = await prisma.jobComment.create({
      data: {
        jobPostingId: id,
        userId: user.id,
        content: content.trim(),
        isAnonymous: isAnonymous || false,
        status: 'pending'
      },
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
      message: 'Yorumunuz admin onayına sunuldu',
      data: {
        id: comment.id,
        content: comment.content,
        isAnonymous: comment.isAnonymous,
        status: comment.status,
        createdAt: comment.createdAt
      }
    });

  } catch (error: any) {
    console.error('Yorum eklenemedi:', error);
    
    // Prisma hatalarını daha anlaşılır hale getir
    let errorMessage = 'Yorum eklenirken bir hata oluştu';
    
    if (error.code === 'P2002') {
      errorMessage = 'Bu yorum zaten mevcut';
    } else if (error.code === 'P2003') {
      errorMessage = 'İş ilanı veya kullanıcı bulunamadı';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
