@echo off
echo ========================================
echo .env Dosyasi Kontrol
echo ========================================
echo.

REM Script'in bulunduğu dizine geç
cd /d "%~dp0"

echo Calisma dizini: %CD%
echo.

if not exist ".env" (
    echo HATA: .env dosyasi bulunamadi!
    echo Lutfen .env dosyasi olusturun.
    pause
    exit /b 1
)

echo .env dosyasi bulundu.
echo.
echo DATABASE_URL kontrol ediliyor...
echo.

REM DATABASE_URL'i kontrol et (case-insensitive)
findstr /i "DATABASE_URL" .env >nul
if %errorlevel% neq 0 (
    echo HATA: DATABASE_URL bulunamadi!
    echo.
    echo .env dosyasinda DATABASE_URL satiri olmalidir.
    echo Ornek: DATABASE_URL="postgresql://..."
    pause
    exit /b 1
)

echo DATABASE_URL bulundu!
echo.
echo .env dosyasindaki DATABASE_URL satiri:
findstr /i "DATABASE_URL" .env
echo.
echo.
echo NOT: Eger yukaridaki satir bos veya hatali gorunuyorsa,
echo .env dosyasini duzenleyip tekrar deneyin.
echo.
pause

