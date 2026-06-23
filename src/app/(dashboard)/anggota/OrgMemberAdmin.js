"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  saveOrgMemberAction,
  deleteOrgMemberAction,
  reorderOrgMemberAction,
} from "@/app/actions/admin";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Users,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function OrgMemberAdmin({ jabatanList, initialMembers }) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers ?? []);
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState({});
  const [msg, setMsg] = useState({});

  const grouped = {};
  jabatanList.forEach((j) => {
    grouped[j.id] = { jabatan: j, members: members.filter((m) => m.jabatan?.id === j.id) };
  });

  async function handleSave(formData) {
    const res = await saveOrgMemberAction(null, formData);
    if (res?.success) router.refresh();
    return res;
  }

  async function handleDelete(id) {
    if (!confirm("Hapus anggota ini?")) return;
    const fd = new FormData();
    fd.set("id", id);
    const res = await deleteOrgMemberAction(null, fd);
    if (res?.success) router.refresh();
  }

  async function handleReorder(id, direction, jabatan_id) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("direction", direction);
    fd.set("jabatan_id", jabatan_id);
    const res = await reorderOrgMemberAction(null, fd);
    if (res?.success) router.refresh();
  }

  return (
    <div className="mt-10 bg-card border border-primary/20 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users size={18} className="text-primary" />
        <h3 className="font-bold text-foreground text-lg">
          Kelola Anggota Struktur
        </h3>
        <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-semibold">
          Admin
        </span>
      </div>

      <div className="space-y-6">
        {jabatanList.map((j) => {
          const ms = grouped[j.id]?.members ?? [];
          return (
            <div key={j.id} className="border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-foreground text-sm">
                  {j.nama} ({ms.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setEditing((p) => ({ ...p, [j.id]: !p[j.id] }))}
                  className="text-xs text-primary hover:underline"
                >
                  {editing[j.id] ? "Tutup" : "+ Tambah"}
                </button>
              </div>

              {editing[j.id] && (
                <form
                  action={async (fd) => {
                    const res = await handleSave(fd);
                    if (res?.success) setEditing((p) => ({ ...p, [j.id]: false }));
                  }}
                  className="flex gap-2 mb-3"
                >
                  <input type="hidden" name="jabatan_id" value={j.id} />
                  <input
                    type="text"
                    name="nama"
                    required
                    placeholder="Nama anggota"
                    className="flex-1 border border-border bg-background text-foreground rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Plus size={15} />
                  </button>
                </form>
              )}

              <div className="space-y-1">
                {ms.map((m, idx) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/50 group"
                  >
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleReorder(m.id, "up", j.id)}
                        className="p-0.5 rounded text-muted-foreground hover:text-primary disabled:opacity-20"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === ms.length - 1}
                        onClick={() => handleReorder(m.id, "down", j.id)}
                        className="p-0.5 rounded text-muted-foreground hover:text-primary disabled:opacity-20"
                      >
                        <ChevronDown size={12} />
                      </button>
                    </div>
                    <span className="flex-1 text-sm text-foreground">
                      {m.nama}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      className="p-1 rounded text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {ms.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    Belum ada anggota untuk jabatan ini.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
