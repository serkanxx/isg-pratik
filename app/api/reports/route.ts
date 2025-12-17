import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // @ts-ignore: NextAuth session type missing id
        const userId = session.user.id;

        if (!userId) {
            return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
        }

        return createReport(userId, request);
    } catch (error) {
        console.error('Rapor kaydetme hatası:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function createReport(userId: string, request: Request) {
    try {
        const body = await request.json();
        const { type, title, data } = body;

        console.log('Create Report Request:', { userId, type, title });

        if (!type || !data) {
            console.error('Missing fields:', { type, hasData: !!data });
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Acil Durum Planı için documentNo'yu ayrı kolona da kaydet
        // Boş string'i null'a çevir, sadece gerçek değer varsa kaydet
        let documentNo: string | null = null;
        if (type === 'EMERGENCY_PLAN' && data?.documentNo) {
            const docNo = String(data.documentNo).trim();
            documentNo = docNo.length > 0 ? docNo : null;
        }
        
        // Debug log
        console.log('DocumentNo Debug:', {
            type,
            documentNo,
            dataDocumentNo: data?.documentNo,
            hasDocumentNo: !!data?.documentNo,
            trimmed: documentNo
        });

        const report = await prisma.reportHistory.create({
            data: {
                userId,
                type,
                title: title || 'İsimsiz Rapor',
                data,
                documentNo
            }
        });

        console.log('Report created:', {
            id: report.id,
            type: report.type,
            documentNo: report.documentNo,
            hasDocumentNo: !!report.documentNo
        });
        return NextResponse.json(report);
    } catch (error) {
        console.error('Create report prisma error:', error);
        return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // @ts-ignore
        const userId = session.user.id;
        if (!userId) {
            return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50; // Default limit
        const companyId = searchParams.get('company_id');
        const skip = searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : 0;

        // Sadece gerekli field'ları seç
        let reports = await prisma.reportHistory.findMany({
            where: {
                userId,
                ...(companyId ? {
                    data: {
                        path: ['companyId'],
                        equals: companyId
                    }
                } : {})
            },
            select: {
                id: true,
                type: true,
                title: true,
                data: true,
                documentNo: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            skip: skip
        });

        // Eğer companyId filtresi varsa ve JSON path ile eşleşmediyse, client-side filter yap
        if (companyId && reports.length > 0) {
            const company = await prisma.company.findUnique({
                where: { id: companyId },
                select: { title: true }
            });

            if (company) {
                reports = reports.filter((report: any) => {
                    const reportData = report.data as any;
                    return reportData?.headerInfo?.title === company.title || 
                           reportData?.companyId === companyId;
                });
            }
        }

        // Cache için headers ekle
        return NextResponse.json(reports, {
            headers: {
                'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=300',
            },
        });
    } catch (error) {
        console.error('Raporları getirme hatası:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // @ts-ignore
        let userId = session.user.id;
        if (!userId) {
            const user = await prisma.user.findUnique({ where: { email: session.user.email } });
            if (user) userId = user.id;
            else return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Silinecek rapor seçilmedi' }, { status: 400 });
        }

        // Sadece kendi raporlarını silebilir
        const deleteResult = await prisma.reportHistory.deleteMany({
            where: {
                id: { in: ids },
                userId: userId
            }
        });

        return NextResponse.json({ message: 'Raporlar silindi', count: deleteResult.count });
    } catch (error) {
        console.error('Rapor silme hatası:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
