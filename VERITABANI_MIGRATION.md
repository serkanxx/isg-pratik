# Veritabanı Migration Rehberi

Bu rehber, yeni eklenen `JobPosting` modelini veritabanına eklemek için gerekli adımları içerir.

## 📋 Ön Hazırlık

### 1. Veritabanı Bağlantısını Kontrol Edin

`.env.local` dosyanızda `DATABASE_URL` olduğundan emin olun:

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

**ÖNEMLİ:** Production'da (Vercel) bu değişken zaten ayarlı olmalı. Kontrol edin:
- Vercel Dashboard → Project → Settings → Environment Variables
- `DATABASE_URL` değişkeninin olduğundan emin olun

## 🚀 Adım Adım Migration

### Yöntem 1: Prisma DB Push (Hızlı - Development için)

Bu yöntem schema'yı direkt veritabanına uygular. Migration dosyası oluşturmaz.

#### Localhost'ta:

1. **Terminal'i açın ve proje klasörüne gidin:**
   ```bash
   cd "c:\Users\SRKN\Desktop\isg robot\isg-projesi\isg-uygulamasi"
   ```

2. **Prisma Client'ı generate edin:**
   ```bash
   npx prisma generate
   ```

3. **Schema'yı veritabanına push edin:**
   ```bash
   npx prisma db push
   ```

4. **Başarı mesajını kontrol edin:**
   ```
   ✔ The database is now in sync with your schema.
   ```

#### Production'da (Vercel):

Vercel'de build sırasında otomatik olarak `prisma generate` çalışır. Ancak `db push` için:

**Seçenek A: Vercel CLI ile (Önerilen)**

1. **Vercel CLI'yi kurun (eğer yoksa):**
   ```bash
   npm install -g vercel
   ```

2. **Vercel'e login olun:**
   ```bash
   vercel login
   ```

3. **Production environment'ı seçin:**
   ```bash
   vercel env pull .env.production
   ```

4. **Migration'ı çalıştırın:**
   ```bash
   npx prisma db push
   ```

**Seçenek B: Vercel Dashboard'dan (Manuel)**

1. Vercel Dashboard → Project → Settings → Environment Variables
2. `DATABASE_URL` değerini kopyalayın
3. Local'de `.env.local` dosyanıza ekleyin
4. `npx prisma db push` komutunu çalıştırın

**Seçenek C: Vercel Postgres Console (Eğer Vercel Postgres kullanıyorsanız)**

1. Vercel Dashboard → Storage → Postgres
2. "Query" sekmesine gidin
3. SQL komutunu çalıştırın (aşağıda SQL script var)

### Yöntem 2: Prisma Migrate (Production için Önerilen)

Bu yöntem migration dosyası oluşturur ve versiyon kontrolü sağlar.

#### Localhost'ta:

1. **Migration oluşturun:**
   ```bash
   npx prisma migrate dev --name add_job_postings
   ```

2. **Migration'ı uygulayın:**
   ```bash
   npx prisma migrate deploy
   ```

#### Production'da:

1. **Migration dosyalarını commit edin:**
   ```bash
   git add prisma/migrations
   git commit -m "Add job_postings migration"
   git push
   ```

2. **Vercel otomatik olarak migration'ı çalıştırır** (build script'inde `prisma migrate deploy` varsa)

   Eğer yoksa, `package.json`'a ekleyin:
   ```json
   {
     "scripts": {
       "build": "prisma generate && prisma migrate deploy && next build"
     }
   }
   ```

### Yöntem 3: Manuel SQL (Alternatif)

Eğer Prisma komutları çalışmazsa, manuel SQL ile tabloyu oluşturabilirsiniz:

