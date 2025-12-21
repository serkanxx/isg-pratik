import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = request.nextUrl;

    // Giriş yapmış kullanıcı giriş sayfasına gitmeye çalışırsa panele yönlendir
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
        if (token) {
            return NextResponse.redirect(new URL('/panel', request.url));
        }
    }

    // Panel rotaları koruması
    if (pathname.startsWith('/panel')) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Admin rotaları koruması
    if (pathname.startsWith('/admin')) {
        if (!token || token.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/panel', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/panel/:path*', '/admin/:path*', '/login', '/register'],
};
