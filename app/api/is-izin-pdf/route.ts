import { NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';

export async function POST(request: Request) {
    try {
        const data = await request.json();

        const {
            permitNo,
            companyName,
            location,
            workDescription,
            startTime,
            endTime,
            permitTypes,
            safetyMeasures,
            ppeList,
            requesterLabel,
            requesterName,
            approverLabel,
            approverName,
        } = data;

        // PDF oluştur (A4 boyut)
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        let yPos = margin;

        // Türkçe karakter desteği için Roboto fontunu yükle
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
            console.error('Font yükleme hatası:', fontError);
            doc.setFont('helvetica');
        }

        // Renk tanımları
        const primaryColor: [number, number, number] = [37, 99, 235]; // Mavi
        const successColor: [number, number, number] = [22, 163, 74]; // Yeşil
        const textColor: [number, number, number] = [31, 41, 55]; // Koyu gri
        const lightGray: [number, number, number] = [243, 244, 246];

        // Metin kısaltma yardımcı fonksiyonu
        const truncateText = (text: string, maxWidth: number, fontSize: number): string => {
            doc.setFontSize(fontSize);
            if (doc.getTextWidth(text) <= maxWidth) return text;
            let truncated = text;
            while (doc.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
                truncated = truncated.slice(0, -1);
            }
            return truncated + '...';
        };

        // ===== HEADER =====
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 24, 'F');

        // Sol üst başlık
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('Roboto', 'bold');
        doc.text('İŞ İZİN FORMU', margin, 14);

        // Sağ üst - Sadece İzin No
        doc.setFontSize(11);
        doc.setFont('Roboto', 'bold');
        const permitText = `İzin No: ${permitNo}`;
        const permitWidth = doc.getTextWidth(permitText);
        doc.text(permitText, pageWidth - margin - permitWidth, 14);

        yPos = 34;

        // ===== 1. İŞ TANIMI VE LOKASYON =====
        doc.setFillColor(51, 65, 85);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('Roboto', 'bold');
        doc.text('1. İŞ TANIMI VE LOKASYON', margin + 3, yPos + 5);
        yPos += 10;

        // Bilgi kutusu
        const infoBoxHeight = 32;
        doc.setFillColor(...lightGray);
        doc.rect(margin, yPos, pageWidth - 2 * margin, infoBoxHeight, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPos, pageWidth - 2 * margin, infoBoxHeight, 'S');

        doc.setTextColor(...textColor);
        doc.setFontSize(8);
        const contentWidth = pageWidth - 2 * margin;
        const halfWidth = contentWidth / 2;

        // Sol sütun
        doc.setFont('Roboto', 'bold');
        doc.text('Firma / Yüklenici:', margin + 3, yPos + 5);
        doc.setFont('Roboto', 'normal');
        const companyTrunc = truncateText(companyName || '-', halfWidth - 35, 8);
        doc.text(companyTrunc, margin + 32, yPos + 5);

        doc.setFont('Roboto', 'bold');
        doc.text('Çalışma Alanı:', margin + 3, yPos + 11);
        doc.setFont('Roboto', 'normal');
        const locationTrunc = truncateText(location || '-', halfWidth - 32, 8);
        doc.text(locationTrunc, margin + 32, yPos + 11);

        doc.setFont('Roboto', 'bold');
        doc.text('İş Detayı:', margin + 3, yPos + 17);
        doc.setFont('Roboto', 'normal');
        const descLines = doc.splitTextToSize(workDescription || '-', contentWidth - 35);
        const descText = descLines.slice(0, 2).join(' ');
        const descTrunc = descText.length > 80 ? descText.substring(0, 77) + '...' : descText;
        doc.text(descTrunc, margin + 32, yPos + 17);

        // Sağ sütun - Tarihler
        const rightCol = margin + halfWidth + 5;
        doc.setFont('Roboto', 'bold');
        doc.text('Başlangıç:', rightCol, yPos + 5);
        doc.setFont('Roboto', 'normal');
        doc.text(startTime || '-', rightCol + 22, yPos + 5);

        doc.setFont('Roboto', 'bold');
        doc.text('Bitiş:', rightCol, yPos + 11);
        doc.setFont('Roboto', 'normal');
        doc.text(endTime || '-', rightCol + 22, yPos + 11);

        yPos += infoBoxHeight + 5;

        // ===== 2. İZİN TÜRÜ =====
        doc.setFillColor(217, 119, 6);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('Roboto', 'bold');
        doc.text('2. İZİN TÜRÜ', margin + 3, yPos + 5);
        yPos += 10;

        // İzin türleri kutusu
        doc.setFillColor(...lightGray);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 14, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 14, 'S');

        doc.setTextColor(...textColor);
        doc.setFontSize(8);

        const permitTypeLabels: { [key: string]: string } = {
            'sicak': 'Sıcak İş Çalışması',
            'yuksek': 'Yüksekte Çalışma',
            'kapali': 'Kapalı Alan',
            'elektrik': 'Elektrik Çalışması'
        };

        let xOffset = margin + 4;
        const maxLabelX = pageWidth - margin - 5;
        const badgeHeight = 8;
        const badgeY = yPos + 3;

        if (permitTypes && permitTypes.length > 0) {
            for (const type of permitTypes) {
                const label = permitTypeLabels[type] || type;
                const labelWidth = doc.getTextWidth(label) + 6;

                if (xOffset + labelWidth > maxLabelX) break; // Taşma kontrolü

                doc.setFillColor(...primaryColor);
                doc.roundedRect(xOffset, badgeY, labelWidth, badgeHeight, 1, 1, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFont('Roboto', 'bold');
                // Dikey ortalama: kutu merkezi + font yüksekliğinin yaklaşık yarısı
                const textY = badgeY + (badgeHeight / 2) + 1;
                doc.text(label, xOffset + 3, textY);
                xOffset += labelWidth + 3;
            }
        } else {
            doc.setTextColor(150, 150, 150);
            doc.text('Seçilmedi', margin + 4, yPos + 8);
        }

        yPos += 18;

        // ===== 3. GÜVENLİK ÖNLEMLERİ =====
        doc.setFillColor(22, 163, 74);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('Roboto', 'bold');
        doc.text('3. GÜVENLİK ÖNLEMLERİ KONTROL LİSTESİ', margin + 3, yPos + 5);
        yPos += 10;

        // Güvenlik önlemleri listesi
        const safetyCount = safetyMeasures?.length || 0;
        const safetyRows = Math.ceil(safetyCount / 2);
        const safetyBoxHeight = Math.max(20, safetyRows * 6 + 6);

        doc.setFillColor(...lightGray);
        doc.rect(margin, yPos, pageWidth - 2 * margin, safetyBoxHeight, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPos, pageWidth - 2 * margin, safetyBoxHeight, 'S');

        doc.setTextColor(...textColor);
        doc.setFontSize(7);

        if (safetyMeasures && safetyMeasures.length > 0) {
            const colWidth = (contentWidth - 10) / 2;
            safetyMeasures.forEach((measure: string, index: number) => {
                const col = index % 2;
                const row = Math.floor(index / 2);
                const x = margin + 4 + col * colWidth;
                const y = yPos + 5 + row * 6;

                // Checkbox
                doc.setFillColor(...successColor);
                doc.rect(x, y - 2.5, 3, 3, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(5);
                doc.text('V', x + 0.7, y);

                doc.setTextColor(...textColor);
                doc.setFontSize(6.5);
                doc.setFont('Roboto', 'normal');
                // Metni kısalt - daha uzun limit, daha küçük font
                let shortMeasure = measure.length > 52 ? measure.substring(0, 49) + '...' : measure;
                doc.text(shortMeasure, x + 5, y);
            });
        } else {
            doc.setTextColor(150, 150, 150);
            doc.text('Önlem seçilmedi', margin + 4, yPos + 8);
        }

        yPos += safetyBoxHeight + 5;

        // ===== 4. KKD =====
        doc.setFillColor(147, 51, 234);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('Roboto', 'bold');
        doc.text('4. KİŞİSEL KORUYUCU DONANIMLAR', margin + 3, yPos + 5);
        yPos += 10;

        // KKD kutusu
        doc.setFillColor(...lightGray);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 12, 'S');

        doc.setTextColor(...textColor);
        doc.setFontSize(8);

        if (ppeList && ppeList.length > 0) {
            xOffset = margin + 4;
            for (const item of ppeList) {
                const itemWidth = doc.getTextWidth(item) + 8;

                if (xOffset + itemWidth > maxLabelX) break; // Taşma kontrolü

                doc.setFillColor(147, 51, 234);
                doc.roundedRect(xOffset, yPos + 2, itemWidth, 7, 1, 1, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFont('Roboto', 'bold');
                doc.text(item, xOffset + 4, yPos + 7);
                xOffset += itemWidth + 2;
            }
        } else {
            doc.setTextColor(150, 150, 150);
            doc.text('KKD seçilmedi', margin + 4, yPos + 8);
        }

        yPos += 16;

        // ===== 5. ONAY VE İMZALAR =====
        doc.setFillColor(71, 85, 105);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('Roboto', 'bold');
        doc.text('5. ONAY VE İMZALAR', margin + 3, yPos + 5);
        yPos += 10;

        // İmza alanları
        const signBoxWidth = (contentWidth - 10) / 2;
        const signBoxHeight = 30;

        // Sol imza kutusu - Kullanıcının girdiği label
        doc.setFillColor(...lightGray);
        doc.rect(margin, yPos, signBoxWidth, signBoxHeight, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPos, signBoxWidth, signBoxHeight, 'S');

        doc.setTextColor(...textColor);
        doc.setFontSize(8);
        doc.setFont('Roboto', 'bold');
        // Kullanıcının girdiği başlık veya varsayılan
        doc.text(requesterLabel || 'İzni İsteyen', margin + 3, yPos + 5);
        doc.setFont('Roboto', 'normal');
        doc.setFontSize(9);
        doc.text(requesterName || '................................', margin + 3, yPos + 12);

        // İmza çizgisi
        doc.setDrawColor(150, 150, 150);
        doc.setLineDashPattern([2, 2], 0);
        doc.line(margin + 3, yPos + 24, margin + signBoxWidth - 5, yPos + 24);
        doc.setLineDashPattern([], 0);
        doc.setFontSize(6);
        doc.setTextColor(150, 150, 150);
        doc.text('İmza', margin + signBoxWidth / 2 - 5, yPos + 28);

        // Sağ imza kutusu - Kullanıcının girdiği label
        const rightBoxX = margin + signBoxWidth + 10;
        doc.setFillColor(...lightGray);
        doc.rect(rightBoxX, yPos, signBoxWidth, signBoxHeight, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(rightBoxX, yPos, signBoxWidth, signBoxHeight, 'S');

        doc.setTextColor(...textColor);
        doc.setFontSize(8);
        doc.setFont('Roboto', 'bold');
        // Kullanıcının girdiği başlık veya varsayılan
        doc.text(approverLabel || 'İzni Onaylayan', rightBoxX + 3, yPos + 5);
        doc.setFont('Roboto', 'normal');
        doc.setFontSize(9);
        doc.text(approverName || '................................', rightBoxX + 3, yPos + 12);

        // İmza çizgisi
        doc.setDrawColor(150, 150, 150);
        doc.setLineDashPattern([2, 2], 0);
        doc.line(rightBoxX + 3, yPos + 24, rightBoxX + signBoxWidth - 5, yPos + 24);
        doc.setLineDashPattern([], 0);
        doc.setFontSize(6);
        doc.setTextColor(150, 150, 150);
        doc.text('İmza', rightBoxX + signBoxWidth / 2 - 5, yPos + 28);

        // ===== FOOTER =====
        doc.setFillColor(241, 245, 249);
        doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');

        // PDF'i buffer olarak al
        const pdfBuffer = doc.output('arraybuffer');

        // Response oluştur
        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Is-Izin-Formu-${permitNo}.pdf"`,
            },
        });

    } catch (error: any) {
        console.error('PDF oluşturma hatası:', error);
        return NextResponse.json(
            { error: 'PDF oluşturulamadı: ' + error.message },
            { status: 500 }
        );
    }
}
