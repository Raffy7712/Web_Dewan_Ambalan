"use server";

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
  if (!session) return { error: "Silakan login dulu untuk mendaftar." };

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

  const ambR = consumeAmbalanUser(session.id);
  if (!ambR.ok) return { error: rateLimitMessage(ambR.retryAfterMs) };

  let existing = null;
  try {
    const existingResult = await query(
      "SELECT id FROM ambalan_applications WHERE account_id = $1 AND period = $2",
      [session.id, period]
    );
    existing = existingResult.rows[0] ?? null;
  } catch (err) {
    if (err.code !== "42P01") {
      console.error("submitAmbalanApplicationAction:", err.message);
    }
  }

  const isFirstSubmit = !existing;

  try {
    await query(
      `INSERT INTO ambalan_applications (account_id, full_name, class_name, phone, motivation, experience, period, status, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (account_id, period) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         class_name = EXCLUDED.class_name,
         phone = EXCLUDED.phone,
         motivation = EXCLUDED.motivation,
         experience = EXCLUDED.experience,
         status = EXCLUDED.status,
         updated_at = EXCLUDED.updated_at`,
      [session.id, full_name, class_name, phone, motivation, experience, period, "pending", new Date().toISOString()]
    );
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

    let acc;
    try {
      const accResult = await query(
        "SELECT email, display_name FROM accounts WHERE id = $1",
        [session.id]
      );
      acc = accResult.rows[0] ?? null;
    } catch (err) {
      acc = null;
    }
    if (acc?.email) {
      sendAmbalanReceivedEmail(
        acc.email,
        acc.display_name ?? session.display_name ?? "Pengguna",
        period,
      ).catch(() => {});
    }
  }

  revalidatePath("/daftar-calon-dewan-ambalan");
  return { success: "Pendaftaran calon pengurus ambalan berhasil dikirim." };
}
