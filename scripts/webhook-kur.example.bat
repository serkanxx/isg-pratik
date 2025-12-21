@echo off
echo Telegram Webhook Kurulumu
echo.

REM Bot token'ınızı buraya ekleyin
set BOT_TOKEN=YOUR_BOT_TOKEN_HERE
set WEBHOOK_URL=https://www.isgpratik.com/api/telegram/webhook

echo Webhook URL: %WEBHOOK_URL%
echo.

echo Webhook kuruluyor...
powershell -Command "$body = @{url = '%WEBHOOK_URL%'} | ConvertTo-Json; Invoke-RestMethod -Uri 'https://api.telegram.org/bot%BOT_TOKEN%/setWebhook' -Method Post -ContentType 'application/json' -Body $body"

echo.
echo Webhook durumu kontrol ediliyor...
powershell -Command "Invoke-RestMethod -Uri 'https://api.telegram.org/bot%BOT_TOKEN%/getWebhookInfo'"

echo.
echo Kurulum tamamlandi!
pause

