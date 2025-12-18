@echo off
echo Telegram Webhook Durumu
echo.

set BOT_TOKEN=8030105705:AAE_tkUwlHjJcycYTRFNrY-Cei0HffPgDmc

echo Webhook bilgileri aliniyor...
powershell -Command "Invoke-RestMethod -Uri 'https://api.telegram.org/bot%BOT_TOKEN%/getWebhookInfo' | ConvertTo-Json -Depth 10"

echo.
pause
