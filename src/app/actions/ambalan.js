"use server";

import { headers } from "next/headers";
import { getSession } from "./auth";
import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { isAmbalanRegistrationEnabled, getMasaBakti } from "@/lib/cms";
import { getStaffEmails } from "@/lib/queries";
import {
  sendNewAmbalanApplicationNotification,
  sendAmbalanReceivedEmail,
} from "@/lib/email";
import { consumeAmbalanUser, rateLimitMessage } from "@/lib/rate-limit";

export async function submitAmbalanApplicationAction(prevState, formData) {
  const session = await getSession();

  if (!(await isAmbalanRegistrationEnabled())) {
    return {
      error:
        "Pendaftaran seleksi calon pengurus sedang ditutup. Hubungi humas atau admin ambalan.",
    };
  }

  const { period_key: period } = await getMasaBakti();

  const full_name = formData.get("full_name")?.toString().trim() ?? "";
  const class_name = formData.get("class_name")?.toString().trim() ?? "";
  const phone = formData.get("phone")?.toString().trim() ?? "";
  const motivation = formData.get("motivation")?.toString().trim() ?? "";
  const experience = formData.get("experience")?.toString().trim() ?? "";

  if (!full_name || !class_name || !phone || !motivation) {
    return { error: "Nama, kelas, nomor WhatsApp, dan motivasi wajib diisi." };
  }
  if (!/^[0-9+\-\s()]{8,20}$/.test(phone)) {
    return { error: "Nomor WhatsApp tidak valid." };
  }
  if (motivation.length < 40) {
    return { error: "Motivasi minimal 40 karakter." };
  }
  if (motivation.length > 800 || experience.length > 800) {
    return { error: "Jawaban terlalu panjang. Maksimal 800 karakter." };
  }

  const accountId = session?.id ?? null;

  const headersList = await headers();
  const submitterIp =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    null;

  const existingName = await query(
    "SELECT id FROM ambalan_applications WHERE LOWER(full_name) = LOWER($1) AND period = $2 LIMIT 1",
    [full_name, period]
  );
  if (existingName.rows[0]) {
    return { error: "Nama sudah terdaftar. Gunakan nama lain atau hubungi admin." };
  }

  if (submitterIp) {
    const existingIp = await query(
      "SELECT id FROM ambalan_applications WHERE submitter_ip = $1 AND period = $2 LIMIT 1",
      [submitterIp, period]
    );
    if (existingIp.rows[0]) {
      return { error: "Perangkat ini sudah digunakan untuk mendaftar. Hubungi admin jika ada kendala." };
    }
  }

  if (session) {
    const ambR = consumeAmbalanUser(session.id);
    if (!ambR.ok) return { error: rateLimitMessage(ambR.retryAfterMs) };
  }

  let isFirstSubmit = true;

  if (accountId) {
    try {
      const existingResult = await query(
        "SELECT id FROM ambalan_applications WHERE account_id = $1 AND period = $2",
        [accountId, period]
      );
      isFirstSubmit = !existingResult.rows[0];
    } catch {
      // table might not exist yet
    }
  }

  try {
    if (accountId) {
      await query(
        `INSERT INTO ambalan_applications (account_id, full_name, class_name, phone, motivation, experience, period, status, updated_at, submitter_ip)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (account_id, period) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           class_name = EXCLUDED.class_name,
           phone = EXCLUDED.phone,
           motivation = EXCLUDED.motivation,
           experience = EXCLUDED.experience,
           status = EXCLUDED.status,
           updated_at = EXCLUDED.updated_at`,
        [accountId, full_name, class_name, phone, motivation, experience, period, "pending", new Date().toISOString(), submitterIp]
      );
    } else {
      await query(
        `INSERT INTO ambalan_applications (account_id, full_name, class_name, phone, motivation, experience, period, status, updated_at, submitter_ip)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [null, full_name, class_name, phone, motivation, experience, period, "pending", new Date().toISOString(), submitterIp]
      );
    }
  } catch (err) {
    if (err.code === "42P01") {
      return {
        error:
          "Tabel pendaftaran belum ada. Jalankan migration-v3.sql di Supabase dulu.",
      };
    }
    console.error("submitAmbalanApplicationAction:", err.message);
    return { error: "Gagal menyimpan pendaftaran. Coba lagi." };
  }

  if (isFirstSubmit) {
    getStaffEmails()
      .then((staff) =>
        sendNewAmbalanApplicationNotification(staff, {
          fullName: full_name,
          className: class_name,
          phone,
          period,
          motivationPreview:
            motivation.length > 220 ? `${motivation.slice(0, 220)}…` : motivation,
        }),
      )
      .catch(() => {});
  }

  if (isFirstSubmit && accountId) {
    try {
      const accResult = await query(
        "SELECT email, display_name FROM accounts WHERE id = $1",
        [accountId]
      );
      const acc = accResult.rows[0] ?? null;
      if (acc?.email) {
        sendAmbalanReceivedEmail(
          acc.email,
          acc.display_name ?? session.display_name ?? "Pengguna",
          period,
        ).catch(() => {});
      }
    } catch {
      // non-critical
    }
  }

  revalidatePath("/daftar-calon-dewan-ambalan");
  return { success: "Pendaftaran calon pengurus ambalan berhasil dikirim." };
}
