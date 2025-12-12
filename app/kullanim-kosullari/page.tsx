import React from 'react';
import Link from "next/link";
import { ArrowLeft, Shield, CheckCircle } from 'lucide-react';

export const metadata = {
    title: "Kullanım Koşulları | İSG Pratik",
    description: "İSG Pratik kullanım koşulları ve hizmet şartları",
};

export default function KullanimKosullariPage() {
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
                            <Shield className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Kullanım Koşulları</h1>
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
                            Bu Kullanım Koşulları, İSG Pratik platformunu ("Platform", "Hizmet" veya "Uygulama")
                            kullanımınızı düzenler. Platformu kullanarak bu koşulları kabul etmiş sayılırsınız.
                        </p>
                    </section>

                    {/* Madde 1 */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">1</span>
                            Hizmet Tanımı
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            İSG Pratik, İş Sağlığı ve Güvenliği (İSG) profesyonellerine yönelik bir dijital platformdur.
                            Platform aşağıdaki hizmetleri sunar:
                        </p>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                Fine-Kinney ve 5x5 Matris yöntemleriyle risk değerlendirme
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                AI destekli sektörel risk analizi
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                PDF rapor oluşturma ve dışa aktarma
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                Risk kütüphanesi ve şablonlar
                            </li>
                        </ul>
                    </section>

                    {/* Madde 2 */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">2</span>
                            Hesap Oluşturma ve Güvenlik
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Platformu kullanabilmek için bir hesap oluşturmanız gerekmektedir. Hesap oluştururken:
                        </p>
                        <ul className="space-y-2 text-gray-600 list-disc list-inside">
                            <li>Doğru ve güncel bilgiler sağlamalısınız</li>
                            <li>Hesap güvenliğinizden siz sorumlusunuz</li>
                            <li>Şifrenizi kimseyle paylaşmamalısınız</li>
                            <li>Yetkisiz erişim durumunda derhal bize bildirmelisiniz</li>
                        </ul>
                    </section>

                    {/* Madde 3 */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">3</span>
                            Kullanım Kuralları
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Platformu kullanırken aşağıdaki kurallara uymanız zorunludur:
                        </p>
                        <ul className="space-y-2 text-gray-600 list-disc list-inside">
                            <li>Yasalara ve düzenlemelere uygun şekilde kullanım</li>
                            <li>Başkalarının haklarına saygı gösterme</li>
                            <li>Platformun güvenliğini tehlikeye atacak eylemlerden kaçınma</li>
                            <li>Yanıltıcı veya sahte bilgi paylaşmama</li>
                            <li>Platformu ticari olmayan amaçlar dışında kullanmama (lisans kapsamında izin verilenler hariç)</li>
                        </ul>
                    </section>

                    {/* Madde 4 */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">4</span>
                            Fikri Mülkiyet Hakları
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            Platform ve içeriğindeki tüm haklarımız (yazılım, tasarım, metin, grafik, logo vb.)
                            İSG Pratik'e aittir. Bu içerikleri kopyalama, dağıtma veya değiştirme hakkına sahip değilsiniz.
                            Risk değerlendirme raporlarınız ve verileriniz size aittir.
                        </p>
                    </section>

                    {/* Madde 5 */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">5</span>
                            Sorumluluk Sınırlaması
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Platform, İSG uzmanlarına yardımcı bir araç olarak sunulmaktadır:
                        </p>
                        <ul className="space-y-2 text-gray-600 list-disc list-inside">
                            <li>Risk değerlendirmelerinin doğruluğu kullanıcının sorumluluğundadır</li>
                            <li>AI tarafından önerilen içerikler uzman kontrolünden geçirilmelidir</li>
                            <li>Platform, yasal İSG danışmanlığı yerine geçmez</li>
                            <li>Dolaylı veya doğrudan zararlardan sorumlu değiliz</li>
                        </ul>
                    </section>

                    {/* Madde 6 */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">6</span>
                            Hizmet Değişiklikleri
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            İSG Pratik, herhangi bir zamanda hizmetlerini değiştirme, askıya alma veya sonlandırma
                            hakkını saklı tutar. Önemli değişiklikler için kullanıcılar önceden bilgilendirilir.
                        </p>
                    </section>

                    {/* Madde 7 */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">7</span>
                            Uyuşmazlık Çözümü
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            Bu koşullardan doğan uyuşmazlıklarda Türkiye Cumhuriyeti yasaları geçerlidir.
                            Uyuşmazlıkların çözümünde İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
                        </p>
                    </section>

                    {/* İletişim */}
                    <section className="bg-indigo-50 rounded-xl p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">İletişim</h2>
                        <p className="text-gray-600">
                            Kullanım koşullarıyla ilgili sorularınız için bizimle iletişime geçebilirsiniz:
                        </p>
                        <p className="text-indigo-600 font-medium mt-2">info@isgpratik.com.tr</p>
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
