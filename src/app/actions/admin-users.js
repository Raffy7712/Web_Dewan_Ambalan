"use server";

import { query, getClient } from "@/lib/db";
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

  let target;
  try {
    const result = await query(
      "SELECT id, role, banned, email, display_name FROM accounts WHERE id = $1",
      [accountId]
    );
    target = result.rows[0] ?? null;
  } catch (err) {
    return { error: "Akun tidak ditemukan." };
  }

  if (!target) return { error: "Akun tidak ditemukan." };

  if (banned) {
    if (target.role === "admin") {
      let count;
      try {
        const countResult = await query(
          "SELECT COUNT(*) as count FROM accounts WHERE role = $1 AND is_active = $2 AND banned = $3",
          ["admin", true, false]
        );
        count = Number(countResult.rows[0].count);
      } catch (err) {
        return { error: "Gagal memverifikasi admin." };
      }
      if (count <= 1) {
        return {
          error:
            "Tidak bisa memblokir admin terakhir yang aktif. Angkat admin lain dulu.",
        };
      }
    }

    try {
      await query(
        "UPDATE accounts SET banned = $1, banned_at = $2, banned_reason = $3, banned_by = $4 WHERE id = $5",
        [true, new Date().toISOString(), reason || null, session.id, accountId]
      );
    } catch (err) {
      console.error("setAccountBannedAction ban:", err.message);
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
    try {
      await query(
        "UPDATE accounts SET banned = $1, banned_at = $2, banned_reason = $3, banned_by = $4 WHERE id = $5",
        [false, null, null, null, accountId]
      );
    } catch (err) {
      console.error("setAccountBannedAction unban:", err.message);
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

  let target;
  try {
    const result = await query(
      "SELECT id, role, is_active, banned, email, display_name FROM accounts WHERE id = $1",
      [accountId]
    );
    target = result.rows[0] ?? null;
  } catch (err) {
    return { error: "Akun tidak ditemukan." };
  }

  if (!target) return { error: "Akun tidak ditemukan." };
  if (!target.is_active) {
    return { error: "Akun tidak aktif tidak dapat diubah perannya." };
  }
  if (target.role === newRole) {
    return { success: true, role: newRole };
  }

  if (target.role === "admin" && newRole !== "admin") {
    let count;
    try {
      const countResult = await query(
        "SELECT COUNT(*) as count FROM accounts WHERE role = $1 AND is_active = $2 AND banned = $3",
        ["admin", true, false]
      );
      count = Number(countResult.rows[0].count);
    } catch (err) {
      return { error: "Gagal memverifikasi jumlah admin." };
    }
    if (count <= 1) {
      return {
        error:
          "Tidak bisa menurunkan admin terakhir yang aktif. Angkat akun lain menjadi admin dulu.",
      };
    }
  }

  try {
    await query(
      "UPDATE accounts SET role = $1 WHERE id = $2",
      [newRole, accountId]
    );
  } catch (err) {
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
