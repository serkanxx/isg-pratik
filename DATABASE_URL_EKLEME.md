# DATABASE_URL Ekleme Rehberi

## 🔍 Sorun

Prisma `DATABASE_URL` environment variable'ını bulamıyor. Bu değişken `.env` dosyasında olmalı.

## 📝 Çözüm: DATABASE_URL Ekleme

### Yöntem 1: Vercel'den DATABASE_URL Alın (Önerilen)

1. **Vercel Dashboard'a gidin:**
   - https://vercel.com/dashboard
   - Projenizi seçin

2. **Environment Variables'a gidin:**
   - Settings → Environment Variables
   - `DATABASE_URL` değişkenini bulun

3. **Değeri kopyalayın**

4. **Local `.env` dosyasına ekleyin:**
   - Proje klasöründe `.env` dosyasını açın
   - Şu satırı ekleyin:
   ```env
   DATABASE_URL="kopyaladiginiz_url_buraya"
   ```

### Yöntem 2: Manuel Olarak Oluşturun

Eğer Vercel'de yoksa veya yeni bir veritabanı kullanacaksanız:

1. **PostgreSQL veritabanı bağlantı bilgilerinizi hazırlayın:**
   - Host (örn: `db.xxxxx.supabase.co`)
   - Port (genellikle `5432`)
   - Database adı
   - Kullanıcı adı
   - Şifre

2. **`.env` dosyasına ekleyin:**
   ```env
   DATABASE_URL="postgresql://kullanici_adi:sifre@host:port/database_adi?schema=public"
   ```

   **Örnek:**
   ```env
   DATABASE_URL="postgresql://postgres:myPassword@db.xxxxx.supabase.co:5432/postgres?schema=public"
   ```

### Yöntem 3: .env.local'den .env'e Kopyalayın

Eğer `.env.local` dosyasında `DATABASE_URL` varsa:

1. `.env.local` dosyasını açın
2. `DATABASE_URL` satırını bulun
3. `.env` dosyasına kopyalayın

## ✅ Kontrol

`.env` dosyasına ekledikten sonra:

```bash
npx prisma db push
```

Bu komut artık çalışmalı.

## 📝 Örnek .env Dosyası

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your-bot-token"

# Supabase (eğer kullanıyorsanız)
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## ⚠️ Önemli Notlar

1. **`.env` dosyası `.gitignore`'da** - Bu dosya GitHub'a push edilmez (güvenlik için)
2. **`.env.local` Prisma tarafından okunmaz** - Prisma sadece `.env` dosyasını okur
3. **Production'da** - Vercel'de `DATABASE_URL` zaten ayarlı olmalı

## 🔧 Hızlı Çözüm

1. `.env` dosyasını açın (proje kök dizininde)
2. Şu satırı ekleyin:
   ```env
   DATABASE_URL="vercel_dashboard_dan_kopyaladiginiz_url"
   ```
3. Dosyayı kaydedin
4. `npx prisma db push` komutunu tekrar çalıştırın

