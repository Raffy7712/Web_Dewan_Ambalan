"use client";

import { useState } from "react";
import { assignJabatanAction } from "@/app/actions/admin";
import { Users, ChevronDown, CheckCircle } from "lucide-react";

export default function AnggotaAdminPanel({ jabatanList, initialUsers }) {
  const [allUsers, setAllUsers] = useState(initialUsers ?? []);
  const [saving, setSaving] = useState({});
  const [msg, setMsg] = useState({});

  async function handleAssign(accountId, jabatanId) {
    setSaving((prev) => ({ ...prev, [accountId]: true }));
    const fd = new FormData();
    fd.set("account_id", accountId);
    fd.set("jabatan_id", jabatanId);
    const res = await assignJabatanAction(null, fd);
    setSaving((prev) => ({ ...prev, [accountId]: false }));

    if (res?.success) {
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === accountId
            ? {
                ...u,
                jabatan_id: jabatanId || null,
                jabatan: jabatanList.find((j) => j.id === jabatanId) ?? null,
              }
            : u,
        ),
      );
      setMsg((prev) => ({ ...prev, [accountId]: "saved" }));
      setTimeout(() => setMsg((prev) => ({ ...prev, [accountId]: null })), 1800);
    } else {
      setMsg((prev) => ({ ...prev, [accountId]: res?.error ?? "Gagal" }));
    }
  }

  return (
    <div className="mt-10 bg-white dark:bg-[#150f2d] border border-emerald-100 dark:border-purple-900/40 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
        <h3 className="font-bold text-gray-800 dark:text-purple-50 text-lg">
          Kelola Struktur Dewan Ambalan
        </h3>
        <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-semibold">
          Admin Only
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-emerald-100 dark:border-purple-900/40 text-left">
              <th className="pb-2 text-gray-500 dark:text-purple-400 font-medium">
                Anggota
              </th>
              <th className="pb-2 text-gray-500 dark:text-purple-400 font-medium pl-4">
                Status
              </th>
              <th className="pb-2 text-gray-500 dark:text-purple-400 font-medium pl-4">
                Ubah Jabatan
              </th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((u) => (
              <tr
                key={u.id}
                className="border-b border-emerald-50 dark:border-purple-900/20 last:border-0"
              >
                <td className="py-2.5">
                  <p className="font-semibold text-gray-800 dark:text-purple-100">
                    {u.display_name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-purple-500">
                    @{u.username} / {u.role}
                  </p>
                </td>
                <td className="py-2.5 pl-4">
                  <span className="text-xs text-gray-500 dark:text-purple-400">
                    {u.jabatan?.nama ?? "Anggota Pramuka"}
                  </span>
                </td>
                <td className="py-2.5 pl-4">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <select
                        defaultValue={u.jabatan_id ?? ""}
                        disabled={saving[u.id]}
                        onChange={(e) =>
                          handleAssign(u.id, e.target.value || null)
                        }
                        className="appearance-none bg-white dark:bg-[#1e1640] border border-gray-300 dark:border-purple-700 text-gray-800 dark:text-purple-200 text-xs rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                      >
                        <option value="">Anggota Pramuka</option>
                        {jabatanList.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.nama}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={12}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                    {msg[u.id] === "saved" && (
                      <CheckCircle
                        size={15}
                        className="text-emerald-500 flex-shrink-0"
                      />
                    )}
                    {msg[u.id] && msg[u.id] !== "saved" && (
                      <span className="text-xs text-red-500">{msg[u.id]}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
