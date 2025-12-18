import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { prisma } from '@/lib/prisma';

// Telegram Webhook endpoint
// Bot'unuzu bu URL'ye yönlendirmeniz gerekir: https://yourdomain.com/api/telegram/webhook

export async function POST(request: Request) {
  try {
    console.log('=== Telegram Webhook İsteği Alındı ===');
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN bulunamadı');
      return NextResponse.json(
        { error: 'TELEGRAM_BOT_TOKEN bulunamadı' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const update = body;
    
    // Gelen update'i logla
    console.log('Update tipi:', update.channel_post ? 'channel_post' : update.message ? 'message' : 'unknown');
    console.log('Update içeriği:', JSON.stringify(update, null, 2));

    // Telegram update objesi
    // Kanal mesajları channel_post olarak gelir, normal mesajlar message olarak gelir
    const message = update.channel_post || update.message;
    let channelUsername = 'unknown';
    let messageId: number | undefined;
    let messageText = '';
    let messageDate: Date | undefined;
    let hasMedia = false;
    let mediaUrl: string | null = null;
    let shouldProcess = false;

    if (message) {
      console.log('Mesaj bulundu, işleniyor...');
      // 1. Kanal mesajı (channel_post) - Bot'un gönderdiği mesajlar
      if (update.channel_post) {
        console.log('Kanal mesajı tespit edildi (channel_post)');
        const chat = message.chat;
        channelUsername = chat.username || chat.title || 'unknown';
        messageId = message.message_id;
        messageText = message.text || message.caption || '';
        messageDate = new Date(message.date * 1000);
        shouldProcess = true;
        console.log(`Kanal: ${channelUsername}, Mesaj ID: ${messageId}, Metin uzunluğu: ${messageText.length}`);
      }
      // 2. Forward edilmiş kanal mesajı
      else if (update.message && update.message.forward_from_chat) {
        console.log('Forward edilmiş mesaj tespit edildi');
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
          console.log(`Forward - Kanal: ${channelUsername}, Mesaj ID: ${messageId}, Metin uzunluğu: ${messageText.length}`);
        } else {
          console.log(`Forward edilmiş mesaj kanal değil, tip: ${forwardedChat.type}`);
        }
      }
      // 3. Normal grup/kanal mesajı (bot grup üyesi ise)
      else if (update.message) {
        console.log('Normal mesaj tespit edildi');
        const chat = message.chat;
        console.log(`Chat tipi: ${chat.type}, Username: ${chat.username || chat.title || 'unknown'}`);
        if (chat.type === 'channel' || chat.type === 'supergroup') {
          channelUsername = chat.username || chat.title || 'unknown';
          messageId = message.message_id;
          messageText = message.text || message.caption || '';
          messageDate = new Date(message.date * 1000);
          shouldProcess = true;
          console.log(`Grup/Kanal mesajı - Kanal: ${channelUsername}, Mesaj ID: ${messageId}, Metin uzunluğu: ${messageText.length}`);
        } else {
          console.log(`Mesaj işlenmedi - Chat tipi: ${chat.type} (channel veya supergroup değil)`);
        }
      } else {
        console.log('Mesaj bulunamadı veya işlenemedi');
      }

      if (shouldProcess && messageId !== undefined && messageDate !== undefined) {
        console.log('Mesaj işleniyor...');
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
            telegramMessageId: BigInt(messageId) // BigInt'e çevir
          }
        });

        if (!existing) {
          console.log('Yeni mesaj, veritabanına kaydediliyor...');
          // Veritabanına kaydet
          await prisma.jobPosting.create({
            data: {
              telegramMessageId: BigInt(messageId), // BigInt'e çevir
              channelUsername: channelUsername,
              content: messageText,
              rawText: JSON.stringify(message),
              hasMedia: hasMedia,
              mediaUrl: mediaUrl,
              postedAt: messageDate,
              isActive: true
            }
          });

          console.log(`✅ Yeni iş ilanı kaydedildi: ${messageId} - ${channelUsername}`);
        } else {
          console.log(`⚠️ Mesaj zaten kayıtlı: ${messageId}`);
        }
      } else {
        console.log(`❌ Mesaj işlenmedi - shouldProcess: ${shouldProcess}, messageId: ${messageId}, messageDate: ${messageDate}`);
      }
    } else {
      console.log('❌ Update içinde mesaj bulunamadı');
    }

    // Telegram'a OK döndür
    console.log('=== Webhook İsteği Tamamlandı ===');
    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    // Telegram'a hata döndürme, sadece logla
    return NextResponse.json({ ok: true }); // Telegram tekrar denemesin diye
  }
}

// GET - Webhook durumunu kontrol et ve gerekirse düzelt
export async function GET() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const hasToken = !!botToken;
    const correctWebhookUrl = 'https://www.isgpratik.com/api/telegram/webhook';
    
    if (!hasToken) {
      return NextResponse.json({
        message: 'Telegram Webhook endpoint aktif',
        status: 'missing_token',
        note: 'TELEGRAM_BOT_TOKEN environment variable bulunamadı. Lütfen .env.local dosyanıza ekleyin.',
        webhookUrl: correctWebhookUrl
      });
    }

    // Telegram'dan mevcut webhook bilgilerini al
    const webhookInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const webhookInfo = await webhookInfoResponse.json();

    const currentUrl = webhookInfo.result?.url || null;
    const isCorrect = currentUrl === correctWebhookUrl;
    let fixed = false;

    // Eğer webhook yanlış URL'ye yönlendirilmişse, otomatik düzelt
    if (!isCorrect && currentUrl) {
      console.log(`⚠️ Webhook yanlış URL'ye yönlendirilmiş: ${currentUrl}`);
      console.log(`🔧 Doğru URL'ye yönlendiriliyor: ${correctWebhookUrl}`);
      
      try {
        const setWebhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: correctWebhookUrl })
        });
        
        const setWebhookResult = await setWebhookResponse.json();
        
        if (setWebhookResult.ok) {
          fixed = true;
          console.log(`✅ Webhook başarıyla düzeltildi: ${correctWebhookUrl}`);
        } else {
          console.error(`❌ Webhook düzeltilemedi:`, setWebhookResult);
        }
      } catch (error: any) {
        console.error('Webhook düzeltme hatası:', error);
      }
    }

    return NextResponse.json({
      message: 'Telegram Webhook endpoint aktif',
      status: isCorrect || fixed ? 'ready' : 'incorrect_url',
      currentWebhookUrl: currentUrl,
      correctWebhookUrl: correctWebhookUrl,
      fixed: fixed,
      pendingUpdates: webhookInfo.result?.pending_update_count || 0,
      lastError: webhookInfo.result?.last_error_message || null,
      note: isCorrect 
        ? 'Webhook doğru URL\'ye yönlendirilmiş.'
        : fixed
          ? 'Webhook otomatik olarak düzeltildi.'
          : 'Webhook yanlış URL\'ye yönlendirilmiş. Lütfen manuel olarak düzeltin.',
      webhookUrl: correctWebhookUrl
    });
  } catch (error: any) {
    console.error('Webhook kontrol hatası:', error);
    return NextResponse.json({
      message: 'Telegram Webhook endpoint aktif',
      status: 'error',
      error: error.message,
      webhookUrl: 'https://www.isgpratik.com/api/telegram/webhook'
    }, { status: 500 });
  }
}

