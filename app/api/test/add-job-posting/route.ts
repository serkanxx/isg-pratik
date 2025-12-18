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
    return NextResponse.json(
      { error: `Sunucu hatası: ${error.message}` },
      { status: 500 }
    );
  }
}
