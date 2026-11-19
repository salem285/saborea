import { SignJWT, jwtVerify } from "jose";

export type StaffRole = "admin" | "cashier";

export const STAFF_COOKIE_NAME = "saborea_session";
export const TABLE_COOKIE_NAME = "saborea_table_token";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not configured.");
  }
  return new TextEncoder().encode(secret);
}

export async function signStaffSession(role: StaffRole): Promise<string> {
  return new SignJWT({ role, type: "staff_session" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifyStaffSession(
  token: string | undefined
): Promise<{ role: StaffRole } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      payload.type === "staff_session" &&
      (payload.role === "admin" || payload.role === "cashier")
    ) {
      return { role: payload.role };
    }
    return null;
  } catch {
    return null;
  }
}

export interface TableTokenPayload {
  tableId: string;
  tableNumber: string;
}

export async function signTableToken(payload: TableTokenPayload): Promise<string> {
  return new SignJWT({
    tableId: payload.tableId,
    tableNumber: payload.tableNumber,
    type: "table_qr",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(getSecretKey());
}

export async function verifyTableToken(
  token: string | undefined
): Promise<TableTokenPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      payload.type === "table_qr" &&
      typeof payload.tableId === "string" &&
      typeof payload.tableNumber === "string"
    ) {
      return {
        tableId: payload.tableId,
        tableNumber: payload.tableNumber,
      };
    }
    return null;
  } catch {
    return null;
  }
}
