-- report_history tablosuna document_no kolonu ekle
ALTER TABLE report_history 
ADD COLUMN IF NOT EXISTS document_no VARCHAR(50);

-- Mevcut data JSON'ındaki documentNo değerlerini yeni kolona kopyala
UPDATE report_history
SET document_no = data->>'documentNo'
WHERE type = 'EMERGENCY_PLAN'
  AND data->>'documentNo' IS NOT NULL
  AND data->>'documentNo' != '';

-- Index ekle (opsiyonel, performans için)
CREATE INDEX IF NOT EXISTS idx_report_history_document_no 
ON report_history(document_no) 
WHERE document_no IS NOT NULL;

-- Kontrol sorgusu
SELECT 
    id,
    type,
    title,
    document_no,
    data->>'documentNo' as json_document_no,
    "createdAt"
FROM report_history
WHERE type = 'EMERGENCY_PLAN'
ORDER BY "createdAt" DESC;


