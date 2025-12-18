import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { prisma } from '@/lib/prisma';

// Telegram Webhook endpoint
// Bot'unuzu bu URL'ye yönlendirmeniz gerekir: https://yourdomain.com/api/telegram/webhook

export async function POST(request: Request) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: 'TELEGRAM_BOT_TOKEN bulunamadı' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const update = body;

    // Telegram update objesi
    // Kanal mesajları channel_post olarak gelir, normal mesajlar message olarak gelir
    const message = update.channel_post || update.message;
    let channelUsername = 'unknown';
    let messageId: number;
    let messageText = '';
    let messageDate: Date;
    let hasMedia = false;
    let mediaUrl: string | null = null;
    let shouldProcess = false;

    if (message) {
      // 1. Kanal mesajı (channel_post) - Bot'un gönderdiği mesajlar
      if (update.channel_post) {
        const chat = message.chat;
        channelUsername = chat.username || chat.title || 'unknown';
        messageId = message.message_id;
        messageText = message.text || message.caption || '';
        messageDate = new Date(message.date * 1000);
        shouldProcess = true;
      }
      // 2. Forward edilmiş kanal mesajı
      else if (update.message && update.message.forward_from_chat) {
        const forwardedChat = update.message.forward_from_chat;
        if (forwardedChat.type === 'channel') {
          channelUsername = forwardedChat.username || forwardedChat.title || 'unknown';
          // Forward edilen mesajın orijinal ID'sini kullan
          messageId = update.message.forward_from_message_id || message.message_id;
          messageText = message.text || message.caption || '';
          // Forward edilen mesajın tarihini kullan (eğer varsa)
          messageDate = message.forward_date 
            ? new Date(message.forward_date * 1000)
            : new Date(message.date * 1000);
          shouldProcess = true;
        }
      }
      // 3. Normal grup/kanal mesajı (bot grup üyesi ise)
      else if (update.message) {
        const chat = message.chat;
        if (chat.type === 'channel' || chat.type === 'supergroup') {
          channelUsername = chat.username || chat.title || 'unknown';
          messageId = message.message_id;
          messageText = message.text || message.caption || '';
          messageDate = new Date(message.date * 1000);
          shouldProcess = true;
        }
      }

      if (shouldProcess) {
        // Medya kontrolü
        hasMedia = !!(message.photo || message.video || message.document);

        if (message.photo && message.photo.length > 0) {
          // En büyük fotoğrafı al
          const largestPhoto = message.photo[message.photo.length - 1];
          const fileId = largestPhoto.file_id;
          mediaUrl = fileId;
        }

        // Duplicate kontrolü
        const existing = await prisma.jobPosting.findUnique({
          where: {
            telegramMessageId: messageId
          }
        });

        if (!existing) {
          // Veritabanına kaydet
          await prisma.jobPosting.create({
            data: {
              telegramMessageId: messageId,
              channelUsername: channelUsername,
              content: messageText,
              rawText: JSON.stringify(message),
              hasMedia: hasMedia,
              mediaUrl: mediaUrl,
              postedAt: messageDate,
              isActive: true
            }
          });

          console.log(`Yeni iş ilanı kaydedildi: ${messageId} - ${channelUsername}`);
        } else {
          console.log(`Mesaj zaten kayıtlı: ${messageId}`);
        }
      }
    }

    // Telegram'a OK döndür
    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    // Telegram'a hata döndürme, sadece logla
    return NextResponse.json({ ok: true }); // Telegram tekrar denemesin diye
  }
}

// GET - Webhook durumunu kontrol et
export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const hasToken = !!botToken;
  
  return NextResponse.json({
    message: 'Telegram Webhook endpoint aktif',
    status: hasToken ? 'ready' : 'missing_token',
    note: hasToken 
      ? 'Bot token bulundu. Webhook kurulumu yapılabilir.'
      : 'TELEGRAM_BOT_TOKEN environment variable bulunamadı. Lütfen .env.local dosyanıza ekleyin.',
    webhookUrl: 'https://www.isgpratik.com/api/telegram/webhook'
  });
}
