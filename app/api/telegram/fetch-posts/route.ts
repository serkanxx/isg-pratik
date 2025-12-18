import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { prisma } from '@/lib/prisma';

// Telegram Bot API ile kanal mesajlarını çekme
// NOT: Bot'un kanala admin olarak eklenmesi ve "Post Messages" yetkisi olması gerekir

export async function POST(request: Request) {
  try {
    const { channelUsername, limit = 50 } = await request.json();

    // Environment variables kontrolü
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: 'TELEGRAM_BOT_TOKEN environment variable bulunamadı' },
        { status: 500 }
      );
    }

    if (!channelUsername) {
      return NextResponse.json(
        { error: 'channelUsername parametresi gerekli' },
        { status: 400 }
      );
    }

    // Telegram Bot oluştur
    const bot = new TelegramBot(botToken, { polling: false });

    // Kanal bilgilerini al
    let channelId: string;
    try {
      const chat = await bot.getChat(`@${channelUsername.replace('@', '')}`);
      channelId = chat.id.toString();
    } catch (error: any) {
      return NextResponse.json(
        { error: `Kanal bulunamadı veya bot kanala erişemiyor: ${error.message}` },
        { status: 404 }
      );
    }

    // Son mesajları çek
    // Not: Telegram Bot API direkt olarak kanal mesajlarını çekemez
    // Bu yüzden alternatif yöntemler kullanmamız gerekiyor:
    // 1. Webhook ile yeni mesajları dinlemek (önerilen)
    // 2. Telegram Client API (MTProto) kullanmak
    // 3. Forward edilmiş mesajları takip etmek

    // Bu endpoint manuel olarak çağrıldığında, webhook'tan gelen mesajları
    // veritabanından çekebilir veya forward edilmiş mesajları işleyebilir

    // Şimdilik basit bir yaklaşım: Eğer bot kanalda ise ve mesajlar forward ediliyorsa
    // veya webhook ile mesajlar kaydediliyorsa, onları çekebiliriz

    // Alternatif: Telegram Client API kullanarak (daha gelişmiş)
    // Bu için @mtproto/core veya grammy gibi kütüphaneler gerekir

    return NextResponse.json({
      message: 'Telegram mesajları çekme işlemi başlatıldı',
      note: 'Bot\'un kanala admin olarak eklenmesi ve webhook kurulumu gerekir. Webhook endpoint: /api/telegram/webhook',
      channelId,
      channelUsername: channelUsername.replace('@', '')
    });

  } catch (error: any) {
    console.error('Telegram fetch error:', error);
    return NextResponse.json(
      { error: `Sunucu hatası: ${error.message}` },
      { status: 500 }
    );
  }
}

// GET - Son çekilen mesajların durumunu kontrol et
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelUsername = searchParams.get('channel');

    if (!channelUsername) {
      return NextResponse.json(
        { error: 'channel parametresi gerekli' },
        { status: 400 }
      );
    }

    const jobPostings = await prisma.jobPosting.findMany({
      where: {
        channelUsername: channelUsername.replace('@', ''),
        isActive: true
      },
      orderBy: {
        postedAt: 'desc'
      },
      take: 10,
      select: {
        id: true,
        content: true,
        postedAt: true,
        hasMedia: true,
        viewCount: true
      }
    });

    return NextResponse.json({
      count: jobPostings.length,
      posts: jobPostings
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: `Sunucu hatası: ${error.message}` },
      { status: 500 }
    );
  }
}
