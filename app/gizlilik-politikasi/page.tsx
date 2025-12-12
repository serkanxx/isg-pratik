import React from 'react';
import Link from "next/link";
import { ArrowLeft, Eye, CheckCircle, Shield, Cookie, Globe, Mail, Bell } from 'lucide-react';

export const metadata = {
    title: "Gizlilik Politikası | İSG Pratik",
    description: "İSG Pratik gizlilik politikası ve veri koruma uygulamaları",
};

export default function GizlilikPolitikasiPage() {
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
                            <Eye className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Gizlilik Politikası</h1>
                            <p className="text-gray-500 text-sm">Son güncelleme: 8 Aralık 2024</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-12">

                    {/* Giriş */}
                    <section className="mb-10">
                        <p className="text-gray-600 leading-relaxed">
                            İSG Pratik olarak gizliliğinize saygı duyuyor ve kişisel verilerinizi korumayı taahhüt ediyoruz.
                            Bu Gizlilik Politikası, platformumuzu kullandığınızda verilerinizi nasıl topladığımızı,
                            kullandığımızı ve koruduğumuzu açıklamaktadır.
                        </p>
                    </section>

                    {/* Madde 1 */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">1</span>
                            Topladığımız Bilgiler
                        </h2>

                        <h3 className="font-semibold text-gray-900 mt-4 mb-2">Sizin Sağladığınız Bilgiler:</h3>
                        <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
                            <li>Kayıt sırasında ad, soyad ve e-posta adresi</li>
                            <li>Google ile giriş yaparsanız Google hesabınızdan temel profil bilgileri</li>
                            <li>Platform üzerinde oluşturduğunuz içerikler (risk değerlendirmeleri, raporlar vb.)</li>
                            <li>Destek talepleriniz ve iletişimleriniz</li>
                        </ul>

                        <h3 className="font-semibold text-gray-900 mt-4 mb-2">Otomatik Toplanan Bilgiler:</h3>
                        <ul className="space-y-2 text-gray-600 list-disc list-inside">
                            <li>IP adresi ve coğrafi konum (ülke düzeyinde)</li>
                            <li>Tarayıcı türü ve sürümü</li>
                            <li>Cihaz bilgileri</li>
                            <li>Sayfa görüntüleme ve kullanım istatistikleri</li>
                        </ul>
                    </section>

                    {/* Madde 2 */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">2</span>
                            Bilgilerin Kullanımı
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Topladığımız bilgileri aşağıdaki amaçlarla kullanırız:
                        </p>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                Hesabınızı oluşturmak ve yönetmek
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                Platform hizmetlerini sunmak ve kişiselleştirmek
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                Teknik destek sağlamak
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                Platform performansını analiz etmek ve iyileştirmek
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                Güvenlik tehditlerini tespit etmek ve önlemek
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                Yasal yükümlülüklerimizi yerine getirmek
                            </li>
                        </ul>
                    </section>

                    {/* Madde 3 - Çerezler */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">3</span>
                            Çerezler ve İzleme Teknolojileri
                        </h2>
                        <div className="bg-amber-50 rounded-xl p-4 mb-4">
                            <div className="flex items-start gap-2">
                                <Cookie className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <p className="text-amber-800 text-sm">
                                    Platformumuz, deneyiminizi iyileştirmek için çerezler kullanmaktadır.
                                </p>
                            </div>
                        </div>
                        <p className="text-gray-600 leading-relaxed mb-4">Kullandığımız çerez türleri:</p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-2">Zorunlu Çerezler</h3>
                                <p className="text-sm text-gray-600">Oturum yönetimi ve güvenlik için gerekli çerezler</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-2">Analitik Çerezler</h3>
                                <p className="text-sm text-gray-600">Platform kullanımını anlamamıza yardımcı çerezler</p>
                            </div>
                        </div>
                    </section>

                    {/* Madde 4 - Paylaşım */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">4</span>
                            Bilgi Paylaşımı
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Kişisel bilgilerinizi aşağıdaki durumlar dışında üçüncü taraflarla paylaşmayız:
                        </p>
                        <ul className="space-y-2 text-gray-600 list-disc list-inside">
                            <li>Açık izniniz olduğunda</li>
                            <li>Yasal zorunluluk halinde (mahkeme kararı, resmi talep vb.)</li>
                            <li>Hizmet sağlayıcılarımızla (bulut depolama, e-posta servisleri)</li>
                            <li>Şirket birleşme veya devir durumlarında</li>
                        </ul>
                        <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-4">
                            <p className="text-green-800 text-sm flex items-start gap-2">
                                <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <strong>Önemli:</strong> Verilerinizi hiçbir koşulda reklam veya pazarlama amaçlı üçüncü taraflara satmayız.
                            </p>
                        </div>
                    </section>

                    {/* Madde 5 - Güvenlik */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">5</span>
                            Veri Güvenliği
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Verilerinizi korumak için endüstri standardı güvenlik önlemleri uyguluyoruz:
                        </p>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <Shield className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                256-bit SSL/TLS şifreleme
                            </li>
                            <li className="flex items-start gap-2">
                                <Shield className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                Güvenli veri merkezlerinde depolama
                            </li>
                            <li className="flex items-start gap-2">
                                <Shield className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                Düzenli güvenlik denetimleri
                            </li>
                            <li className="flex items-start gap-2">
                                <Shield className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                Erişim kontrolü ve yetkilendirme
                            </li>
                        </ul>
                    </section>

                    {/* Madde 6 - Haklar */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">6</span>
                            Haklarınız
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Verileriniz üzerinde aşağıdaki haklara sahipsiniz:
                        </p>
                        <div className="grid md:grid-cols-2 gap-3">
                            {[
                                "Verilerinize erişim talep etme",
                                "Yanlış verilerin düzeltilmesini isteme",
                                "Verilerinizin silinmesini talep etme",
                                "Veri işlemeye itiraz etme",
                                "Verilerinizi taşıma hakkı",
                                "Pazarlama iletişimlerinden çıkma"
                            ].map((hak, idx) => (
                                <div key={idx} className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-600">{hak}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Madde 7 - Uluslararası */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">7</span>
                            Uluslararası Veri Aktarımı
                        </h2>
                        <div className="flex items-start gap-3 text-gray-600">
                            <Globe className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                            <p className="leading-relaxed">
                                Verileriniz, hizmet sağlayıcılarımız aracılığıyla Türkiye dışındaki sunucularda işlenebilir.
                                Bu durumda, uygun güvenlik önlemleri ve yasal korumalar sağlanmaktadır.
                            </p>
                        </div>
                    </section>

                    {/* Madde 8 - Değişiklikler */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">8</span>
                            Politika Değişiklikleri
                        </h2>
                        <div className="flex items-start gap-3 text-gray-600">
                            <Bell className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                            <p className="leading-relaxed">
                                Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler yapıldığında
                                e-posta veya platform içi bildirim yoluyla sizi bilgilendireceğiz.
                            </p>
                        </div>
                    </section>

                    {/* İletişim */}
                    <section className="bg-indigo-50 rounded-xl p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">İletişim</h2>
                        <p className="text-gray-600 mb-4">
                            Gizlilik politikamızla ilgili sorularınız için bizimle iletişime geçebilirsiniz:
                        </p>
                        <div className="flex items-center gap-2">
                            <Mail className="w-5 h-5 text-indigo-600" />
                            <p className="text-indigo-600 font-medium">gizlilik@isgpratik.com</p>
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
