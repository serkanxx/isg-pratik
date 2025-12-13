import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

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

        // Kullanıcı oluştur (emailVerified = null)
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                phoneCode,
                phoneCodeExp,
                phoneVerified: true, // SMS doğrulama devre dışı
                emailVerified: null, // Email doğrulanmamış
                plan: "premium_trial",
                trialEndsAt,
            },
        });

        // Email doğrulama token'ı oluştur
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat

        // Token'ı veritabanına kaydet
        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token: verificationToken,
                expires: tokenExpires,
            },
        });

        // Doğrulama emaili gönder
        const emailResult = await sendVerificationEmail(email, verificationToken);

        if (!emailResult.success) {
            console.error("Email gönderilemedi:", emailResult.error);
            // Email gönderilemese bile kayıt başarılı sayılsın
        }

        console.log(`SMS Kodu: ${phoneCode} -> +90${phone}`);

        return NextResponse.json({
            message: "Kayıt başarılı! Email adresinize doğrulama linki gönderildi.",
            userId: user.id,
            requiresEmailVerification: true,
        });
    } catch (error: any) {
        console.error("Register error:", error);
        return NextResponse.json(
            { error: "Kayıt sırasında bir hata oluştu" },
            { status: 500 }
        );
    }
}

