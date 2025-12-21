@echo off
echo Telegram Webhook Durumu
echo.

REM Bot token'ınızı buraya ekleyin
set BOT_TOKEN=YOUR_BOT_TOKEN_HERE

echo Webhook bilgileri aliniyor...
powershell -Command "Invoke-RestMethod -Uri 'https://api.telegram.org/bot%BOT_TOKEN%/getWebhookInfo' | ConvertTo-Json -Depth 10"

echo.
pause

