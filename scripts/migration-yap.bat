@echo off
echo ========================================
echo Veritabani Migration Islemi
echo ========================================
echo.

REM Script'in bulunduğu dizine geç
cd /d "%~dp0"

echo Calisma dizini: %CD%
echo.

REM Prisma schema dosyasını kontrol et
if not exist "prisma\schema.prisma" (
    echo HATA: prisma\schema.prisma dosyasi bulunamadi!
    echo Lutfen script'i proje kok dizininde calistirin.
    pause
    exit /b 1
)

echo UYARI: Next.js dev server calisiyorsa, once kapatmaniz onerilir.
echo.
pause

echo 1. Prisma Client generate ediliyor...
call npx prisma generate
if %errorlevel% neq 0 (
    echo.
    echo HATA: Prisma generate basarisiz!
    echo.
    echo Cozum onerileri:
    echo - Next.js dev server'i kapatip tekrar deneyin
    echo - IDE'yi kapatip tekrar deneyin
    echo - Bilgisayari yeniden baslatin
    pause
    exit /b 1
)

echo.
echo 2. Schema veritabanina push ediliyor...
call npx prisma db push
if %errorlevel% neq 0 (
    echo.
    echo HATA: Database push basarisiz!
    echo.
    echo Cozum onerileri:
    echo - DATABASE_URL environment variable'ini kontrol edin
    echo - Veritabani baglantisini kontrol edin
    pause
    exit /b 1
)

echo.
echo ========================================
echo Migration basariyla tamamlandi!
echo ========================================
echo.
echo Kontrol etmek icin: npx prisma studio
echo.
pause

