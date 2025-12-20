import { NextRequest, NextResponse } from 'next/server';
import { sendArchiveErrorReportEmail } from '@/lib/email';

// Rate limiting için basit bir in-memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit kontrolü: 3 dakikada en fazla 1 hata bildirimi
function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = rateLimitStore.get(userId);

    if (!userLimit) {
        rateLimitStore.set(userId, { count: 1, resetTime: now + 3 * 60 * 1000 }); // 3 dakika
        return true;
    }

    // Süre dolmuşsa sıfırla
    if (now > userLimit.resetTime) {
        rateLimitStore.set(userId, { count: 1, resetTime: now + 3 * 60 * 1000 });
        return true;
    }

    // Limit aşılmış
    if (userLimit.count >= 1) {
        return false;
    }

    // Sayacı artır
    userLimit.count++;
    return true;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { fileName, fileLink, userEmail, userName, errorDescription } = body;

        // Rate limiting kontrolü
        const userId = userEmail || request.headers.get('x-forwarded-for') || 'unknown';
        if (!checkRateLimit(userId)) {
            return NextResponse.json(
                { error: 'Çok fazla hata bildirimi gönderdiniz. Lütfen 3 dakika sonra tekrar deneyin.' },
                { status: 429 }
            );
        }

        // Email gönder
        const emailResult = await sendArchiveErrorReportEmail({
            fileName,
            fileLink,
            userEmail: userEmail || 'Bilinmiyor',
            userName: userName || 'Bilinmeyen Kullanıcı',
            errorDescription: errorDescription || 'Açıklama belirtilmemiş'
        });

        if (!emailResult.success) {
            return NextResponse.json(
                { error: 'Email gönderilemedi. Lütfen daha sonra tekrar deneyin.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: 'Hata bildirimi başarıyla gönderildi.' });
    } catch (error) {
        console.error('Hata bildirimi API hatası:', error);
        return NextResponse.json(
            { error: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.' },
            { status: 500 }
        );
    }
}

