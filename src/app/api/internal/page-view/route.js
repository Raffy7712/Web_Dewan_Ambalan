import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getClientIpFromHeaders } from "@/lib/request-ip";
import { consumePageViewIp, rateLimitMessage } from "@/lib/rate-limit";

const MAX_BODY_BYTES = 8192;

export async function POST(request) {
  const secret = process.env.INTERNAL_ANALYTICS_SECRET;
  if (!secret) {
    return new NextResponse(null, { status: 204 });
  }

  const cl = request.headers.get("content-length");
  if (cl && Number(cl) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const header = request.headers.get("x-da-internal");
  if (!header || header !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIpFromHeaders(request.headers);
  const rl = consumePageViewIp(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: rateLimitMessage(rl.retryAfterMs) },
      { status: 429 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const path =
    typeof body.path === "string"
      ? body.path.trim().slice(0, 512)
      : "";
  if (!path) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }

  try {
    const db = createAdminClient();
    const { error } = await db.from("page_view_logs").insert({ path });
    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ ok: false, message: "no table" }, { status: 503 });
      }
      console.error("page-view log:", error.message);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
