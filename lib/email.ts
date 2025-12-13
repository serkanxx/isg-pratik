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
