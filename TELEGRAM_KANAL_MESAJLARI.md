# Telegram Kanal Mesajları - Önemli Bilgi

## ⚠️ Telegram Bot API Sınırlaması

**Telegram Bot API, kanal mesajlarını direkt olarak webhook ile göndermez!**

### Nasıl Çalışır?

1. **Kanal Mesajları (`channel_post`):**
   - Bot'un kanala admin olarak eklenmesi ve "Post Messages" yetkisi olması gerekir
   - Ancak **sadece bot'un kendisinin gönderdiği mesajlar** webhook'a gelir
   - Başkalarının gönderdiği mesajlar **webhook'a gelmez**

2. **Grup Mesajları (`message`):**
   - Bot grup üyesi ise, grup mesajları webhook'a gelir
   - Ancak kanal mesajları grup mesajı değildir

## 🔧 Çözüm Yöntemleri

### Yöntem 1: Bot'un Mesajları Forward Etmesi (Önerilen)

1. Kanal sahibi veya admin, yeni mesajları bot'a forward eder
2. Bot forward edilen mesajları alır ve işler
3. Webhook'ta `update.message.forward_from_chat` kontrolü yapılır

### Yöntem 2: Telegram Client API (MTProto) - Gelişmiş

- `@mtproto/core` veya `grammy` kütüphaneleri kullanılır
- Bot yerine normal kullanıcı hesabı ile giriş yapılır
- Tüm kanal mesajları alınabilir
- Daha karmaşık kurulum gerektirir

### Yöntem 3: RSS Feed (Eğer Kanal RSS Sağlıyorsa)

- Bazı kanallar RSS feed sağlar
- RSS feed'i parse ederek mesajlar alınabilir
- Ancak çoğu kanal RSS sağlamaz

## 📝 Mevcut Durum

Webhook endpoint'i şu anda hem `channel_post` hem de `message` update'lerini işleyecek şekilde güncellendi. Ancak:

- **Bot'un gönderdiği mesajlar** → ✅ Çalışır
- **Başkalarının gönderdiği mesajlar** → ❌ Çalışmaz (Telegram API sınırlaması)

## 🚀 Önerilen Çözüm: Forward Sistemi

Kanal sahibi veya admin, yeni mesajları bot'a forward ederse, bot bu mesajları alabilir. Webhook kodu forward mesajlarını da işleyecek şekilde güncellenebilir.

### Forward Mesajlarını İşleme

```typescript
if (update.message && update.message.forward_from_chat) {
  // Forward edilmiş mesaj
  const forwardedChat = update.message.forward_from_chat;
  if (forwardedChat.type === 'channel') {
    // Kanal mesajı forward edilmiş
    // İşle...
  }
}
```

## 🔍 Test Etme

1. Bot'u kanala admin olarak ekleyin
2. Bot'a "Post Messages" yetkisi verin
3. **Bot'un kendisinden** kanala bir test mesajı gönderin
4. Webhook log'larını kontrol edin
5. Veritabanını kontrol edin

## 📚 Kaynaklar

- [Telegram Bot API - Updates](https://core.telegram.org/bots/api#update)
- [Telegram Bot API - Channel Posts](https://core.telegram.org/bots/api#channel-post)
- [Telegram MTProto](https://core.telegram.org/api)

