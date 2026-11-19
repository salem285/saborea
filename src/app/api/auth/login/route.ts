import { NextRequest, NextResponse } from "next/server";
import { signStaffSession, STAFF_COOKIE_NAME, type StaffRole } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      role?: StaffRole;
      password?: string;
    };

    const role: StaffRole = body.role === "admin" ? "admin" : "cashier";
    const password = (body.password ?? "").trim();

    const expectedPassword =
      role === "admin"
        ? process.env.ADMIN_PASSWORD
        : process.env.CASHIER_PASSWORD;

    if (!expectedPassword || password !== expectedPassword) {
      return NextResponse.json(
        { error: "كلمة المرور غير صحيحة / Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await signStaffSession(role);
    const redirectTo = role === "admin" ? "/admin" : "/cashier";

    const response = NextResponse.json({
      ok: true,
      role,
      redirectTo,
    });

    response.cookies.set(STAFF_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ أثناء تسجيل الدخول" },
      { status: 500 }
    );
  }
}
