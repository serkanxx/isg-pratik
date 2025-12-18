import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json(
                { error: "Email gerekli" },
                { status: 400 }
            );
        }

        // Kullanıcıyı bul
        const user = await prisma.user.findUnique({
            where: { email },
            select: { emailVerified: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Kullanıcı bulunamadı" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            verified: user.emailVerified !== null,
            emailVerified: user.emailVerified,
        });
    } catch (error: any) {
        console.error("Check email verified error:", error);
        return NextResponse.json(
            { error: "Bir hata oluştu" },
            { status: 500 }
        );
    }
}

