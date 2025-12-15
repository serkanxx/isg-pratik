import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import path from 'path';
import fs from 'fs';
import { jsPDF } from 'jspdf';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { companyName, companyAddress, registrationNumber, reportDate, validityDate, employer, isgUzmani, documentNo } = body;

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

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
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

        // Kapak sayfası kenar süs çizgileri
        doc.setDrawColor(50, 50, 50);
        doc.setLineWidth(2);
        doc.rect(10, 10, pageWidth - 20, pageHeight - 20); // Dış çerçeve
        doc.setLineWidth(0.5);
        doc.rect(15, 15, pageWidth - 30, pageHeight - 30); // İç çerçeve

        // Firma Adi - Ust kisim ortalanmis (metni kaydır eğer uzunsa)
        doc.setFontSize(24);
        doc.setFont('Roboto', 'bold');
        const companyNameText = companyName || '[FİRMA ADI]';
        const maxCompanyNameWidth = pageWidth - 50; // sol ve sağ 25mm margin
        const companyNameLines = doc.splitTextToSize(companyNameText, maxCompanyNameWidth);
        let companyNameY = 55;
        companyNameLines.forEach((line: string, index: number) => {
            doc.text(line, pageWidth / 2, companyNameY + (index * 10), { align: 'center' });
        });
        const afterCompanyNameY = companyNameY + (companyNameLines.length * 10) + 10;

        // Sicil No (ozel formatli)
        doc.setFontSize(14);
        doc.setFont('Roboto', 'normal');

        const formatRegistrationNumber = (num: string) => {
            if (!num) return '';
            // Tum bosluklari ve non-digit karakterleri temizle
            const cleanNum = num.replace(/\D/g, '');

            // Eğer 26 hane değilse olduğu gibi döndür (veya yine de formatlamaya çalış)
            // İstenen format: 1 4322 07 07 1390293 034 24 54 000
            // Regex grupları: (\d{1})(\d{4})(\d{2})(\d{2})(\d{7})(\d{3})(\d{2})(\d{2})(\d{3})

            const match = cleanNum.match(/^(\d{1})(\d{4})(\d{2})(\d{2})(\d{7})(\d{3})(\d{2})(\d{2})(\d{3})$/);

            if (match) {
                // match[0] tüm string, match[1]..match[9] gruplar
                return `${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]} ${match[6]} ${match[7]} ${match[8]} ${match[9]}`;
            }

            return num;
        };

        const formattedRegistrationNumber = registrationNumber ? formatRegistrationNumber(registrationNumber) : '';
        doc.text(formattedRegistrationNumber, pageWidth / 2, afterCompanyNameY, { align: 'center' });

        // Ana Baslik
        doc.setFontSize(28);
        doc.setFont('Roboto', 'bold');
        doc.text('ACİL DURUM EYLEM PLANI', pageWidth / 2, 130, { align: 'center' });

        // Hazirlayan / Onaylayan Kutulari
        const boxY = 165;
        const boxWidth = 80;
        const boxHeight = 40;
        const boxGap = 20;

        // Hazirlayan kutusu
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(margin + 10, boxY, boxWidth, boxHeight);
        doc.setFontSize(10);
        doc.setFont('Roboto', 'bold');
        doc.text('HAZIRLAYAN', margin + 10 + boxWidth / 2, boxY + 8, { align: 'center' });

        // Onaylayan kutusu
        doc.rect(pageWidth - margin - boxWidth - 10, boxY, boxWidth, boxHeight);
        doc.text('ONAYLAYAN', pageWidth - margin - boxWidth / 2 - 10, boxY + 8, { align: 'center' });

        // Tarih tablosu
        const tableY = 235;
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

        const col1CenterX = tableX + col1Width / 2;
        doc.text('YAPILDIĞI TARİH', col1CenterX, tableY + 8, { align: 'center' });
        doc.setFont('Roboto', 'normal');

        const col2CenterX = tableX + col1Width + (tableWidth - col1Width) / 2;
        doc.text(reportDate || '', col2CenterX, tableY + 8, { align: 'center' });

        // Gecerlilik Suresi satiri
        doc.rect(tableX, tableY + rowHeight, col1Width, rowHeight);
        doc.rect(tableX + col1Width, tableY + rowHeight, tableWidth - col1Width, rowHeight);
        doc.setFont('Roboto', 'bold');
        doc.text('GEÇERLİLİK TARİHİ', col1CenterX, tableY + rowHeight + 8, { align: 'center' });
        doc.setFont('Roboto', 'normal');
        doc.text(validityDate || '', col2CenterX, tableY + rowHeight + 8, { align: 'center' });

        // ========== ICERIK SAYFALARI ==========
        let allLines = text.split('\n').filter((line: string) => line.trim() !== '');

        // Kapakta zaten olan bilgileri atla - "GİRİŞ" veya "1." ile başlayan satıra kadar atla
        let startIndex = 0;
        for (let i = 0; i < allLines.length; i++) {
            const trimmedLine = allLines[i].trim().toUpperCase();
            if (trimmedLine.startsWith('GİRİŞ') || trimmedLine.startsWith('GIRIS') ||
                trimmedLine.startsWith('1.') || trimmedLine.startsWith('1 ')) {
                startIndex = i;
                break;
            }
        }

        // Başlık numaralandırma haritası - tam eşleşme ile çalışır
        const headingMap: { [key: string]: string } = {
            'GİRİŞ': '1.   GİRİŞ',
            'GIRIS': '1.   GİRİŞ',
            'AMAÇ': '1.1.   AMAÇ',
            'AMAC': '1.1.   AMAÇ',
            'ACİL DURUM YÖNETİMİ POLİTİKASI': '1.2.   ACİL DURUM YÖNETİMİ POLİTİKASI',
            'ACIL DURUM YONETIMI POLITIKASI': '1.2.   ACİL DURUM YÖNETİMİ POLİTİKASI',
            'KAPSAM': '1.3.   KAPSAM',
            'TANIMLAR': '2.   TANIMLAR',
            'ACİL DURUM': '2.1.   ACİL DURUM',
            'ACIL DURUM': '2.1.   ACİL DURUM',
            'ACİL DURUM PLANI': '2.2.   ACİL DURUM PLANI',
            'ACIL DURUM PLANI': '2.2.   ACİL DURUM PLANI',
            'İLK YARDIM': '2.3.   İLK YARDIM',
            'ILK YARDIM': '2.3.   İLK YARDIM',
            'ACİL DURUM MÜDAHALESİ': '2.4.   ACİL DURUM MÜDAHALESİ',
            'ACIL DURUM MUDAHALESI': '2.4.   ACİL DURUM MÜDAHALESİ',
            'ORGANİZASYON': '3.   ORGANİZASYON',
            'ORGANIZASYON': '3.   ORGANİZASYON',
            'ORGANİZASYON ŞEMASI': '3.1.   ORGANİZASYON ŞEMASI',
            'ORGANIZASYON SEMASI': '3.1.   ORGANİZASYON ŞEMASI',
            'GÖREV YETKİ SORUMLULUKLAR': '3.2.   GÖREV YETKİ SORUMLULUKLAR',
            'GOREV YETKI SORUMLULUKLAR': '3.2.   GÖREV YETKİ SORUMLULUKLAR',
            'ACİL DURUM KOORDİNATÖRÜ': '3.2.1.   Acil Durum Koordinatörü',
            'ACIL DURUM KOORDINATORU': '3.2.1.   Acil Durum Koordinatörü',
        };

        let coordinatorFound = false;

        // Satırları işle ve başlıklara numara ekle
        const lines = allLines.slice(startIndex).map((line: string) => {
            const trimmed = line.trim();
            const trimmedUpper = trimmed.toUpperCase();

            // Tam eşleşme kontrolü
            if (headingMap[trimmedUpper]) {
                return headingMap[trimmedUpper];
            }

            // "Acil Durum Koordinatörü" için özel kontrol
            // Başlık olamayacak kadar uzun satırları (cümleleri) hariç tut
            if (line.length < 50) {
                if (trimmed === 'Acil Durum Koordinatörü' ||
                    trimmed === 'Acil Durum Koordinatörü:' ||
                    trimmedUpper.includes('KOORDINATÖRÜ') ||
                    trimmedUpper.includes('KOORDİNATÖRÜ')) {

                    if (!coordinatorFound) {
                        coordinatorFound = true;
                        return '3.2.1.   Acil Durum Koordinatörü';
                    } else {
                        // İkinci tekrarı sil
                        return '';
                    }
                }
            }

            return line;
        });

        let currentPage = 1;
        const totalPages = 21; // Kapak + İçerik + Tablo + EK-1 ~ EK-8 + İletişim + KKE + Destek + Firma + Değişmeler

        // Header cizim fonksiyonu
        const drawHeader = () => {
            const headerY = 10;
            const headerHeight = 20;
            const logoWidth = 30;
            const docInfoWidth = 45; // Daraltıldı (55 -> 45)
            const companyNameWidth = pageWidth - (2 * margin) - logoWidth - docInfoWidth; // Firma adına daha fazla alan

            // Sol kutu - Firma Logo (boş beyaz)
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.3);
            doc.rect(margin, headerY, logoWidth, headerHeight);
            // Logo yoksa boş bırak (beyaz arka plan zaten var)

            // Orta kutu - Firma Adi (metin kaydır ve ortala)
            const companyBoxX = margin + logoWidth;
            doc.rect(companyBoxX, headerY, companyNameWidth, headerHeight);
            doc.setFontSize(8);  // 9 -> 8 (%10 küçültüldü)
            doc.setFont('Roboto', 'bold');
            const headerCompanyName = companyName || '';
            const headerCompanyLines = doc.splitTextToSize(headerCompanyName, companyNameWidth - 4);
            const lineHeight = 4;
            const totalTextHeight = headerCompanyLines.length * lineHeight;
            const startTextY = headerY + (headerHeight - totalTextHeight) / 2 + lineHeight;
            headerCompanyLines.forEach((line: string, idx: number) => {
                doc.text(line, companyBoxX + companyNameWidth / 2, startTextY + (idx * lineHeight), { align: 'center' });
            });

            // Sag kutu - Dokuman bilgileri (daraltılmış)
            const rightBoxX = margin + logoWidth + companyNameWidth;
            const smallRowHeight = 5;

            doc.rect(rightBoxX, headerY, docInfoWidth, headerHeight);

            // Ic cizgiler
            doc.setFontSize(4.5);  // 5 -> 4.5 (%10 küçültüldü)
            doc.setFont('Roboto', 'normal');

            const infoLabels = ['Doküman No', 'Yayın Tarihi', 'Revizyon Tarihi', 'Revizyon No'];
            const fontBoyutu = 10; // doc.setFontSize(10) olarak ayarlandığı için bu değeri kullandık

            for (let i = 0; i < 4; i++) {
                const rowY = headerY + (i * smallRowHeight);

                // ----------------------------------------------------------------------
                // ✨ YENİ: Dikey ortalama için hesaplama
                // Metin Y koordinatı = Satır başlangıcı + (Yüksekliğin yarısı) + (Dengeleme)
                // Metin Y koordinatı = Satır başlangıcı + (Yüksekliğin yarısı) + (Dengeleme) - (Manuel Ayar)
                const dikeyOrtalamaY = rowY + (smallRowHeight / 2) + (fontBoyutu / 6) - 1.5; // Kullanıcı isteği üzerine yukarı kaydırıldı
                // Not: Font Boyutu/3 veya /3.5 genellikle jsPDF'de görsel olarak en iyi sonucu verir.
                // ----------------------------------------------------------------------

                if (i < 3) {
                    doc.line(rightBoxX, rowY + smallRowHeight, rightBoxX + docInfoWidth, rowY + smallRowHeight);
                }

                // doc.text() metodunda yeni Y koordinatını kullanıyoruz.
                doc.text(infoLabels[i], rightBoxX + 2, dikeyOrtalamaY);

                // --- YENİ: Değerleri Yazdırma ---
                doc.setFont('Roboto', 'normal'); // Değerler normal font olsun
                // Değerleri sabit bir hizada (sağa kaydırılmış) yazdır (rightBoxX + 22)
                const valueX = rightBoxX + 22;

                if (i === 0 && documentNo) {
                    // Doküman No (Index 0)
                    doc.text(documentNo, valueX, dikeyOrtalamaY);
                } else if (i === 1 && reportDate) {
                    // Yayın Tarihi (Index 1)
                    doc.text(reportDate, valueX, dikeyOrtalamaY);
                }
                // Revizyon Tarihi ve No şimdilik boş kalabilir veya 00 olarak set edilebilir
                doc.setFont('Roboto', 'normal'); // Tekrar eski fonta dön (döngü başı zaten normal ama emin olmak için)
            }
        };

        // Footer cizim fonksiyonu
        const drawFooter = (pageNum: number, total: number) => {
            doc.setFontSize(5); // 7'den 5'e düşürüldü (%30 küçültme)
            doc.setFont('Roboto', 'normal');
            // Sayfa numarası (sağ altta)
            doc.text(`Sayfa ${pageNum} / ${total}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
            // Alt bilgiler - imza alanları (kapak hariç, sayfa numarasının üstünde)
            if (pageNum > 1) {
                doc.setFontSize(6);
                doc.text('İŞ GÜVENLİK UZMANI', margin, pageHeight - 18);
                doc.text('İŞYERİ HEKİMİ', pageWidth / 2, pageHeight - 18, { align: 'center' });
                doc.text('İŞVEREN/İŞVEREN VEKİLİ', pageWidth - margin, pageHeight - 18, { align: 'right' });
            }
        };

        // Yeni sayfa olustur
        doc.addPage();
        currentPage++;
        drawHeader();

        let y = 35;  // Header'a daha yakın başla
        const contentWidth = pageWidth - (2 * margin);
        const lineHeight = 5;
        let lineCount = 0;

        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);

        // Sabit içerik - kullanıcının verdiği 2. sayfa metni
        const pageContent = [
            { type: 'h1', text: '1.\tGİRİŞ' },
            { type: 'h2', text: '1.1.\tAMAÇ' },
            { type: 'p', text: 'Acil Durum Planı, herhangi bir acil durum oluştuğunda, panik yapmadan, organize olarak, düzenli bir şekilde müdahale etmek, ortaya çıkabilecek olan zararları en az seviyeye düşürmek maksadıyla hazırlanmıştır.' },
            { type: 'p', text: `Bu plan, ${companyName} 'nde meydana gelebilecek yangın, doğal afetler, sabotaj, zehirlenme, travma, ekipman hasar, çevresel kazalar ve iş kazalarına karşı alınacak önlemlerle, ${companyName} personelinin yapacakları işleri ve eğitim takvimini belirtmektedir. Ayrıca acil durum ekipmanlarının hazır halde tutulması için gerekli bakımların yapılmasını sağlamaktadır.` },
            { type: 'h2', text: '1.2.\tACİL DURUM YÖNETİMİ POLİTİKASI' },
            { type: 'p', text: 'Acil durumlar, bir işletmenin başına gelebilecek en kötü olaylardandır. Tesisde, malzemede, cihazlarda hasar yaratarak, müşteri, tedarikçi ve itibar kaybına neden olarak maddi; personel zaiyatına neden olarak, manevi zararlar verir. Bu nedenle, acil durumlara hazırlıklı olmak, çok büyük bir önceliktir. Bu plan içinde verilmiş olan görevler titizlikle uygulanacak, bu konuda eğitimler yapılacak ve hiçbir şekilde taviz verilmeyecektir.' },
            { type: 'h2', text: '1.3.\tKAPSAM' },
            { type: 'p', text: 'Acil Durum Planı tüm çalışanlar, tesiste bulunan tüm ziyaretçiler, müşteriler ve taşeron firmalar için geçerlidir.' },
            { type: 'p', text: `Bu planın geçerli olduğu bölge ${companyName} faaliyet/işletme sahasıdır.` },
            { type: 'h1', text: '2.\tTANIMLAR' },
            { type: 'h2', text: '2.1.\tACİL DURUM' },
            { type: 'p', text: 'Acil durum, çalışanlar, müşteriler, tedarikçiler, ziyaretçiler veya çevre halkı arasında, ölüm ve ciddi yaralanmaya neden olabilecek veya işin durmasına, faaliyetlerin aksamasına, fiziksel veya çevresel olarak zarar görmesine, tesisin mali yapısının bozulmasına ve toplum içinde itibarının düşmesine neden olabilecek, plan ve istem dışı olaylardır.' },
            { type: 'h2', text: '2.2.\tACİL DURUM PLANI' },
            { type: 'p', text: 'Acil durumların engellenmesi, her şeye rağmen ortaya çıktığında, oluşabilecek zararların önlenmesi veya hafifletilmesi için yapılan plandır.' },
            { type: 'h2', text: '2.3.\tİLK YARDIM' },
            { type: 'p', text: 'Herhangi bir kaza veya yaşamı tehlikeye düşüren bir durumda, sağlık görevlilerinin yardımı sağlanıncaya kadar, hayatın kurtarılması ya da durumun kötüye gitmesini önleyebilmek amacıyla, olay yerinde, tıbbi araç gereç aranmaksızın, mevcut araç ve gereçlerle yapılan ilaçsız uygulamalardır.' },
            { type: 'h2', text: '2.4.\tACİL DURUM MÜDAHALESİ' },
            { type: 'p', text: 'Acil durumların ortaya çıkmasından sonra yapılacak müdahaledir.' },
            { type: 'h1', text: '3.\tORGANİZASYON' },
            { type: 'h2', text: '3.1.\tORGANİZASYON ŞEMASI' },
            { type: 'p', text: 'Destek elemanı tahliye, ilkyardım, yangın söndürme ve koruma, kurtarma görevlerinde çalışmaları yürütecek ve İşveren onayı ile işlemleri gerçekleştirecektir.' },
            { type: 'h2', text: '3.2.\tGÖREV YETKİ SORUMLULUKLAR' },
            { type: 'p', text: 'Acil durum ekibinde bulunan kişiler aynı zamanda mevzuatta destek elemanı olarak tanımlanırlar.' },
            { type: 'h3', text: '3.2.1\tAcil Durum Koordinatörü' },
            { type: 'p', text: 'Firma bünyesinde bulunan işyerlerindeki en üst sorumlu olup meydana gelebilecek tüm acil durumların yönetilmesinde ekip liderliği görevini üstlenerek görevli herkesten sorumlu olacaktır. Acil durum sırasında yapılacak her işlem onayından geçecektir.' },
            { type: 'p', text: 'Acil durum faaliyet ve hazırlıklarını koordine eder. Acil durum planında belirtilmiş acil durum uygulama prosedürlerini uygulamaya koyar, uygulama sırasında tespit edilen veya meydana gelen değişik durumlar karşısında uygulama yöntemlerini değiştirir.' },
            { type: 'p', text: 'Gerekli araç gereçleri sağlar, bakım ve kontrolleri yapar/yaptırır. Acil durum koordinatörü ……………………………………………………………….  \'dir.' },
            // 3. Sayfa içeriği
            { type: 'p', text: '' },  // Boşluk: y += lineHeight; ile aynı etki - bir satır boşluk bırakır
            { type: 'h3', text: '3.2.2\tİlkyardım Ekibi' },
            { type: 'p', text: 'İlkyardım ekibi, tesis personelinden ilkyardımcı eğitimi almış personelden oluşturulur. Ekip amiri ve ilk yardım ekibindeki diğer personelin tamamının eğitim alması istenir, fakat olmadığı durumlarda sedyeciler, ilkyardımcı eğitimi almış kişilerce sedye ile yaralı taşıma hususunda eğitilmelidir. İlk yardım ekibinin kullanacağı malzeme ve teçhizat ortak sağlık birimi veya iş yeri hekimi tarafından belirlenmelidir.' },
            { type: 'p', text: 'İlkyardım Ekip Liderinin Görevleri' },
            { type: 'bullet', text: '•\tEkibi koordine eder ve yönetir.' },
            { type: 'bullet', text: '•\tİş kazalarında kaza raporu düzenlemeye yardımcı olur ve kaza raporu işlemlerini takip eder.' },
            { type: 'bullet', text: '•\tKoordinatörün talimatlarına göre ekibini sevk ve idare eder.' },
            { type: 'p', text: 'İlkyardım Ekibin Görevleri' },
            { type: 'bullet', text: '•\tAcil durum halinde acil durum koordinatörünün vereceği direktifler doğrultusunda çalışır.' },
            { type: 'bullet', text: '•\tAcil durum haberinin alır almaz ilk yardım malzemelerini alarak olay yerine gider.' },
            { type: 'bullet', text: '•\tKaza sonucu ya da bir başka nedenden ötürü meydana gelen yaralanmalara ilk müdahalede bulunur.' },
            { type: 'bullet', text: '•\tYetkisiz kişilerin yaralılara müdahale etmesini engeller.' },
            { type: 'bullet', text: '•\tİlkyardım malzemelerinin kontrollerini yapmak, eksik ve kullanılmaz durumda malzeme varsa banka yetkililerine bildirir.' },
            { type: 'bullet', text: '•\tSevk edilen hasta / yaralıların durumlarını takip eder.' },
            { type: 'h3', text: '3.2.3\tYangınla Mücadele Ekibi' },
            { type: 'p', text: 'Ekibin üyeleri İleri Yangın Eğitimi almış olmalı ve yangınla mücadele teçhizatını ve malzemesinin her şartta kullanmasını, bilmelidir. Malzemenin Bakım tutum ve İdamesi ekip başı tarafından yapılmalıdır.' },
            { type: 'p', text: 'Yangınla Mücadele Ekip Üyelerinin Görevleri' },
            { type: 'bullet', text: '•\tAcil durum halinde acil durum sorumlusunun vereceği direktifler doğrultusunda çalışır.' },
            { type: 'bullet', text: '•\tYangın emrine göre uygun teçhizatın kullanılmasını sağlar.' },
            { type: 'bullet', text: '•\tYangın alarmı alır almaz bölgesinde bulunan yangın söndürücüyü alarak yangın yerine gelmek amirin talimatları doğrultusunda hareket eder.' },
            { type: 'bullet', text: '•\tYangında kurtarma gerekiyorsa önce kendi güvenliğini sağlayarak kurtarma işlemini yürütür.' },
            { type: 'bullet', text: '•\tKurtarılan kişileri ilk yardım ekibine teslim eder' },
            { type: 'bullet', text: '•\tSöndürme işlemi sonrası kullanılan ve boşalan tüpleri ekip sorumlusuna teslim etmek.' },
            { type: 'bullet', text: '•\tTatbikat eğitim ve toplantılara katılır.' },
            { type: 'p', text: 'Yangına Müdahale ve Söndürme Ekibinin ihtiyaç duyacağı malzeme ve teçhizat bu amaçla tesis edilmiş yangın İstasyonunda kullanıma hazır bulundurulmalıdır. Kullanılan ekipman bakım ve idamesi aksi belirtilmedikçe yangın sorumlusu koordinesinde yapılmalıdır.' },
            { type: 'h3', text: '3.2.4\tArama Ekibi Görevleri' },
            { type: 'bullet', text: '•\tArama ekibinin görevi, herhangi bir acil durumda, tehlike altındaki insanları ve diğer canlıları aramak' },
            { type: 'bullet', text: '•\tKurtarma ekibi ve tahliye ekibi ile işbirliği içinde çalışmaktır.' },
            { type: 'h3', text: '3.2.5\tKurtarma Ekibi' },
            { type: 'bullet', text: '•\tHerhangi bir acil durumda, tehlike altındaki insanları ve diğer canlıları kurtarmaktır.' },
            { type: 'bullet', text: '•\tTehlike altında canlı bulunmaması durumunda malzemeleri öncelik sırasına göre kurtarır. (Öncelikle bilgisayarlar, sonra evraklar ve büro mobilyaları)' },
            { type: 'bullet', text: '•\tArama ekibi ile işbirliği içindedir.' },
            { type: 'h3', text: '3.2.6\tTahliye Ekibi' },
            { type: 'bullet', text: '•\tAcil durumlarda bölüm tahliye sorumluları acil duruma göre bölüm çalışanlarını acil çıkış kapılarına panik yapmadan dışarıya çıkışlarını organize eder.' },
            { type: 'bullet', text: '•\tTek bir kapıda yığılmanın olmaması için gerekirse diğer çıkış kapıları güvenli olup olmamasına bakarak diğer kapılara personeli yönlendirir ve kendisi de dışarı çıkar.' },
            { type: 'bullet', text: '•\tDışarı çıkan personelin Toplanma bölgesinde toplanmasını sağlar.' },
            // 4. Sayfa içeriği
            { type: 'bullet', text: '•\tPersonelin yoklamasını yaparak Acil durum Koordinatörüne rapor verir.' },
            { type: 'bullet', text: '•\tİçerde kalan, yaralanan var ise diğer ekipler tarafından müdahale yapılır.' },
            { type: 'h3', text: '3.2.7\tKoruma (Güvenlik) Ekibi Görevleri' },
            { type: 'bullet', text: '•\tKoruma ekibi tehlike altındaki bölgenin etrafını çevirerek dışarıdan ilgili olmayan kişilerin tehlikeli bölgeye girmesini engeller.' },
            { type: 'bullet', text: '•\tTehlikeden kurtarılan malzemeleri ilgili olmayan kişilerin zarar vermesine veya başka sebeplerle zarar görmesini engellemek amacı ile hareket eder.' },
            { type: 'bullet', text: '•\tMümkün olduğu takdirde diğer ekiplere destek verir.' },
            { type: 'h3', text: '3.2.8\tHaberleşme Ekibi Görevleri' },
            { type: 'bullet', text: '•\tAcil durumlarda dış ve iç haberleşmeyi sağlayan ekiptir.' },
            { type: 'bullet', text: '•\tHaberleşme ekip elemanlarında ilgili yerlere ait acil durum telefonlarının listesi bulunur.' },
            { type: 'bullet', text: '•\tİlgili yerlerin aranması konusunda acil durum koordinatöründen talimat aldıktan sonra arama yaparlar.' },
            { type: 'bullet', text: '•\tOlay esnasındaki haberleşmede acil durumda haberleşme şemasına uygun olarak hareket edilir.' },
            { type: 'h3', text: '3.2.9\tTeknik Kontrol Ekibi Görevleri' },
            { type: 'bullet', text: '•\tAcil durumlarda hidrofor, doğalgaz, elektrik ve jeneratör sorumlusu ana pano ve jeneratörün kapalı olup olmadığını kontrol eder, gerekirse kapatır.' },
            { type: 'bullet', text: '•\tKazan ve doğalgaz sorumlusu, kazan ve doğalgazı faaliyet dışı bırakır.' },
            { type: 'bullet', text: '•\tHidrofor dairesi sorumlusu hidroforun çalışıp çalışmadığını kontrol eder.' },
            { type: 'bullet', text: '•\tSorumlu yardımcıları, ihtiyaç halinde sorumlulara yardım eder, sorumlunun firma içerisinde olmaması durumunda sorumlunun görevini yapar.' },
            { type: 'h3', text: '3.2.10\tKimyasal Kirlenme Ekibi Görevleri' },
            { type: 'bullet', text: '•\tHerhangi bir acil durum sebebi ile veya iş kazası sonucu, kullandığımız kimyasal malzemelerin dökülmesi durumunda bu malzemenin yayılmasını, kanalizasyona akmasını ve çevreye verebileceği muhtemel zararları kontrol altına almak için çalışır.' },
            { type: 'bullet', text: '•\tDökülen kimyasal malzemeyi uygun şekilde temizlemek ve tehlike riskini ortadan kaldırır.' },
            { type: 'bullet', text: '•\tKimyasalların taşınması ve depolanması esnasında ortaya çıkabilecek tehlike risklerine karşı gerekli önlemleri almak.' },
            { type: 'bullet', text: '•\tMüdahale esnasında koruyucu malzeme giymelidir (çizme, elbise, maske, eldiven, gözlük)' },
            { type: 'bullet', text: '•\tEkibin sevk ve idaresi ekip başı ve güvenlik amiri tarafından yapılır. Ekip başlarının olmaması durumunda ise ekipteki ilk kişi ekip başı görevini üstlenir.' },
            // 6. Sayfa içeriği
            { type: 'h2', text: '3.4.\tİLETİŞİM' },
            { type: 'p', text: 'Acil durumlarda, her türlü iletişim kanalı, acil durum maksatlı, kritik konular için kullanılacağından, zorunlu bir neden olmadıkça iletişim kanalları başka maksatla kullanılmamalıdır. Bu nedenle, acil durum sırasında, iletişim kanalları öncelikle destek elemanının ihtiyaçları için kullanılacaktır. Sabit telefonlarla tesis dışı iletişim zorunlu haller dışında yapılmayacaktır. Sabit telefon sisteminin çalışmaması durumunda, tesis dışı iletişim, öncelikle data hatları üzerinden bilgisayarlarla, bu da mümkün değilse cep telefonlarıyla sağlanacaktır.' },
            { type: 'h2', text: '3.5.\tAİLELERLE İLETİŞİM' },
            { type: 'p', text: 'Acil durum koordinatörü ve destek elemanı, ilk fırsatta personel aileleri ile temasa geçerek, acil durum hakkında bilgi verecek, aileleri hakkında öğrendiği bilgileri çalışanlara iletecektir. İletişim için öncelik sırası Acil durum koordinatörü tarafından saptanır. Ailelerin dışarıdan araması durumunda, aksine bir talimat verilmediği takdirde, telefonlar kişilere değil, Acil durum koordinatörüne bağlanacaktır.' },
            { type: 'h2', text: '3.6.\tDUYURULAR' },
            { type: 'p', text: 'Civarı etkileyen genel bir acil durum (afet) sözkonusu olduğu takdirde, Acil durum koordinatörü tarafından radyo ve televizyonları takip etmek üzere personel görevlendirilir ve konu hakkında gelişmeler izlenir. Acil durum sırasında, mümkün olan her fırsatta personele bilgi verilmelidir, aksi takdirde dedikodu ve yanlış duyumlar dolaşmaya başlar ki, bu durumu daha da kötüleştirir. Ne zaman ve ne kadar bilgi verileceğinin kararını, Acil durum koordinatörü verir.' },
            { type: 'h3', text: '3.6.1.\tALARM VE UYARILAR' },
            { type: 'bullet', text: '•\tYangını ilk gören kişi:' },
            { type: 'p', text: '1) "Yangın, yangın, yangın" diye bağıracak,' },
            { type: 'p', text: '2) En yakın söndürücüyü alarak yangına ilk müdahaleye başlayacak,' },
            { type: 'p', text: '3) Yangın müdahale ekibi gelene kadar müdahaleye devam edecektir.' },
            { type: 'bullet', text: '•\tYangın çıktığını duyan kişi yukarıda belirtilen işlemleri yapar.' },
            { type: 'p', text: '1) Olayı ilk gören Acil durum koordinatörünü arar,' },
            { type: 'p', text: '2) Adını Soyadını' },
            { type: 'p', text: '3) Olay tanımı' },
            { type: 'p', text: '4) Olayın olduğu yer/ünite' },
            { type: 'p', text: '5) Bulunduğu yerin telefon numarasını bildirir.' },
            { type: 'p', text: 'Acil durum ihbarı, işin kısmen de olsa durmasını ve konsantrasyonun başka işlere kaymasını gerektirir. Bu nedenle hatalı alarmlar yanlış anlamalar olmamalıdır. Bu tür sorunlara engel olmak maksadıyla alarm yöntemleri sürekli olarak kontrol edilecektir.' },
            { type: 'h2', text: '3.7.\tALARMIN VERİLMESİ' },
            { type: 'p', text: 'Yangın durumunda otomatik alarm sistemi devreye girer. Otomatik alarm sistemi devreye girmediği durumlarda ihbar butonuna basılarak yangın ihbarı verilir.' },
            { type: 'h2', text: '3.8.\tİNSAN HAYATI' },
            { type: 'p', text: 'Bir acil durumda, insan hayatı birinci önceliktir. Bu nedenle yapılacak herşey insan hayatını korumak içindir.' },
            { type: 'h1', text: '4.\tTAHLİYE' },
            { type: 'p', text: 'Tahliyenin amacı, düzenli ve emniyetli olarak işletmeyı boşaltmaktır. Bu maksatla mümkün olan en yakın emniyetli çıkış kullanılmalıdır. Tahliye sırasında ilave bir acil durum yaratmamak için mutlaka kurallara uyulmalıdır. Yangın durumunda, acil çıkış kapıları kullanılarak yangının çıktığı yönün ters tarafından çıkış ve merdivenlerden işletme tahliye edilmelidir.' },
            { type: 'p', text: 'Tahliye eden personel toplanma bölgesinden sayım yapılana kadar ayrılmayacaktır. Toplanma bölgesinde, ziyaretçilerin de sayımları yapılarak Acil durum koordinatörüne bilgi verilecektir.' },
            { type: 'p', text: 'İşletmedeki ziyaretçilerin sayımının sağlıklı yapılabilmesi için her ziyaretçi için üzerinde acil durumlardaki davranışlarını belirten ziyaretçi giriş kartı uygulamasının sağlıklı yürütülmesi gerekmektedir.' },
            // 7. Sayfa ve devamı
            { type: 'h2', text: '4.1.\tTAHLİYE YOLLARI VE ÇIKIŞLAR' },
            { type: 'p', text: 'Alarm alındığında çalışanlar kapama planını uygulayarak işi emniyetli bir şekilde durdurup bırakarak aşağıda belirtilen toplanma noktasından yakın olanına giderler.' },
            { type: 'p', text: 'Tahliye yollarını ve acil çıkışları belirten tahliye planları personelin görebileceği yerlerde asılı bulundurulmalıdır.' },
            { type: 'h2', text: '4.2.\tTOPLANMA NOKTA/BÖLGELERİ VE MEVCUT ALMA/PERSONEL TESPİTİ' },
            { type: 'p', text: 'TOPLANMA NOKTASI :' },
            { type: 'p', text: 'Toplanma bölgesine gelen personel bir araya gelerek mevcutları alınacaktır. Mevcut alınırken tesise gelmiş olan ziyaretçi, satıcı, tedarikçi ilgili kişinin yanına giderek mevcuda kaydedilecektir.' },
            { type: 'p', text: 'Alınan mevcutlar, Koruma Ekibi tarafından birleştirilip, kontrol edilerek, eksik personel Acil durum koordinatörüne bildirilir.' },
            { type: 'p', text: 'Mevcut alma işlemi, içeride personel kalıp kalmadığını anlamak için yapılmaktadır. Hatalı bir sonuç, ya bir veya birkaç kişinin hasar içinde unutulmasına, ya da içeride kaldığı sanılan birini müdahale ekibini tehlikeye atarak boşu boşuna aratmak, demektir. Bu işlem mümkün olduğu kadar kısa sürede yapılmalıdır.' },
            { type: 'h2', text: '4.3.\tEĞİTİM VE BİLGİ' },
            { type: 'p', text: 'Personele, acil durumlarda ne yapacağını bildiren eğitimler İş sağlığı ve güvenliği eğitimi kapsamında anlatılacaktır.' },
            { type: 'p', text: 'Aşağıda açıklanan Acil durum eğitimleri, İş Güvenliği Uzmanı / ........................................................... ve İşveren / İşveren Vekili ……………………………………………… tarafından koordine edilir.' },
            { type: 'h3', text: '4.3.1.\tOryantasyon Eğitimleri' },
            { type: 'p', text: 'Oryantasyon eğitimleri Acil Durum Planının anlatılması için yapılan toplu eğitimlerdir. Yeni işe başlayan personele ilk fırsatta, çalışan personele Acil Durum Planında değişiklik yapıldığında, acil durum oryantasyon eğitimi verilir.' },
            { type: 'h3', text: '4.3.2.\tYenileme Eğitimleri' },
            { type: 'p', text: 'Tazeleme eğitimleri daha önce öğrenilmiş olan bilgileri hatırlatmak için yapılan eğitimlerdir. Tüm personele her sene 1 kez veya ihtiyaç duyulduğunda hatırlatma amaçlı tazeleme eğitimi verilir. Bu eğitimler Acil Durum Ekipleri için 4 saat sürelidir.' },
            { type: 'h3', text: '4.3.3.\tMasabaşı Eğitimleri' },
            { type: 'p', text: 'Destek elemanı eğitimi, çeşitli faraziyelerle, hangi durumda ne tür reaksiyon göstereceklerinin tartışıldığı eğitimlerdir. Eğitim sonunda, eğitimin kritiği yapılır. ADYE üyeleri her yıl 1 kez masabaşı eğitimi yaparlar. Müdahale ekipleri, kendi aralarında toplanarak her yıl en az 1 kez masabaşı eğitimi yaparlar. Bu eğitim yenileme eğitiminin hemen sonrasında yapılır.' },
            { type: 'h3', text: '4.3.4.\tFonksiyonel Eğitimler' },
            { type: 'p', text: 'Müdahale ekiplerinin alacakları eğitimlerdir. Bu eğitimler;' },
            { type: 'bullet', text: '•\tYangın / Müdahale ekibi - Gelişmiş yangına müdahale eğitimi' },
            { type: 'bullet', text: '•\tFiziki koruma ekibi - Yangına müdahale eğitimi' },
            { type: 'bullet', text: '•\tTahliye / Kurtarma ekibi - Temel İlkyardım ve Yangına müdahale eğitimleri' },
            { type: 'bullet', text: '•\tİlkyardım ekibi - Temel ilkyardım eğitimi' },
            { type: 'bullet', text: '•\tTeknik bakım ve kontrol ekibi - Yangına müdahale eğitimi' },
            { type: 'bullet', text: '•\tKimyasal Sızıntı ve Kirlilik Kontrol Ekibi - Kimyasal madde temizliği ve Yangına Müdahale eğitimi' },
            { type: 'h3', text: '4.3.5.\tFonksiyonel Gözden Geçirme Eğitimleri' },
            { type: 'p', text: 'Müdahale ekiplerinin kendi aralarında yapacakları fiili eğitimdir. Masabaşı eğitimleri yapıldıktan sonra yapılır.' },
            { type: 'h3', text: '4.3.6.\tGenel Tahliye Eğitimi' },
            { type: 'p', text: 'Tüm personelin katıldığı, hiçbir senaryo olmaksızın, sadece bina tahliyesi ve mevcut alma eğitimidir. Böyle bir eğitime ihtiyaç duyulduğu her an yapılabilir. İhtiyaç olduğu kararı destek elemanı tarafından verilir.' },
            { type: 'h3', text: '4.3.7.\tSimülasyonlu Uygulama Eğitimi' },
            { type: 'p', text: 'Tüm personelin katıldığı, bir senaryo dahilinde gelişen, peşpeşe birkaç olayın olabileceği, simülasyon yapılan eğitimlerdir. Eğitimin sonunda uygun görülecek katılımcılarla birlikte kritik yapılır.' },
            { type: 'h2', text: '4.4.\tKORUYUCU EKİPMAN KULLANIMI' },
            { type: 'p', text: 'Hangi faaliyetlerde ne tür kişisel koruyucular kullanılacağı Acil Durum Planı EK 5\'te verilmiştir.' },
            { type: 'h1', text: '5.\tTESİS KORUNMASI' },
            { type: 'h2', text: '5.1.\tKORUMA SİSTEMLERİ' },
            { type: 'p', text: 'Tesisde bulunan alarm ve koruma sistemleri' },
            { type: 'bullet', text: '-\t1 adet ana giriş olarak bulundurulmaktadır.' },
            { type: 'bullet', text: '-\t1 adet KKT tip yangın söndürücü bulundurulmaktadır.' },
            { type: 'h2', text: '5.2.\tTESİSİN KAPATILMASI' },
            { type: 'p', text: 'Tesisin kapatılması düşünülecek en son yöntemdir. Bir acil durum sırasında, her ne kadar otomatik kesme sistemleri bulunsa da gaz derhal kesilecektir. Su ve elektriğin kesilmesi için görevlendirilecek teknisyenler Acil durum koordinatöründen bu konuda talimat bekleyeceklerdir.' },
            { type: 'p', text: 'Tesisin kapanması ise:' },
            { type: 'bullet', text: '-\tKapama kararı verecek kişi: Kapama talimatı Acil durum koordinatörü tarafından verilecektir.' },
            { type: 'bullet', text: '-\tKapama işlemini yerine getirecek kişiler: Herkes kullandığı cihazı kapatacaktır.' },
            { type: 'h2', text: '5.3.\tKAYITLARIN MUHAFAZASI' },
            { type: 'p', text: 'Acil durum sırasında hasar görmemesi, acil durumdan sonra kolay toparlanabilmek için bilgisayar sistemi, çelik kasalar içinde yedeklenmektedir. Bilgisayar ortamında olmayan her tür kritik kayıt ya bilgisayar ortamına transfer edilip yedeklenecek, ya da bu mümkün değilse kopyaları (fotokopi, fotoğraf veya video) çıkarılarak yedeklenecektir.' },
            { type: 'h1', text: '6.\tHALKLA İLİŞKİLER' },
            { type: 'p', text: 'Bir acil durumda, her türlü halkla ilişkiler faaliyeti, destek elemanı tarafından kontrol ve koordine edilecektir. Acil durum koordinatöründe alınan kararlar ve hazırlanan bilgi dışında bir bilgi verilmeyecektir.' },
            { type: 'h2', text: '6.1.\tRESMİ KURULUŞLARLA İLİŞKİLER' },
            { type: 'p', text: 'Hangi acil durumda hangi resmi kurumun aranacağını gösterir liste ve aranan kuruma verilecek bilgiler "Ek-3 İletişim Bilgileri"nde yer almaktadır.' },
            { type: 'h2', text: '6.2.\tTOPLUMSAL HİZMETLER' },
            { type: 'p', text: 'Genel bir acil durumda öncelikle personel aileleri olmak üzere, çevre topluma destek verilecektir. Bu destek, üretim devam edebiliyorsa, üretimi kesintiye uğratmadan, üretim kesilmişse, toparlanma faaliyetlerine engel olmadan verilmelidir. Bu durum önceden öngörülebilecek bir durum olmadığından, ne şekilde destek verileceği destek elemanının yetki ve sorumluluğundadır.' },
            { type: 'p', text: 'Acil durumlarda verilebilecek destekler işletme imkanları da dikkate alınarak ulaşım, barındırma ve sıcak yemek de dahil olmak üzere ön hazırlık yapılması ve sayının belirlenmesi faydalı olacaktır.' },
            { type: 'h2', text: '6.3.\tTOPLUMU BİLGİLENDİRME' },
            { type: 'p', text: 'Tesis içinde ortaya çıkan bir acil durum, tesis sınırları dışına taşıyorsa; resmi makamlar, olayın yapısını, toplum sağlığı veya güvenliğinin tehlikede olup olmadığını, sorunu çözmek için ne yapıldığını ve bu durumun ortaya çıkmaması için neler yapılmış olduğunu öğrenmek isteyeceklerdir. Bu nedenle, bir acil durumdan etkilenecekler ve bunların ihtiyaç duyacakları bilgi destek elemanı tarafından belirlenir ve Basın Sözcüsü tarafından açıklanır. Aşağıdaki liste bilgi verilecek kişilere örnektir:' },
            {
                type: 'twoColumn', items: [
                    '-  Çevre halkı',
                    '-  Basın yayın kuruluşları',
                    '-  Çalışanlar ve emekliler',
                    '-  Sendikalar',
                    '-  Satıcılar ve tedarikçiler',
                    '-  Müşteriler',
                    '-  Ortaklar',
                    '-  Acil durum müdahale organizasyonları',
                    '-  Resmi makamlar',
                    '-  Mülki amir ve belediye başkanı',
                    '-  Özel ilgi grupları',
                    '-  Komşu kuruluşlar',
                ]
            },
            { type: 'h1noSpace', text: '7.\tTOPARLANMA VE TEKRAR BAŞLAMA' },
            { type: 'p', text: 'Bir acil durum sonrası mümkün olduğu kadar kısa sürede toparlanarak, tekrar işe dönmek gerekir. Aksi takdirde, çalışanlar motivasyonlarını, tesis müşteri ve tedarikçilerini kaybetmeye başlar.' },
            { type: 'h2', text: '7.1.\tSİGORTA' },
            { type: 'p', text: 'Acil durum sonrası sigortayla yapılacak tüm işlemlerde İşveren birlikte çalışacaklardır. Olan biten tüm olay eksiksiz olarak, fakat abartılmadan ekspere gösterilecektir. Hatta bu maksatla, mümkün olduğu takdirde, acil durum sırasında fotoğraf çekimi ve video kaydı yapılacaktır.' },
            { type: 'h2', text: '7.2.\tFAALİYETE TEKRAR BAŞLAMA' },
            { type: 'p', text: 'Toparlanma ve faaliyete tekrar başlama, Acil durum koordinatörü koordinatörlüğünde yapılacak planlamayla yürütülecektir.' },
            { type: 'bullet', text: '-\tToparlanma Ekibi kurulur. Toparlanma için öncelikler saptanır.' },
            { type: 'bullet', text: '-\tTesisdeki personelin emniyeti sağlanmaya devam edilir. Olay yerinin güvenliğini sağlanır.' },
            { type: 'bullet', text: '-\tAyrıntılı kayıt tutulur, tüm kararların mümkünse sesli kaydı tutulur. Hasarın fotoğrafları çekilir veya video kaydı yapılır.' },
            { type: 'bullet', text: '-\tHasar maliyetleri çıkarılır. Alımlar için özel bütçe kodları ayarlanır.' },
            { type: 'bullet', text: '-\tDuman ve su tahliye edilip, molozlar temizlenir. Cihazlar nemden korunur. Güç sistemleri faal hale getirilir.' },
            { type: 'bullet', text: '-\tEnkaz kaldırma faaliyetlerine başlanır. Hasarlı kısımlar hasar görmemiş kısımlardan ayırılır.' },
            { type: 'bullet', text: '-\tHasarlı malzemenin envanterini çıkarılır. Bu iş hasarlı malzemenin değeri saptamak içindir ve genellikle eksper veya eksperin görevlendireceği birinin gözetiminde yapılmalıdır.' },
            { type: 'bullet', text: '-\tHasarlı malzemenin değerlendirilmesi konusunda sigortayla görüştükten sonra karar verilir.' },
            { type: 'bullet', text: '-\tCihazlar, sistemler ve tesis tekrar çalıştırılmaya başlanır.' },
            { type: 'bullet', text: '-\tBüyük onarım ve restorasyon faaliyetlerine, resmi makamlarla ve sigorta şirketiyle görüştükten sonra başlanır.' },
            { type: 'bullet', text: '-\tHasarlı kısmın değeri çıkarılır, işin kesilmesinin verdiği zarar hesaplanır.' },

        ];

        // İçeriği PDF'e yaz
        for (const item of pageContent) {
            // Sayfa kontrolü
            if (y > pageHeight - 25) {
                drawFooter(currentPage, totalPages);
                doc.addPage();
                currentPage++;
                drawHeader();
                y = 40;
            }

            let indent = 0;

            if (item.type === 'h1') {
                // Ana başlık (1., 2., 3.)
                const text = (item as { text?: string }).text || '';
                if (!text.includes('GİRİŞ')) {
                    y += 5; // 1. GİRİŞ hariç üstte boşluk
                }
                doc.setFontSize(10);
                doc.setFont('Roboto', 'bold');
            } else if (item.type === 'h2') {
                // Alt başlık (1.1., 2.1., 3.1.)
                const text = (item as { text?: string }).text || '';
                const noSpaceHeadings = text.startsWith('1.1.') ||
                    text.startsWith('2.1.') ||
                    text.startsWith('3.1.');
                if (!noSpaceHeadings) {
                    y += 4;
                }
                doc.setFontSize(9);
                doc.setFont('Roboto', 'bold');
                indent = 3;
            } else if (item.type === 'h3') {
                // Alt-alt başlık (3.2.1, 3.2.2, vb.)
                // 3.2.3, 3.2.4, 3.2.5, 3.2.6 başlıklarından önce boşluk ekle
                const text = (item as { text?: string }).text || '';
                if (text.startsWith('3.2.3') || text.startsWith('3.2.4') ||
                    text.startsWith('3.2.5') || text.startsWith('3.2.6') ||
                    text.startsWith('3.2.7') || text.startsWith('3.2.8') ||
                    text.startsWith('3.2.9') || text.startsWith('3.2.10')) {
                    y += 5;
                }
                doc.setFontSize(9);
                doc.setFont('Roboto', 'bold');
                indent = 6;
            } else if (item.type === 'bullet') {
                // Madde işareti
                doc.setFontSize(8);
                doc.setFont('Roboto', 'normal');
                indent = 10;
            } else if (item.type === 'twoColumn') {
                // 2 sütunlu liste
                doc.setFontSize(8);
                doc.setFont('Roboto', 'normal');
                const items = (item as { type: string; items: string[] }).items;
                const halfCount = Math.ceil(items.length / 2);
                const colWidth = (contentWidth - 20) / 2;
                const startY = y;

                // Sol sütun
                for (let i = 0; i < halfCount; i++) {
                    doc.text(items[i], margin + 5, y);
                    y += lineHeight;
                }

                // Sağ sütun
                y = startY;
                for (let i = halfCount; i < items.length; i++) {
                    doc.text(items[i], margin + colWidth + 10, y);
                    y += lineHeight;
                }

                continue; // Sonraki öğeye geç
            } else if (item.type === 'h1noSpace') {
                // Ana başlık - boşluksuz
                doc.setFontSize(10);
                doc.setFont('Roboto', 'bold');
            } else {
                // Normal paragraf
                doc.setFontSize(8);
                doc.setFont('Roboto', 'normal');
            }

            const itemText = (item as { text?: string }).text || '';
            const splitLines = doc.splitTextToSize(itemText.replace(/\t/g, '   '), contentWidth - indent);
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
        }

        // ========== 5. SAYFA: TABLO ==========
        drawFooter(currentPage, totalPages);
        doc.addPage();
        currentPage++;
        drawHeader();

        // Tablo başlığı
        doc.setFontSize(10);
        doc.setFont('Roboto', 'bold');
        doc.text('3.3.    OLASI ACİL DURUMLAR ve RİSK DEĞERLENDİRMESİ', margin, 38);

        // Tablo verileri
        const tableData = [
            ['1.', 'Deprem', '1', '5', '5', '5', '5', '2', '5', '28'],
            ['2.', 'Yangın', '2', '3', '5', '5', '2', '5', '5', '27'],
            ['3.', 'Bomba İhbarı, Patlaması', '1', '5', '3', '4', '2', '1', '5', '21'],
            ['4.', 'Sel ve Ani Su Basması', '1', '2', '4', '4', '3', '2', '4', '20'],
            ['5.', 'Şiddetli Rüzgar ve Fırtına', '1', '2', '4', '4', '3', '2', '4', '20'],
            ['6.', 'Şüpheli Paket', '1', '5', '1', '4', '3', '1', '4', '19'],
            ['7.', 'Terör Dışı Patlama', '1', '3', '3', '5', '2', '2', '3', '19'],
            ['8.', 'Kar ve Don', '2', '2', '2', '3', '3', '2', '4', '18'],
            ['9.', 'Zehirlenme', '1', '3', '3', '3', '1', '1', '5', '17'],
            ['10.', 'İş Kazası', '2', '3', '2', '3', '1', '3', '3', '17'],
            ['11.', 'Bulaşıcı Hastalıklar', '1', '3', '2', '3', '2', '1', '5', '17'],
            ['12.', 'Kimyasal Kirlilik', '1', '2', '2', '2', '2', '3', '3', '15'],
            ['13.', 'Toplu Kavga', '1', '3', '1', '2', '1', '2', '4', '14'],
            ['14.', 'Trafik Kazası', '1', '3', '2', '2', '1', '1', '4', '14'],
            ['15.', 'İntihar', '1', '3', '1', '3', '1', '1', '3', '13'],
            ['16.', 'Ziyaretçi Hastalanması, Ölmesi', '1', '3', '1', '1', '1', '2', '4', '13'],
            ['17.', 'Kemirgen', '1', '1', '2', '1', '2', '2', '4', '13'],
            ['18.', 'Haşarat', '1', '1', '2', '1', '2', '2', '4', '13'],
            ['19.', 'Hırsızlık', '1', '1', '1', '3', '1', '3', '3', '13'],
            ['20.', 'GAZ PATLAMASI', '1', '5', '4', '5', '3', '2', '3', '23'],
        ];

        // Tablo çizimi
        const riskTableY = 43;
        const colWidths = [12, 38, 18, 14, 14, 14, 14, 16, 16, 18]; // Sütun genişlikleri
        const riskRowHeight = 8;
        const headerRowHeight = 16;
        let riskTableX = margin;

        // Başlık satırı arka plan
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);

        // Başlık satırları çiz
        const headers1 = ['SIRA', 'RİSKLER', 'MEYDANA', 'ETKİLERİ', '', '', '', 'MÜCADELE', '', 'TOPLAM'];
        const headers2 = ['NO', '', 'GELME OLASILIĞI', 'İnsan', 'Tesis', 'İş', 'Çevre', 'İç Kaynak', 'Dış Kaynak', ''];

        doc.setFontSize(6);
        doc.setFont('Roboto', 'bold');

        // İlk başlık satırı
        let xPos = riskTableX;
        for (let i = 0; i < colWidths.length; i++) {
            doc.rect(xPos, riskTableY, colWidths[i], headerRowHeight);
            xPos += colWidths[i];
        }

        // Başlık metinleri
        xPos = riskTableX;
        doc.text('SIRA', xPos + 2, riskTableY + 5);
        doc.text('NO', xPos + 2, riskTableY + 11);
        xPos += colWidths[0];

        doc.text('RİSKLER', xPos + 2, riskTableY + 8);
        xPos += colWidths[1];

        doc.text('MEYDANA', xPos + 1, riskTableY + 4);
        doc.text('GELME', xPos + 1, riskTableY + 8);
        doc.text('OLASILIĞI', xPos + 1, riskTableY + 12);
        xPos += colWidths[2];

        // ETKİLERİ sütunları
        doc.text('İnsan', xPos + 2, riskTableY + 12);
        xPos += colWidths[3];
        doc.text('Tesis', xPos + 2, riskTableY + 12);
        xPos += colWidths[4];
        doc.text('İş', xPos + 4, riskTableY + 12);
        xPos += colWidths[5];
        doc.text('Çevre', xPos + 2, riskTableY + 12);
        xPos += colWidths[6];

        // MÜCADELE sütunları
        doc.text('İç Kaynak', xPos + 1, riskTableY + 12);
        xPos += colWidths[7];
        doc.text('Dış Kaynak', xPos + 1, riskTableY + 12);
        xPos += colWidths[8];

        doc.text('TOPLAM', xPos + 1, riskTableY + 8);

        // Veri satırları
        let currentY = riskTableY + headerRowHeight;
        doc.setFont('Roboto', 'normal');
        doc.setFontSize(6);

        for (const row of tableData) {
            xPos = riskTableX;
            for (let i = 0; i < row.length; i++) {
                doc.rect(xPos, currentY, colWidths[i], riskRowHeight);
                const cellText = row[i];
                if (i <= 1) {
                    doc.text(cellText, xPos + 2, currentY + 5);
                } else {
                    // Sayıları ortala
                    const textWidth = doc.getTextWidth(cellText);
                    doc.text(cellText, xPos + (colWidths[i] - textWidth) / 2, currentY + 5);
                }
                xPos += colWidths[i];
            }
            currentY += riskRowHeight;
        }

        // Alt açıklama
        doc.setFontSize(7);
        doc.text('1', margin + 60, currentY + 8);
        doc.text('5', margin + 120, currentY + 8);
        doc.text('En iyi', margin + 55, currentY + 13);
        doc.text('En kötü', margin + 115, currentY + 13);

        // Ok çiz
        doc.setLineWidth(0.5);
        doc.line(margin + 65, currentY + 7, margin + 115, currentY + 7);
        doc.line(margin + 112, currentY + 5, margin + 115, currentY + 7);
        doc.line(margin + 112, currentY + 9, margin + 115, currentY + 7);

        // ========== EK-1: YANGIN MÜDAHALE PLANI ==========
        drawFooter(currentPage, totalPages);
        doc.addPage();
        currentPage++;
        drawHeader();

        // Başlıklar
        doc.setFontSize(10);
        doc.setFont('Roboto', 'bold');
        doc.text('EK-1 ACİL DURUMLAR VE MÜDAHALE YÖNTEMLERİ', margin, 38);
        doc.text('1.   ACİL DURUM: YANGIN', margin, 46);

        // Yangın Müdahale Planı resmi
        try {
            const imgPath = path.join(process.cwd(), 'public', 'yangin-mudahale-plani.png');
            const imgData = fs.readFileSync(imgPath);
            const base64Img = imgData.toString('base64');
            const imgDataUrl = `data:image/png;base64,${base64Img}`;

            // Resmi sayfaya sığdır (margin'ler dahil)
            const imgWidth = pageWidth - (margin * 2);
            const imgHeight = pageHeight - 70; // Alt bilgi için daha fazla boşluk
            doc.addImage(imgDataUrl, 'PNG', margin, 52, imgWidth, imgHeight);
        } catch (imgError) {
            console.error('Yangın resmi yüklenemedi:', imgError);
            doc.text('Yangın Müdahale Planı resmi yüklenemedi.', margin, 60);
        }

        // ========== EK-2: DEPREM MÜDAHALE PLANI ==========
        drawFooter(currentPage, totalPages);
        doc.addPage();
        currentPage++;
        drawHeader();

        // Başlık
        doc.setFontSize(10);
        doc.setFont('Roboto', 'bold');
        doc.text('2.   ACİL DURUM: DEPREM', margin, 38);

        // Deprem Müdahale Planı resmi
        try {
            const depremImgPath = path.join(process.cwd(), 'public', 'deprem-mudahale-plani.png');
            const depremImgData = fs.readFileSync(depremImgPath);
            const depremBase64Img = depremImgData.toString('base64');
            const depremImgDataUrl = `data:image/png;base64,${depremBase64Img}`;

            // Resmi sayfaya sığdır
            const depremImgWidth = pageWidth - (margin * 2);
            const depremImgHeight = pageHeight - 70; // Alt bilgi için daha fazla boşluk
            doc.addImage(depremImgDataUrl, 'PNG', margin, 44, depremImgWidth, depremImgHeight);
        } catch (depremImgError) {
            console.error('Deprem resmi yüklenemedi:', depremImgError);
            doc.text('Deprem Müdahale Planı resmi yüklenemedi.', margin, 60);
        }

        // ========== EK-3: SABOTAJ MÜDAHALE PLANI ==========
        drawFooter(currentPage, totalPages);
        doc.addPage();
        currentPage++;
        drawHeader();

        // Başlık
        doc.setFontSize(10);
        doc.setFont('Roboto', 'bold');
        doc.text('3.   ACİL DURUM: SABOTAJ', margin, 38);

        // Sabotaj Müdahale Planı resmi
        try {
            const sabotajImgPath = path.join(process.cwd(), 'public', 'sabotaj-mudahale-plani.png');
            const sabotajImgData = fs.readFileSync(sabotajImgPath);
            const sabotajBase64Img = sabotajImgData.toString('base64');
            const sabotajImgDataUrl = `data:image/png;base64,${sabotajBase64Img}`;

            // Resmi sayfaya sığdır
            const sabotajImgWidth = pageWidth - (margin * 2);
            const sabotajImgHeight = pageHeight - 70; // Alt bilgi için daha fazla boşluk
            doc.addImage(sabotajImgDataUrl, 'PNG', margin, 44, sabotajImgWidth, sabotajImgHeight);
        } catch (sabotajImgError) {
            console.error('Sabotaj resmi yüklenemedi:', sabotajImgError);
            doc.text('Sabotaj Müdahale Planı resmi yüklenemedi.', margin, 60);
        }

        // ========== EK-4: İŞ KAZASI MÜDAHALE PLANI ==========
        drawFooter(currentPage, totalPages);
        doc.addPage();
        currentPage++;
        drawHeader();

        // Başlık
        doc.setFontSize(10);
        doc.setFont('Roboto', 'bold');
        doc.text('4.   ACİL DURUM: İŞ KAZASI VE SAĞLIK OLAYLARI', margin, 38);

        // İş Kazası Müdahale Planı resmi
        try {
            const iskazasiImgPath = path.join(process.cwd(), 'public', 'is-kazasi-mudahale-plani.png');
            const iskazasiImgData = fs.readFileSync(iskazasiImgPath);
            const iskazasiBase64Img = iskazasiImgData.toString('base64');
            const iskazasiImgDataUrl = `data:image/png;base64,${iskazasiBase64Img}`;

            // Resmi sayfaya sığdır
            const iskazasiImgWidth = pageWidth - (margin * 2);
            const iskazasiImgHeight = pageHeight - 70; // Alt bilgi için daha fazla boşluk
            doc.addImage(iskazasiImgDataUrl, 'PNG', margin, 44, iskazasiImgWidth, iskazasiImgHeight);
        } catch (iskazasiImgError) {
            console.error('İş Kazası resmi yüklenemedi:', iskazasiImgError);
            doc.text('İş Kazası Müdahale Planı resmi yüklenemedi.', margin, 60);
        }

        // ========== EK-5: KİMYASAL DÖKÜLME SIZINTI ==========
        drawFooter(currentPage, totalPages);
        doc.addPage();
        currentPage++;
        drawHeader();

        // Başlık
        doc.setFontSize(10);
        doc.setFont('Roboto', 'bold');
        doc.text('5.   ACİL DURUM: KİMYASAL DÖKÜLME SIZINTI', margin, 38);

        // Kimyasal Dökülme Müdahale Planı resmi
        try {
            const kimyasalImgPath = path.join(process.cwd(), 'public', 'kimyasal-dokulmesi-plani.png');
            const kimyasalImgData = fs.readFileSync(kimyasalImgPath);
            const kimyasalBase64Img = kimyasalImgData.toString('base64');
            const kimyasalImgDataUrl = `data:image/png;base64,${kimyasalBase64Img}`;

            // Resmi sayfaya sığdır
            const kimyasalImgWidth = pageWidth - (margin * 2);
            const kimyasalImgHeight = pageHeight - 55;
            doc.addImage(kimyasalImgDataUrl, 'PNG', margin, 44, kimyasalImgWidth, kimyasalImgHeight);
        } catch (kimyasalImgError) {
            console.error('Kimyasal Dökülme resmi yüklenemedi:', kimyasalImgError);
            doc.text('Kimyasal Dökülme Müdahale Planı resmi yüklenemedi.', margin, 60);
        }

        // ========== EK-6: ELEKTRİK ÇARPMASI ==========
        drawFooter(currentPage, totalPages);
        doc.addPage();
        currentPage++;
        drawHeader();

        // Başlık
        doc.setFontSize(10);
        doc.setFont('Roboto', 'bold');
        doc.text('6.   ACİL DURUM: ELEKTRİK ÇARPMASI', margin, 38);

        // Elektrik Çarpması Müdahale Planı resmi
        try {
            const elektrikImgPath = path.join(process.cwd(), 'public', 'elektrik-carpmasi-plani.png');
            const elektrikImgData = fs.readFileSync(elektrikImgPath);
            const elektrikBase64Img = elektrikImgData.toString('base64');
            const elektrikImgDataUrl = `data:image/png;base64,${elektrikBase64Img}`;

            // Resmi sayfaya sığdır
            const elektrikImgWidth = pageWidth - (margin * 2);
            const elektrikImgHeight = pageHeight - 65; // Alt kısımdan daha boşluk
            doc.addImage(elektrikImgDataUrl, 'PNG', margin, 44, elektrikImgWidth, elektrikImgHeight);
        } catch (elektrikImgError) {
            console.error('Elektrik Çarpması resmi yüklenemedi:', elektrikImgError);
            doc.text('Elektrik Çarpması Müdahale Planı resmi yüklenemedi.', margin, 60);
        }

        // ========== EK-7: ZEHİRLENME ==========
        drawFooter(currentPage, totalPages);
        doc.addPage();
        currentPage++;
        drawHeader();

        // Başlık
        doc.setFontSize(10);
        doc.setFont('Roboto', 'bold');
        doc.text('7.   ACİL DURUM: ZEHİRLENME', margin, 38);

        // Zehirlenme Müdahale Planı resmi
        try {
            const zehirlenmeImgPath = path.join(process.cwd(), 'public', 'zehirlenme-plani.png');
            const zehirlenmeImgData = fs.readFileSync(zehirlenmeImgPath);
            const zehirlenmeBase64Img = zehirlenmeImgData.toString('base64');
            const zehirlenmeImgDataUrl = `data:image/png;base64,${zehirlenmeBase64Img}`;

            // Resmi sayfaya sığdır
            const zehirlenmeImgWidth = pageWidth - (margin * 2);
            const zehirlenmeImgHeight = pageHeight - 55;
            doc.addImage(zehirlenmeImgDataUrl, 'PNG', margin, 44, zehirlenmeImgWidth, zehirlenmeImgHeight);
        } catch (zehirlenmeImgError) {
            console.error('Zehirlenme resmi yüklenemedi:', zehirlenmeImgError);
            doc.text('Zehirlenme Müdahale Planı resmi yüklenemedi.', margin, 60);
        }

        // ========== EK-8: PATLAMA ==========
        drawFooter(currentPage, totalPages);
        doc.addPage();
        currentPage++;
        drawHeader();

        // Başlık
        doc.setFontSize(10);
        doc.setFont('Roboto', 'bold');
        doc.text('8.   ACİL DURUM: PATLAMA', margin, 38);

        // Patlama Müdahale Planı resmi
        try {
            const patlamaImgPath = path.join(process.cwd(), 'public', 'patlama-plani.png');
            const patlamaImgData = fs.readFileSync(patlamaImgPath);
            const patlamaBase64Img = patlamaImgData.toString('base64');
            const patlamaImgDataUrl = `data:image/png;base64,${patlamaBase64Img}`;

            // Resmi sayfaya sığdır
            const patlamaImgWidth = pageWidth - (margin * 2);
            const patlamaImgHeight = pageHeight - 65; // Alt kısımdan 1cm daha boşluk (55->65)
            doc.addImage(patlamaImgDataUrl, 'PNG', margin, 44, patlamaImgWidth, patlamaImgHeight);
        } catch (patlamaImgError) {
            console.error('Patlama resmi yüklenemedi:', patlamaImgError);
            doc.text('Patlama Müdahale Planı resmi yüklenemedi.', margin, 60);
        }

        // ========== EK-2: ACİL İLETİŞİM LİSTESİ ==========
        drawFooter(currentPage, totalPages);
        doc.addPage(); // Dikey sayfa
        currentPage++;
        drawHeader();

        // Yatay sayfa için boyutlar (sonraki sayfalar için tanım)
        const landWidth = 297;
        const landHeight = 210;
        const landMargin = 10;

        // Başlıklar
        doc.setFontSize(10);
        doc.setFont('Roboto', 'bold');
        doc.text('EK-2  ACİL İLETİŞİM LİSTESİ', margin, 38);
        doc.text('1.   İÇ İLETİŞİM LİSTESİ', margin, 48);

        // İç İletişim Tablosu
        let iletisimY = 55;
        const iletisimRowHeight = 8;
        const col1W = 45;
        const col2W = 60;
        const col3W = 75;

        // Tablo başlığı
        doc.setFontSize(8);
        doc.setFont('Roboto', 'bold');
        doc.rect(margin, iletisimY, col1W, iletisimRowHeight);
        doc.rect(margin + col1W, iletisimY, col2W, iletisimRowHeight);
        doc.rect(margin + col1W + col2W, iletisimY, col3W, iletisimRowHeight);
        doc.text('', margin + 2, iletisimY + 5);
        doc.text('İSİM SOYİSİM', margin + col1W + 15, iletisimY + 5);
        doc.text('İLETİŞİM BİLGİLERİ', margin + col1W + col2W + 15, iletisimY + 5);

        // İç İletişim Verileri
        const icIletisimData = [
            'İŞVEREN',
            'İŞVEREN VEKİLİ',
            'DESTEK ELEMANI',
            '',
            '',
            ''
        ];

        doc.setFont('Roboto', 'normal');
        icIletisimData.forEach((item) => {
            iletisimY += iletisimRowHeight;
            doc.rect(margin, iletisimY, col1W, iletisimRowHeight);
            doc.rect(margin + col1W, iletisimY, col2W, iletisimRowHeight);
            doc.rect(margin + col1W + col2W, iletisimY, col3W, iletisimRowHeight);
            doc.text(item, margin + 2, iletisimY + 5);
        });

        // 2. DIŞ İLETİŞİM LİSTESİ
        iletisimY += 20;
        doc.setFont('Roboto', 'bold');
        doc.setFontSize(10);
        doc.text('2.   DIŞ İLETİŞİM LİSTESİ', margin, iletisimY);

        iletisimY += 8;
        const disCol1W = 40;
        const disCol2W = 35;
        const disCol3W = 105;

        // Tablo başlığı
        doc.setFontSize(8);
        doc.rect(margin, iletisimY, disCol1W, iletisimRowHeight);
        doc.rect(margin + disCol1W, iletisimY, disCol2W, iletisimRowHeight);
        doc.rect(margin + disCol1W + disCol2W, iletisimY, disCol3W, iletisimRowHeight);
        doc.text('BİRİM ADI', margin + 5, iletisimY + 5);
        doc.text('TELEFON', margin + disCol1W + 3, iletisimY + 5);
        doc.text('ADRES-TELEFON BİLGİLERİ', margin + disCol1W + disCol2W + 25, iletisimY + 5);

        // Dış İletişim Verileri
        const disIletisimData = [
            ['İTFAİYE', '110', ''],
            ['AMBULANS İLKYARDIM', '112', ''],
            ['POLİS', '112', ''],
            ['JANDARMA', '156', ''],
            ['DOĞALGAZ', '187', ''],
            ['ELEKTRİK', '186', ''],
            ['EN YAKIN HASTANE', '', ''],
            ['ZEHİR DANIŞMA MERKEZİ', '114', ''],
            ['ÇEVRE İL MÜDÜRLÜĞÜ', '', '']
        ];

        doc.setFont('Roboto', 'normal');
        disIletisimData.forEach((row) => {
            iletisimY += iletisimRowHeight;
            doc.rect(margin, iletisimY, disCol1W, iletisimRowHeight);
            doc.rect(margin + disCol1W, iletisimY, disCol2W, iletisimRowHeight);
            doc.rect(margin + disCol1W + disCol2W, iletisimY, disCol3W, iletisimRowHeight);
            doc.text(row[0], margin + 2, iletisimY + 5);
            doc.text(row[1], margin + disCol1W + 12, iletisimY + 5);
            doc.text(row[2], margin + disCol1W + disCol2W + 2, iletisimY + 5);
        });

        // ========== EK-4: KKE LİSTESİ ==========
        drawFooter(currentPage, totalPages);
        doc.addPage(); // Dikey sayfa
        currentPage++;
        drawHeader();

        // Başlık
        doc.setFontSize(9);
        doc.setFont('Roboto', 'bold');
        doc.text('EK-4  FAALİYETLERE GÖRE KİŞİSEL KORUYUCU EKİPMAN LİSTESİ', margin, 38);

        // KKE Tablosu - dikey sayfa için boyutlar
        let kkeY = 45;
        const kkeRowH = 6;
        const kkeCol0 = 35; // KKE Adı - küçültüldü
        const kkeColW = 15; // Her faaliyet sütunu - küçültüldü
        const faaliyetler = ['ELEKTRİK TAMİR', 'KAYNAK', 'KİMYASALLA ÇALIŞMA', 'MEKANİK TAMİR', 'ARITMA BÖLGESİ', 'YÜKLEME BOŞALTMA', 'TEMİZLİK', 'GÜVENLİK', 'TANK/SİLO GİRİŞ', 'YÜKSEKTE ÇALIŞMA'];

        // Tablo başlığı
        doc.setFontSize(5);
        doc.setFont('Roboto', 'bold');
        doc.rect(margin, kkeY, kkeCol0, kkeRowH * 2);
        doc.text('', margin + 2, kkeY + 8);

        faaliyetler.forEach((faaliyet, i) => {
            doc.rect(margin + kkeCol0 + (i * kkeColW), kkeY, kkeColW, kkeRowH * 2);
            // İki satırlık başlık
            const words = faaliyet.split(' ');
            if (words.length > 1) {
                doc.text(words[0], margin + kkeCol0 + (i * kkeColW) + 1, kkeY + 4);
                doc.text(words.slice(1).join(' '), margin + kkeCol0 + (i * kkeColW) + 1, kkeY + 8);
            } else {
                doc.text(faaliyet, margin + kkeCol0 + (i * kkeColW) + 1, kkeY + 6);
            }
        });

        kkeY += kkeRowH * 2;

        // KKE verileri - √ işareti kullan
        const kkeData = [
            ['İŞ AYAKKABISI', '√', '', '', '√', '√', '√', '√', '√', '√', '√'],
            ['ELEKTRİKÇİ AYAKKABISI', '√', '', '', '', '', '', '', '', '', ''],
            ['PVC ÇİZME', '√', '', '', '√', '√', '', '', '', '', ''],
            ['ÇİZME - KİMYASAL', '', '√', '', '', '', '', '', '', '', ''],
            ['TOZ MASKESİ', '√', '', '', '', '', '', '', '', '', ''],
            ['KAYNAK MASKESİ', '', '√', '', '', '', '', '', '', '', ''],
            ['GAZ MASKESİ', '√', '', '√', '', '', '', '', '', '', '√'],
            ['KULAKLIK', '√', '√', '√', '√', '√', '√', '', '', '', '√'],
            ['BARET', '√', '√', '√', '', '', '', '', '', '', ''],
            ['GÖZLÜK', '√', '', '√', '', '', '', '', '', '', ''],
            ['İŞ ELBİSESİ', '√', '√', '√', '', '√', '', '√', '', '', ''],
            ['KİMYASAL ELBİSESİ', '', '', '√', '', '', '', '', '', '', ''],
            ['KAYNAKÇI ÖNLÜĞÜ', '', '√', '', '', '', '', '', '', '', ''],
            ['EMNİYET KEMERİ', '', '', '', '', '', '', '', '', '', ''],
            ['ELDİVEN - KİMYASAL', '', '', '√', '', '', '', '', '', '', ''],
            ['CAN YELEĞİ/SİMİDİ', '', '', '', '', '', '√', '', '', '', ''],
            ['ELDİVEN - MONTAJ', '', '', '', '√', '', '', '', '', '', ''],
            ['ELDİVEN - Y.GERİLİM', '', '', '', '', '', '', '', '', '', ''],
            ['ELDİVEN - TEMİZLİK', '', '', '', '√', '', '', '', '', '', ''],
            ['ELEKTRİKÇİ MASKESİ', '√', '', '', '', '', '', '', '', '', ''],
            ['BEL KEMERİ', '', '', '', '', '', '√', '', '', '', ''],
            ['TOPRAKLAMAISTAKASI', '', '√', '', '', '', '', '', '', '', '']
        ];

        doc.setFont('Roboto', 'normal');
        doc.setFontSize(5);
        kkeData.forEach((row) => {
            doc.rect(margin, kkeY, kkeCol0, kkeRowH);
            doc.text(row[0], margin + 1, kkeY + 4);

            for (let i = 0; i < faaliyetler.length; i++) {
                doc.rect(margin + kkeCol0 + (i * kkeColW), kkeY, kkeColW, kkeRowH);
                if (row[i + 1] === '√') {
                    doc.text('√', margin + kkeCol0 + (i * kkeColW) + 6, kkeY + 4);
                }
            }
            kkeY += kkeRowH;
        });

        // ========== EK-6: DESTEK ELEMANI ATAMA YAZISI ==========
        drawFooter(currentPage, totalPages);
        doc.addPage(); // Dikey sayfa
        currentPage++;
        drawHeader();

        // Başlık
        doc.setFontSize(10);
        doc.setFont('Roboto', 'bold');
        doc.text('EK-6  DESTEK ELEMANI ATAMA YAZISI', margin, 38);

        // Açıklama metni
        doc.setFontSize(9);
        doc.setFont('Roboto', 'normal');
        const atamaMetni = `${companyName || '[FİRMA ADI]'} 'ne Arama, Kurtarma ve Tahliye, Yangınla mücadele görevlerini yerine getirmek üzere gerekli eğitimleri almış ve Acil Durumlar Hakkında Yönetmelik ve İlk Yardım Yönetmeliği'ne göre; "Destek Elemanı" olarak atanmıştır.`;
        const atamaLines = doc.splitTextToSize(atamaMetni, pageWidth - 2 * margin);
        doc.text(atamaLines, margin, 48);

        // Destek Elemanı Tablosu - dikey sayfa için boyutlar
        let destekY = 65;
        const destekRowH = 20;
        const destekCol1 = 55; // Ad/Soyad
        const destekCol2 = 80; // Görevi
        const destekCol3 = 45; // İmza

        // Tablo başlığı
        doc.setFontSize(8);
        doc.setFont('Roboto', 'bold');
        doc.rect(margin, destekY, destekCol1, 10);
        doc.rect(margin + destekCol1, destekY, destekCol2, 10);
        doc.rect(margin + destekCol1 + destekCol2, destekY, destekCol3, 10);
        doc.text('Ad / Soyad', margin + 15, destekY + 7);
        doc.text('Görevi ( Acil Durum Ekibi )', margin + destekCol1 + 15, destekY + 7);
        doc.text('İMZA', margin + destekCol1 + destekCol2 + 15, destekY + 7);

        destekY += 10;

        // Ekip satırları
        const ekipler = [
            'KURTARMA EKİBİ',
            'ARAMA VE TAHLİYE EKİBİ',
            'YANGIN İLE MÜCADELE EKİBİ',
            'İLK YARDIM EKİBİ'
        ];

        doc.setFont('Roboto', 'normal');
        ekipler.forEach((ekip) => {
            doc.rect(margin, destekY, destekCol1, destekRowH);
            doc.rect(margin + destekCol1, destekY, destekCol2, destekRowH);
            doc.rect(margin + destekCol1 + destekCol2, destekY, destekCol3, destekRowH);
            doc.text(ekip, margin + destekCol1 + 15, destekY + 12);
            destekY += destekRowH;
        });

        // ========== EK-7: FİRMA BİLGİLERİ (DİKEY) ==========
        drawFooter(currentPage, totalPages);
        doc.addPage(); // Dikey sayfa
        currentPage++;
        drawHeader();

        // Başlık
        const sayfaGenisligi2 = doc.internal.pageSize.getWidth();
        doc.setFontSize(10);
        doc.setFont('Roboto', 'bold');
        doc.text('EK-7 FİRMA BİLGİLERİ', sayfaGenisligi2 / 2, 38, { align: 'center' });

        // Firma Bilgileri Tablosu
        let firmaY = 48;
        const firmaRowH = 12;
        const firmaCol1 = 50;
        const firmaCol2 = 130;

        doc.setFontSize(8);

        // İŞYERİNİN satırları
        doc.setFont('Roboto', 'bold');
        doc.rect(margin, firmaY, firmaCol1, firmaRowH * 3);
        doc.text('İŞYERİNİN', margin + 5, firmaY + 20);

        doc.setFont('Roboto', 'normal');
        // Ünvanı - ortalanarak ve metin kaydır
        doc.rect(margin + firmaCol1, firmaY, firmaCol2, firmaRowH);
        const firmaAdiText = companyName || '[FİRMA ADI]';
        const firmaAdiLines = doc.splitTextToSize(firmaAdiText, firmaCol2 - 6);
        const firmaAdiY = firmaY + (firmaRowH / 2) - ((firmaAdiLines.length - 1) * 3);
        doc.text(firmaAdiLines, margin + firmaCol1 + (firmaCol2 / 2), firmaAdiY + 3, { align: 'center' });
        firmaY += firmaRowH;

        // Adresi - ortalanarak ve metin kaydır
        doc.rect(margin + firmaCol1, firmaY, firmaCol2, firmaRowH);
        const adresText = companyAddress || '[FİRMA ADRES]';
        const adresLines = doc.splitTextToSize(adresText, firmaCol2 - 6);
        const adresY = firmaY + (firmaRowH / 2) - ((adresLines.length - 1) * 3);
        doc.text(adresLines, margin + firmaCol1 + (firmaCol2 / 2), adresY + 3, { align: 'center' });
        firmaY += firmaRowH;

        // İşveren / Çalışan Sayısı
        doc.rect(margin + firmaCol1, firmaY, firmaCol2 / 2, firmaRowH);
        doc.rect(margin + firmaCol1 + firmaCol2 / 2, firmaY, firmaCol2 / 2, firmaRowH);
        doc.text('İşveren :', margin + firmaCol1 + 3, firmaY + 8);
        doc.text('ÇALIŞAN SAYISI :', margin + firmaCol1 + firmaCol2 / 2 + 3, firmaY + 8);
        firmaY += firmaRowH;

        // İŞ GÜVENLİĞİ UZMANI
        doc.setFont('Roboto', 'bold');
        doc.rect(margin, firmaY, firmaCol1, firmaRowH);
        doc.text('İŞ GÜVENLİĞİ UZMANI', margin + 3, firmaY + 8);
        doc.setFont('Roboto', 'normal');
        doc.rect(margin + firmaCol1, firmaY, firmaCol2 / 2, firmaRowH);
        doc.rect(margin + firmaCol1 + firmaCol2 / 2, firmaY, firmaCol2 / 2, firmaRowH);
        doc.text(isgUzmani || '', margin + firmaCol1 + 3, firmaY + 8);
        firmaY += firmaRowH;

        // FAALİYETİN TÜRÜ
        doc.setFont('Roboto', 'bold');
        doc.rect(margin, firmaY, firmaCol1, firmaRowH * 2);
        doc.text('FAALİYETİN', margin + 5, firmaY + 8);
        doc.text('TÜRÜ', margin + 5, firmaY + 16);
        doc.setFont('Roboto', 'normal');
        doc.rect(margin + firmaCol1, firmaY, firmaCol2, firmaRowH * 2);
        firmaY += firmaRowH * 2;

        // EK-8 TAHLİYE VE ÇIKIŞ PLANI
        firmaY += 20;
        // Sayfa genişliğini alıyoruz
        const sayfaGenisligi = doc.internal.pageSize.getWidth();
        doc.setFont('Roboto', 'bold');
        doc.setFontSize(10);
        doc.text('EK-8 TAHLİYE VE ÇIKIŞ PLANI', sayfaGenisligi / 2, firmaY, { align: 'center' });

        firmaY += 8;
        // Büyük boş kutu (alt boşluk için kısaltıldı)
        doc.rect(margin, firmaY, pageWidth - 2 * margin, 100);

        // Footer
        drawFooter(currentPage, totalPages);

        // ========== 21. SAYFA: DEĞİŞME VE DÜZELTMELER ==========
        doc.addPage();
        currentPage++;
        drawHeader();

        // Başlık
        doc.setFontSize(10);
        doc.setFont('Roboto', 'bold');
        doc.text('DEĞİŞME VE DÜZELTMELER', sayfaGenisligi2 / 2, 38, { align: 'center' });

        // Değişme ve Düzeltmeler Tablosu
        let degismeY = 48;
        const degismeRowH = 15; // Daha kısa satırlar
        const siraNoW = 35;
        const konuW = 55;
        const yapanW = 55;
        const tarihW = 35;

        // Tablo başlığı - ortalanmış
        doc.setFontSize(7);
        doc.setFont('Roboto', 'bold');
        doc.rect(margin, degismeY, siraNoW, degismeRowH);
        doc.rect(margin + siraNoW, degismeY, konuW, degismeRowH);
        doc.rect(margin + siraNoW + konuW, degismeY, yapanW, degismeRowH);
        doc.rect(margin + siraNoW + konuW + yapanW, degismeY, tarihW, degismeRowH);

        doc.text('SIRA NO', margin + siraNoW / 2, degismeY + 9, { align: 'center' });
        doc.text('DEĞİŞME/DÜZELTME KONUSU', margin + siraNoW + konuW / 2, degismeY + 9, { align: 'center' });
        doc.text('DEĞİŞME/DÜZELTMEYİ YAPAN', margin + siraNoW + konuW + yapanW / 2, degismeY + 9, { align: 'center' });
        doc.text('TARİH', margin + siraNoW + konuW + yapanW + tarihW / 2, degismeY + 9, { align: 'center' });

        degismeY += degismeRowH;

        // İlk satır - İLK YAYIN - ortalanmış
        doc.setFont('Roboto', 'normal');
        doc.rect(margin, degismeY, siraNoW, degismeRowH);
        doc.rect(margin + siraNoW, degismeY, konuW, degismeRowH);
        doc.rect(margin + siraNoW + konuW, degismeY, yapanW, degismeRowH);
        doc.rect(margin + siraNoW + konuW + yapanW, degismeY, tarihW, degismeRowH);

        doc.text('01', margin + siraNoW / 2, degismeY + 9, { align: 'center' });
        doc.text('İLK YAYIN', margin + siraNoW + konuW / 2, degismeY + 9, { align: 'center' });
        doc.text(isgUzmani || '', margin + siraNoW + konuW + yapanW / 2, degismeY + 9, { align: 'center' });
        doc.text(reportDate || '', margin + siraNoW + konuW + yapanW + tarihW / 2, degismeY + 9, { align: 'center' });

        degismeY += degismeRowH;

        // Boş satırlar (5 adet)
        for (let i = 0; i < 5; i++) {
            doc.rect(margin, degismeY, siraNoW, degismeRowH);
            doc.rect(margin + siraNoW, degismeY, konuW, degismeRowH);
            doc.rect(margin + siraNoW + konuW, degismeY, yapanW, degismeRowH);
            doc.rect(margin + siraNoW + konuW + yapanW, degismeY, tarihW, degismeRowH);
            degismeY += degismeRowH;
        }

        // Onay metni
        degismeY += 20;
        doc.setFont('Roboto', 'bold');
        doc.setFontSize(10);
        doc.text(companyName || '[FİRMA ADI]', margin, degismeY);

        degismeY += 10;
        doc.setFont('Roboto', 'normal');
        doc.setFontSize(9);
        const onayMetni = 'FİRMASI İÇİN HAZIRLANMIŞ OLAN BU ACİL DURUM PLANI 21 SAYFADAN OLUŞMAKTADIR. DOKÜMANI OKUDUĞUMU VE KABUL ETTİĞİMİ BEYAN EDERİM.';
        const onayLines = doc.splitTextToSize(onayMetni, pageWidth - 2 * margin);
        doc.text(onayLines, margin, degismeY);

        // Son sayfa footer
        drawFooter(currentPage, totalPages);

        // Eski DOCX içeriği - devre dışı
        /*
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
                // Ana başlık
                if (!line.includes('GİRİŞ') && !line.includes('1.   GİRİŞ')) { // 1. GİRİŞ hariç boşluk ekle
                    y += 5;
                }
                doc.setFontSize(10);
                doc.setFont('Roboto', 'bold');
            } else if (isSubHeading) {
                // Sadece 1.1., 2.1. ve 3.1. başlıkları için boşluk ekleme
                const noSpaceHeadings = line.startsWith('1.1.') ||
                    line.startsWith('2.1.') ||
                    line.startsWith('3.1.');
                if (noSpaceHeadings) {
                    // Bu başlıkları üstteki ana başlığa yaklaştır
                    y -= 2;
                } else {
                    y += 4;
                }
                doc.setFontSize(9);
                doc.setFont('Roboto', 'bold');
            } else if (isSubSubHeading) {
                // Alt-alt başlık (3.2.1 gibi) - indent ve kalın
                doc.setFontSize(8);
                doc.setFont('Roboto', 'bold');
            } else {
                doc.setFontSize(8);
                doc.setFont('Roboto', 'normal');
            }

            // Madde isareti ve alt-alt başlık için indent
            let indent = 0;
            if (line.startsWith('•') || line.startsWith('-') || line.startsWith('·')) {
                indent = 5;
            } else if (isSubSubHeading) {
                indent = 8;  // Alt-alt başlıkları sağa kaydır
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
        */

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
