"use client";

import { useState, useCallback } from "react";
import {
  updateApplicantStatusAction,
  deleteApplicantAction,
} from "@/app/actions/ambalan-admin";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Download,
  Trash2,
  ExternalLink,
} from "lucide-react";

const STATUS_LABEL = {
  pending: "Pending",
  reviewed: "Ditinjau",
  accepted: "Diterima",
  rejected: "Ditolak",
};

const STATUS_BADGE = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  reviewed:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  accepted:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function ApplicantsManager({ applicants }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [busy, setBusy] = useState(false);

  const filtered = applicants.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      a.full_name?.toLowerCase().includes(q) ||
      a.class_name?.toLowerCase().includes(q) ||
      a.phone?.includes(q);
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAction = useCallback(async (fn, ...args) => {
    setBusy(true);
    await fn(...args);
    setBusy(false);
  }, []);

  const handleExport = () => {
    window.open("/api/admin/ambalan-applications/export", "_blank");
  };

  const toggleDetail = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-foreground">
          Pendaftar Calon Pengurus
        </h1>
        <button
          onClick={handleExport}
          disabled={busy || !applicants.length}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          <Download size={16} />
          Export XLSX
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, kelas, atau no. WA..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Semua status</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Ditinjau</option>
          <option value="accepted">Diterima</option>
          <option value="rejected">Ditolak</option>
        </select>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} dari {applicants.length} pendaftar
      </p>

      <div className="space-y-2">
        {filtered.map((a) => (
          <div
            key={a.id}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            <div
              className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => toggleDetail(a.id)}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {a.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a.class_name} &middot; {a.phone}
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[a.status] || STATUS_BADGE.pending}`}
              >
                {STATUS_LABEL[a.status] || a.status}
              </span>
              {expandedId === a.id ? (
                <ChevronUp size={18} className="shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown size={18} className="shrink-0 text-muted-foreground" />
              )}
            </div>

            {expandedId === a.id && (
              <div className="border-t border-border px-4 py-3 space-y-3 text-sm">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Motivasi
                    </p>
                    <p className="text-foreground whitespace-pre-wrap mt-0.5">
                      {a.motivation || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Pengalaman
                    </p>
                    <p className="text-foreground whitespace-pre-wrap mt-0.5">
                      {a.experience || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>Periode: {a.period}</span>
                  <span>IP: {a.submitter_ip || "-"}</span>
                  <span>
                    Daftar:{" "}
                    {a.created_at
                      ? new Date(a.created_at).toLocaleString("id-ID")
                      : "-"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                  <span className="text-xs font-medium text-muted-foreground mr-1">
                    Ubah status:
                  </span>
                  {["pending", "reviewed", "accepted", "rejected"].map((st) => (
                    <form
                      key={st}
                      action={async (fd) => {
                        fd.set("id", a.id);
                        fd.set("status", st);
                        await handleAction(updateApplicantStatusAction, fd);
                        toggleDetail(a.id);
                      }}
                      className="inline"
                    >
                      <button
                        type="submit"
                        disabled={busy || a.status === st}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-40 ${
                          a.status === st
                            ? "bg-primary/10 text-primary cursor-not-allowed"
                            : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        {STATUS_LABEL[st] || st}
                      </button>
                    </form>
                  ))}

                  <div className="flex-1" />

                  <form
                    action={async (fd) => {
                      if (!confirm(`Hapus pendaftar "${a.full_name}"?`))
                        return;
                      fd.set("id", a.id);
                      await handleAction(deleteApplicantAction, fd);
                    }}
                    className="inline"
                  >
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40"
                    >
                      <Trash2 size={13} />
                      Hapus
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {!filtered.length && (
        <p className="text-center text-sm text-muted-foreground py-8">
          Tidak ada pendaftar ditemukan.
        </p>
      )}
    </div>
  );
}
