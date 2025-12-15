const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' }); // Env dosyasını yükle
const prisma = new PrismaClient();

async function main() {
    console.log('Prisma Client başlatıldı...');

    try {
        // 1. Önce kullanıcıyı bul (ilk kullanıcı)
        const user = await prisma.user.findFirst();
        if (!user) {
            console.error('HATA: Veritabanında hiç kullanıcı yok!');
            return;
        }
        console.log('Kullanıcı bulundu:', user.email);

        // 2. ReportHistory modelinin varlığını kontrol et
        if (!prisma.reportHistory) {
            console.error('KRİTİK HATA: prisma.reportHistory tanımlı değil! Lütfen "npx prisma generate" komutunu çalıştırın.');
            return;
        }

        // 3. Test raporu oluştur
        console.log('Test raporu oluşturuluyor...');
        const report = await prisma.reportHistory.create({
            data: {
                userId: user.id,
                type: 'TEST_REPORT',
                title: 'Sistem Test Raporu',
                data: { test: true, message: 'Bu bir test raporudur' }
            }
        });

        console.log('BAŞARILI! Rapor veritabanına kaydedildi. ID:', report.id);

        // 4. ReportHistory tablosunu say
        const count = await prisma.reportHistory.count();
        console.log('Toplam Rapor Sayısı:', count);

    } catch (e) {
        console.error('BEKLENMEYEN HATA:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
