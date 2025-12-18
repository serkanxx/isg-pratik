import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json(
                { error: "Token gerekli" },
                { status: 400 }
            );
        }

        // Token'ı bul
        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token },
        });

        if (!verificationToken) {
            return NextResponse.json(
                { error: "Geçersiz veya süresi dolmuş token" },
                { status: 400 }
            );
        }

        // Token süresi kontrolü
        if (verificationToken.expires < new Date()) {
            // Süresi dolmuş token'ı sil
            await prisma.verificationToken.delete({
                where: { token },
            });
            return NextResponse.json(
                { error: "Token süresi dolmuş. Lütfen tekrar kayıt olun." },
                { status: 400 }
            );
        }

        // Kullanıcıyı bul ve emailVerified'ı güncelle
        const user = await prisma.user.update({
            where: { email: verificationToken.identifier },
            data: { emailVerified: new Date() },
        });

        // Token'ı sil (kullanıldı)
        await prisma.verificationToken.delete({
            where: { token },
        });

        return NextResponse.json({
            success: true,
            message: "Email adresiniz başarıyla doğrulandı!",
            email: user.email,
        });
    } catch (error: any) {
        console.error("Verify email error:", error);
        return NextResponse.json(
            { error: "Doğrulama sırasında bir hata oluştu" },
            { status: 500 }
        );
    }
}
