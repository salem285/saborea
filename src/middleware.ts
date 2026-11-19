import { NextRequest, NextResponse } from "next/server";
import {
  STAFF_COOKIE_NAME,
  TABLE_COOKIE_NAME,
  verifyStaffSession,
  verifyTableToken,
} from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. Handle signed QR table token (?t=<signed_table_token>) on customer routes
  const qrToken = searchParams.get("t");
  if (qrToken && !pathname.startsWith("/admin") && !pathname.startsWith("/cashier") && !pathname.startsWith("/api")) {
    const verifiedTable = await verifyTableToken(qrToken);
    if (verifiedTable) {
      const cleanUrl = request.nextUrl.clone();
      cleanUrl.searchParams.delete("t");
      const response = NextResponse.redirect(cleanUrl);
      response.cookies.set(TABLE_COOKIE_NAME, qrToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 12, // 12 hours table dining session
      });
      return response;
    }
  }

  // 2. Protect /admin and /api/admin/* — Strictly Admin ONLY (Cashier is forbidden)
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = request.cookies.get(STAFF_COOKIE_NAME)?.value;
    const session = await verifyStaffSession(token);

    if (!session || session.role !== "admin") {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json(
          { error: "Forbidden: Admin session required." },
          { status: 403 }
        );
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("role", "admin");
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 3. Protect /cashier and /api/cashier/* — Cashier or Admin session required
  if (pathname.startsWith("/cashier") || pathname.startsWith("/api/cashier")) {
    const token = request.cookies.get(STAFF_COOKIE_NAME)?.value;
    const session = await verifyStaffSession(token);

    if (!session || (session.role !== "cashier" && session.role !== "admin")) {
      if (pathname.startsWith("/api/cashier")) {
        return NextResponse.json(
          { error: "Unauthorized: Staff session required." },
          { status: 401 }
        );
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("role", "cashier");
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/menu/:path*",
    "/order",
    "/admin/:path*",
    "/cashier/:path*",
    "/api/admin/:path*",
    "/api/cashier/:path*",
  ],
};
