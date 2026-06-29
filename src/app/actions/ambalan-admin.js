"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";

export async function getAmbalanApplicantsAction() {
  const session = await getSession();
  if (!session || session.role !== "admin") return [];

  const { rows } = await query(
    `SELECT
       id, account_id, full_name, class_name, phone,
       motivation, experience, status, submitter_ip,
       created_at, updated_at, period
     FROM ambalan_applications
     ORDER BY created_at DESC`,
    []
  );
  return rows;
}

export async function updateApplicantStatusAction(formData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const id = formData.get("id")?.toString().trim();
  const status = formData.get("status")?.toString().trim();

  if (!id || !["pending", "reviewed", "accepted", "rejected"].includes(status)) {
    return { error: "Data tidak valid." };
  }

  try {
    await query(
      `UPDATE ambalan_applications SET status = $1, updated_at = $2 WHERE id = $3`,
      [status, new Date().toISOString(), id]
    );
    revalidatePath("/admin/ambalan-applications");
    return { success: "Status berhasil diperbarui." };
  } catch (err) {
    console.error("updateApplicantStatusAction:", err.message);
    return { error: "Gagal memperbarui status." };
  }
}

export async function deleteApplicantAction(formData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const id = formData.get("id")?.toString().trim();
  if (!id) return { error: "Data tidak valid." };

  try {
    await query("DELETE FROM ambalan_applications WHERE id = $1", [id]);
    revalidatePath("/admin/ambalan-applications");
    return { success: "Pendaftar berhasil dihapus." };
  } catch (err) {
    console.error("deleteApplicantAction:", err.message);
    return { error: "Gagal menghapus pendaftar." };
  }
}


