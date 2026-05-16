import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, ts: Date.now(), v: "2026-05-16-v4" });
}

export async function POST() {
  return NextResponse.json({ ok: true, ts: Date.now(), v: "2026-05-16-v4" });
}
