@echo off
echo ========================================
echo Test API - Production (Vercel)
echo ========================================
echo.

REM Script'in bulunduğu dizine geç
cd /d "%~dp0"

echo UYARI: Bu script production (Vercel) uzerinde test yapar.
echo.
echo Production URL: https://www.isgpratik.com
echo.

REM Secret key - Production'da environment variable olarak ayarlanmalı
REM Vercel Dashboard -> Settings -> Environment Variables -> TEST_API_SECRET_KEY
   set SECRET_KEY=my-secret-test-key-2025

echo Test is ilani ekleniyor...
echo.

powershell -Command "$body = @{content = 'Test İş İlanı - İSG Uzmanı aranıyor. Deneyimli, sertifikalı İSG uzmanı aranmaktadır.'; channelUsername = 'test_channel'} | ConvertTo-Json; $headers = @{'x-test-key' = '%SECRET_KEY%'}; Invoke-RestMethod -Uri 'https://www.isgpratik.com/api/test/add-job-posting' -Method Post -ContentType 'application/json' -Headers $headers -Body $body | ConvertTo-Json -Depth 10"

echo.
echo Test tamamlandi!
echo.
echo Kontrol etmek icin:
echo 1. https://www.isgpratik.com/is-ilanlari sayfasini acin
echo 2. Test ilanini kontrol edin
echo.
echo NOT: Eger 401 Unauthorized hatasi alirsaniz:
echo - Vercel Dashboard -> Settings -> Environment Variables
echo - TEST_API_SECRET_KEY ekleyin
echo - Bu batch dosyasindaki SECRET_KEY degerini guncelleyin
echo.
pause
