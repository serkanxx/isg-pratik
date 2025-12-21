# .env dosyasını yeniden oluştur (UTF-8 encoding ile)
# Bu script mevcut .env dosyasını okuyup UTF-8 encoding ile yeniden yazar

$envPath = Join-Path $PSScriptRoot ".env"
$backupPath = Join-Path $PSScriptRoot ".env.backup"

Write-Host "========================================"
Write-Host ".env Dosyasi Yeniden Olusturma"
Write-Host "========================================"
Write-Host ""

if (Test-Path $envPath) {
    Write-Host "Mevcut .env dosyasi yedekleniyor..."
    Copy-Item $envPath $backupPath -Force
    Write-Host "Yedek: .env.backup"
    Write-Host ""
    
    # Mevcut içeriği oku
    $content = Get-Content $envPath -Raw
    
    # DATABASE_URL'i bul ve düzelt
    if ($content -match 'DATABASE_URL\s*=\s*([^\r\n]+)') {
        $dbUrl = $matches[1].Trim()
        
        # Tırnak işaretleri yoksa ekle
        if (-not $dbUrl.StartsWith('"')) {
            $dbUrl = '"' + $dbUrl
        }
        if (-not $dbUrl.EndsWith('"')) {
            $dbUrl = $dbUrl + '"'
        }
        
        # DATABASE_URL satırını değiştir
        $content = $content -replace 'DATABASE_URL\s*=\s*[^\r\n]+', "DATABASE_URL=$dbUrl"
        
        # UTF-8 encoding ile yeniden yaz (BOM olmadan)
        [System.IO.File]::WriteAllText($envPath, $content, [System.Text.UTF8Encoding]::new($false))
        
        Write-Host "DATABASE_URL duzeltildi:"
        Write-Host "DATABASE_URL=$dbUrl"
        Write-Host ""
        Write-Host ".env dosyasi UTF-8 encoding ile yeniden olusturuldu."
    } else {
        Write-Host "HATA: DATABASE_URL bulunamadi!"
    }
} else {
    Write-Host "HATA: .env dosyasi bulunamadi!"
}

Write-Host ""
Write-Host "Simdi 'npx prisma db push' komutunu calistirabilirsiniz."
Write-Host ""

