@echo off
chcp 65001 >nul
echo ========================================
echo Telegram Webhook Durum Kontrolü
echo ========================================
echo.

REM Bot token'ı buraya ekleyin
set BOT_TOKEN=8030105705:AAE_tkUwlHjJcycYTRFNrY-Cei0HffPgDmc

echo [1] Webhook bilgilerini kontrol ediliyor...
echo.

powershell -Command "$PSDefaultParameterValues['*:Encoding'] = 'utf8'; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; try { $response = Invoke-WebRequest -Uri 'https://api.telegram.org/bot%BOT_TOKEN%/getWebhookInfo' -UseBasicParsing -ErrorAction Stop; Write-Host 'Status Code:' $response.StatusCode -ForegroundColor Green; Write-Host 'Response:' -ForegroundColor Green; $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 } catch { Write-Host 'Hata:' -ForegroundColor Red; Write-Host $_.Exception.Message -ForegroundColor Red; if ($_.Exception.Response) { $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream(), [System.Text.Encoding]::UTF8); $responseBody = $reader.ReadToEnd(); Write-Host 'Response Body:' -ForegroundColor Yellow; Write-Host $responseBody -ForegroundColor Yellow } }"

echo.
echo [2] Webhook endpoint durumunu kontrol ediliyor...
echo.

powershell -Command "$PSDefaultParameterValues['*:Encoding'] = 'utf8'; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; try { $response = Invoke-WebRequest -Uri 'https://www.isgpratik.com/api/telegram/webhook' -Method Get -UseBasicParsing -ErrorAction Stop; Write-Host 'Status Code:' $response.StatusCode -ForegroundColor Green; Write-Host 'Response:' -ForegroundColor Green; $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 } catch { Write-Host 'Hata:' -ForegroundColor Red; Write-Host $_.Exception.Message -ForegroundColor Red; if ($_.Exception.Response) { $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream(), [System.Text.Encoding]::UTF8); $responseBody = $reader.ReadToEnd(); Write-Host 'Response Body:' -ForegroundColor Yellow; Write-Host $responseBody -ForegroundColor Yellow } }"

echo.
echo ========================================
echo Kontrol tamamlandı.
echo ========================================
pause




