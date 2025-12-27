import { Metadata } from 'next';
import PanelLayout from '@/app/panel/layout';

export const metadata: Metadata = {
    title: 'Acil Durum Eylem Planı Oluştur | İSG Pratik',
    description: 'Ücretsiz Acil Durum Eylem Planı oluşturun. Firma bilgilerinizi girin, profesyonel PDF ve Word raporunuzu hemen indirin. 6331 sayılı İSG kanununa uyumlu.',
    keywords: ['acil durum eylem planı', 'acil durum planı oluştur', 'ieyep hazırla', 'acil durum raporu', 'isg acil durum', 'ücretsiz acil durum planı', 'toplu acil durum planı'],
    openGraph: {
        title: 'Acil Durum Eylem Planı Oluştur | İSG Pratik',
        description: 'Ücretsiz Acil Durum Eylem Planı oluşturun. Firma bilgilerinizi girin, profesyonel PDF ve Word raporunuzu hemen indirin.',
        url: 'https://www.isgpratik.com/acil-durum',
        type: 'website',
    },
    alternates: {
        canonical: 'https://www.isgpratik.com/acil-durum',
    },
};

export default function AcilDurumLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <PanelLayout>{children}</PanelLayout>;
}
