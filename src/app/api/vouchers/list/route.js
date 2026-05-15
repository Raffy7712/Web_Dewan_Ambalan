import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-auth";

// GET /api/vouchers/list - list all vouchers with filters (admin only)
export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50"), 1), 200);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);

    const db = createAdminClient();
    let query = db
      .from("vouchers")
      .select("id, code, title, description, status, expires_at, created_at", { count: "exact" });

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      const escaped = search.replace(/%/g, "\\%").replace(/_/g, "\\_");
      query = query.or(`code.ilike.%${escaped}%,title.ilike.%${escaped}%`);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching vouchers:", error);
      return NextResponse.json(
        { error: "Failed to fetch vouchers" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      items: data || [],
      pagination: { total: count || 0, limit, offset },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
