import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const { name, email, password, phone } = await request.json();

        // Validasyon
        if (!name || !email || !password || !phone) {
            return NextResponse.json(
                { error: "Tüm alanlar zorunludur" },
                { status: 400 }
            );
        }

        // Email kontrolü
        const existingEmail = await prisma.user.findUnique({
            where: { email },
        });

        if (existingEmail) {
            return NextResponse.json(
                { error: "Bu email adresi zaten kullanılıyor" },
                { status: 400 }
            );
        }

        // Telefon kontrolü
        const existingPhone = await prisma.user.findUnique({
            where: { phone },
        });

        if (existingPhone) {
            return NextResponse.json(
                { error: "Bu telefon numarası zaten kullanılıyor" },
                { status: 400 }
            );
        }

        // Şifre hashle
        const hashedPassword = await bcrypt.hash(password, 12);

        // SMS doğrulama kodu oluştur (6 haneli)
        const phoneCode = Math.floor(100000 + Math.random() * 900000).toString();
        const phoneCodeExp = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika geçerli

        // Premium Trial bitiş tarihi (3 ay sonra)
        const trialEndsAt = new Date();
        trialEndsAt.setMonth(trialEndsAt.getMonth() + 3);

        // Kullanıcı oluştur
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                phoneCode,
                phoneCodeExp,
                phoneVerified: true, // GEÇİCİ: SMS doğrulama devre dışı
                plan: "premium_trial",
                trialEndsAt,
            },
        });

        // SMS gönder (Netgsm entegrasyonu burada olacak)
        // Şimdilik console'a yazdırıyoruz
        console.log(`SMS Kodu: ${phoneCode} -> +90${phone}`);

        // TODO: Netgsm SMS gönderimi
        // await sendSms(phone, `İSG-PRO doğrulama kodunuz: ${phoneCode}`);

        return NextResponse.json({
            message: "Kayıt başarılı! Giriş yapabilirsiniz.",
            userId: user.id,
            skipSms: true, // SMS atlandı
        });
    } catch (error: any) {
        console.error("Register error:", error);
        return NextResponse.json(
            { error: "Kayıt sırasında bir hata oluştu" },
            { status: 500 }
        );
    }
}
