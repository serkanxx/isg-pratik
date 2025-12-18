# Webhook Kurulum Adımları

## ⚠️ ÖNEMLİ GÜVENLİK UYARISI
**Bot token'ınızı asla public olarak paylaşmayın!** Token'ınızı güvenli bir yerde saklayın ve sadece environment variable olarak kullanın.

## 📋 Adım Adım Webhook Kurulumu

### 1. Environment Variable Kontrolü

`.env.local` dosyanızda bot token'ınızın olduğundan emin olun:

```env
TELEGRAM_BOT_TOKEN=8030105705:AAE_tkUwlHjJcycYTRFNrY-Cei0HffPgDmc
```

**NOT:** Bu token'ı güvenli tutun ve asla public repository'lerde paylaşmayın!

### 2. Webhook Endpoint'ini Test Edin

Önce webhook endpoint'inizin çalıştığını kontrol edin:

```bash
curl https://www.isgpratik.com/api/telegram/webhook
```

Bu komut şunu döndürmelidir:
```json
{
  "message": "Telegram Webhook endpoint aktif",
  "status": "ready",
  "note": "Bot token bulundu. Webhook kurulumu yapılabilir.",
  "webhookUrl": "https://www.isgpratik.com/api/telegram/webhook"
}
```

### 3. Webhook'u Kurun

**Windows PowerShell için:**
```powershell
$botToken = "8030105705:AAE_tkUwlHjJcycYTRFNrY-Cei0HffPgDmc"
$webhookUrl = "https://www.isgpratik.com/api/telegram/webhook"

$body = @{
    url = $webhookUrl
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.telegram.org/bot$botToken/setWebhook" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

**Linux/Mac için:**
```bash
curl -X POST "https://api.telegram.org/bot8030105705:AAE_tkUwlHjJcycYTRFNrY-Cei0HffPgDmc/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.isgpratik.com/api/telegram/webhook"}'
```

### 4. Webhook Durumunu Kontrol Edin

Webhook'un başarıyla kurulduğunu kontrol edin:

**Windows PowerShell:**
```powershell
$botToken = "8030105705:AAE_tkUwlHjJcycYTRFNrY-Cei0HffPgDmc"
Invoke-RestMethod -Uri "https://api.telegram.org/bot$botToken/getWebhookInfo"
```

**Linux/Mac:**
```bash
curl "https://api.telegram.org/bot8030105705:AAE_tkUwlHjJcycYTRFNrY-Cei0HffPgDmc/getWebhookInfo"
```

Başarılı bir kurulum şunu döndürmelidir:
```json
{
  "ok": true,
  "result": {
    "url": "https://www.isgpratik.com/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

### 5. Test Mesajı Gönderin

1. Bot'unuzun ekli olduğu kanala bir test mesajı gönderin
2. Veritabanınızı kontrol edin - mesaj otomatik olarak kaydedilmiş olmalı
3. `/is-ilanlari` sayfasında yeni mesajı görebilmelisiniz

## 🔍 Sorun Giderme

### Webhook kurulumu başarısız oluyor

1. **SSL Sertifikası Kontrolü:**
   - Webhook URL'nizin HTTPS olduğundan emin olun
   - SSL sertifikanızın geçerli olduğundan emin olun
   - `https://www.isgpratik.com/api/telegram/webhook` adresine tarayıcıdan erişebildiğinizden emin olun

2. **Bot Token Kontrolü:**
   - Bot token'ınızın doğru olduğundan emin olun
   - Environment variable'ın doğru yüklendiğinden emin olun

3. **Endpoint Erişilebilirliği:**
   ```bash
   curl https://www.isgpratik.com/api/telegram/webhook
   ```
   Bu komut bir JSON response döndürmelidir.

### Mesajlar kaydedilmiyor

1. **Veritabanı Migration:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

2. **Bot'un Kanalda Olduğundan Emin Olun:**
   - Bot'un kanala admin olarak eklendiğinden emin olun
   - Bot'a "Post Messages" yetkisi verildiğinden emin olun

3. **Console Log'larını Kontrol Edin:**
   - Vercel/Production log'larını kontrol edin
   - "Yeni iş ilanı kaydedildi" mesajını arayın

### Webhook'u Kaldırma

Eğer webhook'u kaldırmak isterseniz:

**Windows PowerShell:**
```powershell
$botToken = "8030105705:AAE_tkUwlHjJcycYTRFNrY-Cei0HffPgDmc"
Invoke-RestMethod -Uri "https://api.telegram.org/bot$botToken/deleteWebhook" -Method Post
```

**Linux/Mac:**
```bash
curl -X POST "https://api.telegram.org/bot8030105705:AAE_tkUwlHjJcycYTRFNrY-Cei0HffPgDmc/deleteWebhook"
```

## 📝 Notlar

- Webhook kurulumu sadece bir kez yapılmalıdır
- Production'da webhook URL'niz değişirse, tekrar `setWebhook` çağırmanız gerekir
- Webhook'un çalışması için bot'un kanala admin olarak eklenmesi gerekir
- Her yeni mesaj için webhook otomatik olarak tetiklenir

## 🔐 Güvenlik Önerileri

1. **Bot Token'ını Güvenli Tutun:**
   - Token'ı asla public repository'lerde paylaşmayın
   - Environment variable olarak kullanın
   - Token'ı düzenli olarak yenileyin (gerekirse)

2. **Webhook URL'yi Doğrulayın:**
   - Sadece kendi domain'inizden webhook alın
   - Webhook endpoint'inize authentication ekleyebilirsiniz (ileride)

3. **Rate Limiting:**
   - Telegram'ın rate limit'lerine dikkat edin
   - Çok fazla istek göndermeyin
