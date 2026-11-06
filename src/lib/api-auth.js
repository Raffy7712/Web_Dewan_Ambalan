import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";

/**
 * Verify that the request comes from an authenticated admin.
 * Cross-checks DB state (is_active, banned via getCurrentUser) AND role.
 * Returns the user if valid, or a 401 NextResponse if not.
 * Usage: const session = await requireAdmin(request); if (session instanceof NextResponse) return session;
 */
export async function requireAdmin(request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

/**
 * Verify that the request comes from an authenticated user (any role).
 * Cross-checks DB state (is_active, banned via getCurrentUser).
 * Returns the user if valid, or a 401 NextResponse if not.
 */
export async function requireAuth(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}
