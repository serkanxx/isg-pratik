import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - İş ilanlarını listele
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const channel = searchParams.get('channel');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Filtre oluştur
    const where: any = {
      isActive: true
    };

    if (channel) {
      where.channelUsername = channel.replace('@', '');
    }

    if (search) {
      where.content = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Toplam sayı
    const total = await prisma.jobPosting.count({ where });

    // İlanları çek
    const jobPostings = await prisma.jobPosting.findMany({
      where,
      orderBy: {
        postedAt: 'desc'
      },
      skip,
      take: limit,
      select: {
        id: true,
        content: true,
        hasMedia: true,
        mediaUrl: true,
        postedAt: true,
        channelUsername: true,
        viewCount: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      data: jobPostings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { 
        error: `Sunucu hatası: ${error.message}`,
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        }
      },
      { status: 500 }
    );
  }
}

