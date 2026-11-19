import { NextRequest, NextResponse } from "next/server";
import { TABLE_COOKIE_NAME, verifyTableToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const cookieToken = request.cookies.get(TABLE_COOKIE_NAME)?.value;
  const verified = await verifyTableToken(cookieToken);

  if (!verified) {
    return NextResponse.json({
      tableId: null,
      tableNumber: null,
      verified: false,
    });
  }

  return NextResponse.json({
    tableId: verified.tableId,
    tableNumber: verified.tableNumber,
    verified: true,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { token?: string };
    const verified = await verifyTableToken(body.token);

    if (!verified || !body.token) {
      return NextResponse.json(
        { error: "Invalid or expired table QR token" },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      tableId: verified.tableId,
      tableNumber: verified.tableNumber,
      verified: true,
    });

    response.cookies.set(TABLE_COOKIE_NAME, body.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Failed to verify table token" },
      { status: 500 }
    );
  }
}
