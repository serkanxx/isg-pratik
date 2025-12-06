import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const { userId, code } = await request.json();

        if (!userId || !code) {
            return NextResponse.json(
                { error: "Kullanıcı ID ve kod gerekli" },
                { status: 400 }
            );
        }

        // Kullanıcıyı bul
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Kullanıcı bulunamadı" },
                { status: 404 }
            );
        }

        // Kod süre kontrolü
        if (!user.phoneCodeExp || new Date() > user.phoneCodeExp) {
            return NextResponse.json(
                { error: "Doğrulama kodu süresi dolmuş. Yeni kod isteyin." },
                { status: 400 }
            );
        }

        // Kod kontrolü
        if (user.phoneCode !== code) {
            return NextResponse.json(
                { error: "Doğrulama kodu hatalı" },
                { status: 400 }
            );
        }

        // Telefon doğrulandı
        await prisma.user.update({
            where: { id: userId },
            data: {
                phoneVerified: true,
                phoneCode: null,
                phoneCodeExp: null,
            },
        });

        return NextResponse.json({
            message: "Telefon doğrulandı, giriş yapabilirsiniz",
        });
    } catch (error: any) {
        console.error("Verify phone error:", error);
        return NextResponse.json(
            { error: "Doğrulama sırasında bir hata oluştu" },
            { status: 500 }
        );
    }
}
