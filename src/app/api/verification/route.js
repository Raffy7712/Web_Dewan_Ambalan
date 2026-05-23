import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

/* ── helper: safe JSON response ── */
function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

/* ── POST /api/verification — public verification ── */
export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid request body" }, 400);
    }

    const { code, nomor_sertifikat } = body;

    if ((!code && !nomor_sertifikat) || (code && typeof code !== "string") || (nomor_sertifikat && typeof nomor_sertifikat !== "string")) {
      return json({ error: "code atau nomor diperlukan" }, 400);
    }

    const db = createAdminClient();

    let item = null;
    let itemType = null;

    /* ── Cari berdasarkan nomor ── */
    if (nomor_sertifikat) {
      const { data, error } = await db
        .from("certificates")
        .select("id, kode, nomor, jenis_sertifikat, nama_penerima, penerbit, status, issue_date, keterangan")
        .eq("nomor", nomor_sertifikat)
        .maybeSingle();

      if (error) {
        return json({ error: "Query error", detail: error.message }, 500);
      }
      if (data) {
        item = data;
        itemType = "certificate";
      }
    } else {
      /* ── Cari voucher dulu berdasarkan code ── */
      const { data: vd, error: vErr } = await db
        .from("vouchers")
        .select("id, kode, judul, keterangan, status, kadaluarsa")
        .eq("kode", code)
        .maybeSingle();

      if (vErr) {
        return json({ error: "Query error", detail: vErr.message }, 500);
      }

      if (vd) {
        item = vd;
        itemType = "voucher";
      } else {
        /* ── Jika bukan voucher, cek certificate ── */
        const { data: cd, error: cErr } = await db
          .from("certificates")
          .select("id, kode, nomor, jenis_sertifikat, nama_penerima, penerbit, status, issue_date, keterangan")
          .eq("kode", code)
          .maybeSingle();

        if (cErr) {
          return json({ error: "Query error", detail: cErr.message }, 500);
        }
        if (cd) {
          item = cd;
          itemType = "certificate";
        }
      }
    }

    if (!item) {
      return json({ error: "Tidak ditemukan", valid: false }, 404);
    }

    /* ── Build response ── */
    const responseItem = {
      code: item.kode || "",
      title: item.judul || item.jenis_sertifikat || "",
      description: item.keterangan || null,
      status: item.status || "",
    };

    let valid = true;
    let message = "";

    if (itemType === "voucher") {
      if (item.status === "expired" || item.status === "used" || item.status === "revoked") {
        valid = false;
        message = item.status === "expired"
          ? "Voucher sudah expired"
          : item.status === "used"
            ? "Voucher sudah digunakan"
            : "Voucher telah dibatalkan";
      } else {
        message = "Voucher valid";
      }
      if (item.kadaluarsa) {
        responseItem.expires_at = item.kadaluarsa;
      }
    } else {
      if (item.status === "revoked") {
        valid = false;
        message = "Sertifikat telah dibatalkan";
      } else {
        message = "Sertifikat valid";
      }
      responseItem.nomor_sertifikat = item.nomor || null;
      responseItem.recipient_name = item.nama_penerima || "";
      responseItem.certificate_type = item.jenis_sertifikat || "";
      responseItem.dewan_ambalan = item.penerbit || null;
      responseItem.issue_date = item.issue_date || null;
    }

    return json({
      ok: true,
      valid,
      message,
      type: itemType,
      item: responseItem,
    });
  } catch (error) {
    console.error("[/api/verification POST]", error);
    return json(
      {
        error: "Internal server error",
        detail: error?.message || String(error),
      },
      500,
    );
  }
}

/* ── GET /api/verification?code=xxx — public verification via query param ── */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const nomor = searchParams.get("nomor_sertifikat");

    if (!code && !nomor) {
      return json({ error: "Parameter code atau nomor_sertifikat diperlukan" }, 400);
    }

    const db = createAdminClient();

    let item = null;
    let itemType = null;

    if (nomor) {
      const { data, error } = await db
        .from("certificates")
        .select("id, kode, nomor, jenis_sertifikat, nama_penerima, penerbit, status, issue_date, keterangan")
        .eq("nomor", nomor)
        .maybeSingle();

      if (error) {
        return json({ error: "Query error", detail: error.message }, 500);
      }
      if (data) {
        item = data;
        itemType = "certificate";
      }
    } else {
      /* ── Cari voucher dulu ── */
      const { data: vd, error: vErr } = await db
        .from("vouchers")
        .select("id, kode, judul, keterangan, status, kadaluarsa")
        .eq("kode", code)
        .maybeSingle();

      if (vErr) {
        return json({ error: "Query error", detail: vErr.message }, 500);
      }

      if (vd) {
        item = vd;
        itemType = "voucher";
      } else {
        /* ── Cek certificate ── */
        const { data: cd, error: cErr } = await db
          .from("certificates")
          .select("id, kode, nomor, jenis_sertifikat, nama_penerima, penerbit, status, issue_date, keterangan")
          .eq("kode", code)
          .maybeSingle();

        if (cErr) {
          return json({ error: "Query error", detail: cErr.message }, 500);
        }
        if (cd) {
          item = cd;
          itemType = "certificate";
        }
      }
    }

    if (!item) {
      return json({ error: "Tidak ditemukan", valid: false }, 404);
    }

    /* ── Build response ── */
    const responseItem = {
      code: item.kode || "",
      title: item.judul || item.jenis_sertifikat || "",
      description: item.keterangan || null,
      status: item.status || "",
    };

    let valid = true;
    let message = "";

    if (itemType === "voucher") {
      if (item.status === "expired" || item.status === "used" || item.status === "revoked") {
        valid = false;
        message = item.status === "expired"
          ? "Voucher sudah expired"
          : item.status === "used"
            ? "Voucher sudah digunakan"
            : "Voucher telah dibatalkan";
      } else {
        message = "Voucher valid";
      }
      if (item.kadaluarsa) {
        responseItem.expires_at = item.kadaluarsa;
      }
    } else {
      if (item.status === "revoked") {
        valid = false;
        message = "Sertifikat telah dibatalkan";
      } else {
        message = "Sertifikat valid";
      }
      responseItem.nomor_sertifikat = item.nomor || null;
      responseItem.recipient_name = item.nama_penerima || "";
      responseItem.certificate_type = item.jenis_sertifikat || "";
      responseItem.dewan_ambalan = item.penerbit || null;
      responseItem.issue_date = item.issue_date || null;
    }

    return json({
      ok: true,
      valid,
      message,
      type: itemType,
      item: responseItem,
    });
  } catch (error) {
    console.error("[/api/verification GET]", error);
    return json(
      {
        error: "Internal server error",
        detail: error?.message || String(error),
      },
      500,
    );
  }
}
