import { NextRequest, NextResponse } from 'next/server';

// Google Drive linkini indirme linkine çevir
function getDownloadUrl(originalLink: string, fileName?: string): { url: string; format: string } {
    try {
        // Google Drive open link formatı: https://drive.google.com/open?id=FILE_ID
        const openMatch = originalLink.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
        if (openMatch) {
            const fileId = openMatch[1];
            const fileExtension = fileName?.toLowerCase().split('.').pop() || '';

            // Eğer dosya adında uzantı yoksa veya doc/docx ise, Google Docs olabilir - DOCX export dene
            if (!fileExtension || fileExtension === 'docx' || fileExtension === 'doc') {
                // Google Docs export'u dene
                return {
                    url: `https://docs.google.com/document/d/${fileId}/export?format=docx`,
                    format: 'docx'
                };
            }

            // Diğer durumlarda normal download
            return {
                url: `https://drive.google.com/uc?export=download&id=${fileId}`,
                format: 'direct'
            };
        }

        // Google Docs formatı: https://docs.google.com/document/d/FILE_ID/edit
        const docMatch = originalLink.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
        if (docMatch) {
            const fileExtension = fileName?.toLowerCase().split('.').pop() || '';
            let format = 'docx'; // Varsayılan DOCX
            if (fileExtension === 'pdf') {
                format = 'pdf';
            } else if (fileExtension === 'odt') {
                format = 'odt';
            }
            return {
                url: `https://docs.google.com/document/d/${docMatch[1]}/export?format=${format}`,
                format: format
            };
        }

        // Google Sheets formatı: https://docs.google.com/spreadsheets/d/FILE_ID/edit
        const sheetMatch = originalLink.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
        if (sheetMatch) {
            return {
                url: `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/export?format=xlsx`,
                format: 'xlsx'
            };
        }

        // Google Slides formatı: https://docs.google.com/presentation/d/FILE_ID/edit
        const slidesMatch = originalLink.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
        if (slidesMatch) {
            return {
                url: `https://docs.google.com/presentation/d/${slidesMatch[1]}/export?format=pdf`,
                format: 'pdf'
            };
        }

        // Direkt drive link formatı: https://drive.google.com/file/d/FILE_ID/view
        const fileMatch = originalLink.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileMatch) {
            return {
                url: `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`,
                format: 'direct'
            };
        }

        return {
            url: originalLink,
            format: 'direct'
        };
    } catch (error) {
        console.error('Link dönüştürme hatası:', error);
        return {
            url: originalLink,
            format: 'direct'
        };
    }
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const fileUrl = searchParams.get('url');
        const fileName = searchParams.get('name') || 'download';

        if (!fileUrl) {
            return NextResponse.json({ error: 'URL parametresi gerekli' }, { status: 400 });
        }

        // Google Drive linkini indirme linkine çevir
        let { url: downloadUrl, format } = getDownloadUrl(fileUrl, fileName);

        try {
            // Dosyayı fetch et
            let response = await fetch(downloadUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': '*/*',
                },
                redirect: 'follow',
            });

            // Eğer format docx ise ve 404 dönerse, normal download'a geç
            if (!response.ok && format === 'docx' && fileUrl.includes('drive.google.com/open?id=')) {
                const fileIdMatch = fileUrl.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
                if (fileIdMatch && response.status === 404) {
                    // Normal download'ı dene
                    downloadUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
                    format = 'direct';
                    response = await fetch(downloadUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': '*/*',
                        },
                        redirect: 'follow',
                    });
                }
            }

            // Eğer hala başarısız olursa
            if (!response.ok) {
                console.warn(`Fetch failed for ${downloadUrl}, redirecting to original link: ${fileUrl}`);
                return NextResponse.redirect(fileUrl);
            }

            // Content-Type kontrolü
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('text/html')) {
                console.info(`Content-Type is text/html for ${downloadUrl}, redirecting to original link: ${fileUrl}`);
                return NextResponse.redirect(fileUrl);
            }

            // Dosya içeriğini al
            const arrayBuffer = await response.arrayBuffer();

            // İçeriğin HTML olup olmadığını kontrol et
            const text = new TextDecoder().decode(arrayBuffer.slice(0, 1000));
            const isHTML = text.trim().toLowerCase().startsWith('<!doctype html') ||
                text.trim().toLowerCase().startsWith('<html') ||
                text.trim().toLowerCase().includes('<html');

            // Eğer format docx ise ve HTML dönerse, normal download'a geç
            if (isHTML && format === 'docx' && fileUrl.includes('drive.google.com/open?id=')) {
                const fileIdMatch = fileUrl.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
                if (fileIdMatch) {
                    // Normal download'ı dene
                    const normalDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
                    const normalResponse = await fetch(normalDownloadUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': '*/*',
                        },
                        redirect: 'follow',
                    });

                    if (normalResponse.ok) {
                        const normalContentType = normalResponse.headers.get('content-type') || '';
                        if (!normalContentType.includes('text/html')) {
                            const normalArrayBuffer = await normalResponse.arrayBuffer();
                            const normalText = new TextDecoder().decode(normalArrayBuffer.slice(0, 1000));
                            if (!normalText.trim().toLowerCase().startsWith('<!doctype html') &&
                                !normalText.trim().toLowerCase().startsWith('<html')) {
                                // Normal download başarılı, bunu kullan
                                const normalBuffer = Buffer.from(normalArrayBuffer);

                                // Dosya adını ve formatını belirle
                                let finalFileName = fileName.replace(/\.[^/.]+$/, '') || fileName;
                                if (!finalFileName.toLowerCase().endsWith('.docx')) {
                                    finalFileName = `${finalFileName}.docx`;
                                }

                                return new NextResponse(normalBuffer, {
                                    headers: {
                                        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                        'Content-Disposition': `attachment; filename="${encodeURIComponent(finalFileName)}"; filename*=UTF-8''${encodeURIComponent(finalFileName)}`,
                                        'Content-Length': normalBuffer.length.toString(),
                                    },
                                });
                            }
                        }
                    }
                }
            }

            if (isHTML) {
                console.info(`Detected HTML content for ${downloadUrl}, redirecting to original link: ${fileUrl}`);
                return NextResponse.redirect(fileUrl);
            }

            const buffer = Buffer.from(arrayBuffer);

            // Format mapping
            const formatMimeTypes: Record<string, string> = {
                'pdf': 'application/pdf',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'odt': 'application/vnd.oasis.opendocument.text',
                'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'xls': 'application/vnd.ms-excel',
                'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'ppt': 'application/vnd.ms-powerpoint',
                'zip': 'application/zip',
                'rar': 'application/x-rar-compressed',
                'txt': 'text/plain',
            };

            // Dosya adını ve formatını belirle
            let finalFileName = fileName;
            let mimeType = 'application/octet-stream';

            // Dosya adından mevcut uzantıyı al
            const currentExtension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : '';

            // Eğer format belirlenmişse (docx, pdf, xlsx vs), dosya adına mutlaka ekle
            if (format !== 'direct' && format !== '' && formatMimeTypes[format]) {
                const baseName = fileName.replace(/\.[^/.]+$/, '') || fileName;
                // Dosya adına uzantı ekle (mevcut uzantıyı kontrol etmeden, mutlaka ekle)
                finalFileName = `${baseName}.${format}`;
                mimeType = formatMimeTypes[format];
            } else if (currentExtension) {
                // Format belirlenememişse, dosya adından uzantıya göre belirle
                const extensionMimeTypes: Record<string, string> = {
                    'pdf': 'application/pdf',
                    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'doc': 'application/msword',
                    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'xls': 'application/vnd.ms-excel',
                    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'ppt': 'application/vnd.ms-powerpoint',
                };
                mimeType = extensionMimeTypes[currentExtension] || mimeType;
            } else if (contentType && !contentType.includes('application/octet-stream') && !contentType.includes('text/html')) {
                // Uzantı yoksa, Content-Type'a göre belirle
                mimeType = contentType;
                const contentTypeToExtension: Record<string, string> = {
                    'application/pdf': 'pdf',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
                    'application/msword': 'doc',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
                    'application/vnd.ms-excel': 'xls',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
                };
                const ext = contentTypeToExtension[contentType];
                if (ext && !finalFileName.toLowerCase().endsWith(`.${ext}`)) {
                    finalFileName = `${finalFileName}.${ext}`;
                }
            }

            // Response oluştur
            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': mimeType,
                    'Content-Disposition': `attachment; filename="${encodeURIComponent(finalFileName)}"; filename*=UTF-8''${encodeURIComponent(finalFileName)}`,
                    'Content-Length': buffer.length.toString(),
                },
            });
        } catch (fetchError) {
            console.error('Fetch hatası:', fetchError);
            return NextResponse.redirect(fileUrl);
        }
    } catch (error) {
        console.error('İndirme hatası:', error);
        const fileUrl = request.nextUrl.searchParams.get('url');
        if (fileUrl) {
            return NextResponse.redirect(fileUrl);
        }
        return NextResponse.json({ error: 'İndirme hatası' }, { status: 500 });
    }
}
