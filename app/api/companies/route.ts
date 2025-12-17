import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET - Kullanıcının firmalarını listele
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Kullanıcı ID'sini bul (session'da zaten var, DB query yapmadan)
        const userId = (session.user as any).id;
        if (!userId) {
            return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
        }

        // Prisma ile sorgula - sadece gerekli field'ları seç
        const companies = await prisma.company.findMany({
            where: {
                user_id: userId,
                is_active: true
            },
            select: {
                id: true,
                title: true,
                address: true,
                registration_number: true,
                danger_class: true,
                logo: true,
                employer: true,
                igu: true,
                doctor: true,
                representative: true,
                support: true,
                created_at: true,
                updated_at: true
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        // Eğer user_id olarak email kullanan eski bir yapı varsa ve biz id'ye geçiyorsak
        // bunu dikkate almalıyız. Ama tablo sıfırlandığı için id ile devam etmek en doğrusu.

        // Kullanıcıya özel cache (5 dakika, stale-while-revalidate 1 saat)
        return NextResponse.json(companies, {
            headers: {
                'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=3600',
            },
        });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

// POST - Yeni firma ekle
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Kullanıcı ID'sini bul
        let userId = (session.user as any).id;
        if (!userId) {
            const user = await prisma.user.findUnique({ where: { email: session.user.email } });
            if (user) userId = user.id;
            else return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        const {
            title,
            address,
            registration_number,
            danger_class,
            logo,
            employer,
            igu,
            doctor,
            representative,
            support
        } = body;

        if (!title || !danger_class) {
            return NextResponse.json({ error: 'Firma unvanı ve tehlike sınıfı zorunludur' }, { status: 400 });
        }

        const company = await prisma.company.create({
            data: {
                user_id: userId, // User ID'sini kaydet
                title,
                address: address || '',
                registration_number: registration_number || '',
                danger_class,
                logo: logo || null,
                employer: employer || '',
                igu: igu || '',
                doctor: doctor || '',
                representative: representative || '',
                support: support || '',
                is_active: true
            }
        });

        return NextResponse.json(company);
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Sunucu hatası: ' + (error as Error).message }, { status: 500 });
    }
}
