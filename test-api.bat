@echo off
echo ========================================
echo Test API - Localhost
echo ========================================
echo.

REM Script'in bulunduğu dizine geç
cd /d "%~dp0"

echo Test is ilani ekleniyor (localhost)...
echo.

powershell -Command "$body = @{content = 'Test İş İlanı - İSG Uzmanı aranıyor. Deneyimli, sertifikalı İSG uzmanı aranmaktadır.'; channelUsername = 'test_channel'} | ConvertTo-Json; Invoke-RestMethod -Uri 'http://localhost:3000/api/test/add-job-posting' -Method Post -ContentType 'application/json' -Body $body | ConvertTo-Json -Depth 10"

echo.
echo Test tamamlandi!
echo.
echo Kontrol etmek icin:
echo 1. Prisma Studio'yu yenileyin (F5)
echo 2. Veya http://localhost:3000/is-ilanlari sayfasini acin
echo.
pause
