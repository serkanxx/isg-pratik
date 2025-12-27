import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Firma çalışanlarını listele
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('company_id');

        if (!companyId) {
            return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const employees = await prisma.companyEmployee.findMany({
            where: {
                companyId: companyId,
                userId: user.id
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Yeni çalışan ekle
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        const { companyId, fullName, tcNo, position } = body;

        if (!companyId || !fullName) {
            return NextResponse.json({ error: 'companyId and fullName are required' }, { status: 400 });
        }

        const employee = await prisma.companyEmployee.create({
            data: {
                companyId,
                userId: user.id,
                fullName,
                tcNo: tcNo || null,
                position: position || null
            }
        });

        return NextResponse.json(employee, { status: 201 });
    } catch (error) {
        console.error('Error creating employee:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Çalışan sil (bulk)
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        await prisma.companyEmployee.delete({
            where: {
                id: id,
                userId: user.id
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting employee:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT - Çalışan güncelle (eğitim durumu için)
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        const { id, fullName, tcNo, position, trainingDate, trainingTopic } = body;

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const employee = await prisma.companyEmployee.update({
            where: {
                id: id,
                userId: user.id
            },
            data: {
                ...(fullName && { fullName }),
                ...(tcNo !== undefined && { tcNo }),
                ...(position !== undefined && { position }),
                ...(trainingDate !== undefined && { trainingDate: trainingDate ? new Date(trainingDate) : null }),
                ...(trainingTopic !== undefined && { trainingTopic })
            }
        });

        return NextResponse.json(employee);
    } catch (error) {
        console.error('Error updating employee:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
