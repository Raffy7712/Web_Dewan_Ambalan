"use server";

import { getSession } from "./auth";
import { createAdminClient } from "@/lib/supabase";
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

  const db = createAdminClient();

  const { data: existing, error: exErr } = await db
    .from("ambalan_applications")
    .select("id")
    .eq("account_id", session.id)
    .eq("period", period)
    .maybeSingle();

  if (exErr && exErr.code !== "42P01") {
    console.error("submitAmbalanApplicationAction:", exErr.message);
  }

  const isFirstSubmit = !existing;

  const { error } = await db.from("ambalan_applications").upsert(
    {
      account_id: session.id,
      full_name,
      class_name,
      phone,
      motivation,
      experience,
      period,
      status: "pending",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "account_id,period" },
  );

  if (error) {
    if (error.code === "42P01") {
      return {
        error:
          "Tabel pendaftaran belum ada. Jalankan migration-v3.sql di Supabase dulu.",
      };
    }
    console.error("submitAmbalanApplicationAction:", error.message);
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

    const { data: acc } = await db
      .from("accounts")
      .select("email, display_name")
      .eq("id", session.id)
      .maybeSingle();
    if (acc?.email) {
      sendAmbalanReceivedEmail(
        acc.email,
        acc.display_name ?? session.display_name ?? "Pengguna",
        period,
      ).catch(() => {});
    }
  }

  revalidatePath("/daftar-ambalan");
  return { success: "Pendaftaran calon pengurus ambalan berhasil dikirim." };
}
