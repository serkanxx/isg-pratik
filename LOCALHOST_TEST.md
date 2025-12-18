# Localhost'ta Telegram Webhook Test Etme

## ⚠️ Sorun

**Telegram webhook'ları localhost'ta çalışmaz!**

Telegram Bot API, webhook'ları sadece:
- ✅ HTTPS ile erişilebilir public URL'lere kurar
- ❌ Localhost'a (localhost:3000) erişemez

## 🔧 Çözümler

### Çözüm 1: Production'da Test (Önerilen)

1. **Kodunuzu deploy edin:**
   ```bash
   git add .
   git commit -m "Telegram webhook eklendi"
   git push
   ```

2. **Vercel'de otomatik deploy olur** (eğer Vercel kullanıyorsanız)

3. **Webhook'u production URL'ye kurun:**
   ```bash
   webhook-kur.bat
   ```

4. **Production'da test edin:**
   - https://www.isgpratik.com/is-ilanlari
   - Kanalda mesaj gönderin veya forward edin

### Çözüm 2: ngrok ile Localhost Test (Geliştirme için)

ngrok kullanarak localhost'unuzu geçici olarak public URL'ye açabilirsiniz:

1. **ngrok'u indirin ve kurun:**
   - https://ngrok.com/download
   - Veya: `npm install -g ngrok`

2. **ngrok'u başlatın:**
   ```bash
   ngrok http 3000
   ```

3. **ngrok size bir URL verecek:**
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:3000
   ```

4. **Webhook'u ngrok URL'sine kurun:**
   ```powershell
   $botToken = "8030105705:AAE_tkUwlHjJcycYTRFNrY-Cei0HffPgDmc"
   $webhookUrl = "https://abc123.ngrok.io/api/telegram/webhook"
   
   $body = @{url = $webhookUrl} | ConvertTo-Json
   Invoke-RestMethod -Uri "https://api.telegram.org/bot$botToken/setWebhook" `
       -Method Post -ContentType "application/json" -Body $body
   ```

5. **Test edin:**
   - Localhost'ta Next.js dev server çalıştırın: `npm run dev`
   - Kanalda mesaj gönderin veya forward edin
   - Localhost'ta mesajları görebilmelisiniz

**NOT:** ngrok free plan'da URL her yeniden başlatmada değişir. Her seferinde webhook'u yeniden kurmanız gerekir.

### Çözüm 3: Manuel Test (Webhook Olmadan)

Webhook olmadan da test edebilirsiniz:

1. **Manuel olarak veritabanına test verisi ekleyin:**
   ```typescript
   // Test için bir API endpoint oluşturun
   // app/api/test/add-job-posting/route.ts
   ```

2. **Veya Prisma Studio kullanın:**
   ```bash
   npx prisma studio
   ```
   - Veritabanını açın
   - `job_postings` tablosuna manuel olarak test verisi ekleyin

## 📝 Localhost'ta Yapılabilecekler

✅ **Yapılabilir:**
- Frontend sayfasını görüntüleme (`/is-ilanlari`)
- API endpoint'lerini test etme (manuel request ile)
- Veritabanı işlemlerini test etme
- Kod geliştirme

❌ **Yapılamaz:**
- Telegram webhook'larını alma
- Gerçek zamanlı mesaj takibi

## 🚀 Önerilen Workflow

1. **Development (Localhost):**
   - Kod geliştirme
   - Frontend test
   - API test (manuel)
   - Veritabanı test

2. **Production (Deploy):**
   - Webhook kurulumu
   - Gerçek Telegram mesajları
   - Canlı test

## 🔍 Webhook Durumunu Kontrol

Production'da webhook'un çalışıp çalışmadığını kontrol edin:

```bash
webhook-kontrol.bat
```

Veya tarayıcıdan:
```
https://www.isgpratik.com/api/telegram/webhook
```

## 📚 Notlar

- Localhost'ta webhook çalışmaz - bu Telegram API'nin bir sınırlamasıdır
- Production'da test etmek en güvenilir yöntemdir
- ngrok sadece geliştirme için geçici bir çözümdür
- Production'da SSL sertifikası olmalı (HTTPS)

