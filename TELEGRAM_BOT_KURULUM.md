# Telegram Bot Kurulum Rehberi

Bu rehber, Telegram kanalından otomatik olarak iş ilanlarını çekmek için gerekli adımları içerir.

## 📋 Gereksinimler

1. **Telegram Bot Token**: BotFather'dan alınacak bot token'ı
2. **Kanal Erişimi**: Bot'un kanala admin olarak eklenmesi (kanal sahibinden izin gerekebilir)
3. **Webhook URL**: Production ortamında webhook için public URL

## 🚀 Adım Adım Kurulum

### 1. Telegram Bot Oluşturma

1. Telegram'da [@BotFather](https://t.me/BotFather) ile konuşun
2. `/newbot` komutunu gönderin
3. Bot'unuz için bir isim seçin (örn: "İSG İş İlanları Bot")
4. Bot'unuz için bir kullanıcı adı seçin (örn: `isg_is_ilanlari_bot`)
5. BotFather size bir **Bot Token** verecek. Bu token'ı kopyalayın.

**Örnek Token Formatı:**
```
123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 2. Environment Variable Ekleme

`.env.local` dosyanıza (veya production environment variables'a) şunu ekleyin:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 3. Bot'u Kanal'a Ekleme

**ÖNEMLİ:** Kanal sahibi olmadığınız için, kanal sahibinden izin almanız gerekebilir.

#### Yöntem 1: Kanal Sahibi İseniz
1. Kanal ayarlarına gidin
2. "Yöneticiler" (Administrators) bölümüne gidin
3. "Yönetici Ekle" (Add Administrator) butonuna tıklayın
4. Bot'unuzu arayın ve ekleyin
5. Bot'a **"Mesaj Gönderme" (Post Messages)** yetkisi verin
6. Bot'a **"Mesajları Düzenleme" (Edit Messages)** yetkisi verin (opsiyonel)

#### Yöntem 2: Kanal Sahibi Değilseniz
1. Kanal sahibiyle iletişime geçin
2. Bot'unuzun amacını açıklayın (iş ilanlarını otomatik olarak web sitesinde göstermek)
3. Bot'un kanala admin olarak eklenmesini isteyin
4. Bot'un sadece mesajları okuması gerektiğini belirtin (spam yapmayacak)

### 4. Webhook Kurulumu

#### Development (Local)
Local development için webhook kullanmak zor olabilir. Bunun yerine manuel test yapabilirsiniz.

#### Production
1. Production URL'nizi hazırlayın: `https://yourdomain.com/api/telegram/webhook`
2. Bot'unuzu webhook'a yönlendirin:

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://yourdomain.com/api/telegram/webhook"}'
```

**Webhook'u Kontrol Etme:**
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

**Webhook'u Kaldırma:**
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/deleteWebhook"
```

### 5. Veritabanı Migration

Prisma schema'yı güncelledikten sonra migration çalıştırın:

```bash
npx prisma generate
npx prisma db push
```

veya

```bash
npx prisma migrate dev --name add_job_postings
```

### 6. Paketleri Yükleme

```bash
npm install
```

## 🔄 Nasıl Çalışır?

1. **Webhook ile Otomatik**: Kanalda yeni bir mesaj paylaşıldığında, Telegram webhook'u tetikler ve mesaj otomatik olarak veritabanına kaydedilir.

2. **Manuel Çekme**: `/api/telegram/fetch-posts` endpoint'ini POST request ile çağırarak manuel olarak mesajları çekebilirsiniz (şu an için sınırlı).

## 📱 Kullanım

### İş İlanları Sayfası
- URL: `/is-ilanlari`
- Bu sayfa otomatik olarak veritabanındaki iş ilanlarını listeler
- Arama ve filtreleme özellikleri mevcuttur

### API Endpoints

#### 1. Webhook (Otomatik)
- **URL**: `/api/telegram/webhook`
- **Method**: POST
- **Açıklama**: Telegram'dan gelen mesajları otomatik olarak işler

#### 2. İş İlanlarını Listele
- **URL**: `/api/job-postings`
- **Method**: GET
- **Query Parameters**:
  - `page`: Sayfa numarası (default: 1)
  - `limit`: Sayfa başına kayıt (default: 20)
  - `search`: İçerikte arama
  - `channel`: Kanal adına göre filtreleme

#### 3. Mesaj Durumu Kontrol
- **URL**: `/api/telegram/fetch-posts`
- **Method**: GET
- **Query Parameters**:
  - `channel`: Kanal kullanıcı adı

## ⚠️ Önemli Notlar

1. **Rate Limiting**: Telegram Bot API rate limit'leri vardır. Çok fazla istek göndermeyin.

2. **Kanal Erişimi**: Bot'un kanala erişebilmesi için admin olması gerekir. Kanal sahibi değilseniz, kanal sahibinden izin alın.

3. **Mesaj Formatı**: Bot sadece kanal mesajlarını işler. Özel mesajlar ve grup mesajları işlenmez.

4. **Medya Dosyaları**: Fotoğraf ve videolar için şu an sadece file_id saklanıyor. İleride Telegram Bot API ile dosya URL'si alınabilir.

5. **Gizlilik**: Bot token'ınızı asla public repository'lerde paylaşmayın. `.env.local` dosyasını `.gitignore`'a ekleyin.

## 🐛 Sorun Giderme

### Bot kanala erişemiyor
- Bot'un kanala admin olarak eklendiğinden emin olun
- Bot'a "Post Messages" yetkisi verildiğinden emin olun
- Kanal adını doğru yazdığınızdan emin olun (@ işareti olmadan)

### Webhook çalışmıyor
- Webhook URL'nin HTTPS olduğundan emin olun (HTTP çalışmaz)
- SSL sertifikanızın geçerli olduğundan emin olun
- `getWebhookInfo` ile webhook durumunu kontrol edin

### Mesajlar kaydedilmiyor
- Veritabanı bağlantısını kontrol edin
- Prisma migration'ların çalıştığından emin olun
- Console log'ları kontrol edin

## 📚 Ek Kaynaklar

- [Telegram Bot API Dokümantasyonu](https://core.telegram.org/bots/api)
- [node-telegram-bot-api GitHub](https://github.com/yagop/node-telegram-bot-api)
- [Telegram Bot Örnekleri](https://github.com/yagop/node-telegram-bot-api/tree/master/examples)

## 🔐 Güvenlik

1. Bot token'ınızı asla paylaşmayın
2. Webhook URL'nizi sadece güvendiğiniz kaynaklardan çağırın
3. Rate limiting ekleyin (ileride)
4. Admin paneli ekleyerek bot'u yönetebilirsiniz (ileride)

## 📝 Notlar

- Şu an için bot sadece yeni mesajları dinler. Geçmiş mesajları çekmek için farklı bir yöntem gerekir (Telegram Client API - MTProto).
- İleride admin paneli eklenerek bot yönetimi kolaylaştırılabilir.
- Medya dosyalarını indirmek için Telegram Bot API'nin `getFile` metodunu kullanabilirsiniz.
