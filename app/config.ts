// ISG Uygulaması Yapılandırma Dosyası
// NOT: Bu dosyayı güvenlik için .gitignore'a eklemeniz önerilir

export const config = {
    // Admin panel şifresi
    // Üretim ortamında bu şifreyi değiştirin!
    adminPassword: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
};
