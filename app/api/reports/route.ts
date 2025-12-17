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
            // Fallback if id is missing, fetch user by email
            const user = await prisma.user.findUnique({ where: { email: session.user.email } });
            if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
            return createReport(user.id, request);
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
        let userId = session.user.id;
        if (!userId) {
            const user = await prisma.user.findUnique({ where: { email: session.user.email } });
            if (user) userId = user.id;
            else return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit');
        const companyId = searchParams.get('company_id');

        let reports = await prisma.reportHistory.findMany({
            where: {
                userId
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit ? parseInt(limit) : undefined
        });

        // company_id filtresi varsa, rapor verisindeki firma bilgisine göre filtrele
        if (companyId) {
            // Önce firma bilgisini al
            const company = await prisma.company.findUnique({
                where: { id: companyId }
            });

            if (company) {
                // Rapor verisindeki firma unvanına göre filtrele
                reports = reports.filter((report: any) => {
                    const reportData = report.data as any;
                    // headerInfo.title veya companyId kontrolü
                    if (reportData?.headerInfo?.title === company.title) {
                        return true;
                    }
                    if (reportData?.companyId === companyId) {
                        return true;
                    }
                    return false;
                });
            }
        }

        return NextResponse.json(reports);
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
