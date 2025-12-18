import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

    try {
        const { data, error } = await resend.emails.send({
            from: 'İSG Pratik <noreply@isgpratik.com>',
            to: email,
            subject: 'Email Adresinizi Doğrulayın - İSG Pratik',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #4F46E5; margin: 0;">İSG Pratik</h1>
                        <p style="color: #6B7280; margin-top: 5px;">Risk Yönetim Sistemi</p>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                        <h2 style="color: white; margin: 0 0 10px 0;">Hoş Geldiniz! 🎉</h2>
                        <p style="color: rgba(255,255,255,0.9); margin: 0;">Email adresinizi doğrulamak için aşağıdaki butona tıklayın.</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="display: inline-block; background: #4F46E5; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            Email Adresimi Doğrula
                        </a>
                    </div>
                    
                    <p style="color: #6B7280; font-size: 14px; text-align: center;">
                        Bu link 24 saat geçerlidir. Eğer bu kaydı siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;" />
                    
                    <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
                        Link çalışmıyorsa, bu adresi tarayıcınıza yapıştırın:<br/>
                        <a href="${verificationUrl}" style="color: #4F46E5; word-break: break-all;">${verificationUrl}</a>
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error('Email gönderme hatası:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Email gönderme hatası:', error);
        return { success: false, error };
    }
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    try {
        const { data, error } = await resend.emails.send({
            from: 'İSG Pratik <noreply@isgpratik.com>',
            to: email,
            subject: 'Şifre Sıfırlama - İSG Pratik',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #4F46E5; margin: 0;">İSG Pratik</h1>
                    </div>
                    
                    <h2 style="color: #1F2937;">Şifre Sıfırlama Talebi</h2>
                    <p style="color: #6B7280;">Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="display: inline-block; background: #4F46E5; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                            Şifremi Sıfırla
                        </a>
                    </div>
                    
                    <p style="color: #9CA3AF; font-size: 12px;">
                        Bu link 1 saat geçerlidir. Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error('Email gönderme hatası:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Email gönderme hatası:', error);
        return { success: false, error };
    }
}

// Yeni üyelik bildirimi emaili gönder
export async function sendNewUserNotificationEmail(userName: string, userEmail: string, userPhone: string | null) {
    const registrationDate = new Date().toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    try {
        const { data, error } = await resend.emails.send({
            from: 'İSG Pratik <noreply@isgpratik.com>',
            to: 'serkanxx@gmail.com',
            subject: `🎉 Yeni Üyelik - ${userName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 20px; border-radius: 12px 12px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Yeni Üyelik Bildirimi</h1>
                    </div>
                    
                    <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                        <p style="color: #1e293b; font-size: 16px; margin-bottom: 20px;">
                            İSG Pratik platformuna yeni bir kullanıcı kayıt oldu.
                        </p>
                        
                        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
                            <tr>
                                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #4F46E5; width: 140px; background: #f8fafc;">İsim:</td>
                                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${userName || 'Belirtilmemiş'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #4F46E5; background: #f8fafc;">E-Posta:</td>
                                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">
                                    <a href="mailto:${userEmail}" style="color: #4F46E5; text-decoration: none;">${userEmail}</a>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #4F46E5; background: #f8fafc;">Telefon:</td>
                                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${userPhone ? `+90${userPhone}` : 'Belirtilmemiş'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 15px; font-weight: bold; color: #4F46E5; background: #f8fafc;">Kayıt Tarihi:</td>
                                <td style="padding: 12px 15px; color: #1e293b;">${registrationDate}</td>
                            </tr>
                        </table>
                        
                        <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                            <p style="margin: 0; color: #92400e; font-size: 14px;">
                                <strong>Not:</strong> Bu email otomatik olarak gönderilmiştir. Kullanıcı henüz email adresini doğrulamamış olabilir.
                            </p>
                        </div>
                    </div>
                    
                    <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
                        Bu email İSG Pratik yeni üyelik bildirim sistemi tarafından gönderilmiştir.
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error('Yeni üyelik bildirimi email gönderme hatası:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Yeni üyelik bildirimi email gönderme hatası:', error);
        return { success: false, error };
    }
}
