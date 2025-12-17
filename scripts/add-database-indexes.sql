-- Veritabanı performans optimizasyonu için index'ler
-- Bu script'i Supabase SQL Editor'de çalıştırın
-- NOT: Kullanıcı tarafından test edilmiş ve çalışan versiyon

-- Companies tablosu için index'ler
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_user_id_active ON companies(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_user_active_created ON companies(user_id, is_active, created_at DESC);

-- Report History tablosu için index'ler
CREATE INDEX IF NOT EXISTS idx_report_history_user_id ON report_history("userId");
CREATE INDEX IF NOT EXISTS idx_report_history_user_id_created ON report_history("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_report_history_type ON report_history(type);
CREATE INDEX IF NOT EXISTS idx_report_history_document_no ON report_history(document_no) WHERE document_no IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_report_history_user_type_created ON report_history("userId", type, "createdAt" DESC);

-- Notes tablosu için index'ler
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes("userId");
CREATE INDEX IF NOT EXISTS idx_notes_user_id_company ON notes("userId", "companyId");
CREATE INDEX IF NOT EXISTS idx_notes_user_id_completed_due ON notes("userId", "isCompleted", "dueDate");

-- Visit Programs tablosu için index'ler
CREATE INDEX IF NOT EXISTS idx_visit_programs_user_id ON visit_programs("userId");
CREATE INDEX IF NOT EXISTS idx_visit_programs_user_id_created ON visit_programs("userId", "createdAt" DESC);

-- User Risks tablosu için index'ler (Supabase)
CREATE INDEX IF NOT EXISTS idx_user_risks_user_id ON user_risks("userId");
CREATE INDEX IF NOT EXISTS idx_user_risks_user_id_created ON user_risks("userId", "createdAt" DESC);
-- NOT: user_risks tablosunda 'status' sütunu yok; idx_user_risks_status oluşturulmadı.

-- Risk Items tablosu için index'ler (Supabase)
CREATE INDEX IF NOT EXISTS idx_risk_items_category_code ON risk_items(category_code);
CREATE INDEX IF NOT EXISTS idx_risk_items_sector_tags ON risk_items USING GIN(sector_tags);
CREATE INDEX IF NOT EXISTS idx_risk_items_main_category ON risk_items(main_category) WHERE main_category IS NOT NULL;

-- User tablosu için index'ler
-- NOT: tablo adı büyük U ile "User" olduğu için çift tırnak kullanılmıştır.
CREATE INDEX IF NOT EXISTS idx_User_email_verified ON "User"(email, "emailVerified");
