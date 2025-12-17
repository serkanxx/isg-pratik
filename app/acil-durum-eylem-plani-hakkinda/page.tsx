import React from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, FileText, Shield, ArrowRight, BookOpen, Scale, Users, Clock } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Acil Durum Eylem Planı Hakkında | İSG Pratik',
    description: 'Acil durum eylem planı nedir, nasıl hazırlanır? İEYEP yasal zorunluluğu, önemi ve hazırlama adımları hakkında detaylı bilgi.',
    keywords: ['acil durum eylem planı', 'ieyep nedir', 'acil durum planı nasıl yapılır', '6331 isg kanunu', 'iş güvenliği acil durum', 'acil durum ekipleri', 'tahliye planı', 'yangın eylem planı'],
    openGraph: {
        title: 'Acil Durum Eylem Planı Hakkında | İSG Pratik',
        description: 'Acil durum eylem planı nedir, nasıl hazırlanır? İEYEP yasal zorunluluğu ve önemi hakkında detaylı bilgi.',
        url: 'https://isgpratik.com/acil-durum-eylem-plani-hakkinda',
        type: 'article',
    },
    alternates: {
        canonical: 'https://isgpratik.com/acil-durum-eylem-plani-hakkinda',
    },
};

export default function AcilDurumEylemPlaniHakkinda() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar - Basitleştirilmiş */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl text-indigo-900">
                        <Shield className="w-8 h-8 text-indigo-600" />
                        İSG Pratik
                    </Link>
                    <div className="hidden md:flex gap-6">
                        <Link href="/" className="text-gray-600 hover:text-indigo-600 font-medium">Ana Sayfa</Link>
                        <Link href="/panel/acil-durum" className="text-indigo-600 font-medium bg-indigo-50 px-4 py-2 rounded-lg">Acil Durum Planı Oluştur</Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Breadcrumb */}
                <div className="text-sm text-gray-500 mb-8">
                    <Link href="/" className="hover:text-indigo-600">Ana Sayfa</Link> &gt; <span className="text-gray-900">Acil Durum Eylem Planı Hakkında</span>
                </div>

                <article className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                        Acil Durum Eylem Planı Nedir? <span className="text-orange-600">Neden Önemlidir?</span>
                    </h1>

                    <div className="prose prose-lg text-gray-600 max-w-none">
                        <p className="lead text-xl text-gray-800 mb-8">
                            Acil Durum Eylem Planı (İEYEP), iş yerinde meydana gelebilecek acil durumların önceden tespit edilmesi,
                            bu durumlara karşı alınacak önlemlerin belirlenmesi ve acil durum anında yapılacak iş ve işlemlerin
                            planlanması için hazırlanan dokümandır.
                        </p>

                        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 p-6 my-8 rounded-r-lg">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-orange-900 mb-2 text-lg">Acil Durum Nedir?</h3>
                                    <p className="text-orange-800 m-0">
                                        Yangın, patlama, deprem, sel, kimyasal sızıntı, iş kazası, sabotaj gibi iş yerini veya çalışanları
                                        etkileyebilecek, normal işleyişi bozan ve acil müdahale gerektiren durumlardır.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4 flex items-center gap-2">
                            <Scale className="w-6 h-6 text-indigo-500" />
                            Yasal Zorunluluk ve Mevzuat
                        </h2>
                        <p>
                            6331 sayılı İş Sağlığı ve Güvenliği Kanunu'nun 11. maddesi gereğince, <strong>tüm iş yerleri</strong> acil durum planı
                            hazırlamak, uygulamak ve güncellemekle yükümlüdür. Bu zorunluluk çalışan sayısı ve tehlike sınıfı fark etmeksizin
                            tüm iş yerleri için geçerlidir.
                        </p>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
                            <p className="text-blue-800 m-0 text-base">
                                <strong>Yasal Yükümlülük:</strong> İşveren, acil durum planını hazırlamak, uygulamak, güncellemek ve
                                çalışanlara eğitim vermekle yükümlüdür. Planın hazırlanmaması veya uygulanmaması durumunda idari para cezası
                                uygulanabilir.
                            </p>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-green-500" />
                            Acil Durum Eylem Planının Önemi
                        </h2>
                        <p>
                            Acil durum eylem planı, iş yerlerinde can ve mal kaybını önlemek, acil durumlara hızlı ve etkili müdahale etmek
                            için kritik bir dokümandır. Planın hazırlanması ve uygulanması:
                        </p>
                        <ul className="grid md:grid-cols-2 gap-4 my-6">
                            <li className="flex gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <strong className="block text-gray-900 mb-1">Can Güvenliği</strong>
                                    <span className="text-sm text-gray-600">Çalışanların ve ziyaretçilerin güvenli tahliyesini sağlar</span>
                                </div>
                            </li>
                            <li className="flex gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <strong className="block text-gray-900 mb-1">Mal Güvenliği</strong>
                                    <span className="text-sm text-gray-600">İş yerindeki ekipman ve varlıkların korunmasına yardımcı olur</span>
                                </div>
                            </li>
                            <li className="flex gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <strong className="block text-gray-900 mb-1">Hızlı Müdahale</strong>
                                    <span className="text-sm text-gray-600">Acil durumlara organize ve hızlı şekilde müdahale edilmesini sağlar</span>
                                </div>
                            </li>
                            <li className="flex gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <strong className="block text-gray-900 mb-1">Yasal Uyum</strong>
                                    <span className="text-sm text-gray-600">6331 sayılı kanun gereğince yasal yükümlülüğü yerine getirir</span>
                                </div>
                            </li>
                        </ul>

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4 flex items-center gap-2">
                            <FileText className="w-6 h-6 text-indigo-500" />
                            Acil Durum Eylem Planında Bulunması Gerekenler
                        </h2>
                        <p>
                            Etkili bir acil durum eylem planı aşağıdaki bölümleri içermelidir:
                        </p>
                        <ol className="space-y-4 my-6">
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-600 font-bold rounded-full">1</span>
                                <div>
                                    <strong className="block text-gray-900 mb-1">Acil Durum Senaryoları</strong>
                                    <span className="text-gray-600">Yangın, deprem, patlama, kimyasal sızıntı, iş kazası gibi olası acil durumların tanımlanması</span>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-600 font-bold rounded-full">2</span>
                                <div>
                                    <strong className="block text-gray-900 mb-1">Acil Durum Ekipleri ve Görevleri</strong>
                                    <span className="text-gray-600">Söndürme, kurtarma, ilk yardım, koruma ve haberleşme ekiplerinin oluşturulması ve görev tanımları</span>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-600 font-bold rounded-full">3</span>
                                <div>
                                    <strong className="block text-gray-900 mb-1">Tahliye Planı</strong>
                                    <span className="text-gray-600">Çıkış yolları, toplanma alanları, tahliye rotaları ve acil çıkış işaretleri</span>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-600 font-bold rounded-full">4</span>
                                <div>
                                    <strong className="block text-gray-900 mb-1">Haberleşme Sistemi</strong>
                                    <span className="text-gray-600">Acil durum anında iç ve dış haberleşme yöntemleri, iletişim listeleri</span>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-600 font-bold rounded-full">5</span>
                                <div>
                                    <strong className="block text-gray-900 mb-1">İlk Yardım ve Tıbbi Müdahale</strong>
                                    <span className="text-gray-600">İlk yardım odası, ilk yardım ekipmanları, hastane ve sağlık kuruluşları ile iletişim</span>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-600 font-bold rounded-full">6</span>
                                <div>
                                    <strong className="block text-gray-900 mb-1">Krokiler ve Yerleşim Planları</strong>
                                    <span className="text-gray-600">İş yeri krokisi, acil çıkış yolları, yangın söndürme cihazları, ilk yardım malzemeleri ve toplanma alanlarının gösterildiği planlar</span>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-600 font-bold rounded-full">7</span>
                                <div>
                                    <strong className="block text-gray-900 mb-1">Tatbikat Planı</strong>
                                    <span className="text-gray-600">Yıllık tatbikat programı, tatbikat kayıt formları ve değerlendirme raporları</span>
                                </div>
                            </li>
                        </ol>

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4 flex items-center gap-2">
                            <Users className="w-6 h-6 text-indigo-500" />
                            Acil Durum Ekipleri
                        </h2>
                        <p>
                            Acil durum eylem planında mutlaka aşağıdaki ekipler oluşturulmalı ve her ekibin görevleri net bir şekilde tanımlanmalıdır:
                        </p>
                        <div className="grid md:grid-cols-2 gap-4 my-6">
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                                <h3 className="font-bold text-red-900 mb-2">Söndürme Ekibi</h3>
                                <p className="text-sm text-red-800">Yangın söndürme cihazlarını kullanarak yangına müdahale eder</p>
                            </div>
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                <h3 className="font-bold text-blue-900 mb-2">Kurtarma Ekibi</h3>
                                <p className="text-sm text-blue-800">Yaralı veya mahsur kalan kişilerin kurtarılmasını sağlar</p>
                            </div>
                            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                                <h3 className="font-bold text-green-900 mb-2">İlk Yardım Ekibi</h3>
                                <p className="text-sm text-green-800">Yaralılara ilk yardım müdahalesi yapar ve sağlık kuruluşlarına ulaştırır</p>
                            </div>
                            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                                <h3 className="font-bold text-purple-900 mb-2">Koruma Ekibi</h3>
                                <p className="text-sm text-purple-800">Olay yerini güvenli hale getirir ve giriş-çıkışları kontrol eder</p>
                            </div>
                            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg md:col-span-2">
                                <h3 className="font-bold text-yellow-900 mb-2">Haberleşme Ekibi</h3>
                                <p className="text-sm text-yellow-800">Acil durum anında iç ve dış haberleşmeyi sağlar, ilgili kurumlara bilgi verir</p>
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4 flex items-center gap-2">
                            <Clock className="w-6 h-6 text-indigo-500" />
                            Acil Durum Eylem Planı Nasıl Hazırlanır?
                        </h2>
                        <p>
                            Etkili bir acil durum eylem planı hazırlamak için şu adımlar izlenmelidir:
                        </p>
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 my-6">
                            <ol className="space-y-3">
                                <li className="flex gap-3">
                                    <span className="font-bold text-indigo-600">1.</span>
                                    <span><strong>Risk Analizi:</strong> İş yerinde olası acil durumlar tespit edilir ve risk analizi yapılır</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-indigo-600">2.</span>
                                    <span><strong>Ekip Oluşturma:</strong> Acil durum ekipleri belirlenir ve görev tanımları yapılır</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-indigo-600">3.</span>
                                    <span><strong>Plan Hazırlama:</strong> Tüm bilgiler toplanarak plan dokümanı hazırlanır</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-indigo-600">4.</span>
                                    <span><strong>Eğitim ve Tatbikat:</strong> Çalışanlara eğitim verilir ve düzenli tatbikatlar yapılır</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-indigo-600">5.</span>
                                    <span><strong>Güncelleme:</strong> Plan düzenli olarak gözden geçirilir ve güncellenir</span>
                                </li>
                            </ol>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Neden İSG Pratik Kullanmalısınız?</h2>
                        <p>
                            Manuel olarak acil durum eylem planı hazırlamak zaman alıcı ve hata yapmaya açık bir süreçtir. <strong>İSG Pratik</strong> ile:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-8">
                            <li>Mevzuata %100 uyumlu, hazır acil durum planı şablonları kullanabilirsiniz</li>
                            <li>Yangın, deprem, patlama, kimyasal sızıntı gibi tüm senaryolar için hazır planlar oluşturabilirsiniz</li>
                            <li>Acil durum ekiplerini kolayca oluşturup görevlendirebilirsiniz</li>
                            <li>Profesyonel PDF formatında raporlar hazırlayabilirsiniz</li>
                            <li>Tatbikat kayıtlarını dijital ortamda tutabilirsiniz</li>
                            <li>Krokiler ve yerleşim planlarını ekleyebilirsiniz</li>
                        </ul>

                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-100 flex justify-center">
                        <Link
                            href="/panel/acil-durum"
                            className="inline-flex items-center gap-3 bg-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition-all shadow-xl shadow-orange-200 hover:shadow-2xl hover:-translate-y-1"
                        >
                            Ücretsiz Acil Durum Planı Oluştur
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </article>
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12 mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-white">İSG Pratik</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-6 text-sm">
                            <Link href="/risk-degerlendirme-nedir" className="hover:text-white">Risk Değerlendirmesi Nedir?</Link>
                            <Link href="/acil-durum-eylem-plani-hakkinda" className="text-white font-medium hover:underline">Acil Durum Eylem Planı Hakkında</Link>
                            <Link href="/gizlilik-politikasi" className="hover:text-white">Gizlilik Politikası</Link>
                            <Link href="/kullanim-kosullari" className="hover:text-white">Kullanım Koşulları</Link>
                            <Link href="/kvkk" className="hover:text-white">KVKK</Link>
                        </div>
                        <p className="text-sm">© 2025 İSG Pratik. Tüm hakları saklıdır.</p>
                    </div>
                </div>
            </footer>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Article",
                        "headline": "Acil Durum Eylem Planı Nedir? Neden Önemlidir?",
                        "image": [
                            "https://isgpratik.com/logo.png"
                        ],
                        "datePublished": "2025-01-01T08:00:00+08:00",
                        "dateModified": "2025-01-01T09:20:00+08:00",
                        "author": [{
                            "@type": "Organization",
                            "name": "İSG Pratik",
                            "url": "https://isgpratik.com"
                        }]
                    })
                }}
            />
        </div>
    );
}
