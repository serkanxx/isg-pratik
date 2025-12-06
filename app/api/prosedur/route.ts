import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';

const docxFilePath = path.join(process.cwd(), 'RİSK DEĞERLENDİRME PROSEDÜRÜ.docx');

interface ProsedurRequest {
    title: string;
    address: string;
    registrationNumber: string;
    date: string;
    validityDate: string;
    revision: string;
    logo: string | null;
    employer: string;
    igu: string;
    doctor: string;
    representative: string;
    support: string;
}

export async function POST(request: Request) {
    try {
        const body: ProsedurRequest = await request.json();
        const {
            title,
            address,
            registrationNumber,
            date,
            validityDate,
            revision,
            logo,
            employer,
            igu,
            doctor,
            representative,
            support
        } = body;

        // DOCX dosyasını oku
        const docxBuffer = fs.readFileSync(docxFilePath);

        // Mammoth ile HTML'e çevir - tablolar ve formatları korur
        const result = await mammoth.convertToHtml({ buffer: docxBuffer });
        let html = result.value;

        // Placeholder'ları değiştir - Firma İsmi bold olarak
        const boldTitle = title ? `<strong>${title}</strong>` : '';
        html = html.replace(/\[FİRMA İSMİ\]/g, boldTitle);
        html = html.replace(/\[FİRMA ADRES\]/g, address || '');
        html = html.replace(/\[SGK SİCİL NO\]/g, registrationNumber || '');
        html = html.replace(/\[YAPILDIĞI TARİH\]/g, date || '');
        html = html.replace(/\[GEÇERLİLİK TARİHİ\]/g, validityDate || '');
        html = html.replace(/\[REVİZYON NO\/TARİH\]/g, revision || '');

        // Ekip bilgileri - boşsa orijinal metin kalsın
        if (employer) html = html.replace(/İŞVEREN \/ İŞVEREN VEKİLİ/g, employer);
        if (igu) html = html.replace(/İŞ GÜVENLİĞİ UZMANI/g, igu);
        if (doctor) html = html.replace(/İŞ YERİ HEKİMİ/g, doctor);
        if (representative) html = html.replace(/ÇALIŞAN TEMSİLCİSİ/g, representative);
        if (support) html = html.replace(/DESTEK ELEMANI/g, support);

        return NextResponse.json({
            html,
            title: title || '',
            logo: logo || null,
            messages: result.messages
        });
    } catch (error) {
        console.error("DOCX okuma hatası:", error);
        return NextResponse.json({ error: 'Failed to read DOCX file' }, { status: 500 });
    }
}
