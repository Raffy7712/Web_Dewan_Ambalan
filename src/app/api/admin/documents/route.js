import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { getClientIp } from "@/lib/request-ip";
import { rateLimitConsume, rateLimitMessage } from "@/lib/rate-limit";

const ADMIN_MUTATE_MAX = 30;
const ADMIN_MUTATE_WINDOW = 60 * 1000;

const JENIS = ["sertifikat", "piagam", "surat", "voucher"];
const PREFIX = { sertifikat: "SRT", piagam: "PIG", surat: "SUR", voucher: "VCH" };
const PAGE_SIZE = 20;

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

// prisma camelCase -> respons snake_case (kontrak frontend)
function mapItem(row) {
  return {
    id: row.id,
    kode: row.kode,
    jenis: row.jenis,
    judul: row.judul,
    nomor: row.nomor ?? null,
    penerima: row.penerima ?? null,
    penerbit: row.penerbit ?? null,
    status: row.status,
    tanggal_terbit: row.tanggalTerbit ?? null,
    tanggal_kadaluarsa: row.tanggalKadaluarsa ?? null,
    keterangan: row.keterangan ?? null,
    created_at: row.createdAt ?? null,
    updated_at: row.updatedAt ?? null,
  };
}

function genCode(jenis) {
  const year = new Date().getFullYear();
  let s = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${PREFIX[jenis]}-${year}-${s}`;
}

async function uniqueCode(jenis) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const kode = genCode(jenis);
    const found = await prisma.document.findUnique({ where: { kode } });
    if (!found) return kode;
  }
  throw new Error("Gagal menghasilkan kode unik");
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const jenis = searchParams.get("jenis");
    const q = searchParams.get("q");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

    const where = {};
    if (jenis && JENIS.includes(jenis)) where.jenis = jenis;
    if (q) {
      const like = q;
      where.OR = [
        { judul: { contains: like, mode: "insensitive" } },
        { kode: { contains: like, mode: "insensitive" } },
        { nomor: { contains: like, mode: "insensitive" } },
        { penerima: { contains: like, mode: "insensitive" } },
      ];
    }

    const [data, count] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      prisma.document.count({ where }),
    ]);

    return json({
      items: (data ?? []).map(mapItem),
      page,
      pageSize: PAGE_SIZE,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
    });
  } catch (error) {
    console.error("[/api/admin/documents GET]", error);
    return json({ error: "Internal server error", detail: error?.message || String(error) }, 500);
  }
}

export async function POST(request) {
  const ip = await getClientIp();
  const rl = rateLimitConsume(`admin-mutate:${ip}`, ADMIN_MUTATE_MAX, ADMIN_MUTATE_WINDOW);
  if (!rl.ok) {
    return NextResponse.json({ error: rateLimitMessage(rl.retryAfterMs) }, { status: 429 });
  }
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid request body" }, 400);
    }

    const {
      jenis,
      judul,
      nomor,
      penerima,
      penerbit,
      keterangan,
      tanggal_terbit,
      tanggal_kadaluarsa,
    } = body ?? {};

    if (!jenis || !JENIS.includes(jenis)) {
      return json({ error: "jenis wajib dan harus salah satu dari: " + JENIS.join(", ") }, 400);
    }
    if (!judul || typeof judul !== "string" || !judul.trim()) {
      return json({ error: "judul wajib diisi" }, 400);
    }

    const kode = await uniqueCode(jenis);

    const data = await prisma.document.create({
      data: {
        kode,
        jenis: jenis,
        judul: judul.trim(),
        status: "issued",
        nomor: nomor ? String(nomor) : undefined,
        penerima: penerima ? String(penerima) : undefined,
        penerbit: penerbit ? String(penerbit) : undefined,
        keterangan: keterangan ? String(keterangan) : undefined,
        tanggalTerbit: tanggal_terbit || undefined,
        tanggalKadaluarsa: tanggal_kadaluarsa || undefined,
        createdBy: auth.id ?? null,
      },
    });

    return json({ ok: true, item: mapItem(data) }, 201);
  } catch (error) {
    console.error("[/api/admin/documents POST]", error);
    return json({ error: "Internal server error", detail: error?.message || String(error) }, 500);
  }
}

