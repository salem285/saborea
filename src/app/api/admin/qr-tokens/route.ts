import { NextRequest, NextResponse } from "next/server";
import { signTableToken, STAFF_COOKIE_NAME, verifyStaffSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const staffToken = request.cookies.get(STAFF_COOKIE_NAME)?.value;
  const session = await verifyStaffSession(staffToken);

  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      tables?: Array<{ id: string; number: string }>;
    };
    const tables = body.tables ?? [];
    const tokens: Record<string, string> = {};

    await Promise.all(
      tables.map(async (tbl) => {
        tokens[tbl.id] = await signTableToken({
          tableId: tbl.id,
          tableNumber: tbl.number,
        });
      })
    );

    return NextResponse.json({ tokens });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate table tokens" },
      { status: 500 }
    );
  }
}
