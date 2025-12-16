import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

interface BulkCompanyData {
    title: string;
    address?: string;
    registration_number?: string;
    danger_class: string;
}

interface BulkUploadResult {
    success: boolean;
    totalRows: number;
    successCount: number;
    errorCount: number;
    errors: { row: number; message: string }[];
}

// Tehlike sınıfı mapping
const DANGER_CLASS_MAP: Record<string, string> = {
    'az tehlikeli': 'az_tehlikeli',
    'az_tehlikeli': 'az_tehlikeli',
    'tehlikeli': 'tehlikeli',
    'çok tehlikeli': 'cok_tehlikeli',
    'cok tehlikeli': 'cok_tehlikeli',
    'cok_tehlikeli': 'cok_tehlikeli',
};

function normalizeDangerClass(value: string): string | null {
    const normalized = value.toLowerCase().trim();
    return DANGER_CLASS_MAP[normalized] || null;
}

// POST - Toplu firma yükleme
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
        const { companies } = body as { companies: BulkCompanyData[] };

        if (!companies || !Array.isArray(companies) || companies.length === 0) {
            return NextResponse.json({
                error: 'Yüklenecek firma verisi bulunamadı'
            }, { status: 400 });
        }

        const result: BulkUploadResult = {
            success: true,
            totalRows: companies.length,
            successCount: 0,
            errorCount: 0,
            errors: []
        };

        // Her firmayı işle
        for (let i = 0; i < companies.length; i++) {
            const company = companies[i];
            const rowNumber = i + 1;

            // Validasyon
            if (!company.title || company.title.trim() === '') {
                result.errors.push({ row: rowNumber, message: 'Firma adı zorunludur' });
                result.errorCount++;
                continue;
            }

            if (!company.danger_class || company.danger_class.trim() === '') {
                result.errors.push({ row: rowNumber, message: 'Tehlike sınıfı zorunludur' });
                result.errorCount++;
                continue;
            }

            const dangerClass = normalizeDangerClass(company.danger_class);
            if (!dangerClass) {
                result.errors.push({
                    row: rowNumber,
                    message: `Geçersiz tehlike sınıfı: "${company.danger_class}". Geçerli değerler: Az Tehlikeli, Tehlikeli, Çok Tehlikeli`
                });
                result.errorCount++;
                continue;
            }

            try {
                await prisma.company.create({
                    data: {
                        user_id: userId,
                        title: company.title.trim().replace(/[\r\n]+/g, ' '),
                        address: (company.address || '').trim().replace(/[\r\n]+/g, ' '),
                        registration_number: (company.registration_number || '').replace(/[^0-9]/g, ''),
                        danger_class: dangerClass,
                        logo: null,
                        employer: '',
                        igu: '',
                        doctor: '',
                        representative: '',
                        support: '',
                        is_active: true
                    }
                });
                result.successCount++;
            } catch (dbError) {
                result.errors.push({
                    row: rowNumber,
                    message: `Veritabanı hatası: ${(dbError as Error).message}`
                });
                result.errorCount++;
            }
        }

        result.success = result.errorCount === 0;

        return NextResponse.json(result);
    } catch (error) {
        console.error('Bulk upload API error:', error);
        return NextResponse.json({
            error: 'Sunucu hatası: ' + (error as Error).message
        }, { status: 500 });
    }
}
