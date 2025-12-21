# İSG Pratik - İş Sağlığı ve Güvenliği Risk Yönetim Sistemi

İSG Pratik, İş Sağlığı ve Güvenliği (İSG) profesyonelleri, OSGB'ler ve iş güvenliği uzmanları için geliştirilmiş, süreçleri dijitalleştiren ve hızlandıran kapsamlı bir yönetim platformudur.

## 🚀 Öne Çıkan Özellikler

- **Risk Değerlendirme:** Fine-Kinney metodolojisi ile profesyonel risk analizleri oluşturun.
- **Acil Durum Planları:** İEYEP uyumlu, otomatik dökümantasyon ve takibi.
- **İş İzin Formları:** Tehlikeli çalışmalar (sıcak iş, yüksekte çalışma vb.) için dijital izin süreçleri.
- **Firma Yönetimi:** Müşteri portföyünüzü tek bir merkezden yönetin.
- **Ziyaret Programı:** Haftalık ve aylık ziyaret takvimleri ile saha organizasyonu.
- **Not & Hatırlatma:** Firmaya özel dijital post-it notlar ve görev takibi.
- **Sektörel Kütüphane:** Binlerce hazır tehlike ve önlem maddesi.

## 🛠 Teknoloji Yığını

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router & React 19)
- **Veritabanı:** [Supabase](https://supabase.com/) (PostgreSQL)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Kimlik Doğrulama:** [NextAuth.js](https://next-auth.js.org/)
- **Stil:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Raporlama:** pdfme, jsPDF ve XLSX entegrasyonları

## 📦 Kurulum

1. Depoyu klonlayın:
   ```bash
   git clone [repo-url]
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. Veritabanı şemasını oluşturun:
   ```bash
   npx prisma generate
   ```

4. Uygulamayı başlatın:
   ```bash
   npm run dev
   ```

## 🔒 Güvenlik Notları

- Tüm hassas veriler çevre değişkenleri (`.env`) üzerinden yönetilmelidir.
- Yönetici erişimleri sadece yetkili e-posta adresleri üzerinden tanımlanmıştır.

## 📝 Lisans

Bu proje **özel mülkiyet** kapsamındadır. Tüm hakları saklıdır.
