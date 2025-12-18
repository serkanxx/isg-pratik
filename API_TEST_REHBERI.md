# API Test Rehberi

## 🧪 Test API Endpoint'i

Test için oluşturduğumuz endpoint: `/api/test/add-job-posting`

## 📝 Test Yöntemleri

### Yöntem 1: Batch Dosyası (En Kolay)

1. **Next.js dev server'ın çalıştığından emin olun:**
   ```bash
   npm run dev
   ```

2. **`test-api.bat` dosyasını çift tıklayın**
   - Otomatik olarak test verisi ekler

### Yöntem 2: PowerShell Terminal

1. **PowerShell'i açın**
2. **Şu komutu çalıştırın:**

```powershell
$body = @{
    content = "Test İş İlanı - İSG Uzmanı aranıyor"
    channelUsername = "test_channel"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/test/add-job-posting" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### Yöntem 3: Tarayıcı Console (Chrome/Edge/Firefox)

1. **Tarayıcıda `http://localhost:3000` açın**
2. **F12 tuşuna basın** (Developer Tools)
3. **Console sekmesine gidin**
4. **Şu kodu yapıştırın ve Enter'a basın:**

```javascript
fetch('http://localhost:3000/api/test/add-job-posting', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    content: 'Test İş İlanı - İSG Uzmanı aranıyor. Deneyimli, sertifikalı İSG uzmanı aranmaktadır.',
    channelUsername: 'test_channel'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Başarılı:', data);
  alert('Test iş ilanı eklendi! /is-ilanlari sayfasını kontrol edin.');
})
.catch(error => {
  console.error('Hata:', error);
  alert('Hata oluştu: ' + error.message);
});
```

### Yöntem 4: curl (Eğer Windows'ta curl varsa)

```bash
curl -X POST http://localhost:3000/api/test/add-job-posting \
  -H "Content-Type: application/json" \
  -d "{\"content\": \"Test İş İlanı\", \"channelUsername\": \"test_channel\"}"
```

### Yöntem 5: Postman veya Insomnia

1. **Yeni bir POST request oluşturun**
2. **URL:** `http://localhost:3000/api/test/add-job-posting`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (raw JSON):**
   ```json
   {
     "content": "Test İş İlanı - İSG Uzmanı aranıyor",
     "channelUsername": "test_channel"
   }
   ```
5. **Send butonuna tıklayın**

## ✅ Başarılı Test Sonrası

Test başarılı olduysa:

1. **Prisma Studio'yu yenileyin** (F5)
   - `job_postings` tablosunda yeni kayıt görünmeli

2. **Web sitesinde kontrol edin:**
   - `http://localhost:3000/is-ilanlari` sayfasını açın
   - Test ilanı listede görünmeli

3. **API response:**
   ```json
   {
     "success": true,
     "message": "Test iş ilanı eklendi",
     "data": {
       "id": "...",
       "content": "Test İş İlanı...",
       ...
     }
   }
   ```

## 🔍 Sorun Giderme

### Hata: "Cannot POST /api/test/add-job-posting"

**Çözüm:**
- Next.js dev server'ın çalıştığından emin olun: `npm run dev`
- Port 3000'in kullanılabilir olduğundan emin olun

### Hata: "Bu endpoint sadece development için"

**Çözüm:**
- `NODE_ENV=production` ise bu endpoint çalışmaz
- Development modunda çalıştırdığınızdan emin olun

### Hata: "content parametresi gerekli"

**Çözüm:**
- Request body'de `content` alanının olduğundan emin olun
- JSON formatının doğru olduğundan emin olun

## 📝 Örnek Test Verileri

### Basit Test
```json
{
  "content": "Test İş İlanı",
  "channelUsername": "test_channel"
}
```

### Detaylı Test
```json
{
  "content": "İSG Uzmanı Aranıyor\n\nFirmamız için deneyimli İSG uzmanı aranmaktadır.\n\nGereksinimler:\n- İSG sertifikası\n- Minimum 2 yıl deneyim\n- İyi iletişim becerileri\n\nİletişim: info@firma.com",
  "channelUsername": "isg_ilanlari"
}
```

## 🎯 Hızlı Test

**En kolay yöntem:**
1. `test-api.bat` dosyasını çift tıklayın
2. Prisma Studio'yu yenileyin (F5)
3. Yeni kaydı görün!

