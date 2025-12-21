@echo off
chcp 65001 >nul
echo ========================================
echo Telegram Webhook Yeniden Kurulum
echo ========================================
echo.

REM Bot token'ı buraya ekleyin
set BOT_TOKEN=8030105705:AAE_tkUwlHjJcycYTRFNrY-Cei0HffPgDmc
set WEBHOOK_URL=https://www.isgpratik.com/api/telegram/webhook

echo Webhook URL: %WEBHOOK_URL%
echo.

echo Webhook kuruluyor...
echo.

powershell -Command "$PSDefaultParameterValues['*:Encoding'] = 'utf8'; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $botToken = '%BOT_TOKEN%'; $webhookUrl = '%WEBHOOK_URL%'; try { $body = @{url = $webhookUrl} | ConvertTo-Json; $response = Invoke-WebRequest -Uri \"https://api.telegram.org/bot$botToken/setWebhook\" -Method Post -ContentType 'application/json; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) -UseBasicParsing -ErrorAction Stop; Write-Host 'Status Code:' $response.StatusCode -ForegroundColor Green; Write-Host 'Response:' -ForegroundColor Green; $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 } catch { Write-Host 'Hata:' -ForegroundColor Red; Write-Host $_.Exception.Message -ForegroundColor Red; if ($_.Exception.Response) { $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream(), [System.Text.Encoding]::UTF8); $responseBody = $reader.ReadToEnd(); Write-Host 'Response Body:' -ForegroundColor Yellow; Write-Host $responseBody -ForegroundColor Yellow } }"

echo.
echo ========================================
echo Webhook kurulumu tamamlandı.
echo.
echo Bekleyen mesajları kontrol etmek için webhook-durum-kontrol.bat dosyasını çalıştırın.
echo ========================================
pause





