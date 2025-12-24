import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    Header,
    Footer,
    PageNumber,
    VerticalAlign,
    ImageRun
} from 'docx';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { companyName, companyAddress, registrationNumber, reportDate, validityDate, employer, igu, doctor, support, documentNo } = body;

        // Sicil numarasını formatla
        const formatRegistrationNumber = (num: string) => {
            if (!num) return '';
            const cleanNum = num.replace(/\D/g, '');
            const match = cleanNum.match(/^(\d{1})(\d{4})(\d{2})(\d{2})(\d{7})(\d{3})(\d{2})(\d{2})(\d{3})$/);
            if (match) {
                return `${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]} ${match[6]} ${match[7]} ${match[8]} ${match[9]}`;
            }
            return num;
        };

        const formattedRegistrationNumber = registrationNumber ? formatRegistrationNumber(registrationNumber) : '';

        // İçerik paragraflarını oluştur
        const createH1 = (text: string): Paragraph => new Paragraph({
            children: [new TextRun({ text: text.replace(/\t/g, '    '), bold: true, size: 24 })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
        });

        const createH2 = (text: string): Paragraph => new Paragraph({
            children: [new TextRun({ text: text.replace(/\t/g, '    '), bold: true, size: 22 })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 }
        });

        const createH3 = (text: string): Paragraph => new Paragraph({
            children: [new TextRun({ text: text.replace(/\t/g, '    '), bold: true, size: 20 })],
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 }
        });

        const createParagraph = (text: string): Paragraph => new Paragraph({
            children: [new TextRun({ text, size: 20 })],
            spacing: { after: 120 },
            alignment: AlignmentType.JUSTIFIED
        });

        const createBullet = (text: string): Paragraph => new Paragraph({
            children: [new TextRun({ text: text.replace(/^[•-]\s*/, ''), size: 20 })],
            bullet: { level: 0 },
            spacing: { after: 80 }
        });

        // Border stili
        const cellBorder = {
            top: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
            bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
            left: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
            right: { style: BorderStyle.SINGLE, size: 8, color: '000000' }
        };

        // Kapak sayfası içeriği (üst bilgi olmadan)
        const coverPageContent = [
            // Üstte boşluk
            new Paragraph({ spacing: { before: 1200 } }),
            // Firma adı
            new Paragraph({
                children: [new TextRun({ text: companyName || '[FİRMA ADI]', bold: true, size: 44 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 }
            }),
            // Sicil numarası
            new Paragraph({
                children: [new TextRun({ text: formattedRegistrationNumber, size: 24 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 800 }
            }),
            // Ana başlık
            new Paragraph({
                children: [new TextRun({ text: 'ACİL DURUM EYLEM PLANI', bold: true, size: 52 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 1200 }
            }),
            // Hazırlayan / Onaylayan tablosu
            new Table({
                width: { size: 80, type: WidthType.PERCENTAGE },
                alignment: AlignmentType.CENTER,
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({
                                    children: [new TextRun({ text: 'HAZIRLAYAN', bold: true, size: 20, })],
                                    alignment: AlignmentType.CENTER
                                })],
                                width: { size: 50, type: WidthType.PERCENTAGE },
                                borders: cellBorder,
                                verticalAlign: VerticalAlign.CENTER
                            }),
                            new TableCell({
                                children: [new Paragraph({
                                    children: [new TextRun({ text: 'ONAYLAYAN', bold: true, size: 20, })],
                                    alignment: AlignmentType.CENTER
                                })],
                                width: { size: 50, type: WidthType.PERCENTAGE },
                                borders: cellBorder,
                                verticalAlign: VerticalAlign.CENTER
                            })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({ spacing: { before: 400 } }),
                                    new Paragraph({ spacing: { after: 400 } }),
                                    new Paragraph({ spacing: { after: 400 } }),
                                    new Paragraph({ spacing: { after: 400 } })
                                ],
                                borders: cellBorder
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph({ spacing: { before: 400 } }),
                                    new Paragraph({ spacing: { after: 400 } }),
                                    new Paragraph({ spacing: { after: 400 } }),
                                    new Paragraph({ spacing: { after: 400 } })
                                ],
                                borders: cellBorder
                            })
                        ]
                    })
                ]
            }),
            // Tarih tablosu öncesi boşluk
            new Paragraph({ spacing: { before: 1500 } }),
            // Tarih tablosu - ortalanmış
            new Table({
                width: { size: 80, type: WidthType.PERCENTAGE },
                alignment: AlignmentType.CENTER,
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({
                                    children: [new TextRun({ text: 'YAPILDIĞI TARİH', bold: true, size: 22 })],
                                    alignment: AlignmentType.CENTER,
                                    spacing: { before: 100, after: 100 }
                                })],
                                width: { size: 50, type: WidthType.PERCENTAGE },
                                borders: cellBorder,
                                verticalAlign: VerticalAlign.CENTER
                            }),
                            new TableCell({
                                children: [new Paragraph({
                                    children: [new TextRun({ text: reportDate || '', size: 22 })],
                                    alignment: AlignmentType.CENTER,
                                    spacing: { before: 100, after: 100 }
                                })],
                                width: { size: 50, type: WidthType.PERCENTAGE },
                                borders: cellBorder,
                                verticalAlign: VerticalAlign.CENTER
                            })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({
                                    children: [new TextRun({ text: 'GEÇERLİLİK TARİHİ', bold: true, size: 22 })],
                                    alignment: AlignmentType.CENTER,
                                    spacing: { before: 100, after: 100 }
                                })],
                                borders: cellBorder,
                                verticalAlign: VerticalAlign.CENTER
                            }),
                            new TableCell({
                                children: [new Paragraph({
                                    children: [new TextRun({ text: validityDate || '', size: 22 })],
                                    alignment: AlignmentType.CENTER,
                                    spacing: { before: 100, after: 100 }
                                })],
                                borders: cellBorder,
                                verticalAlign: VerticalAlign.CENTER
                            })
                        ]
                    })
                ]
            })
        ];

        // İçerik sayfaları için header tablosu
        const createContentHeader = () => new Header({
            children: [
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                // Logo kutusu (boş)
                                new TableCell({
                                    children: [new Paragraph({ alignment: AlignmentType.CENTER })],
                                    width: { size: 15, type: WidthType.PERCENTAGE },
                                    borders: cellBorder,
                                    verticalAlign: VerticalAlign.CENTER,
                                    rowSpan: 4
                                }),
                                // Firma adı
                                new TableCell({
                                    children: [new Paragraph({
                                        children: [new TextRun({ text: companyName || '', bold: true, size: 18 })],
                                        alignment: AlignmentType.CENTER
                                    })],
                                    width: { size: 55, type: WidthType.PERCENTAGE },
                                    borders: cellBorder,
                                    verticalAlign: VerticalAlign.CENTER,
                                    rowSpan: 4
                                }),
                                // Doküman No
                                new TableCell({
                                    children: [new Paragraph({
                                        children: [new TextRun({ text: 'Doküman No', bold: true, size: 16, })],
                                        alignment: AlignmentType.CENTER
                                    })],
                                    width: { size: 15, type: WidthType.PERCENTAGE },
                                    borders: cellBorder,
                                    verticalAlign: VerticalAlign.CENTER
                                }),
                                new TableCell({
                                    children: [new Paragraph({
                                        children: [new TextRun({ text: documentNo || '', size: 16 })],
                                        alignment: AlignmentType.CENTER
                                    })],
                                    width: { size: 15, type: WidthType.PERCENTAGE },
                                    borders: cellBorder,
                                    verticalAlign: VerticalAlign.CENTER
                                })
                            ]
                        }),
                        new TableRow({
                            children: [
                                // Yayın Tarihi
                                new TableCell({
                                    children: [new Paragraph({
                                        children: [new TextRun({ text: 'Yayın Tarihi', bold: true, size: 16, })],
                                        alignment: AlignmentType.CENTER
                                    })],
                                    borders: cellBorder,
                                    verticalAlign: VerticalAlign.CENTER
                                }),
                                new TableCell({
                                    children: [new Paragraph({
                                        children: [new TextRun({ text: reportDate || '', size: 16 })],
                                        alignment: AlignmentType.CENTER
                                    })],
                                    borders: cellBorder,
                                    verticalAlign: VerticalAlign.CENTER
                                })
                            ]
                        }),
                        new TableRow({
                            children: [
                                // Revizyon Tarihi
                                new TableCell({
                                    children: [new Paragraph({
                                        children: [new TextRun({ text: 'Revizyon Tarihi', bold: true, size: 16, })],
                                        alignment: AlignmentType.CENTER
                                    })],
                                    borders: cellBorder,
                                    verticalAlign: VerticalAlign.CENTER
                                }),
                                new TableCell({
                                    children: [new Paragraph({
                                        children: [new TextRun({ text: '', size: 16 })],
                                        alignment: AlignmentType.CENTER
                                    })],
                                    borders: cellBorder,
                                    verticalAlign: VerticalAlign.CENTER
                                })
                            ]
                        }),
                        new TableRow({
                            children: [
                                // Revizyon No
                                new TableCell({
                                    children: [new Paragraph({
                                        children: [new TextRun({ text: 'Revizyon No', bold: true, size: 16, })],
                                        alignment: AlignmentType.CENTER
                                    })],
                                    borders: cellBorder,
                                    verticalAlign: VerticalAlign.CENTER
                                }),
                                new TableCell({
                                    children: [new Paragraph({
                                        children: [new TextRun({ text: '', size: 16 })],
                                        alignment: AlignmentType.CENTER
                                    })],
                                    borders: cellBorder,
                                    verticalAlign: VerticalAlign.CENTER
                                })
                            ]
                        })
                    ]
                })
            ]
        });

        // İçerik verileri
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
            { type: 'spacer', text: '' },
            { type: 'h2', text: '3.2.\tGÖREV YETKİ SORUMLULUKLAR' },
            { type: 'p', text: 'Acil durum ekibinde bulunan kişiler aynı zamanda mevzuatta destek elemanı olarak tanımlanırlar.' },
            { type: 'h3', text: '3.2.1\tAcil Durum Koordinatörü' },
            { type: 'p', text: 'Firma bünyesinde bulunan işyerlerindeki en üst sorumlu olup meydana gelebilecek tüm acil durumların yönetilmesinde ekip liderliği görevini üstlenerek görevli herkesten sorumlu olacaktır. Acil durum sırasında yapılacak her işlem onayından geçecektir.' },
            { type: 'p', text: 'Acil durum faaliyet ve hazırlıklarını koordine eder. Acil durum planında belirtilmiş acil durum uygulama prosedürlerini uygulamaya koyar, uygulama sırasında tespit edilen veya meydana gelen değişik durumlar karşısında uygulama yöntemlerini değiştirir.' },
            { type: 'p', text: `Gerekli araç gereçleri sağlar, bakım ve kontrolleri yapar/yaptırır. Acil durum koordinatörü ${employer || '........................................................'} 'dir.` },
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
            { type: 'spacer', text: '' },
            { type: 'h3', text: '3.2.5\tKurtarma Ekibi' },
            { type: 'bullet', text: '•\tHerhangi bir acil durumda, tehlike altındaki insanları ve diğer canlıları kurtarmaktır.' },
            { type: 'bullet', text: '•\tTehlike altında canlı bulunmaması durumunda malzemeleri öncelik sırasına göre kurtarır. (Öncelikle bilgisayarlar, sonra evraklar ve büro mobilyaları)' },
            { type: 'bullet', text: '•\tArama ekibi ile işbirliği içindedir.' },
            { type: 'h3', text: '3.2.6\tTahliye Ekibi' },
            { type: 'bullet', text: '•\tAcil durumlarda bölüm tahliye sorumluları acil duruma göre bölüm çalışanlarını acil çıkış kapılarına panik yapmadan dışarıya çıkışlarını organize eder.' },
            { type: 'bullet', text: '•\tTek bir kapıda yığılmanın olmaması için gerekirse diğer çıkış kapıları güvenli olup olmamasına bakarak diğer kapılara personeli yönlendirir ve kendisi de dışarı çıkar.' },
            { type: 'bullet', text: '•\tDışarı çıkan personelin Toplanma bölgesinde toplanmasını sağlar.' },
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
            { type: 'h2', text: '3.4.\tİLETİŞİM' },
            { type: 'p', text: 'Acil durumlarda, her türlü iletişim kanalı, acil durum maksatlı, kritik konular için kullanılacağından, zorunlu bir neden olmadıkça iletişim kanalları başka maksatla kullanılmamalıdır. Bu nedenle, acil durum sırasında, iletişim kanalları öncelikle destek elemanının ihtiyaçları için kullanılacaktır. Sabit telefonlarla tesis dışı iletişim zorunlu haller dışında yapılmayacaktır. Sabit telefon sisteminin çalışmaması durumunda, tesis dışı iletişim, öncelikle data hatları üzerinden bilgisayarlarla, bu da mümkün değilse cep telefonlarıyla sağlanacaktır.' },
            { type: 'h2', text: '3.5.\tAİLELERLE İLETİŞİM' },
            { type: 'p', text: 'Acil durum koordinatörü ve destek elemanı, ilk fırsatta personel aileleri ile temasa geçerek, acil durum hakkında bilgi verecek, aileleri hakkında öğrendiği bilgileri çalışanlara iletecektir. İletişim için öncelik sırası Acil durum koordinatörü tarafından saptanır. Ailelerin dışarıdan araması durumunda, aksine bir talimat verilmediği takdirde, telefonlar kişilere değil, Acil durum koordinatörüne bağlanacaktır.' },
            { type: 'h2', text: '3.6.\tDUYURULAR' },
            { type: 'p', text: 'Civarı etkileyen genel bir acil durum (afet) sözkonusu olduğu takdirde, Acil durum koordinatörü tarafından radyo ve televizyonları takip etmek üzere personel görevlendirilir ve konu hakkında gelişmeler izlenir. Acil durum sırasında, mümkün olan her fırsatta personele bilgi verilmelidir, aksi takdirde dedikodu ve yanlış duyumlar dolaşmaya başlar ki, bu durumu daha da kötüleştirir. Ne zaman ve ne kadar bilgi verileceğinin kararını, Acil durum koordinatörü verir.' },
            { type: 'h3', text: '3.6.1.\tALARM VE UYARILAR' },
            { type: 'p', text: 'Yangını ilk gören kişi:' },
            { type: 'p', text: '1) "Yangın, yangın, yangın" diye bağıracak,' },
            { type: 'p', text: '2) En yakın söndürücüyü alarak yangına ilk müdahaleye başlayacak,' },
            { type: 'p', text: '3) Yangın müdahale ekibi gelene kadar müdahaleye devam edecektir.' },
            { type: 'h2', text: '3.7.\tALARMIN VERİLMESİ' },
            { type: 'p', text: 'Yangın durumunda otomatik alarm sistemi devreye girer. Otomatik alarm sistemi devreye girmediği durumlarda ihbar butonuna basılarak yangın ihbarı verilir.' },
            { type: 'h2', text: '3.8.\tİNSAN HAYATI' },
            { type: 'p', text: 'Bir acil durumda, insan hayatı birinci önceliktir. Bu nedenle yapılacak herşey insan hayatını korumak içindir.' },
            { type: 'h1', text: '4.\tTAHLİYE' },
            { type: 'p', text: 'Tahliyenin amacı, düzenli ve emniyetli olarak işletmeyi boşaltmaktır. Bu maksatla mümkün olan en yakın emniyetli çıkış kullanılmalıdır. Tahliye sırasında ilave bir acil durum yaratmamak için mutlaka kurallara uyulmalıdır. Yangın durumunda, acil çıkış kapıları kullanılarak yangının çıktığı yönün ters tarafından çıkış ve merdivenlerden işletme tahliye edilmelidir.' },
            { type: 'p', text: 'Tahliye eden personel toplanma bölgesinden sayım yapılana kadar ayrılmayacaktır. Toplanma bölgesinde, ziyaretçilerin de sayımları yapılarak Acil durum koordinatörüne bilgi verilecektir.' },
            { type: 'h2', text: '4.1.\tTAHLİYE YOLLARI VE ÇIKIŞLAR' },
            { type: 'p', text: 'Alarm alındığında çalışanlar kapama planını uygulayarak işi emniyetli bir şekilde durdurup bırakarak aşağıda belirtilen toplanma noktasından yakın olanına giderler.' },
            { type: 'p', text: 'Tahliye yollarını ve acil çıkışları belirten tahliye planları personelin görebileceği yerlerde asılı bulundurulmalıdır.' },
            { type: 'h2', text: '4.2.\tTOPLANMA NOKTA/BÖLGELERİ VE MEVCUT ALMA/PERSONEL TESPİTİ' },
            { type: 'p', text: 'TOPLANMA NOKTASI :' },
            { type: 'p', text: 'Toplanma bölgesine gelen personel bir araya gelerek mevcutları alınacaktır. Mevcut alınırken tesise gelmiş olan ziyaretçi, satıcı, tedarikçi ilgili kişinin yanına giderek mevcuda kaydedilecektir.' },
            { type: 'p', text: 'Alınan mevcutlar, Koruma Ekibi tarafından birleştirip, kontrol edilerek, eksik personel Acil durum koordinatörüne bildirilir.' },
            { type: 'p', text: 'Mevcut alma işlemi, içeride personel kalıp kalmadığını anlamak için yapılmaktadır. Hatalı bir sonuç, ya bir veya birkaç kişinin hasar içinde unutulmasına, ya da içeride kaldığı sanılan birini müdahale ekibini tehlikeye atarak boşu boşuna aratmak, demektir. Bu işlem mümkün olduğu kadar kısa sürede yapılmalıdır.' },
            { type: 'h2', text: '4.3.\tEĞİTİM VE BİLGİ' },
            { type: 'p', text: 'Personele, acil durumlarda ne yapacağını bildiren eğitimler İş sağlığı ve güvenliği eğitimi kapsamında anlatılacaktır.' },
            { type: 'p', text: `Aşağıda açıklanan Acil durum eğitimleri, İş Güvenliği Uzmanı / ${igu || '........................................................... '} ve İşveren / İşveren Vekili ${employer || '..............................................'} tarafından koordine edilir.` },
            { type: 'h3', text: '4.3.1.\tOryantasyon Eğitimleri' },
            { type: 'p', text: 'Oryantasyon eğitimleri Acil Durum Planının anlatılması için yapılan toplu eğitimlerdir. Yeni işe başlayan personele ilk fırsatta, çalışan personele Acil Durum Planında değişiklik yapıldığında, acil durum oryantasyon eğitimi verilir.' },
            { type: 'h3', text: '4.3.2.\tYenileme Eğitimleri' },
            { type: 'p', text: 'Tazeleme eğitimleri daha önce öğrenilmiş olan bilgileri hatırlatmak için yapılan eğitimlerdir. Tüm personele her sene 1 kez veya ihtiyaç duyulduğunda hatırlatma amaçlı tazeleme eğitimi verilir. Bu eğitimler Acil Durum Ekipleri için 4 saat sürelidir.' },
            { type: 'h3', text: '4.3.3.\tMasabaşı Eğitimleri' },
            { type: 'p', text: 'Destek elemanı eğitimi, çeşitli faraziyelerle, hangi durumda ne tür reaksiyon göstereceklerinin tartışıldığı eğitimlerdir. Eğitim sonunda, eğitimin kritiği yapılır. ADYE üyeleri her yıl 1 kez masabaşı eğitimi yaparlar. Müdahale ekipleri, kendi aralarında toplanarak her yıl en az 1 kez masabaşı eğitimi yaparlar. Bu eğitim yenileme eğitiminin hemen sonrasından yapılır.' },
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
            { type: 'spacer', text: '' },
            { type: 'spacer', text: '' },
            { type: 'spacer', text: '' },
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
            { type: 'p', text: 'Acil durum sırasında hasar görmemesi, acil durumdan sonra kolay toparlanabilmek için bilgisayar sistemi, çelik kasalar içinde yedeklenmektedir.' },
            { type: 'p', text: 'Bilgisayar ortamında olmayan her tür kritik kayıt ya bilgisayar ortamına transfer edilip yedeklenecek, ya da bu mümkün değilse kopyaları (fotokopi, fotoğraf veya video) çıkarılarak yedeklenecektir.' },
            { type: 'h1', text: '6.\tHALKLA İLİŞKİLER' },
            { type: 'p', text: 'Bir acil durumda, her türlü halkla ilişkiler faaliyeti, destek elemanı tarafından kontrol ve koordine edilecektir. Acil durum koordinatöründe alınan kararlar ve hazırlanan bilgi dışında bir bilgi verilmeyecektir.' },
            { type: 'h2', text: '6.1.\tRESMİ KURULUŞLARLA İLİŞKİLER' },
            { type: 'p', text: 'Hangi acil durumda hangi resmi kurumun aranacağını gösterir liste ve aranan kuruma verilecek bilgiler "Ek-3 İletişim Bilgileri"nde yer almaktadır.' },
            { type: 'h2', text: '6.2.\tTOPLUMSAL HİZMETLER' },
            { type: 'p', text: 'Genel bir acil durumda öncelikle personel aileleri olmak üzere, çevre topluma destek verilecektir. Bu destek, üretim devam edebiliyorsa, üretimi kesintiye uğratmadan, üretim kesilmişse, toparlanma faaliyetlerine engel olmadan verilmelidir. Bu durum önceden öngörülebilecek bir durum olmadığından, ne şekilde destek verileceği destek elemanının yetki ve sorumluluğundadır.' },
            { type: 'p', text: 'Acil durumlarda verilebilecek destekler işletme imkanları da dikkate alınarak ulaşım, barındırma ve sıcak yemek de dahil olmak üzere ön hazırlık yapılması ve sayının belirlenmesi faydalı olacaktır.' },
            { type: 'h2', text: '6.3.\tTOPLUMU BİLGİLENDİRME' },
            { type: 'p', text: 'Tesis içinde ortaya çıkan bir acil durum, tesis sınırları dışına taşıyorsa; resmi makamlar, olayın yapısını, toplum sağlığı veya güvenliğinin tehlikede olup olmadığını, sorunu çözmek için ne yapıldığını ve bu durumun ortaya çıkmaması için neler yapılmış olduğunu öğrenmek isteyeceklerdir.' },
            { type: 'p', text: 'Bu nedenle, bir acil durumdan etkilenecekler ve bunların ihtiyaç duyacakları bilgi destek elemanı tarafından belirlenir ve Basın Sözcüsü tarafından açıklanır. Aşağıdaki liste bilgi verilecek kişilere örnektir:' },
            { type: 'bullet', text: '-\tÇevre halkı' },
            { type: 'bullet', text: '-\tBasın yayın kuruluşları' },
            { type: 'bullet', text: '-\tÇalışanlar ve emekliler' },
            { type: 'bullet', text: '-\tSendikalar' },
            { type: 'bullet', text: '-\tSatıcılar ve tedarikçiler' },
            { type: 'bullet', text: '-\tMüşteriler' },
            { type: 'bullet', text: '-\tOrtaklar' },
            { type: 'bullet', text: '-\tAcil durum müdahale organizasyonları' },
            { type: 'bullet', text: '-\tResmi makamlar' },
            { type: 'bullet', text: '-\tMülki amir ve belediye başkanı' },
            { type: 'bullet', text: '-\tÖzel ilgi gruplar' },
            { type: 'bullet', text: '-\tKomşu kuruluşlar' },
            { type: 'h1', text: '7.\tTOPARLANMA VE TEKRAR BAŞLAMA' },
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
            { type: 'bullet', text: '-\tEnkaz kaldırma faaliyetlerine başlanır. Hasarlı kısımlar hasar görmemiş kısımlardan ayrılır.' },
            { type: 'bullet', text: '-\tHasarlı malzemenin envanterini çıkarılır. Bu iş hasarlı malzemenin değeri saptamak içindir ve genellikle eksper veya eksperin görevlendireceği birinin gözetiminde yapılmalıdır.' },
            { type: 'bullet', text: '-\tHasarlı malzemenin değerlendirilmesi konusunda sigortayla görüştükten sonra karar verilir.' },
            { type: 'bullet', text: '-\tCihazlar, sistemler ve tesis tekrar çalıştırılmaya başlanır.' },
            { type: 'bullet', text: '-\tBüyük onarım ve restorasyon faaliyetlerine, resmi makamlarla ve sigorta şirketiyle görüştükten sonra başlanır.' },
            { type: 'bullet', text: '-\tHasarlı kısmın değeri çıkarılır, işin kesilmesinin verdiği zarar hesaplanır.' },
        ];

        // İçeriği paragraflar olarak dönüştür
        const contentParagraphs: (Paragraph | Table)[] = [];
        for (const item of pageContent) {
            switch (item.type) {
                case 'h1':
                    contentParagraphs.push(createH1(item.text));
                    break;
                case 'h2':
                    contentParagraphs.push(createH2(item.text));
                    break;
                case 'h3':
                    contentParagraphs.push(createH3(item.text));
                    break;
                case 'bullet':
                    contentParagraphs.push(createBullet(item.text));
                    break;
                case 'spacer':
                    contentParagraphs.push(new Paragraph({ spacing: { before: 200, after: 200 } }));
                    break;
                case 'p':
                default:
                    if (item.text) {
                        contentParagraphs.push(createParagraph(item.text));
                    }
                    break;
            }
        }

        // EK Sayfaları için resim ekleme fonksiyonu
        const createImageParagraph = (imagePath: string): Paragraph | null => {
            try {
                const fullPath = path.join(process.cwd(), 'public', imagePath);
                if (fs.existsSync(fullPath)) {
                    const imageData = fs.readFileSync(fullPath);
                    return new Paragraph({
                        children: [
                            new ImageRun({
                                data: imageData,
                                transformation: {
                                    width: 550,
                                    height: 700
                                },
                                type: 'png'
                            })
                        ],
                        alignment: AlignmentType.CENTER
                    });
                }
            } catch (error) {
                console.error(`Resim yüklenemedi: ${imagePath}`, error);
            }
            return null;
        };

        // 3.3. OLASI ACİL DURUMLAR VE RİSK DEĞERLENDİRMESİ Tablosu
        contentParagraphs.push(new Paragraph({ pageBreakBefore: true }));
        contentParagraphs.push(createH1('OLASI ACİL DURUMLAR ve RİSK DEĞERLENDİRMESİ'));

        // Risk tablosu verileri
        const riskData = [
            { no: '1.', risk: 'Deprem', olasilik: '1', insan: '5', tesis: '5', is: '5', cevre: '5', icKaynak: '2', disKaynak: '5', toplam: '28' },
            { no: '2.', risk: 'Yangın', olasilik: '2', insan: '3', tesis: '5', is: '5', cevre: '2', icKaynak: '5', disKaynak: '5', toplam: '27' },
            { no: '3.', risk: 'Bomba İhbarı, Patlaması', olasilik: '1', insan: '5', tesis: '3', is: '4', cevre: '2', icKaynak: '1', disKaynak: '5', toplam: '21' },
            { no: '4.', risk: 'Sel ve Ani Su Basması', olasilik: '1', insan: '2', tesis: '4', is: '4', cevre: '3', icKaynak: '2', disKaynak: '4', toplam: '20' },
            { no: '5.', risk: 'Şiddetli Rüzgar ve Fırtına', olasilik: '1', insan: '2', tesis: '4', is: '4', cevre: '3', icKaynak: '2', disKaynak: '4', toplam: '20' },
            { no: '6.', risk: 'Şüpheli Paket', olasilik: '1', insan: '5', tesis: '1', is: '4', cevre: '3', icKaynak: '1', disKaynak: '4', toplam: '19' },
            { no: '7.', risk: 'Terör Dışı Patlama', olasilik: '1', insan: '3', tesis: '3', is: '5', cevre: '2', icKaynak: '2', disKaynak: '3', toplam: '19' },
            { no: '8.', risk: 'Kar ve Don', olasilik: '2', insan: '2', tesis: '2', is: '3', cevre: '3', icKaynak: '2', disKaynak: '4', toplam: '18' },
            { no: '9.', risk: 'Zehirlenme', olasilik: '1', insan: '3', tesis: '3', is: '3', cevre: '1', icKaynak: '1', disKaynak: '5', toplam: '17' },
            { no: '10.', risk: 'İş Kazası', olasilik: '2', insan: '3', tesis: '3', is: '1', cevre: '3', icKaynak: '3', disKaynak: '3', toplam: '17' },
            { no: '11.', risk: 'Bulaşıcı Hastalıklar', olasilik: '1', insan: '3', tesis: '2', is: '3', cevre: '2', icKaynak: '1', disKaynak: '5', toplam: '17' },
            { no: '12.', risk: 'Kimyasal Kirlilik', olasilik: '1', insan: '2', tesis: '2', is: '2', cevre: '4', icKaynak: '3', disKaynak: '3', toplam: '15' },
            { no: '13.', risk: 'Toplu Kavga', olasilik: '1', insan: '3', tesis: '1', is: '2', cevre: '1', icKaynak: '2', disKaynak: '4', toplam: '14' },
            { no: '14.', risk: 'Trafik Kazası', olasilik: '1', insan: '3', tesis: '2', is: '2', cevre: '1', icKaynak: '1', disKaynak: '4', toplam: '14' },
            { no: '15.', risk: 'İntihar', olasilik: '1', insan: '3', tesis: '1', is: '3', cevre: '1', icKaynak: '1', disKaynak: '3', toplam: '13' },
            { no: '16.', risk: 'Ziyaretçi Hastalanması, Ölmesi', olasilik: '1', insan: '3', tesis: '1', is: '1', cevre: '1', icKaynak: '2', disKaynak: '4', toplam: '13' },
            { no: '17.', risk: 'Kemirgen', olasilik: '1', insan: '1', tesis: '2', is: '1', cevre: '2', icKaynak: '2', disKaynak: '4', toplam: '13' },
            { no: '18.', risk: 'Haşarat', olasilik: '1', insan: '1', tesis: '2', is: '1', cevre: '2', icKaynak: '2', disKaynak: '4', toplam: '13' },
            { no: '19.', risk: 'Hırsızlık', olasilik: '1', insan: '1', tesis: '1', is: '3', cevre: '1', icKaynak: '3', disKaynak: '3', toplam: '13' },
            { no: '20.', risk: 'GAZ PATLAMASI', olasilik: '1', insan: '5', tesis: '4', is: '5', cevre: '3', icKaynak: '2', disKaynak: '3', toplam: '23' },
        ];

        // Tablo başlık satırı
        const headerRow = new TableRow({
            height: { value: 600, rule: 'atLeast' as const },
            children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'SIRA NO', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 6, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'RİSKLER', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'MEYDANA GELME OLASILIĞI', bold: true, size: 16, })], alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'İnsan', bold: true, size: 16, })], alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Tesis', bold: true, size: 16, })], alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'İş', bold: true, size: 16, })], alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Çevre', bold: true, size: 16, })], alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'İç Kaynak', bold: true, size: 16, })], alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Dış Kaynak', bold: true, size: 16, })], alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'TOPLAM', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
            ]
        });

        // Veri satırları
        const dataRows = riskData.map(item => new TableRow({
            height: { value: 450, rule: 'atLeast' as const },
            children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.no, size: 18 })], alignment: AlignmentType.CENTER })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.risk, size: 18, })] })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.olasilik, size: 18, })], alignment: AlignmentType.CENTER })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.insan, size: 18, })], alignment: AlignmentType.CENTER })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.tesis, size: 18, })], alignment: AlignmentType.CENTER })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.is, size: 18, })], alignment: AlignmentType.CENTER })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.cevre, size: 18, })], alignment: AlignmentType.CENTER })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.icKaynak, size: 18 })], alignment: AlignmentType.CENTER })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.disKaynak, size: 18 })], alignment: AlignmentType.CENTER })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.toplam, size: 18, bold: true })], alignment: AlignmentType.CENTER })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
            ]
        }));

        // Tabloyu oluştur
        const riskTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows]
        });

        contentParagraphs.push(riskTable);

        // Açıklama notu
        contentParagraphs.push(new Paragraph({ spacing: { before: 200 } }));
        contentParagraphs.push(new Paragraph({
            children: [
                new TextRun({ text: '1', size: 18, color: '008000', bold: true }),
                new TextRun({ text: '                                                  ', size: 18 }),
                new TextRun({ text: '→', size: 18 }),
                new TextRun({ text: '                                                  ', size: 18 }),
                new TextRun({ text: '5', size: 18, color: 'CC0000', bold: true })
            ],
            alignment: AlignmentType.CENTER
        }));
        contentParagraphs.push(new Paragraph({
            children: [
                new TextRun({ text: 'En iyi', size: 18, color: '008000' }),
                new TextRun({ text: '                                                                                        ', size: 18 }),
                new TextRun({ text: 'En kötü', size: 18, color: 'CC0000' })
            ],
            alignment: AlignmentType.CENTER
        }));

        // EK-1: Yangın Müdahale Planı
        contentParagraphs.push(new Paragraph({ pageBreakBefore: true }));
        contentParagraphs.push(createH1('EK-1 ACİL DURUMLAR VE MÜDAHALE YÖNTEMLERİ'));
        contentParagraphs.push(createH2('1.   ACİL DURUM: YANGIN'));
        const yanginImg = createImageParagraph('yangin-mudahale-plani.png');
        if (yanginImg) contentParagraphs.push(yanginImg);

        // EK-2: Deprem Müdahale Planı
        contentParagraphs.push(new Paragraph({ pageBreakBefore: true }));
        contentParagraphs.push(createH2('2.   ACİL DURUM: DEPREM'));
        const depremImg = createImageParagraph('deprem-mudahale-plani.png');
        if (depremImg) contentParagraphs.push(depremImg);

        // EK-3: Sabotaj Müdahale Planı
        contentParagraphs.push(new Paragraph({ pageBreakBefore: true }));
        contentParagraphs.push(createH2('3.   ACİL DURUM: SABOTAJ'));
        const sabotajImg = createImageParagraph('sabotaj-mudahale-plani.png');
        if (sabotajImg) contentParagraphs.push(sabotajImg);

        // EK-4: İş Kazası Müdahale Planı
        contentParagraphs.push(new Paragraph({ pageBreakBefore: true }));
        contentParagraphs.push(createH2('4.   ACİL DURUM: İŞ KAZASI VE SAĞLIK OLAYLARI'));
        const isKazasiImg = createImageParagraph('is-kazasi-mudahale-plani.png');
        if (isKazasiImg) contentParagraphs.push(isKazasiImg);

        // EK-5: Kimyasal Dökülme
        contentParagraphs.push(new Paragraph({ pageBreakBefore: true }));
        contentParagraphs.push(createH2('5.   ACİL DURUM: KİMYASAL DÖKÜLME SIZINTI'));
        const kimyasalImg = createImageParagraph('kimyasal-dokulmesi-plani.png');
        if (kimyasalImg) contentParagraphs.push(kimyasalImg);

        // EK-6: Elektrik Çarpması
        contentParagraphs.push(new Paragraph({ pageBreakBefore: true }));
        contentParagraphs.push(createH2('6.   ACİL DURUM: ELEKTRİK ÇARPMASI'));
        const elektrikImg = createImageParagraph('elektrik-carpmasi-plani.png');
        if (elektrikImg) contentParagraphs.push(elektrikImg);

        // EK-7: Zehirlenme
        contentParagraphs.push(new Paragraph({ pageBreakBefore: true }));
        contentParagraphs.push(createH2('7.   ACİL DURUM: ZEHİRLENME'));
        const zehirlenmeImg = createImageParagraph('zehirlenme-plani.png');
        if (zehirlenmeImg) contentParagraphs.push(zehirlenmeImg);

        // EK-8: Patlama
        contentParagraphs.push(new Paragraph({ pageBreakBefore: true }));
        contentParagraphs.push(createH2('8.   ACİL DURUM: PATLAMA'));
        const patlamaImg = createImageParagraph('patlama-plani.png');
        if (patlamaImg) contentParagraphs.push(patlamaImg);

        // EK-2: ACİL İLETİŞİM LİSTESİ
        contentParagraphs.push(new Paragraph({ pageBreakBefore: true }));
        contentParagraphs.push(createH1('EK-2  ACİL İLETİŞİM LİSTESİ'));
        contentParagraphs.push(new Paragraph({ spacing: { before: 300 } }));
        contentParagraphs.push(createH2('1.   İÇ İLETİŞİM LİSTESİ'));
        contentParagraphs.push(new Paragraph({ spacing: { before: 200 } }));

        // İç İletişim Tablosu
        const icIletisimTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    height: { value: 400, rule: 'atLeast' as const },
                    children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })] })], width: { size: 25, type: WidthType.PERCENTAGE }, borders: cellBorder }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'İSİM SOYİSİM', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 40, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'İLETİŞİM BİLGİLERİ', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 35, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER })
                    ]
                }),
                new TableRow({
                    height: { value: 500, rule: 'atLeast' as const },
                    children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'İŞVEREN', bold: true, size: 18 })] })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })] })], borders: cellBorder }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })] })], borders: cellBorder })
                    ]
                }),
                new TableRow({
                    height: { value: 500, rule: 'atLeast' as const },
                    children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'İŞVEREN VEKİLİ', bold: true, size: 18 })] })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })] })], borders: cellBorder }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })] })], borders: cellBorder })
                    ]
                }),
                new TableRow({
                    height: { value: 500, rule: 'atLeast' as const },
                    children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'DESTEK ELEMANI', bold: true, size: 18 })] })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })] })], borders: cellBorder }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })] })], borders: cellBorder })
                    ]
                }),
                new TableRow({
                    height: { value: 500, rule: 'atLeast' as const },
                    children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })] })], borders: cellBorder }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })] })], borders: cellBorder }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })] })], borders: cellBorder })
                    ]
                })
            ]
        });
        contentParagraphs.push(icIletisimTable);

        contentParagraphs.push(new Paragraph({ spacing: { before: 600 } }));
        contentParagraphs.push(createH2('2.   DIŞ İLETİŞİM LİSTESİ'));
        contentParagraphs.push(new Paragraph({ spacing: { before: 200 } }));

        // Dış İletişim verileri
        const disIletisimData = [
            { birim: 'İTFAİYE', telefon: '110', adres: '' },
            { birim: 'AMBULANS İLKYARDIM', telefon: '112', adres: '' },
            { birim: 'POLİS', telefon: '112', adres: '' },
            { birim: 'JANDARMA', telefon: '156', adres: '' },
            { birim: 'DOĞALGAZ', telefon: '187', adres: '' },
            { birim: 'ELEKTRİK', telefon: '186', adres: '' },
            { birim: 'EN YAKIN HASTANE', telefon: '', adres: '' },
            { birim: 'ZEHİR DANIŞMA MERKEZİ', telefon: '114', adres: '' },
            { birim: 'ÇEVRE İL MÜDÜRLÜĞÜ', telefon: '', adres: '' }
        ];

        // Dış İletişim Tablosu
        const disIletisimRows = [
            new TableRow({
                height: { value: 400, rule: 'atLeast' as const },
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'BİRİM ADI', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 30, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'TELEFON', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ADRES-TELEFON BİLGİLERİ', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 50, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER })
                ]
            }),
            ...disIletisimData.map(item => new TableRow({
                height: { value: 450, rule: 'atLeast' as const },
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.birim, bold: true, size: 18 })] })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.telefon, size: 18 })], alignment: AlignmentType.CENTER })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.adres, size: 18 })] })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER })
                ]
            }))
        ];

        const disIletisimTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: disIletisimRows
        });
        contentParagraphs.push(disIletisimTable);

        // EK-4: FAALİYETLERE GÖRE KİŞİSEL KORUYUCU EKİPMAN LİSTESİ
        contentParagraphs.push(new Paragraph({ pageBreakBefore: true }));
        contentParagraphs.push(createH1('EK-4  FAALİYETLERE GÖRE KİŞİSEL KORUYUCU EKİPMAN LİSTESİ'));
        contentParagraphs.push(new Paragraph({ spacing: { before: 300 } }));

        // KKD Tablosu başlık sütunları
        const kkdColumns = ['', 'ELEKTRİK TAMİR', 'KAYNAK', 'KİMYASALLA ÇALIŞMA', 'MEKANİK TAMİR', 'ARITMA BÖLGESİ', 'YÜKLEME BOŞALTMA', 'TEMİZLİK', 'GÜVENLİK', 'TANK/SİLO GİRİŞ', 'YÜKSEKTE ÇALIŞMA'];

        // KKD verileri: [ekipman, elektrik, kaynak, kimyasal, mekanik, arıtma, yükleme, temizlik, güvenlik, tank, yüksek]
        const kkdData = [
            ['İŞ AYAKKABISI', '✓', '', '', '✓', '✓', '✓', '✓', '✓', '✓', '✓'],
            ['ELEKTRİKÇİ AYAKKABISI', '✓', '', '', '', '', '', '', '', '', ''],
            ['PVC ÇİZME', '✓', '', '', '✓', '✓', '', '', '', '', ''],
            ['ÇİZME - KİMYASAL', '', '✓', '', '', '', '', '', '', '', ''],
            ['TOZ MASKESİ', '✓', '', '', '', '', '', '', '', '', ''],
            ['KAYNAK MASKESİ', '', '✓', '', '', '', '', '', '', '', ''],
            ['GAZ MASKESİ', '', '✓', '✓', '', '', '', '', '', '', ''],
            ['KULAKLIK', '', '✓', '', '', '', '', '', '', '', ''],
            ['BARET', '', '', '', '', '', '', '', '', '', ''],
            ['GÖZLÜK', '', '', '', '', '', '', '', '', '', ''],
            ['İŞ ELBİSESİ', '', '✓', '', '', '', '', '', '', '', ''],
            ['KİMYASAL ELBİSESİ', '', '', '', '', '', '', '', '', '', ''],
            ['KAYNAKÇI ÖNLÜĞÜ', '', '✓', '', '', '', '', '', '', '', ''],
            ['EMNİYET KEMERİ', '', '', '', '', '', '', '', '', '', ''],
            ['ELDİVEN - KİMYASAL', '', '', '', '', '✓', '', '', '', '', ''],
            ['CAN YELEĞİ/SİMİDİ', '', '', '', '', '', '✓', '', '', '', ''],
            ['ELDİVEN - MONTAJ', '', '', '✓', '', '', '', '', '', '', ''],
            ['ELDİVEN - Y GERİLİM', '', '', '', '', '', '', '', '', '', ''],
            ['ELDİVEN - TEMİZLİK', '', '', '', '✓', '', '', '', '', '', ''],
            ['ELEKTRİKÇİ MASKESİ', '✓', '', '', '', '', '', '', '', '', ''],
            ['BEL KEMERİ', '', '', '', '', '✓', '', '', '', '', ''],
            ['TOPRAKLAMA/ISTAKASI', '✓', '', '', '', '', '', '', '', '', '']
        ];

        // KKD Tablo başlık satırı
        const kkdHeaderRow = new TableRow({
            height: { value: 680, rule: 'atLeast' as const },
            children: kkdColumns.map((col, index) => new TableCell({
                children: [new Paragraph({
                    children: [new TextRun({ text: col, bold: true, size: 14 })],
                    alignment: AlignmentType.CENTER
                })],
                width: { size: index === 0 ? 18 : 8, type: WidthType.PERCENTAGE },
                borders: cellBorder,
                verticalAlign: VerticalAlign.CENTER
            }))
        });

        // KKD veri satırları
        const kkdDataRows = kkdData.map(row => new TableRow({
            height: { value: 465, rule: 'atLeast' as const },
            children: row.map((cell, index) => new TableCell({
                children: [new Paragraph({
                    children: [new TextRun({ text: cell, size: 14, bold: index === 0 })],
                    alignment: index === 0 ? AlignmentType.LEFT : AlignmentType.CENTER
                })],
                borders: cellBorder,
                verticalAlign: VerticalAlign.CENTER
            }))
        }));

        const kkdTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [kkdHeaderRow, ...kkdDataRows]
        });
        contentParagraphs.push(kkdTable);

        // EK-6: DESTEK ELEMANI ATAMA YAZISI
        contentParagraphs.push(new Paragraph({ pageBreakBefore: true }));
        contentParagraphs.push(createH1('EK-6  DESTEK ELEMANI ATAMA YAZISI'));
        contentParagraphs.push(new Paragraph({ spacing: { before: 300 } }));

        // Açıklama paragrafı
        contentParagraphs.push(new Paragraph({
            children: [
                new TextRun({ text: companyName || '[FİRMA ADI]', bold: true, size: 20 }),
                new TextRun({ text: ' \'ne Arama, Kurtarma ve Tahliye, Yangınla mücadele görevlerini yerine getirmek üzere gerekli eğitimleri almış ve Acil Durumlar Hakkında Yönetmelik ve İlk Yardım Yönetmeliği\'ne göre; "Destek Elemanı" olarak atanmıştır.', size: 20 })
            ],
            spacing: { after: 400 },
            alignment: AlignmentType.JUSTIFIED
        }));

        contentParagraphs.push(new Paragraph({ spacing: { before: 200 } }));

        // Destek Elemanı Atama Tablosu
        const destekEkipleri = [
            'KURTARMA EKİBİ',
            'ARAMA VE TAHLİYE EKİBİ',
            'YANGIN İLE MÜCADELE EKİBİ',
            'İLK YARDIM EKİBİ'
        ];

        const destekAtamaRows = [
            new TableRow({
                height: { value: 500, rule: 'atLeast' as const },
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Ad / Soyad', bold: true, size: 20 })], alignment: AlignmentType.CENTER })], width: { size: 30, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Görevi ( Acil Durum Ekibi )', bold: true, size: 20 })], alignment: AlignmentType.CENTER })], width: { size: 40, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'İMZA', bold: true, size: 20 })], alignment: AlignmentType.CENTER })], width: { size: 30, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER })
                ]
            }),
            ...destekEkipleri.map(ekip => new TableRow({
                height: { value: 1200, rule: 'atLeast' as const },
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })] })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: ekip, bold: true, size: 18, })], alignment: AlignmentType.CENTER })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })] })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER })
                ]
            }))
        ];

        const destekAtamaTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: destekAtamaRows
        });
        contentParagraphs.push(destekAtamaTable);

        // EK-7: FİRMA BİLGİLERİ
        contentParagraphs.push(new Paragraph({ pageBreakBefore: true }));
        contentParagraphs.push(createH1('EK-7 FİRMA BİLGİLERİ'));
        contentParagraphs.push(new Paragraph({ spacing: { before: 300 } }));

        // Firma Bilgileri Tablosu
        const firmaBilgileriTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    height: { value: 800, rule: 'atLeast' as const },
                    children: [
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: 'İŞYERİNİN', bold: true, size: 22, })], alignment: AlignmentType.CENTER })],
                            width: { size: 25, type: WidthType.PERCENTAGE },
                            borders: cellBorder,
                            verticalAlign: VerticalAlign.CENTER,
                            rowSpan: 2
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({ children: [new TextRun({ text: companyName || '', bold: true, size: 20 })], alignment: AlignmentType.CENTER })
                            ],
                            width: { size: 75, type: WidthType.PERCENTAGE },
                            borders: cellBorder,
                            verticalAlign: VerticalAlign.CENTER
                        })
                    ]
                }),
                new TableRow({
                    height: { value: 600, rule: 'atLeast' as const },
                    children: [
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: companyAddress || '', size: 18 })], alignment: AlignmentType.CENTER })],
                            borders: cellBorder,
                            verticalAlign: VerticalAlign.CENTER
                        })
                    ]
                }),
                new TableRow({
                    height: { value: 600, rule: 'atLeast' as const },
                    children: [
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: 'İŞ GÜVENLİĞİ UZMANI', bold: true, size: 22, })], alignment: AlignmentType.CENTER })],
                            borders: cellBorder,
                            verticalAlign: VerticalAlign.CENTER
                        }),
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: igu || '', size: 18 })], alignment: AlignmentType.CENTER })],
                            borders: cellBorder,
                            verticalAlign: VerticalAlign.CENTER
                        })
                    ]
                }),
                new TableRow({
                    height: { value: 600, rule: 'atLeast' as const },
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({ children: [new TextRun({ text: 'FAALİYETİN', bold: true, size: 22, })], alignment: AlignmentType.CENTER }),
                                new Paragraph({ children: [new TextRun({ text: 'TÜRÜ', bold: true, size: 22, })], alignment: AlignmentType.CENTER })
                            ],
                            borders: cellBorder,
                            verticalAlign: VerticalAlign.CENTER
                        }),
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })], alignment: AlignmentType.CENTER })],
                            borders: cellBorder,
                            verticalAlign: VerticalAlign.CENTER
                        })
                    ]
                })
            ]
        });
        contentParagraphs.push(firmaBilgileriTable);

        // EK-8: TAHLİYE VE ÇIKIŞ PLANI
        contentParagraphs.push(new Paragraph({ spacing: { before: 800 } }));
        contentParagraphs.push(new Paragraph({
            children: [new TextRun({ text: 'EK-8 TAHLİYE VE ÇIKIŞ PLANI', bold: true, size: 26 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
        }));

        // Büyük boş kutu (Tahliye planı için)
        const tahliyePlanTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    height: { value: 8000, rule: 'atLeast' as const },
                    children: [
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })] })],
                            borders: cellBorder,
                            verticalAlign: VerticalAlign.CENTER
                        })
                    ]
                })
            ]
        });
        contentParagraphs.push(tahliyePlanTable);

        // DEĞİŞME VE DÜZELTMELER
        contentParagraphs.push(new Paragraph({ pageBreakBefore: true }));
        contentParagraphs.push(new Paragraph({
            children: [new TextRun({ text: 'DEĞİŞME VE DÜZELTMELER', bold: true, size: 28, })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        }));

        // Değişme ve Düzeltmeler Tablosu - 9 satır
        const degismeRows = [
            new TableRow({
                height: { value: 500, rule: 'atLeast' as const },
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'SIRA NO', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'DEĞİŞME/DÜZELTME KONUSU', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 35, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'DEĞİŞME/DÜZELTMEYİ YAPAN', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 30, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'TARİH', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE }, borders: cellBorder, verticalAlign: VerticalAlign.CENTER })
                ]
            }),
            // İlk satır - İLK YAYIN ve tarih
            new TableRow({
                height: { value: 600, rule: 'atLeast' as const },
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '01', size: 18, })], alignment: AlignmentType.CENTER })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'İLK YAYIN', bold: true, size: 18, })], alignment: AlignmentType.CENTER })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })], alignment: AlignmentType.CENTER })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: reportDate || '', size: 18 })], alignment: AlignmentType.CENTER })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER })
                ]
            }),
            // Boş satırlar (7 adet)
            ...Array(7).fill(null).map(() => new TableRow({
                height: { value: 600, rule: 'atLeast' as const },
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })], alignment: AlignmentType.CENTER })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })], alignment: AlignmentType.CENTER })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })], alignment: AlignmentType.CENTER })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })], alignment: AlignmentType.CENTER })], borders: cellBorder, verticalAlign: VerticalAlign.CENTER })
                ]
            }))
        ];

        const degismeDuzeltmeTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: degismeRows
        });
        contentParagraphs.push(degismeDuzeltmeTable);

        // Alt açıklama metni
        contentParagraphs.push(new Paragraph({ spacing: { before: 800 } }));
        contentParagraphs.push(new Paragraph({
            children: [new TextRun({ text: companyName || '[FİRMA ADI]', bold: true, size: 22, })],
            spacing: { after: 200 }
        }));
        contentParagraphs.push(new Paragraph({
            children: [new TextRun({ text: 'FİRMASI İÇİN HAZIRLANMIŞ OLAN BU ACİL DURUM PLANI 22 SAYFADAN OLUŞMAKTADIR. DOKÜMANI OKUDUĞUMU VE KABUL ETTİĞİMİ BEYAN EDERİM.', bold: true, size: 20, })],
            spacing: { after: 200 }
        }));

        // Word belgesini oluştur - 2 ayrı section
        const doc = new Document({
            styles: {
                default: {
                    document: {
                        run: {
                            font: "Calibri",
                            language: {
                                value: "tr-TR"
                            }
                        }
                    }
                }
            },
            sections: [
                // Kapak sayfası - Header/Footer yok, çift çerçeve border
                {
                    properties: {
                        page: {
                            margin: {
                                top: 720,
                                right: 720,
                                bottom: 720,
                                left: 720
                            },
                            borders: {
                                pageBorderTop: { style: BorderStyle.DOUBLE, size: 24, color: '000000', space: 24 },
                                pageBorderRight: { style: BorderStyle.DOUBLE, size: 24, color: '000000', space: 24 },
                                pageBorderBottom: { style: BorderStyle.DOUBLE, size: 24, color: '000000', space: 24 },
                                pageBorderLeft: { style: BorderStyle.DOUBLE, size: 24, color: '000000', space: 24 }
                            }
                        }
                    },
                    children: coverPageContent
                },
                // İçerik sayfaları - Header ile
                {
                    properties: {
                        page: {
                            margin: {
                                top: 1440, // Header için daha fazla boşluk
                                right: 720,
                                bottom: 720,
                                left: 720
                            }
                        }
                    },
                    headers: {
                        default: createContentHeader()
                    },
                    footers: {
                        default: new Footer({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: 'Sayfa ', size: 16 }),
                                        new TextRun({
                                            children: [PageNumber.CURRENT],
                                            size: 16
                                        })
                                    ],
                                    alignment: AlignmentType.RIGHT
                                })
                            ]
                        })
                    },
                    children: contentParagraphs
                }
            ]
        });

        // Word dosyasını buffer olarak oluştur
        const buffer = await Packer.toBuffer(doc);

        // Dosya adını oluştur
        const getFirstTwoWords = (name: string) => {
            const words = name.trim().split(/\s+/);
            return words.slice(0, 2).join(' ');
        };
        const sanitizeName = (name: string) => {
            return name
                .replace(/İ/g, 'I').replace(/ı/g, 'i')
                .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
                .replace(/Ü/g, 'U').replace(/ü/g, 'u')
                .replace(/Ş/g, 'S').replace(/ş/g, 's')
                .replace(/Ö/g, 'O').replace(/ö/g, 'o')
                .replace(/Ç/g, 'C').replace(/ç/g, 'c')
                .replace(/[^a-zA-Z0-9 -]/g, '');
        };
        const firstTwo = getFirstTwoWords(companyName || 'Firma');
        const safeFilename = sanitizeName(firstTwo);
        const filename = `${safeFilename} - Acil Durum Eylem Planı.docx`;

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
            }
        });

    } catch (error: any) {
        console.error('Word oluşturma hatası:', error);
        return NextResponse.json({ error: error.message || 'Word oluşturulurken hata oluştu' }, { status: 500 });
    }
}