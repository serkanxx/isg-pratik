import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Test için manuel iş ilanı ekleme endpoint'i
// Production'da secret key ile korunur

export async function POST(request: Request) {
  // Production'da secret key kontrolü
  if (process.env.NODE_ENV === 'production') {
    const { searchParams } = new URL(request.url);
    const secretKey = searchParams.get('key') || request.headers.get('x-test-key');
    const expectedKey = process.env.TEST_API_SECRET_KEY || 'test-secret-key-change-in-production';
    
    if (secretKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized - Secret key gerekli' },
        { status: 401 }
      );
    }
  }

  try {
    // Veritabanı bağlantı kontrolü
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL bulunamadı');
      return NextResponse.json(
        { error: 'Veritabanı bağlantı bilgisi bulunamadı' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { content, channelUsername } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'content parametresi gerekli' },
        { status: 400 }
      );
    }

    // Test verisi oluştur
    const testPosting = await prisma.jobPosting.create({
      data: {
        telegramMessageId: Date.now(), // Test için unique ID
        channelUsername: channelUsername || 'test_channel',
        content: content,
        rawText: JSON.stringify({ test: true }),
        hasMedia: false,
        mediaUrl: null,
        postedAt: new Date(),
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Test iş ilanı eklendi',
      data: testPosting
    });

  } catch (error: any) {
    console.error('Error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    
    // Daha detaylı hata mesajı
    const errorMessage = error.message || 'Bilinmeyen hata';
    const errorName = error.name || 'UnknownError';
    
    return NextResponse.json(
      { 
        error: `Sunucu hatası: ${errorMessage}`,
        errorType: errorName,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
