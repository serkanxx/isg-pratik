-- Acil Durum Planları için documentNo güncelleme script'i
-- Bu script, report_history tablosundaki EMERGENCY_PLAN tipindeki raporların
-- data JSON'ına documentNo ekler (eğer yoksa)

-- Önce mevcut durumu kontrol et
SELECT 
    id,
    type,
    title,
    data->>'documentNo' as current_document_no,
    data->>'date' as report_date
FROM report_history
WHERE type = 'EMERGENCY_PLAN'
ORDER BY created_at DESC;

-- Eğer documentNo yoksa, boş string olarak ekle
-- (Manuel olarak doldurmanız gerekecek)
UPDATE report_history
SET data = jsonb_set(
    data::jsonb,
    '{documentNo}',
    '""'::jsonb,
    true
)
WHERE type = 'EMERGENCY_PLAN'
  AND (data->>'documentNo' IS NULL OR data->>'documentNo' = '');

-- Belirli bir rapor için documentNo güncelleme örneği:
-- UPDATE report_history
-- SET data = jsonb_set(
--     data::jsonb,
--     '{documentNo}',
--     '"AD-01"'::jsonb,
--     true
-- )
-- WHERE id = 'rapor-id-buraya'
--   AND type = 'EMERGENCY_PLAN';

-- Güncelleme sonrası kontrol
SELECT 
    id,
    type,
    title,
    data->>'documentNo' as document_no,
    data->>'date' as report_date,
    created_at
FROM report_history
WHERE type = 'EMERGENCY_PLAN'
ORDER BY created_at DESC;


