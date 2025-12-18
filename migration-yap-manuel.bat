@echo off
echo ========================================
echo Veritabani Migration - Manuel Komutlar
echo ========================================
echo.
echo Bu script size komutlari gosterir, siz manuel calistirirsiniz.
echo.

REM Script'in bulunduğu dizine geç
cd /d "%~dp0"

echo Calisma dizini: %CD%
echo.
echo Asagidaki komutlari sirasiyla calistirin:
echo.
echo 1. npx prisma generate
echo 2. npx prisma db push
echo.
echo Veya tek seferde:
echo npx prisma generate && npx prisma db push
echo.
pause
