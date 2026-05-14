"use server";

import { createAdminClient } from "@/lib/supabase";
import { getSession } from "./auth";
import { revalidatePath } from "next/cache";
import {
  sendAccountBannedEmail,
  sendAccountUnbannedEmail,
  sendAccountRoleChangedEmail,
} from "@/lib/email";

async function ensureAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function setAccountBannedAction(prevState, formData) {
  const session = await ensureAdmin();
  if (!session) return { error: "Tidak punya izin." };

  const accountId = formData.get("account_id")?.toString() ?? "";
  const banned = formData.get("banned") === "true";
  const reason = formData.get("reason")?.toString().trim().slice(0, 500) ?? "";

  if (!accountId) return { error: "Akun tidak valid." };
  if (accountId === session.id) {
    return { error: "Kamu tidak bisa memblokir akun sendiri." };
  }

  const db = createAdminClient();

  const { data: target, error: fetchErr } = await db
    .from("accounts")
    .select("id, role, banned, email, display_name")
    .eq("id", accountId)
    .maybeSingle();

  if (fetchErr || !target) return { error: "Akun tidak ditemukan." };

  if (banned) {
    if (target.role === "admin") {
      const { count, error: cErr } = await db
        .from("accounts")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin")
        .eq("is_active", true)
        .eq("banned", false);

      if (cErr) return { error: "Gagal memverifikasi admin." };
      if ((count ?? 0) <= 1) {
        return {
          error:
            "Tidak bisa memblokir admin terakhir yang aktif. Angkat admin lain dulu.",
        };
      }
    }

    const { error } = await db
      .from("accounts")
      .update({
        banned: true,
        banned_at: new Date().toISOString(),
        banned_reason: reason || null,
        banned_by: session.id,
      })
      .eq("id", accountId);

    if (error) {
      console.error("setAccountBannedAction ban:", error.message);
      return { error: "Gagal memblokir akun. Pastikan migrasi v7 sudah dijalankan." };
    }
    if (target.email) {
      sendAccountBannedEmail(
        target.email,
        target.display_name ?? "Pengguna",
        reason || undefined,
      ).catch(() => {});
    }
  } else {
    const { error } = await db
      .from("accounts")
      .update({
        banned: false,
        banned_at: null,
        banned_reason: null,
        banned_by: null,
      })
      .eq("id", accountId);

    if (error) {
      console.error("setAccountBannedAction unban:", error.message);
      return { error: "Gagal membuka blokir akun." };
    }
    if (target.email) {
      sendAccountUnbannedEmail(
        target.email,
        target.display_name ?? "Pengguna",
      ).catch(() => {});
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/management");
  revalidatePath("/anggota");
  return { success: true, banned };
}

const ASSIGNABLE_ROLES = ["user", "moderator", "admin"];

export async function setAccountRoleAction(prevState, formData) {
  const session = await ensureAdmin();
  if (!session) return { error: "Tidak punya izin." };

  const accountId = formData.get("account_id")?.toString() ?? "";
  const newRole = formData.get("role")?.toString().trim().toLowerCase() ?? "";

  if (!accountId) return { error: "Akun tidak valid." };
  if (!ASSIGNABLE_ROLES.includes(newRole)) {
    return { error: "Peran tidak valid." };
  }

  const db = createAdminClient();

  const { data: target, error: fetchErr } = await db
    .from("accounts")
    .select("id, role, is_active, banned, email, display_name")
    .eq("id", accountId)
    .maybeSingle();

  if (fetchErr || !target) return { error: "Akun tidak ditemukan." };
  if (!target.is_active) {
    return { error: "Akun tidak aktif tidak dapat diubah perannya." };
  }
  if (target.role === newRole) {
    return { success: true, role: newRole };
  }

  if (target.role === "admin" && newRole !== "admin") {
    const { count, error: cErr } = await db
      .from("accounts")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin")
      .eq("is_active", true)
      .eq("banned", false);

    if (cErr) return { error: "Gagal memverifikasi jumlah admin." };
    if ((count ?? 0) <= 1) {
      return {
        error:
          "Tidak bisa menurunkan admin terakhir yang aktif. Angkat akun lain menjadi admin dulu.",
      };
    }
  }

  const { error } = await db.from("accounts").update({ role: newRole }).eq("id", accountId);

  if (error) {
    return { error: "Gagal memperbarui peran." };
  }

  if (target.email) {
    sendAccountRoleChangedEmail(
      target.email,
      target.display_name ?? "Pengguna",
      newRole,
    ).catch(() => {});
  }

  revalidatePath("/admin/management");
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  revalidatePath("/anggota");
  return { success: true, role: newRole };
}
