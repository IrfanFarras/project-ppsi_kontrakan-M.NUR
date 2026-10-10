import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Next.js 16: konvensi `middleware` di-rename menjadi `proxy`.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    // Verifikasi (decrypt) session NextAuth, bukan sekadar cek keberadaan cookie.
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const isValid =
      !!token &&
      token.role === "OWNER" &&
      !!token.accessToken &&
      token.accessTokenExpires > Date.now();

    if (!isValid) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
