-- Bu script ile tabloların kolon adlarını kontrol edebilirsiniz
-- Supabase SQL Editor'de çalıştırın

-- user_risks tablosunun kolonlarını listele
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_risks' 
ORDER BY ordinal_position;

-- risk_items tablosunun kolonlarını listele
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'risk_items' 
ORDER BY ordinal_position;
