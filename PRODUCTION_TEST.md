# Production (Vercel) Test Rehberi

## 🚀 Production'da Test Etme

Production'da test endpoint'i secret key ile korunur. Güvenlik için bu key'i Vercel Environment Variables'a eklemeniz gerekir.

## 📋 Adım Adım Kurulum

### 1. Vercel Environment Variable Ekleme

1. **Vercel Dashboard'a gidin:**
   - https://vercel.com/dashboard
   - Projenizi seçin

2. **Settings → Environment Variables'a gidin**

3. **Yeni variable ekleyin:**
   - **Name:** `TEST_API_SECRET_KEY`
   - **Value:** Güçlü bir secret key (örn: `my-super-secret-test-key-2025`)
   - **Environment:** Production (veya All)

4. **Save butonuna tıklayın**

5. **Redeploy yapın** (gerekirse)

### 2. Test API'yi Çağırma

#### Yöntem 1: Batch Dosyası (Kolay)

1. **`test-api-production.bat` dosyasını açın**
2. **`SECRET_KEY` değerini Vercel'de ayarladığınız key ile değiştirin**
3. **Dosyayı kaydedin**
4. **Çift tıklayarak çalıştırın**

#### Yöntem 2: Tarayıcı Console

1. **Tarayıcıda `https://www.isgpratik.com` açın**
2. **F12 tuşuna basın** (Developer Tools)
3. **Console sekmesine gidin**
4. **Şu kodu yapıştırın** (SECRET_KEY'i değiştirin):

```javascript
fetch('https://www.isgpratik.com/api/test/add-job-posting?key=YOUR_SECRET_KEY_HERE', {
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
  alert('Hata: ' + error.message);
});
```

#### Yöntem 3: PowerShell

```powershell
$secretKey = "YOUR_SECRET_KEY_HERE"
$body = @{
    content = "Test İş İlanı - İSG Uzmanı aranıyor"
    channelUsername = "test_channel"
} | ConvertTo-Json

$headers = @{
    'x-test-key' = $secretKey
}

Invoke-RestMethod -Uri "https://www.isgpratik.com/api/test/add-job-posting" `
    -Method Post `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $body
```

#### Yöntem 4: Query Parameter ile

```javascript
// URL'de key parametresi ile
fetch('https://www.isgpratik.com/api/test/add-job-posting?key=YOUR_SECRET_KEY', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    content: 'Test İş İlanı',
    channelUsername: 'test_channel'
  })
})
```

## ✅ Test Sonrası Kontrol

1. **Web sitesinde kontrol:**
   - `https://www.isgpratik.com/is-ilanlari` sayfasını açın
   - Test ilanı listede görünmeli

2. **Veritabanında kontrol:**
   - Vercel Dashboard → Storage → Postgres → Query
   - `SELECT * FROM job_postings ORDER BY "createdAt" DESC LIMIT 1;`

## 🔐 Güvenlik Notları

1. **Secret key'i güvenli tutun**
   - Asla public repository'lerde paylaşmayın
   - Sadece güvendiğiniz kişilerle paylaşın

2. **Production'da dikkatli kullanın**
   - Test endpoint'i gerçek veritabanına veri ekler
   - Test verilerini düzenli olarak temizleyin

3. **İleride kaldırılabilir**
   - Test tamamlandıktan sonra endpoint'i kaldırabilirsiniz
   - Veya sadece admin kullanıcılar için erişilebilir yapabilirsiniz

## 🔧 Sorun Giderme

### Hata: "Unauthorized - Secret key gerekli"

**Çözüm:**
1. Vercel Dashboard → Environment Variables → `TEST_API_SECRET_KEY` kontrol edin
2. Batch dosyasındaki `SECRET_KEY` değerini güncelleyin
3. Vercel'de redeploy yapın

### Hata: "Environment variable not found"

**Çözüm:**
- Vercel'de `TEST_API_SECRET_KEY` environment variable'ının eklendiğinden emin olun
- Production environment'ı seçtiğinizden emin olun

## 📝 Örnek Kullanım

### Basit Test
```javascript
fetch('https://www.isgpratik.com/api/test/add-job-posting?key=YOUR_KEY', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Test İş İlanı',
    channelUsername: 'test_channel'
  })
})
```

### Detaylı Test
```javascript
fetch('https://www.isgpratik.com/api/test/add-job-posting?key=YOUR_KEY', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'İSG Uzmanı Aranıyor\n\nFirmamız için deneyimli İSG uzmanı aranmaktadır.\n\nGereksinimler:\n- İSG sertifikası\n- Minimum 2 yıl deneyim',
    channelUsername: 'isg_ilanlari'
  })
})
```
