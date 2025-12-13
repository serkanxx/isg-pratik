import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import path from 'path';
import fs from 'fs';
import { jsPDF } from 'jspdf';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            companyName,
            companyAddress,
            registrationNumber,
            reportDate,
            validityDate,
            employer,
            dangerClass
        } = body;

        // DOCX dosyasını oku
        const docxPath = path.join(process.cwd(), 'ACİL DURUM EYLEM PLANI.docx');

        if (!fs.existsSync(docxPath)) {
            return NextResponse.json({ error: 'DOCX şablonu bulunamadı' }, { status: 404 });
        }

        const docxBuffer = fs.readFileSync(docxPath);

        // DOCX'i HTML'e dönüştür
        const result = await mammoth.extractRawText({ buffer: docxBuffer });
        let text = result.value;

        // Placeholder'ları değiştir
        text = text.replace(/\[FİRMA ADI\]/g, companyName || '');
        text = text.replace(/\[SİCİL NO\]/g, registrationNumber || '');
        text = text.replace(/\[YAPILDIĞI TARİH\]/g, reportDate || '');
        text = text.replace(/\[GEÇERLİLİK TARİHİ\]/g, validityDate || '');
        text = text.replace(/\[FİRMA ADRESİ\]/g, companyAddress || '');

        // PDF oluştur
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Türkçe karakter desteği için font ayarları
        doc.setFont('helvetica');

        // Başlık sayfası
        doc.setFontSize(24);
        doc.setTextColor(0, 0, 0);

        // Firma adı
        doc.setFontSize(18);
        const companyNameWidth = doc.getTextWidth(companyName);
        doc.text(companyName, (210 - companyNameWidth) / 2, 60);

        // Sicil No
        if (registrationNumber) {
            doc.setFontSize(12);
            const regText = `Sicil No: ${registrationNumber}`;
            const regWidth = doc.getTextWidth(regText);
            doc.text(regText, (210 - regWidth) / 2, 75);
        }

        // Ana başlık
        doc.setFontSize(28);
        doc.setTextColor(200, 50, 0);
        const titleText = 'ACIL DURUM EYLEM PLANI';
        const titleWidth = doc.getTextWidth(titleText);
        doc.text(titleText, (210 - titleWidth) / 2, 120);

        // Tarihler
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);

        doc.text(`Yapilisi Tarihi: ${reportDate}`, 30, 180);
        doc.text(`Gecerlilik Tarihi: ${validityDate}`, 30, 190);

        // Hazirlayan
        doc.text('Hazirlayan: ISG Uzmani', 30, 210);
        doc.text(`Onaylayan: ${employer || 'Isveren'}`, 30, 220);

        // İçerik sayfaları
        doc.addPage();

        // İçeriği sayfalara böl
        const lines = text.split('\n').filter((line: string) => line.trim() !== '');
        let y = 20;
        const lineHeight = 6;
        const pageHeight = 280;
        const marginBottom = 20;

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (y > pageHeight - marginBottom) {
                doc.addPage();
                y = 20;
            }

            // Başlıkları kalın yap
            if (line === line.toUpperCase() && line.length > 3 && line.length < 100) {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                y += 4;
            } else {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
            }

            // Uzun satırları böl
            const maxWidth = 170;
            const splitLines = doc.splitTextToSize(line, maxWidth);

            for (const splitLine of splitLines) {
                if (y > pageHeight - marginBottom) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(splitLine, 20, y);
                y += lineHeight;
            }
        }

        // PDF'i buffer olarak al
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Acil_Durum_Eylem_Plani_${companyName.replace(/\s+/g, '_')}.pdf"`
            }
        });

    } catch (error: any) {
        console.error('PDF oluşturma hatası:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
