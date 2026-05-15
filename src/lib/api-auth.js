import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";

/**
 * Verify that the request comes from an authenticated admin.
 * Checks both JWT validity AND database state (is_active, banned, role).
 * Returns the session payload if valid, or a 401 NextResponse if not.
 * Usage: const session = await requireAdmin(request); if (session instanceof NextResponse) return session;
 */
export async function requireAdmin(request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

/**
 * Verify that the request comes from an authenticated user (any role).
 * Checks both JWT validity AND database state (is_active, banned).
 * Returns the session payload if valid, or a 401 NextResponse if not.
 */
export async function requireAuth(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}
