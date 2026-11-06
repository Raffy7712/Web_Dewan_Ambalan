import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/request-ip";
import { rateLimitConsume, rateLimitMessage } from "@/lib/rate-limit";

const RATE_MAX = 60;
const RATE_WINDOW = 60 * 1000; // 1 menit

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

// prisma camelCase -> respons snake_case (kontrak frontend)
function publicItem(row) {
  return {
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
  };
}

function isExpired(jenis, tanggalKadaluarsa) {
  if (jenis !== "voucher" && jenis !== "surat") return false;
  if (!tanggalKadaluarsa) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(tanggalKadaluarsa);
  exp.setHours(0, 0, 0, 0);
  return exp < today;
}

async function resolveDocument({ kode, nomor, jenis }) {
  if (kode) {
    return prisma.document.findUnique({ where: { kode } });
  }
  if (nomor && jenis) {
    return prisma.document.findFirst({ where: { nomor, jenis } });
  }
  return null;
}

async function verify({ kode, nomor, jenis }, request) {
  // Rate limit per IP
  const ip = await getClientIp();
  const r = rateLimitConsume(`verify:${ip}`, RATE_MAX, RATE_WINDOW);
  if (!r.ok) {
    return json(
      { ok: false, error: rateLimitMessage(r.retryAfterMs), valid: false },
      429,
    );
  }

  const data = await resolveDocument({ kode, nomor, jenis });

  if (!data) {
    return json({ ok: false, valid: false, message: "Dokumen tidak ditemukan" }, 404);
  }

  const revoked = data.status === "revoked";
  const expired = isExpired(data.jenis, data.tanggalKadaluarsa);
  const valid = !revoked && !expired;

  let message = "Dokumen valid";
  if (revoked) message = "Dokumen telah dibatalkan (revoked)";
  else if (expired) message = "Dokumen sudah kadaluarsa";

  // Catat scan (best-effort, jangan gagalkan respon)
  try {
    await prisma.verificationScan.create({
      data: {
        documentId: data.id,
        ipAddress: ip,
        metadata: { kode: data.kode ?? null, jenis: data.jenis ?? null },
      },
    });
  } catch (e) {
    console.error("[/api/verification] scan log gagal:", e);
  }

  return json({
    ok: true,
    valid,
    message,
    type: data.jenis,
    jitem: publicItem(data),
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const kode = searchParams.get("kode");
    const nomor = searchParams.get("nomor");
    const jenis = searchParams.get("jenis");

    if (!kode && !(nomor && jenis)) {
      return json(
        { ok: false, error: "Parameter kode atau (nomor + jenis) diperlukan" },
        400,
      );
    }
    return await verify({ kode, nomor, jenis }, request);
  } catch (error) {
    console.error("[/api/verification GET]", error);
    return json({ ok: false, error: "Internal server error", detail: error?.message || String(error) }, 500);
  }
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid request body" }, 400);
    }

    const { kode, nomor, jenis } = body ?? {};
    if (!kode && !(nomor && jenis)) {
      return json(
        { ok: false, error: "Field kode atau (nomor + jenis) diperlukan" },
        400,
      );
    }
    return await verify({ kode, nomor, jenis }, request);
  } catch (error) {
    console.error("[/api/verification POST]", error);
    return json({ ok: false, error: "Internal server error", detail: error?.message || String(error) }, 500);
  }
}
