import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// R2 S3 client oluştur
function getR2Client() {
    return new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
    });
}

export async function GET() {
    try {
        const bucketName = process.env.R2_BUCKET_NAME;
        const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

        if (!bucketName || !publicUrl) {
            return NextResponse.json(
                { error: 'R2 bucket yapılandırması eksik' },
                { status: 500 }
            );
        }

        const s3Client = getR2Client();
        const allFiles: any[] = [];
        let continuationToken: string | undefined = undefined;
        let isTruncated = true;

        // Tüm dosyaları pagination ile çek
        while (isTruncated) {
            const command = new ListObjectsV2Command({
                Bucket: bucketName,
                ContinuationToken: continuationToken,
                MaxKeys: 1000, // Her istekte maksimum 1000 dosya
            });

            const response = await s3Client.send(command);
            
            // Dosyaları filtrele ve ekle
            const files = (response.Contents || [])
                .filter(item => item.Key && !item.Key.endsWith('/')) // Klasörleri filtrele
                .map(item => ({
                    fileName: item.Key || '',
                    link: `${publicUrl}/${item.Key}`,
                    size: item.Size || 0,
                    lastModified: item.LastModified?.toISOString() || '',
                }));

            allFiles.push(...files);

            // Pagination kontrolü
            isTruncated = response.IsTruncated || false;
            continuationToken = response.NextContinuationToken;
        }

        console.log(`Toplam ${allFiles.length} dosya R2'den çekildi`);

        return NextResponse.json({ files: allFiles }, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            },
        });
    } catch (error: any) {
        console.error('R2 dosya listesi hatası:', error);
        return NextResponse.json(
            { error: 'Dosya listesi alınamadı', details: error.message },
            { status: 500 }
        );
    }
}

