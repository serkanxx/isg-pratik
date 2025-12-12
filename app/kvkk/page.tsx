import React from 'react';
import Link from "next/link";
import { ArrowLeft, Shield, CheckCircle, AlertCircle, Lock, Eye, Trash2, FileText } from 'lucide-react';

export const metadata = {
    title: "KVKK Aydınlatma Metni | İSG Pratik",
    description: "İSG Pratik KVKK aydınlatma metni ve kişisel verilerin korunması politikası",
};

export default function KVKKPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        Ana Sayfaya Dön
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Lock className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">KVKK Aydınlatma Metni</h1>
                            <p className="text-gray-500 text-sm">Kişisel Verilerin Korunması Kanunu</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-12">

                    {/* Giriş */}
                    <section className="mb-10">
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
                            <p className="text-indigo-800 text-sm">
                                <strong>6698 sayılı Kişisel Verilerin Korunması Kanunu</strong> kapsamında,
                                kişisel verilerinizin işlenmesi hakkında sizi bilgilendirmek amacıyla bu aydınlatma metni hazırlanmıştır.
                            </p>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                            İSG Pratik olarak, kişisel verilerinizin güvenliği konusunda azami hassasiyet göstermekteyiz.
                            Bu aydınlatma metni, hangi verilerinizi, hangi amaçlarla ve nasıl işlediğimizi açıklamaktadır.
                        </p>
                    </section>

                    {/* Madde 1 - Veri Sorumlusu */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">1</span>
                            Veri Sorumlusu
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            Kişisel verileriniz, veri sorumlusu sıfatıyla <strong>İSG Pratik</strong> tarafından aşağıda
                            açıklanan amaçlar doğrultusunda, hukuka ve dürüstlük kurallarına uygun olarak işlenmektedir.
                        </p>
                    </section>

                    {/* Madde 2 - İşlenen Veriler */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">2</span>
                            İşlenen Kişisel Veriler
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Platform kullanımınız sırasında aşağıdaki kişisel verileriniz işlenmektedir:
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-indigo-600" />
                                    Kimlik Bilgileri
                                </h3>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• Ad, soyad</li>
                                    <li>• E-posta adresi</li>
                                    <li>• Profil fotoğrafı (isteğe bağlı)</li>
                                </ul>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-indigo-600" />
                                    Kullanım Verileri
                                </h3>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• IP adresi</li>
                                    <li>• Tarayıcı bilgileri</li>
                                    <li>• Oturum verileri</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Madde 3 - İşleme Amaçları */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">3</span>
                            Veri İşleme Amaçları
                        </h2>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                Üyelik işlemlerinin gerçekleştirilmesi ve hesap yönetimi
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                Platform hizmetlerinin sunulması ve iyileştirilmesi
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                Müşteri memnuniyeti ve destek hizmetleri
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                Yasal yükümlülüklerin yerine getirilmesi
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                Güvenlik ve dolandırıcılık önleme
                            </li>
                        </ul>
                    </section>

                    {/* Madde 4 - Hukuki Sebepler */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">4</span>
                            Hukuki Sebepler
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Kişisel verileriniz, KVKK'nın 5. ve 6. maddelerinde belirtilen aşağıdaki hukuki sebeplere dayanılarak işlenmektedir:
                        </p>
                        <ul className="space-y-2 text-gray-600 list-disc list-inside">
                            <li>Açık rızanızın bulunması</li>
                            <li>Sözleşmenin kurulması veya ifası için gerekli olması</li>
                            <li>Hukuki yükümlülüğümüzün yerine getirilmesi</li>
                            <li>Meşru menfaatlerimiz için zorunlu olması</li>
                        </ul>
                    </section>

                    {/* Madde 5 - Aktarım */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">5</span>
                            Verilerin Aktarılması
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Kişisel verileriniz, aşağıdaki taraflarla paylaşılabilir:
                        </p>
                        <ul className="space-y-2 text-gray-600 list-disc list-inside">
                            <li>Yasal zorunluluk halinde yetkili kamu kurum ve kuruluşları</li>
                            <li>Hizmet sağlayıcılarımız (bulut depolama, e-posta hizmetleri vb.)</li>
                            <li>Ödeme işlemleri için finans kuruluşları</li>
                        </ul>
                        <div className="mt-4 bg-amber-50 border border-amber-100 rounded-lg p-4">
                            <p className="text-amber-800 text-sm flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                Verileriniz hiçbir koşulda üçüncü taraflara satılmaz veya pazarlama amaçlı paylaşılmaz.
                            </p>
                        </div>
                    </section>

                    {/* Madde 6 - Haklar */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">6</span>
                            KVKK Kapsamındaki Haklarınız
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
                        </p>
                        <div className="grid md:grid-cols-2 gap-3">
                            {[
                                "Kişisel verilerin işlenip işlenmediğini öğrenme",
                                "İşlenmişse buna ilişkin bilgi talep etme",
                                "İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme",
                                "Yurt içi/yurt dışı aktarıldığı üçüncü kişileri bilme",
                                "Eksik/yanlış işlenmişse düzeltilmesini isteme",
                                "KVKK'nın 7. maddesi kapsamında silinmesini isteme",
                                "Düzeltme/silme işlemlerinin üçüncü kişilere bildirilmesini isteme",
                                "İşlenen verilerin analiz edilmesiyle aleyhinize sonuç çıkmasına itiraz etme"
                            ].map((hak, idx) => (
                                <div key={idx} className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-600">{hak}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Madde 7 - Saklama */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">7</span>
                            Veri Saklama Süresi
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca saklanır. Hesabınızı sildiğinizde,
                            yasal zorunluluklar saklı kalmak kaydıyla verileriniz 30 gün içinde sistemlerimizden kaldırılır.
                        </p>
                    </section>

                    {/* Madde 8 - Güvenlik */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">8</span>
                            Veri Güvenliği
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Kişisel verilerinizin güvenliği için aşağıdaki önlemler alınmaktadır:
                        </p>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <Shield className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                SSL/TLS şifreleme ile güvenli veri iletimi
                            </li>
                            <li className="flex items-start gap-2">
                                <Shield className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                Şifreli veritabanı depolama
                            </li>
                            <li className="flex items-start gap-2">
                                <Shield className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                Düzenli güvenlik güncellemeleri
                            </li>
                            <li className="flex items-start gap-2">
                                <Shield className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                Erişim kontrolü ve yetkilendirme
                            </li>
                        </ul>
                    </section>

                    {/* İletişim */}
                    <section className="bg-indigo-50 rounded-xl p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Başvuru ve İletişim</h2>
                        <p className="text-gray-600 mb-4">
                            KVKK kapsamındaki haklarınızı kullanmak için aşağıdaki kanallardan bize ulaşabilirsiniz:
                        </p>
                        <div className="space-y-2">
                            <p className="text-indigo-600 font-medium">📧 kvkk@isgpratik.com</p>
                            <p className="text-gray-500 text-sm">
                                Başvurularınız en geç 30 gün içinde sonuçlandırılacaktır.
                            </p>
                        </div>
                    </section>

                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-8">
                <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
                    © 2025 İSG Pratik. Tüm hakları saklıdır.
                </div>
            </footer>
        </div>
    );
}
