import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendNewUserNotificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
    try {
        const { name, email, password, phone } = await request.json();

        // Validasyon (telefon zorunlu değil)
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Ad Soyad, Email ve Şifre zorunludur" },
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

        // Telefon kontrolü (varsa)
        if (phone) {
            const existingPhone = await prisma.user.findUnique({
                where: { phone },
            });

            if (existingPhone) {
                return NextResponse.json(
                    { error: "Bu telefon numarası zaten kullanılıyor" },
                    { status: 400 }
                );
            }
        }

        // Şifre hashle
        const hashedPassword = await bcrypt.hash(password, 12);

        // SMS doğrulama kodu oluştur (6 haneli)
        const phoneCode = Math.floor(100000 + Math.random() * 900000).toString();
        const phoneCodeExp = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika geçerli

        // Premium Trial bitiş tarihi (3 ay sonra)
        const trialEndsAt = new Date();
        trialEndsAt.setMonth(trialEndsAt.getMonth() + 3);

        // Kullanıcı oluştur (emailVerified otomatik onaylanmış)
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone: phone || null,
                phoneCode: phone ? phoneCode : null,
                phoneCodeExp: phone ? phoneCodeExp : null,
                phoneVerified: true, // SMS doğrulama devre dışı
                emailVerified: new Date(), // Email otomatik onaylı
                plan: "premium_trial",
                trialEndsAt,
            },
        });

        // Yeni üyelik bildirimi emaili gönder (arka planda, hata olsa bile kayıt başarılı sayılsın)
        sendNewUserNotificationEmail(name, email, phone).catch((error) => {
            console.error("Yeni üyelik bildirimi emaili gönderilemedi:", error);
            // Hata olsa bile kayıt işlemi devam eder
        });

        if (phone) {
            console.log(`SMS Kodu: ${phoneCode} -> +90${phone}`);
        }

        return NextResponse.json({
            message: "Kayıt başarılı! Şimdi giriş yapabilirsiniz.",
            userId: user.id,
            requiresEmailVerification: false,
        });
    } catch (error: any) {
        console.error("Register error:", error);
        return NextResponse.json(
            { error: "Kayıt sırasında bir hata oluştu" },
            { status: 500 }
        );
    }
}