```sql
-- job_postings tablosunu oluştur
CREATE TABLE IF NOT EXISTS "job_postings" (
    "id" TEXT NOT NULL,
    "telegramMessageId" INTEGER NOT NULL,
    "channelUsername" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "rawText" TEXT,
    "hasMedia" BOOLEAN NOT NULL DEFAULT false,
    "mediaUrl" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

-- Unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "job_postings_telegramMessageId_key" ON "job_postings"("telegramMessageId");

-- Indexes
CREATE INDEX IF NOT EXISTS "job_postings_channelUsername_postedAt_idx" ON "job_postings"("channelUsername", "postedAt");
CREATE INDEX IF NOT EXISTS "job_postings_isActive_postedAt_idx" ON "job_postings"("isActive", "postedAt");
```

## ✅ Migration'ı Doğrulama

### 1. Prisma Studio ile Kontrol

```bash
npx prisma studio
```

- Tarayıcıda `http://localhost:5555` açılır
- `job_postings` tablosunu kontrol edin
- Tablo görünüyorsa migration başarılı!

### 2. API ile Test

```bash
# Test endpoint'ini çağırın (localhost'ta)
curl -X POST http://localhost:3000/api/test/add-job-posting \
  -H "Content-Type: application/json" \
  -d '{"content": "Test iş ilanı", "channelUsername": "test_channel"}'
```

### 3. Veritabanı Sorgusu ile Kontrol

```sql
-- Tablo var mı?
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'job_postings'
);

-- Tablo yapısını görüntüle
\d job_postings
```

## 🔧 Sorun Giderme

### Hata: "The database schema is not in sync"

**Çözüm:**
```bash
npx prisma db push --force-reset
```

**DİKKAT:** Bu komut tüm verileri siler! Sadece development'ta kullanın.

### Hata: "Migration failed"

**Çözüm:**
1. Migration dosyalarını kontrol edin: `prisma/migrations/`
2. Hatalı migration'ı düzeltin
3. Tekrar deneyin: `npx prisma migrate deploy`

### Hata: "Connection refused"

**Çözüm:**
1. `DATABASE_URL` değişkenini kontrol edin
2. Veritabanı sunucusunun çalıştığından emin olun
3. Firewall/network ayarlarını kontrol edin

### Production'da Migration Çalışmıyor

**Çözüm:**
1. Vercel Dashboard → Project → Settings → Environment Variables
2. `DATABASE_URL` değişkeninin doğru olduğundan emin olun
3. Build log'larını kontrol edin
4. Manuel olarak Vercel CLI ile migration çalıştırın

## 📝 Özet Komutlar

### Development (Localhost)
```bash
# 1. Prisma Client generate
npx prisma generate

# 2. Schema'yı veritabanına push et
npx prisma db push

# 3. Kontrol et
npx prisma studio
```

### Production (Vercel)
```bash
# 1. Environment variable'ları çek
vercel env pull .env.production

# 2. Migration çalıştır
npx prisma db push

# Veya migration ile:
npx prisma migrate deploy
```

## 🎯 Hızlı Başlangıç

**En hızlı yöntem (Development):**

### ⚠️ ÖNEMLİ: Önce Next.js Dev Server'ı Kapatın!

1. **Next.js dev server çalışıyorsa kapatın** (Ctrl+C veya terminal'i kapatın)
2. **IDE'yi kapatın** (VS Code, Cursor vb. - Prisma dosyalarını kilitleyebilir)
3. **Terminal'i açın ve şu komutları çalıştırın:**

```bash
cd "c:\Users\SRKN\Desktop\isg robot\isg-projesi\isg-uygulamasi"
npx prisma generate
npx prisma db push
```

**VEYA batch dosyasını kullanın:**
- `migration-yap.bat` dosyasını çift tıklayın
- Uyarıları okuyun ve devam edin

**Production için:**
1. Vercel Dashboard → Environment Variables → `DATABASE_URL` kontrol et
2. Local'de `.env.local` dosyasına `DATABASE_URL` ekle
3. `npx prisma db push` çalıştır

## 📚 Ek Kaynaklar

- [Prisma Migrate Dokümantasyonu](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma DB Push Dokümantasyonu](https://www.prisma.io/docs/concepts/components/prisma-migrate/db-push)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
