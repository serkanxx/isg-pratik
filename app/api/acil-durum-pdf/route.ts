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
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 15;

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

            const toBase64 = (buffer: ArrayBuffer) => Buffer.from(buffer).toString('base64');

            doc.addFileToVFS('Roboto-Regular.ttf', toBase64(fontBuffer));
            doc.addFileToVFS('Roboto-Bold.ttf', toBase64(fontBoldBuffer));
            doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
            doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
            doc.setFont('Roboto');
        } catch (fontError) {
            console.error('Font yukleme hatasi:', fontError);
            doc.setFont('helvetica');
        }

        // ========== SAYFA 1: KAPAK SAYFASI ==========
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        doc.setTextColor(0, 0, 0);

        // Firma Adi - Ust kisim ortalanmis (metni kaydır eğer uzunsa)
        doc.setFontSize(24);
        doc.setFont('Roboto', 'bold');
        const companyNameText = companyName || '[FİRMA ADI]';
        const maxCompanyNameWidth = pageWidth - 40; // sol ve sağ 20mm margin
        const companyNameLines = doc.splitTextToSize(companyNameText, maxCompanyNameWidth);
        let companyNameY = 50;
        companyNameLines.forEach((line: string, index: number) => {
            doc.text(line, pageWidth / 2, companyNameY + (index * 10), { align: 'center' });
        });
        const afterCompanyNameY = companyNameY + (companyNameLines.length * 10) + 10;

        // Sicil No
        doc.setFontSize(16);
        doc.setFont('Roboto', 'normal');
        doc.text(registrationNumber ? `[${registrationNumber}]` : '[SİCİL NO]', pageWidth / 2, afterCompanyNameY, { align: 'center' });

        // Ana Baslik
        doc.setFontSize(28);
        doc.setFont('Roboto', 'bold');
        doc.text('ACİL DURUM EYLEM PLANI', pageWidth / 2, 120, { align: 'center' });

        // Hazirlayan / Onaylayan Kutulari
        const boxY = 160;
        const boxWidth = 80;
        const boxHeight = 40;
        const boxGap = 20;

        // Hazirlayan kutusu
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(margin + 5, boxY, boxWidth, boxHeight);
        doc.setFontSize(10);
        doc.setFont('Roboto', 'bold');
        doc.text('HAZIRLAYAN', margin + 5 + boxWidth / 2, boxY + 8, { align: 'center' });

        // Onaylayan kutusu
        doc.rect(pageWidth - margin - boxWidth - 5, boxY, boxWidth, boxHeight);
        doc.text('ONAYLAYAN', pageWidth - margin - boxWidth / 2 - 5, boxY + 8, { align: 'center' });

        // Tarih tablosu
        const tableY = 230;
        const tableWidth = 140;
        const tableX = (pageWidth - tableWidth) / 2;
        const rowHeight = 12;
        const col1Width = 70;

        doc.setLineWidth(0.3);

        // Yapildigi Tarih satiri
        doc.rect(tableX, tableY, col1Width, rowHeight);
        doc.rect(tableX + col1Width, tableY, tableWidth - col1Width, rowHeight);
        doc.setFontSize(9);
        doc.setFont('Roboto', 'bold');
        doc.text('YAPILDIĞI TARİH', tableX + 3, tableY + 8);
        doc.setFont('Roboto', 'normal');
        doc.text(reportDate || '[YAPILDIĞI TARİH]', tableX + col1Width + 3, tableY + 8);

        // Gecerlilik Suresi satiri
        doc.rect(tableX, tableY + rowHeight, col1Width, rowHeight);
        doc.rect(tableX + col1Width, tableY + rowHeight, tableWidth - col1Width, rowHeight);
        doc.setFont('Roboto', 'bold');
        doc.text('GEÇERLİLİK SÜRESİ', tableX + 3, tableY + rowHeight + 8);
        doc.setFont('Roboto', 'normal');
        doc.text(validityDate || '[GEÇERLİLİK TARİHİ]', tableX + col1Width + 3, tableY + rowHeight + 8);

        // ========== ICERIK SAYFALARI ==========
        const lines = text.split('\n').filter((line: string) => line.trim() !== '');
        let currentPage = 1;
        const totalPages = Math.ceil(lines.length / 45) + 1; // Tahmini sayfa sayisi

        // Header cizim fonksiyonu
        const drawHeader = () => {
            const headerY = 10;
            const headerHeight = 20;

            // Sol kutu - Firma Logo
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.3);
            doc.rect(margin, headerY, 35, headerHeight);
            doc.setFontSize(7);
            doc.setFont('Roboto', 'normal');
            doc.text('[FİRMA LOGO]', margin + 17.5, headerY + 12, { align: 'center' });

            // Orta kutu - Firma Adi
            doc.rect(margin + 35, headerY, 90, headerHeight);
            doc.setFontSize(10);
            doc.setFont('Roboto', 'bold');
            doc.text(companyName || '[FİRMA ADI]', margin + 80, headerY + 12, { align: 'center' });

            // Sag kutu - Dokuman bilgileri
            const rightBoxX = margin + 125;
            const rightBoxWidth = 55;
            const smallRowHeight = 5;

            doc.rect(rightBoxX, headerY, rightBoxWidth, headerHeight);

            // Ic cizgiler
            doc.setFontSize(6);
            doc.setFont('Roboto', 'normal');

            const infoLabels = ['Doküman No', 'Yayın Tarihi', 'Revizyon Tarihi', 'Revizyon No'];
            for (let i = 0; i < 4; i++) {
                const rowY = headerY + (i * smallRowHeight);
                if (i < 3) {
                    doc.line(rightBoxX, rowY + smallRowHeight, rightBoxX + rightBoxWidth, rowY + smallRowHeight);
                }
                doc.text(infoLabels[i], rightBoxX + 2, rowY + 4);
            }
        };

        // Footer cizim fonksiyonu
        const drawFooter = (pageNum: number, total: number) => {
            doc.setFontSize(8);
            doc.setFont('Roboto', 'normal');
            doc.text(`Sayfa ${pageNum} / ${total}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        };

        // Yeni sayfa olustur
        doc.addPage();
        currentPage++;
        drawHeader();

        let y = 40;
        const contentWidth = pageWidth - (2 * margin);
        const lineHeight = 5;
        let lineCount = 0;

        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Sayfa kontrolu
            if (y > pageHeight - 25) {
                drawFooter(currentPage, totalPages);
                doc.addPage();
                currentPage++;
                drawHeader();
                y = 40;
            }

            // Baslik kontrolu (buyuk harfle baslayan veya numara ile baslayan)
            const isMainHeading = /^[0-9]+\.?\s+[A-ZİĞÜŞÖÇ]/.test(line) && line.length < 80;
            const isSubHeading = /^[0-9]+\.[0-9]+\.?\s+/.test(line);
            const isSubSubHeading = /^[0-9]+\.[0-9]+\.[0-9]+/.test(line);

            if (isMainHeading || (line === line.toUpperCase() && line.length > 3 && line.length < 60)) {
                y += 3;
                doc.setFontSize(11);
                doc.setFont('Roboto', 'bold');
            } else if (isSubHeading) {
                y += 2;
                doc.setFontSize(10);
                doc.setFont('Roboto', 'bold');
            } else if (isSubSubHeading) {
                doc.setFontSize(9);
                doc.setFont('Roboto', 'bold');
            } else {
                doc.setFontSize(9);
                doc.setFont('Roboto', 'normal');
            }

            // Madde isareti kontrolu
            let indent = 0;
            if (line.startsWith('•') || line.startsWith('-') || line.startsWith('·')) {
                indent = 5;
            }

            const splitLines = doc.splitTextToSize(line, contentWidth - indent);
            for (const splitLine of splitLines) {
                if (y > pageHeight - 25) {
                    drawFooter(currentPage, totalPages);
                    doc.addPage();
                    currentPage++;
                    drawHeader();
                    y = 40;
                }
                doc.text(splitLine, margin + indent, y);
                y += lineHeight;
            }

            lineCount++;
        }

        // Son sayfaya footer ekle
        drawFooter(currentPage, currentPage);

        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

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

        // Firma adının ilk 2 kelimesini al
        const getFirstTwoWords = (name: string) => {
            const words = name.trim().split(/\s+/);
            return words.slice(0, 2).join(' ');
        };

        const firstTwoWords = getFirstTwoWords(companyName);
        const safeFilename = sanitizeFilename(firstTwoWords);

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${safeFilename}_Acil_Durum_Eylem_Plani.pdf"`
            }
        });

    } catch (error: any) {
        console.error('PDF olusturma hatasi:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
