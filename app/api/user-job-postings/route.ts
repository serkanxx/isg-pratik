import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Onaylanmış kullanıcı ilanlarını listele (public)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '15');
        const city = searchParams.get('city') || '';
        const search = searchParams.get('search') || '';

        const skip = (page - 1) * limit;

        // Filtreler
        const where: any = {
            status: 'approved'
        };

        // City filtresi - sadece belirtilmişse ekle
        if (city && city !== 'Tüm Türkiye') {
            where.city = city;
        }

        // Search filtresi
        if (search) {
            where.content = {
                contains: search,
                mode: 'insensitive'
            };
        }

        console.log('User job postings query where:', JSON.stringify(where));

        const [postings, total] = await Promise.all([
            prisma.userJobPosting.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            }),
            prisma.userJobPosting.count({ where })
        ]);

        console.log('User job postings found:', postings.length);

        return NextResponse.json({
            success: true,
            data: postings,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error('Kullanıcı ilanları listeleme hatası:', error);
        return NextResponse.json(
            { success: false, error: error.message, data: [] },
            { status: 500 }
        );
    }
}

// POST - Yeni kullanıcı ilanı oluştur
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: 'Giriş yapmanız gerekiyor' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { content, city } = body;

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'İlan içeriği boş olamaz' },
                { status: 400 }
            );
        }

        // Kullanıcıyı bul
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Kullanıcı bulunamadı' },
                { status: 404 }
            );
        }

        // İlanı oluştur
        const posting = await prisma.userJobPosting.create({
            data: {
                userId: user.id,
                content: content.trim(),
                city: city || 'Tüm Türkiye',
                status: 'pending'
            }
        });

        return NextResponse.json({
            success: true,
            message: 'İlanınız başarıyla gönderildi. Admin onayından sonra yayınlanacaktır.',
            data: posting
        });
    } catch (error: any) {
        console.error('İlan oluşturma hatası:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
