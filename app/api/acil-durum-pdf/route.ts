import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import path from 'path';
import fs from 'fs';
import { jsPDF } from 'jspdf';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { companyName, companyAddress, registrationNumber, reportDate, validityDate, employer } = body;

        let docxPath = path.join(process.cwd(), 'ACİL DURUM EYLEM PLANI.docx');
        if (!fs.existsSync(docxPath)) {
            docxPath = path.join(process.cwd(), 'ACIL DURUM EYLEM PLANI.docx');
        }
        if (!fs.existsSync(docxPath)) {
            return NextResponse.json({ error: 'DOCX sablonu bulunamadi' }, { status: 404 });
        }

        const docxBuffer = fs.readFileSync(docxPath);
        const result = await mammoth.extractRawText({ buffer: docxBuffer });
        let text = result.value;

        // Placeholder'lari degistir
        text = text.replace(/\[FİRMA ADI\]/g, companyName || '');
        text = text.replace(/\[FIRMA ADI\]/g, companyName || '');
        text = text.replace(/\[SİCİL NO\]/g, registrationNumber || '');
        text = text.replace(/\[SICIL NO\]/g, registrationNumber || '');
        text = text.replace(/\[YAPILDIĞI TARİH\]/g, reportDate || '');
        text = text.replace(/\[YAPILDIGI TARIH\]/g, reportDate || '');
        text = text.replace(/\[GEÇERLİLİK TARİHİ\]/g, validityDate || '');
        text = text.replace(/\[GECERLILIK TARIHI\]/g, validityDate || '');

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        // Turkce karakter destegi icin Roboto fontunu yukle
        try {
            const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
            const fontUrlBold = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf';

            const [fontRes, fontBoldRes] = await Promise.all([
                fetch(fontUrl),
                fetch(fontUrlBold)
            ]);

            const fontBuffer = await fontRes.arrayBuffer();
            const fontBoldBuffer = await fontBoldRes.arrayBuffer();

            // Server-side base64 encoding
            const toBase64 = (buffer: ArrayBuffer) => {
                return Buffer.from(buffer).toString('base64');
            };

            doc.addFileToVFS('Roboto-Regular.ttf', toBase64(fontBuffer));
            doc.addFileToVFS('Roboto-Bold.ttf', toBase64(fontBoldBuffer));

            doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
            doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

            doc.setFont('Roboto');
        } catch (fontError) {
            console.error('Font yukleme hatasi:', fontError);
            doc.setFont('helvetica');
        }

        // Baslik sayfasi
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);
        const nameWidth = doc.getTextWidth(companyName);
        doc.text(companyName, (210 - nameWidth) / 2, 60);

        if (registrationNumber) {
            doc.setFontSize(12);
            const regText = 'Sicil No: ' + registrationNumber;
            doc.text(regText, (210 - doc.getTextWidth(regText)) / 2, 75);
        }

        doc.setFontSize(28);
        doc.setTextColor(200, 50, 0);
        const title = 'ACİL DURUM EYLEM PLANI';
        doc.text(title, (210 - doc.getTextWidth(title)) / 2, 120);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Yapılış Tarihi: ' + reportDate, 30, 180);
        doc.text('Geçerlilik Tarihi: ' + validityDate, 30, 190);
        doc.text('Hazırlayan: İSG Uzmanı', 30, 210);
        doc.text('Onaylayan: ' + (employer || 'İşveren'), 30, 220);

        doc.addPage();

        const lines = text.split('\n').filter((line: string) => line.trim() !== '');
        let y = 20;
        const lineHeight = 6;
        const pageHeight = 280;

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (y > pageHeight - 20) {
                doc.addPage();
                y = 20;
            }

            if (line === line.toUpperCase() && line.length > 3 && line.length < 100) {
                doc.setFontSize(12);
                doc.setFont('Roboto', 'bold');
                y += 4;
            } else {
                doc.setFontSize(10);
                doc.setFont('Roboto', 'normal');
            }

            const splitLines = doc.splitTextToSize(line, 170);
            for (const splitLine of splitLines) {
                if (y > pageHeight - 20) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(splitLine, 20, y);
                y += lineHeight;
            }
        }

        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

        // Dosya adini ASCII karakterlerle sinirla
        const sanitizeFilename = (name: string) => {
            return name
                .replace(/İ/g, 'I').replace(/ı/g, 'i')
                .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
                .replace(/Ü/g, 'U').replace(/ü/g, 'u')
                .replace(/Ş/g, 'S').replace(/ş/g, 's')
                .replace(/Ö/g, 'O').replace(/ö/g, 'o')
                .replace(/Ç/g, 'C').replace(/ç/g, 'c')
                .replace(/\s+/g, '_')
                .replace(/[^a-zA-Z0-9_-]/g, '');
        };

        const safeFilename = sanitizeFilename(companyName);

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Acil_Durum_Eylem_Plani_${safeFilename}.pdf"`
            }
        });

    } catch (error: any) {
        console.error('PDF olusturma hatasi:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
