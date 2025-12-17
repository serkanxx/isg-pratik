import React from 'react';
import Link from 'next/link';
import { Shield, CheckCircle, AlertTriangle, FileText, Search, ArrowRight } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Risk Değerlendirmesi Nedir? | İSG Pratik',
    description: 'Risk değerlendirmesi nedir, nasıl yapılır? 6331 sayılı kanuna göre risk analizi zorunluluğu ve Fine-Kinney metodu hakkında detaylı bilgi.',
    keywords: ['risk değerlendirmesi nedir', 'risk analizi nasıl yapılır', 'fine kinney metodu', '6331 isg kanunu', 'iş güvenliği risk analizi', 'risk skoru hesaplama', 'tehlike analizi'],
    openGraph: {
        title: 'Risk Değerlendirmesi Nedir? | İSG Pratik',
        description: 'Risk değerlendirmesi nedir, nasıl yapılır? 6331 sayılı kanuna göre risk analizi zorunluluğu ve Fine-Kinney metodu hakkında detaylı bilgi.',
        url: 'https://isgpratik.com/risk-degerlendirme-nedir',
        type: 'article',
    },
    alternates: {
        canonical: 'https://isgpratik.com/risk-degerlendirme-nedir',
    },
};

export default function RiskDegerlendirmeNedir() {
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
                        <Link href="/risk-degerlendirme" className="text-indigo-600 font-medium bg-indigo-50 px-4 py-2 rounded-lg">Risk Analizi Yap</Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Breadcrumb */}
                <div className="text-sm text-gray-500 mb-8">
                    <Link href="/" className="hover:text-indigo-600">Ana Sayfa</Link> &gt; <span className="text-gray-900">Risk Değerlendirmesi Nedir?</span>
                </div>

                <article className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                        Risk Değerlendirmesi Nedir? <span className="text-indigo-600">Neden Zorunludur?</span>
                    </h1>

                    <div className="prose prose-lg text-gray-600 max-w-none">
                        <p className="lead text-xl text-gray-800 mb-8">
                            Risk değerlendirmesi, iş yerinde var olan ya da dışarıdan gelebilecek tehlikelerin belirlenmesi,
                            bu tehlikelerin riske dönüşmesine yol açan faktörlerin analiz edilmesi ve risklerin derecelendirilerek
                            gerekli kontrol tedbirlerinin kararlaştırılması sürecidir.
                        </p>

                        <img
                            src="/risk-process.png"
                            alt="Risk Değerlendirmesi Süreçleri"
                            className="w-full h-64 object-cover rounded-xl mb-8 border border-gray-100 bg-gray-50"
                        />

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6 text-orange-500" />
                            Yasal Zorunluluk (6331 Sayılı Kanun)
                        </h2>
                        <p>
                            6331 sayılı İş Sağlığı ve Güvenliği Kanunu gereğince, çalışan sayısı ve tehlike sınıfı fark etmeksizin
                            <strong> tüm iş yerleri</strong> risk değerlendirmesi yapmak veya yaptırmakla yükümlüdür.
                        </p>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
                            <p className="text-blue-800 m-0 text-base">
                                <strong>Önemli:</strong> Çok tehlikeli sınıfta yer alan iş yerleri için 2 yılda bir, tehlikeli sınıftakiler için 4 yılda bir,
                                az tehlikeli sınıftakiler için ise 6 yılda bir risk değerlendirmesi yenilenmelidir.
                            </p>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4 flex items-center gap-2">
                            <Search className="w-6 h-6 text-indigo-500" />
                            Fine-Kinney Metodu Nedir?
                        </h2>
                        <p>
                            Risk analizi yapılırken en yaygın kullanılan yöntemlerden biri <strong>Fine-Kinney</strong> metodudur.
                            İSG Pratik olarak biz de sistemimizde bu metodolojiyi kullanıyoruz. Bu yöntemde risk değeri (R) şu formülle hesaplanır:
                        </p>
                        <div className="flex justify-center my-8">
                            <div className="bg-gray-900 text-white px-8 py-4 rounded-xl text-xl font-mono shadow-lg">
                                Risk Skoru = İhtimal × Frekans × Şiddet
                            </div>
                        </div>
                        <ul className="grid md:grid-cols-3 gap-4 mb-8">
                            <li className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <strong className="block text-indigo-900 mb-1">İhtimal (P)</strong>
                                Zararın gerçekleşme olasılığı (0.2 - 10 arası)
                            </li>
                            <li className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <strong className="block text-indigo-900 mb-1">Frekans (F)</strong>
                                Tehlikeye maruz kalma sıklığı (0.5 - 10 arası)
                            </li>
                            <li className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <strong className="block text-indigo-900 mb-1">Şiddet (S)</strong>
                                Zararın vereceği hasarın büyüklüğü (1 - 100 arası)
                            </li>
                        </ul>

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Risk Değerlendirmesi Adımları</h2>
                        <ol className="space-y-4">
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 font-bold rounded-full">1</span>
                                <div>
                                    <strong>Tehlikelerin Tanımlanması:</strong> İş yerindeki fiziksel, kimyasal, biyolojik ve ergonomik tehlikeler tespit edilir.
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 font-bold rounded-full">2</span>
                                <div>
                                    <strong>Risklerin Analiz Edilmesi:</strong> Tehlikelerin olasılığı ve şiddeti hesaplanarak risk skoru belirlenir.
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 font-bold rounded-full">3</span>
                                <div>
                                    <strong>Kontrol Tedbirlerinin Kararlaştırılması:</strong> Yüksek riskli durumlar için önleyici faaliyetler planlanır.
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 font-bold rounded-full">4</span>
                                <div>
                                    <strong>Dokümantasyon:</strong> Yapılan tüm çalışmalar raporlanır ve imza altına alınır.
                                </div>
                            </li>
                        </ol>

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Neden İSG Pratik Kullanmalısınız?</h2>
                        <p>
                            Manuel olarak Excel dosyalarıyla uğraşmak yerine, <strong>İSG Pratik</strong>'in yapay zeka destekli altyapısını kullanarak:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-8">
                            <li>Sektörünüze özel hazır risk kütüphanesine erişebilirsiniz.</li>
                            <li>Otomatik risk skoru hesaplaması yapabilirsiniz.</li>
                            <li>PDF formatında profesyonel raporlar oluşturabilirsiniz.</li>
                            <li>Mevzuata %100 uyumlu dokümanlar hazırlayabilirsiniz.</li>
                        </ul>

                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-100 flex justify-center">
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 hover:shadow-2xl hover:-translate-y-1"
                        >
                            Ücretsiz Risk Analizi Oluştur
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
                            <Link href="/risk-degerlendirme-nedir" className="text-white font-medium hover:underline">Risk Değerlendirmesi Nedir?</Link>
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
                        "headline": "Risk Değerlendirmesi Nedir? Neden Zorunludur?",
                        "image": [
                            "https://isgpratik.com/risk-process.png"
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
