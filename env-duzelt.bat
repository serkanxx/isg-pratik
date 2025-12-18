@echo off
echo ========================================
echo .env Dosyasi Duzenleme
echo ========================================
echo.

REM Script'in bulunduğu dizine geç
cd /d "%~dp0"

echo Calisma dizini: %CD%
echo.

if not exist ".env" (
    echo HATA: .env dosyasi bulunamadi!
    pause
    exit /b 1
)

echo .env dosyasindaki DATABASE_URL satiri:
findstr /i "DATABASE_URL" .env
echo.
echo.
echo SORUN: Prisma DATABASE_URL'i bulamiyor.
echo.
echo COZUM:
echo 1. .env dosyasini acin
echo 2. DATABASE_URL satirini kontrol edin
echo 3. Asagidaki formatta oldugundan emin olun:
echo.
echo    DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
echo.
echo ONEMLI:
echo - Tirmak isaretleri olmalidir (")
echo - Satir sonunda bosluk olmamali
echo - Sifredeki ozel karakterler URL encoded olmali
echo.
echo Ornek dogru format:
echo DATABASE_URL="postgresql://postgres:serkan7356Y*@db.bskxzjgjxebqbwglinkr.supabase.co:5432/postgres"
echo.
pause
