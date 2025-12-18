import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Test için manuel iş ilanı ekleme endpoint'i
// Sadece development için - production'da kaldırılmalı

export async function POST(request: Request) {
  // Production'da bu endpoint'i devre dışı bırak
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Bu endpoint sadece development için' },
      { status: 403 }
    );
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
