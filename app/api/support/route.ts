import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const { name, email, phone, reason, message } = await request.json();

        // Validasyon
        if (!name || !email || !reason || !message) {
            return NextResponse.json(
                { error: "Lütfen tüm zorunlu alanları doldurunuz." },
                { status: 400 }
            );
        }

        // Email içeriği
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 20px; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">🎫 Yeni Destek Talebi</h1>
                </div>
                
                <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #4F46E5; width: 140px;">İsim Soyisim:</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #4F46E5;">E-Posta:</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">
                                <a href="mailto:${email}" style="color: #4F46E5;">${email}</a>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #4F46E5;">Telefon:</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${phone || "Belirtilmedi"}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #4F46E5;">İletişim Sebebi:</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="background: #4F46E5; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px;">${reason}</span>
                            </td>
                        </tr>
                    </table>
                    
                    <div style="margin-top: 20px;">
                        <h3 style="color: #4F46E5; margin-bottom: 10px;">📝 Mesaj:</h3>
                        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; color: #334155; white-space: pre-wrap;">
${message}
                        </div>
                    </div>
                </div>
                
                <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
                    Bu email İSG Pratik destek formu üzerinden gönderilmiştir.
                </p>
            </div>
        `;

        // Her iki adrese de email gönder
        const { error } = await resend.emails.send({
            from: "İSG Pratik Destek <noreply@isgpratik.com>",
            to: ["info@isgpratik.com.tr", "serkanxx@gmail.com"],
            replyTo: email,
            subject: `[Destek Talebi] ${reason} - ${name}`,
            html: emailHtml,
        });

        if (error) {
            console.error("Email gönderme hatası:", error);
            return NextResponse.json(
                { error: "Email gönderilemedi. Lütfen tekrar deneyin." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Destek talebiniz başarıyla gönderildi.",
        });
    } catch (error: any) {
        console.error("Support API error:", error);
        return NextResponse.json(
            { error: "Bir hata oluştu. Lütfen tekrar deneyin." },
            { status: 500 }
        );
    }
}
