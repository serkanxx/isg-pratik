import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import path from 'path';
import fs from 'fs';
import { jsPDF } from 'jspdf';

const turkishToAscii = (str: string): string => {
    return str
        .replace(/İ/g, 'I').replace(/ı/g, 'i')
        .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
        .replace(/Ü/g, 'U').replace(/ü/g, 'u')
        .replace(/Ş/g, 'S').replace(/ş/g, 's')
        .replace(/Ö/g, 'O').replace(/ö/g, 'o')
        .replace(/Ç/g, 'C').replace(/ç/g, 'c');
};

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
        let text = turkishToAscii(result.value);

        text = text.replace(/\[FİRMA ADI\]/g, turkishToAscii(companyName || ''));
        text = text.replace(/\[FIRMA ADI\]/g, turkishToAscii(companyName || ''));
        text = text.replace(/\[SİCİL NO\]/g, turkishToAscii(registrationNumber || ''));
        text = text.replace(/\[SICIL NO\]/g, turkishToAscii(registrationNumber || ''));
        text = text.replace(/\[YAPILDIĞI TARİH\]/g, turkishToAscii(reportDate || ''));
        text = text.replace(/\[YAPILDIGI TARIH\]/g, turkishToAscii(reportDate || ''));
        text = text.replace(/\[GEÇERLİLİK TARİHİ\]/g, turkishToAscii(validityDate || ''));
        text = text.replace(/\[GECERLILIK TARIHI\]/g, turkishToAscii(validityDate || ''));

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        doc.setFont('helvetica');

        // Baslik sayfasi
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);
        const safeCompanyName = turkishToAscii(companyName);
        const nameWidth = doc.getTextWidth(safeCompanyName);
        doc.text(safeCompanyName, (210 - nameWidth) / 2, 60);

        if (registrationNumber) {
            doc.setFontSize(12);
            const regText = 'Sicil No: ' + turkishToAscii(registrationNumber);
            doc.text(regText, (210 - doc.getTextWidth(regText)) / 2, 75);
        }

        doc.setFontSize(28);
        doc.setTextColor(200, 50, 0);
        const title = 'ACIL DURUM EYLEM PLANI';
        doc.text(title, (210 - doc.getTextWidth(title)) / 2, 120);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Yapilis Tarihi: ' + turkishToAscii(reportDate), 30, 180);
        doc.text('Gecerlilik Tarihi: ' + turkishToAscii(validityDate), 30, 190);
        doc.text('Hazirlayan: ISG Uzmani', 30, 210);
        doc.text('Onaylayan: ' + turkishToAscii(employer || 'Isveren'), 30, 220);

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
                doc.setFont('helvetica', 'bold');
                y += 4;
            } else {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
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
        const safeFilename = safeCompanyName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');

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
