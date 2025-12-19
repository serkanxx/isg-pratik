import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADMIN_EMAIL = 'serkanxx@gmail.com';

// GET - Admin için kullanıcı istatistiklerini getir
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email || (session.user.email !== ADMIN_EMAIL && (session.user as any)?.role !== 'ADMIN')) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        // Tüm kullanıcıları getir (admin hariç)
        const users = await prisma.user.findMany({
            where: {
                email: {
                    not: ADMIN_EMAIL
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                plan: true,
                trialEndsAt: true,
                createdAt: true,
                updatedAt: true,
                phone: true,
                phoneVerified: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Her kullanıcı için istatistikleri topla
        const userStatistics = await Promise.all(
            users.map(async (user) => {
                // Firma sayısı
                const companyCount = await prisma.company.count({
                    where: { user_id: user.id }
                });

                // Rapor sayıları (tip bazında)
                const reports = await prisma.reportHistory.findMany({
                    where: { userId: user.id },
                    select: { type: true }
                });

                const reportStats = {
                    total: reports.length,
                    riskAssessment: reports.filter(r => r.type === 'RISK_ASSESSMENT').length,
                    emergencyPlan: reports.filter(r => r.type === 'EMERGENCY_PLAN').length,
                    workPermit: reports.filter(r => r.type === 'WORK_PERMIT').length,
                };

                // Risk sayısı
                const riskCount = await prisma.userRisk.count({
                    where: { userId: user.id }
                });

                // Not sayısı
                const noteCount = await prisma.note.count({
                    where: { userId: user.id }
                });

                // Ziyaret programı sayısı
                const visitProgramCount = await prisma.visitProgram.count({
                    where: { userId: user.id }
                });

                // Son aktivite tarihi (en son güncellenen rapor, firma veya risk)
                const lastReport = await prisma.reportHistory.findFirst({
                    where: { userId: user.id },
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true }
                });

                const lastCompany = await prisma.company.findFirst({
                    where: { user_id: user.id },
                    orderBy: { updated_at: 'desc' },
                    select: { updated_at: true }
                });

                const lastRisk = await prisma.userRisk.findFirst({
                    where: { userId: user.id },
                    orderBy: { updatedAt: 'desc' },
                    select: { updatedAt: true }
                });

                const lastActivityDates = [
                    lastReport?.createdAt,
                    lastCompany?.updated_at,
                    lastRisk?.updatedAt,
                    user.updatedAt
                ].filter(Boolean) as Date[];

                const lastActivity = lastActivityDates.length > 0
                    ? new Date(Math.max(...lastActivityDates.map(d => d.getTime())))
                    : user.createdAt;

                return {
                    ...user,
                    statistics: {
                        companyCount,
                        reportStats,
                        riskCount,
                        noteCount,
                        visitProgramCount,
                        lastActivity
                    }
                };
            })
        );

        // Genel istatistikler
        const totalUsers = users.length;
        const newUsersThisMonth = users.filter(u => {
            const userDate = new Date(u.createdAt);
            const now = new Date();
            return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear();
        }).length;

        const newUsersThisWeek = users.filter(u => {
            const userDate = new Date(u.createdAt);
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return userDate >= weekAgo;
        }).length;

        const totalCompanies = await prisma.company.count();
        const totalReports = await prisma.reportHistory.count();
        const totalRisks = await prisma.userRisk.count();

        const planDistribution = {
            premium_trial: users.filter(u => u.plan === 'premium_trial').length,
            free: users.filter(u => u.plan === 'free').length,
            premium: users.filter(u => u.plan === 'premium').length,
        };

        return NextResponse.json({
            success: true,
            data: {
                users: userStatistics,
                summary: {
                    totalUsers,
                    newUsersThisMonth,
                    newUsersThisWeek,
                    totalCompanies,
                    totalReports,
                    totalRisks,
                    planDistribution
                }
            }
        });
    } catch (error: any) {
        console.error('Kullanıcı istatistikleri hatası:', error);
        return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
    }
}
