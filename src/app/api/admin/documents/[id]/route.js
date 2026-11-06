import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { getClientIp } from "@/lib/request-ip";
import { rateLimitConsume, rateLimitMessage } from "@/lib/rate-limit";

const ADMIN_MUTATE_MAX = 30;
const ADMIN_MUTATE_WINDOW = 60 * 1000;

// field yang boleh diubah via PATCH (body pakai snake_case, dipetakan ke prisma)
const EDITABLE = ["judul", "nomor", "penerima", "penerbit", "keterangan", "tanggal_terbit", "tanggal_kadaluarsa", "status"];

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

// pemetaan snake_case -> camelCase prisma
const TO_PRISMA = {
  judul: "judul",
  nomor: "nomor",
  penerima: "penerima",
  penerbit: "penerbit",
  keterangan: "keterangan",
  tanggal_terbit: "tanggalTerbit",
  tanggal_kadaluarsa: "tanggalKadaluarsa",
  status: "status",
};

export async function PATCH(request, { params }) {
  const ip = await getClientIp();
  const rl = rateLimitConsume(`admin-mutate:${ip}`, ADMIN_MUTATE_MAX, ADMIN_MUTATE_WINDOW);
  if (!rl.ok) {
    return NextResponse.json({ error: rateLimitMessage(rl.retryAfterMs) }, { status: 429 });
  }
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid request body" }, 400);
    }

    const updates = {};
    for (const key of EDITABLE) {
      if (key in body && body[key] !== undefined) {
        updates[TO_PRISMA[key]] = body[key];
      }
    }
    if (updates.status !== undefined && !["issued", "revoked"].includes(updates.status)) {
      return json({ error: "status harus 'issued' atau 'revoked'" }, 400);
    }

    if (Object.keys(updates).length === 0) {
      return json({ error: "Tidak ada field yang diupdate" }, 400);
    }

    const data = await prisma.document.update({
      where: { id },
      data: updates,
    });

    return json({ ok: true, item: mapItem(data) });
  } catch (error) {
    console.error("[/api/admin/documents/[id] PATCH]", error);
    if (error?.code === "P2025") return json({ error: "Dokumen tidak ditemukan" }, 404);
    return json({ error: "Internal server error", detail: error?.message || String(error) }, 500);
  }
}

export async function DELETE(request, { params }) {
  const ip = await getClientIp();
  const rl = rateLimitConsume(`admin-mutate:${ip}`, ADMIN_MUTATE_MAX, ADMIN_MUTATE_WINDOW);
  if (!rl.ok) {
    return NextResponse.json({ error: rateLimitMessage(rl.retryAfterMs) }, { status: 429 });
  }
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    await prisma.document.delete({ where: { id } });
    return json({ ok: true });
  } catch (error) {
    console.error("[/api/admin/documents/[id] DELETE]", error);
    if (error?.code === "P2025") return json({ error: "Dokumen tidak ditemukan" }, 404);
    return json({ error: "Internal server error", detail: error?.message || String(error) }, 500);
  }
}
