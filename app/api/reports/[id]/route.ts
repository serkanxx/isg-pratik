import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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
        }

        const { id } = await params;

        const report = await prisma.reportHistory.findUnique({
            where: {
                id: id
            }
        });

        if (!report) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        if (report.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized access to report' }, { status: 403 });
        }

        return NextResponse.json(report);
    } catch (error) {
        console.error('Rapor detayı hatası:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
