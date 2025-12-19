import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADMIN_EMAIL = 'serkanxx@gmail.com';

// GET - Admin için kullanıcı istatistiklerini getir
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            console.error('User statistics API: No session or email');
            return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 });
        }

        const userEmail = session.user.email;
        const userRole = (session.user as any)?.role;

        if (userEmail !== ADMIN_EMAIL && userRole !== 'ADMIN') {
            console.error('User statistics API: Unauthorized access attempt', { email: userEmail, role: userRole });
            return NextResponse.json({ error: 'Yetkisiz erişim - Sadece admin erişebilir' }, { status: 403 });
        }

        console.log('User statistics API: Admin access granted', { email: userEmail, role: userRole });

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

        console.log(`User statistics API: Found ${users.length} users`);

        if (users.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    users: [],
                    summary: {
                        totalUsers: 0,
                        newUsersThisMonth: 0,
                        newUsersThisWeek: 0,
                        totalCompanies: 0,
                        totalReports: 0,
                        totalRisks: 0,
                        planDistribution: {
                            premium_trial: 0,
                            free: 0,
                            premium: 0
                        }
                    }
                }
            });
        }

        const userIds = users.map(u => u.id);

        // Tüm istatistikleri toplu sorgularla çek
        const [companies, reports, risks, notes, visitPrograms] = await Promise.all([
            // Tüm firmalar
            prisma.company.findMany({
                where: { user_id: { in: userIds } },
                select: { user_id: true, updated_at: true }
            }),
            // Tüm raporlar
            prisma.reportHistory.findMany({
                where: { userId: { in: userIds } },
                select: { userId: true, type: true, createdAt: true }
            }),
            // Tüm riskler
            prisma.userRisk.findMany({
                where: { userId: { in: userIds } },
                select: { userId: true, updatedAt: true }
            }),
            // Tüm notlar
            prisma.note.findMany({
                where: { userId: { in: userIds } },
                select: { userId: true }
            }),
            // Tüm ziyaret programları
            prisma.visitProgram.findMany({
                where: { userId: { in: userIds } },
                select: { userId: true }
            })
        ]);

        console.log(`User statistics API: Fetched ${companies.length} companies, ${reports.length} reports, ${risks.length} risks`);

        // Memory'de kullanıcı bazında grupla
        const userStatsMap = new Map<string, {
            companyCount: number;
            reportStats: { total: number; riskAssessment: number; emergencyPlan: number; workPermit: number };
            riskCount: number;
            noteCount: number;
            visitProgramCount: number;
            lastReportDate?: Date;
            lastCompanyDate?: Date;
            lastRiskDate?: Date;
        }>();

        // Firmaları grupla
        companies.forEach(company => {
            const stats = userStatsMap.get(company.user_id) || {
                companyCount: 0,
                reportStats: { total: 0, riskAssessment: 0, emergencyPlan: 0, workPermit: 0 },
                riskCount: 0,
                noteCount: 0,
                visitProgramCount: 0
            };
            stats.companyCount++;
            if (!stats.lastCompanyDate || company.updated_at > stats.lastCompanyDate) {
                stats.lastCompanyDate = company.updated_at;
            }
            userStatsMap.set(company.user_id, stats);
        });

        // Raporları grupla
        reports.forEach(report => {
            const stats = userStatsMap.get(report.userId) || {
                companyCount: 0,
                reportStats: { total: 0, riskAssessment: 0, emergencyPlan: 0, workPermit: 0 },
                riskCount: 0,
                noteCount: 0,
                visitProgramCount: 0
            };
            stats.reportStats.total++;
            if (report.type === 'RISK_ASSESSMENT') stats.reportStats.riskAssessment++;
            else if (report.type === 'EMERGENCY_PLAN') stats.reportStats.emergencyPlan++;
            else if (report.type === 'WORK_PERMIT') stats.reportStats.workPermit++;
            if (!stats.lastReportDate || report.createdAt > stats.lastReportDate) {
                stats.lastReportDate = report.createdAt;
            }
            userStatsMap.set(report.userId, stats);
        });

        // Riskleri grupla
        risks.forEach(risk => {
            const stats = userStatsMap.get(risk.userId) || {
                companyCount: 0,
                reportStats: { total: 0, riskAssessment: 0, emergencyPlan: 0, workPermit: 0 },
                riskCount: 0,
                noteCount: 0,
                visitProgramCount: 0
            };
            stats.riskCount++;
            if (!stats.lastRiskDate || risk.updatedAt > stats.lastRiskDate) {
                stats.lastRiskDate = risk.updatedAt;
            }
            userStatsMap.set(risk.userId, stats);
        });

        // Notları grupla
        notes.forEach(note => {
            const stats = userStatsMap.get(note.userId) || {
                companyCount: 0,
                reportStats: { total: 0, riskAssessment: 0, emergencyPlan: 0, workPermit: 0 },
                riskCount: 0,
                noteCount: 0,
                visitProgramCount: 0
            };
            stats.noteCount++;
            userStatsMap.set(note.userId, stats);
        });

        // Ziyaret programlarını grupla
        visitPrograms.forEach(program => {
            const stats = userStatsMap.get(program.userId) || {
                companyCount: 0,
                reportStats: { total: 0, riskAssessment: 0, emergencyPlan: 0, workPermit: 0 },
                riskCount: 0,
                noteCount: 0,
                visitProgramCount: 0
            };
            stats.visitProgramCount++;
            userStatsMap.set(program.userId, stats);
        });

        // Kullanıcı istatistiklerini oluştur
        const userStatistics = users.map(user => {
            const stats = userStatsMap.get(user.id) || {
                companyCount: 0,
                reportStats: { total: 0, riskAssessment: 0, emergencyPlan: 0, workPermit: 0 },
                riskCount: 0,
                noteCount: 0,
                visitProgramCount: 0
            };

            // Son aktivite tarihini hesapla
            const lastActivityDates = [
                stats.lastReportDate,
                stats.lastCompanyDate,
                stats.lastRiskDate,
                user.updatedAt
            ].filter(Boolean) as Date[];

            const lastActivity = lastActivityDates.length > 0
                ? new Date(Math.max(...lastActivityDates.map(d => d.getTime())))
                : user.createdAt;

            return {
                ...user,
                statistics: {
                    companyCount: stats.companyCount,
                    reportStats: stats.reportStats,
                    riskCount: stats.riskCount,
                    noteCount: stats.noteCount,
                    visitProgramCount: stats.visitProgramCount,
                    lastActivity
                }
            };
        });

        // Genel istatistikler (zaten çektiğimiz verilerden hesapla)
        const totalUsers = users.length;
        const now = new Date();
        const newUsersThisMonth = users.filter(u => {
            const userDate = new Date(u.createdAt);
            return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear();
        }).length;

        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const newUsersThisWeek = users.filter(u => {
            const userDate = new Date(u.createdAt);
            return userDate >= weekAgo;
        }).length;

        // Zaten çektiğimiz verilerden toplamları hesapla
        const totalCompanies = companies.length;
        const totalReports = reports.length;
        const totalRisks = risks.length;

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
        console.error('Error stack:', error.stack);
        return NextResponse.json({ 
            error: error.message || 'Sunucu hatası',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
