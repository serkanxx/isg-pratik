import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    // PrismaAdapter kaldırıldı - JWT session ile çalışıyoruz
    providers: [
        // Google ile giriş
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        // Email/Şifre ile giriş
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Şifre", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email ve şifre gerekli");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.password) {
                    throw new Error("Kullanıcı bulunamadı");
                }

                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) {
                    throw new Error("Şifre hatalı");
                }

                // Email doğrulaması kontrolü
                if (!user.emailVerified) {
                    throw new Error("EMAIL_NOT_VERIFIED");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            // Google OAuth için kullanıcı kontrolü
            if (account?.provider === "google") {
                try {
                    // Kullanıcı var mı kontrol et
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email || "" },
                    });

                    if (!existingUser && user.email) {
                        // Yeni kullanıcı oluştur
                        const trialEndsAt = new Date();
                        trialEndsAt.setMonth(trialEndsAt.getMonth() + 3);

                        await prisma.user.create({
                            data: {
                                email: user.email,
                                name: user.name || "",
                                image: user.image || "",
                                phoneVerified: true,
                                plan: "premium_trial",
                                trialEndsAt,
                            },
                        });
                    }
                    return true;
                } catch (error) {
                    console.error("Google signIn error:", error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            // Kullanıcı bilgilerini token'a ekle
            if (token.email) {
                // HARDCODED ADMIN CHECK
                if (token.email === 'serkanxx@gmail.com') {
                    token.role = 'ADMIN';
                } else {
                    const dbUser = await prisma.user.findUnique({
                        where: { email: token.email },
                        select: { id: true, plan: true, trialEndsAt: true, role: true },
                    });
                    if (dbUser) {
                        token.id = dbUser.id;
                        token.plan = dbUser.plan;
                        token.trialEndsAt = dbUser.trialEndsAt;
                        token.role = dbUser.role;
                    }
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).plan = token.plan;
                (session.user as any).trialEndsAt = token.trialEndsAt;
                (session.user as any).role = token.role;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
