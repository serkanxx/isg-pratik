import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - İş ilanlarını listele
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const city = searchParams.get('city'); // İl bazlı filtreleme

    const skip = (page - 1) * limit;

    // Filtre oluştur
    const where: any = {
      isActive: true
    };

    // Hem search hem city varsa, AND mantığı kullan (her ikisini de içeren mesajlar)
    if (search && city) {
      where.AND = [
        { content: { contains: search, mode: 'insensitive' } },
        { content: { contains: city.toLowerCase(), mode: 'insensitive' } }
      ];
    } else if (search) {
      where.content = {
        contains: search,
        mode: 'insensitive'
      };
    } else if (city) {
      // İl bazlı filtreleme (case-insensitive, fuzzy matching için içerikte arama)
      where.content = {
        contains: city.toLowerCase(),
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

