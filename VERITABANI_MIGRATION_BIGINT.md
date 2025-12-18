# Veritabanı Migration - BigInt Dönüşümü

## ⚠️ ÖNEMLİ: Migration Yapılması Gerekiyor

`telegramMessageId` kolonu `INT4` (32-bit integer) tipinden `BIGINT` (64-bit integer) tipine dönüştürülmelidir.

## 🔧 Migration Yöntemleri

### Yöntem 1: Supabase Dashboard (En Kolay)

1. **Supabase Dashboard'a gidin:**
   - https://supabase.com/dashboard
   - Projenizi seçin

2. **SQL Editor'a gidin:**
   - Sol menüden "SQL Editor" seçin

3. **Şu SQL'i çalıştırın:**

```sql
-- Mevcut kolonu BIGINT'e dönüştür
ALTER TABLE job_postings 
ALTER COLUMN "telegramMessageId" TYPE BIGINT USING "telegramMessageId"::BIGINT;
```

4. **Sonucu kontrol edin:**
   - "Success. No rows returned" mesajı görünmeli

### Yöntem 2: Vercel CLI ile Prisma

1. **Vercel CLI'yi yükleyin (yoksa):**
   ```bash
   npm install -g vercel
   ```

2. **Vercel'e login olun:**
   ```bash
   vercel login
   ```

3. **Projeyi link edin:**
   ```bash
   vercel link
   ```

4. **Migration yapın:**
   ```bash
   npx prisma db push
   ```

   **UYARI:** Bu komut mevcut verileri etkileyebilir. Önce yedek alın!

### Yöntem 3: Prisma Migrate (Önerilen - Production için)

1. **Migration dosyası oluşturun:**
   ```bash
   npx prisma migrate dev --name change_telegram_message_id_to_bigint
   ```

2. **Migration'ı production'a uygulayın:**
   ```bash
   npx prisma migrate deploy
   ```

## ✅ Migration Sonrası Kontrol

1. **Supabase Dashboard → Table Editor → job_postings**
   - `telegramMessageId` kolonunun tipi `bigint` olmalı

2. **Veya SQL ile kontrol:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'job_postings' 
   AND column_name = 'telegramMessageId';
   ```

   Sonuç: `data_type` = `bigint` olmalı

## 🧪 Test

Migration sonrası:

1. `test-api-production.bat` dosyasını çalıştırın
2. `https://www.isgpratik.com/is-ilanlari` sayfasını kontrol edin
3. Yeni test ilanı görünmeli

## ⚠️ Dikkat

- Migration sırasında mevcut veriler korunur
- Eğer `telegramMessageId` değerleri INT4 sınırlarını aşıyorsa, migration başarısız olabilir
- Bu durumda önce verileri temizlemeniz gerekebilir

## 🔍 Sorun Giderme

### Hata: "column cannot be cast automatically to type bigint"

**Çözüm:**
```sql
-- Önce NULL olmayan değerleri kontrol edin
SELECT COUNT(*) FROM job_postings WHERE "telegramMessageId" IS NOT NULL;

-- Eğer veri varsa, USING clause ile dönüştürün
ALTER TABLE job_postings 
ALTER COLUMN "telegramMessageId" TYPE BIGINT USING "telegramMessageId"::BIGINT;
```

### Hata: "value out of range for type integer"

**Çözüm:**
- Bu hata, mevcut verilerin INT4 sınırlarını aştığını gösterir
- Önce verileri temizleyin veya migration'ı yapmadan önce verileri kontrol edin

