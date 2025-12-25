import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADMIN_EMAIL = 'serkanxx@gmail.com';

// PUT - İlanı onayla/reddet/düzenle
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email ||
            (session.user.email !== ADMIN_EMAIL && (session.user as any)?.role !== 'ADMIN')) {
            return NextResponse.json(
                { success: false, error: 'Yetkisiz erişim' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const { status, content, city, adminNote } = body;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return NextResponse.json(
                { success: false, error: 'Geçersiz durum' },
                { status: 400 }
            );
        }

        const updateData: any = {
            status,
            updatedAt: new Date()
        };

        // Admin düzenlemesi varsa içeriği güncelle
        if (content !== undefined) {
            updateData.content = content;
        }

        if (city !== undefined) {
            updateData.city = city;
        }

        if (adminNote !== undefined) {
            updateData.adminNote = adminNote;
        }

        // Onaylandıysa onay bilgilerini ekle
        if (status === 'approved') {
            updateData.approvedAt = new Date();
            updateData.approvedBy = session.user.email;
        }

        const posting = await prisma.userJobPosting.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({
            success: true,
            data: posting
        });
    } catch (error: any) {
        console.error('İlan güncelleme hatası:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - İlanı sil
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email ||
            (session.user.email !== ADMIN_EMAIL && (session.user as any)?.role !== 'ADMIN')) {
            return NextResponse.json(
                { success: false, error: 'Yetkisiz erişim' },
                { status: 401 }
            );
        }

        const { id } = await params;

        await prisma.userJobPosting.delete({
            where: { id }
        });

        return NextResponse.json({
            success: true,
            message: 'İlan silindi'
        });
    } catch (error: any) {
        console.error('İlan silme hatası:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
