"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveCmsEntryAction,
  deleteCmsEntryAction,
  toggleCmsPublishedAction,
} from "@/app/actions/admin";
import { CMS_PUBLIC_BINDINGS, getCmsBindingKeySet } from "@/lib/cms-bindings";

const emptyDraft = () => ({
  section_key: "",
  entry_key: "",
  text: "",
  sort_order: "0",
  is_published: "true",
});

function findEntry(entries, section, entry) {
  return entries.find((e) => e.section_key === section && e.entry_key === entry) ?? null;
}

export default function ContentManager({ selectedPage, pages, initialEntries }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveCmsEntryAction, null);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [rowError, setRowError] = useState(null);
  const [pendingRow, startRowTransition] = useTransition();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const bindingSpec = CMS_PUBLIC_BINDINGS[selectedPage];
  const bindingKeySet = useMemo(() => getCmsBindingKeySet(selectedPage), [selectedPage]);
  const customEntries = useMemo(
    () =>
      initialEntries.filter((e) => !bindingKeySet.has(`${e.section_key}\t${e.entry_key}`)),
    [initialEntries, bindingKeySet],
  );

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success, router]);

  function loadFromSlot(row) {
    const existing = findEntry(initialEntries, row.section, row.entry);
    setEditingId(existing?.id ?? null);
    setDraft({
      section_key: row.section,
      entry_key: row.entry,
      text: typeof existing?.payload?.text === "string" ? existing.payload.text : "",
      sort_order: String(existing?.sort_order ?? 0),
      is_published: existing ? (existing.is_published ? "true" : "false") : "true",
    });
    setRowError(null);
    requestAnimationFrame(() => {
      document.getElementById("cms-save-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function loadEntryForEdit(entry) {
    setEditingId(entry.id);
    setDraft({
      section_key: entry.section_key ?? "",
      entry_key: entry.entry_key ?? "",
      text: typeof entry.payload?.text === "string" ? entry.payload.text : "",
      sort_order: String(entry.sort_order ?? 0),
      is_published: entry.is_published ? "true" : "false",
    });
    setRowError(null);
    setShowAdvanced(true);
    requestAnimationFrame(() => {
      document.getElementById("cms-save-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(emptyDraft());
    setRowError(null);
  }

  function handleDelete(entryId) {
    if (!window.confirm("Hapus entri CMS ini? Tindakan tidak bisa dibatalkan.")) return;
    const wasEditingThis = editingId === entryId;
    setRowError(null);
    const fd = new FormData();
    fd.append("entry_id", entryId);
    startRowTransition(async () => {
      const res = await deleteCmsEntryAction(null, fd);
      if (res?.error) {
        setRowError(res.error);
        return;
      }
      if (wasEditingThis) cancelEdit();
      router.refresh();
    });
  }

  function handleTogglePublished(entryId) {
    setRowError(null);
    const fd = new FormData();
    fd.append("entry_id", entryId);
    startRowTransition(async () => {
      const res = await toggleCmsPublishedAction(null, fd);
      if (res?.error) {
        setRowError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function slotStatus(entry) {
    if (!entry) return { label: "Belum diisi", className: "bg-muted text-foreground" };
    if (!entry.is_published)
      return { label: "Draft (tidak tampil di situs)", className: "bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100" };
    return { label: "Published (tampil)", className: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200" };
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-2">Content CMS</h1>
      <p className="text-muted-foreground mb-4">
        Pilih tab halaman di bawah, lalu ubah tiap <strong className="text-foreground">blok teks</strong>{" "}
        yang sudah dipetakan ke situs. Hanya status <strong className="text-foreground">Published</strong>{" "}
        yang dibaca halaman publik.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {pages.map((p) => (
          <Link
            key={p.key}
            href={`/admin/content?page=${p.key}`}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              p.key === selectedPage
                ? "bg-emerald-600 text-white"
                : "bg-background dark:bg-card border border-border text-foreground"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {bindingSpec && (
        <section className="mb-8 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Blok teks di situs (terpetakan)</h2>
              <p className="text-sm text-muted-foreground mt-1">
                <code className="text-xs bg-white/80 dark:bg-card/80 px-1.5 py-0.5 rounded">page_key</code>{" "}
                untuk tab ini:{" "}
                <code className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">{bindingSpec.pageKey}</code>
                {" · "}
                {bindingSpec.path ? (
                  <>
                    Lihat di browser:{" "}
                    <Link
                      href={bindingSpec.path}
                      className="font-semibold text-emerald-700 dark:text-emerald-400 underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {bindingSpec.pathTitle}
                    </Link>
                  </>
                ) : (
                  <span className="font-medium text-foreground">{bindingSpec.pathTitle}</span>
                )}
              </p>
            </div>
          </div>

          <ul className="space-y-3">
            {bindingSpec.rows.map((row) => {
              const entry = findEntry(initialEntries, row.section, row.entry);
              const st = slotStatus(entry);
              const preview =
                entry && typeof entry.payload?.text === "string" && entry.payload.text.length > 0
                  ? entry.payload.text
                  : null;
              return (
                <li
                  key={`${row.section}-${row.entry}`}
                  className="rounded-lg border border-border bg-background dark:bg-card p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{row.label}</p>
                      <p className="text-xs font-mono text-muted-foreground mt-1 break-all">
                        section_key=<span className="text-emerald-700 dark:text-emerald-400">{row.section}</span> ·
                        entry_key=<span className="text-emerald-700 dark:text-emerald-400">{row.entry}</span>
                      </p>
                      {row.hint && (
                        <p className="text-xs text-muted-foreground mt-1">{row.hint}</p>
                      )}
                      {row.sample && (
                        <p className="text-xs text-muted-foreground mt-2 border-l-2 border-border pl-2">
                          Contoh isi: {row.sample}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded shrink-0 ${st.className}`}>{st.label}</span>
                  </div>
                  <p className="text-sm text-foreground mt-2 line-clamp-3 whitespace-pre-wrap">
                    {preview ?? (
                      <span className="italic text-muted-foreground">
                        Belum ada teks di database — situs memakai teks bawaan (fallback) sampai Anda simpan entri
                        Published.
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => loadFromSlot(row)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      {entry ? "Ubah di form" : "Isi lewat form"}
                    </button>
                    {entry && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleTogglePublished(entry.id)}
                          disabled={pendingRow}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-foreground disabled:opacity-50"
                        >
                          {entry.is_published ? "Jadikan draft" : "Publish"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          disabled={pendingRow}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 disabled:opacity-50"
                        >
                          Hapus
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <h2 id="cms-save-form" className="text-lg font-bold text-foreground mb-2 scroll-mt-20">
        Form simpan
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        Dipakai untuk mengisi slot di atas atau kunci kustom. Klik &quot;Isi / Ubah&quot; pada kartu slot untuk mengisi
        kunci otomatis.
      </p>

      <form
        action={action}
        className="grid gap-4 bg-background dark:bg-card border border-border rounded-xl p-5 mb-6"
      >
        <input type="hidden" name="page_key" value={selectedPage} />
        {editingId && (
          <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
            Mengubah entri yang sudah ada (id terikat). Untuk slot terpetakan, jangan ubah section/entry manual.{" "}
            <button type="button" onClick={cancelEdit} className="font-semibold underline">
              Batal
            </button>
          </p>
        )}
        <div className="grid md:grid-cols-2 gap-3">
          <input
            name="section_key"
            required
            readOnly={!!editingId}
            value={draft.section_key}
            onChange={(e) => setDraft((d) => ({ ...d, section_key: e.target.value }))}
            placeholder="section_key"
            className="px-3 py-2 rounded-lg border border-border bg-background dark:bg-muted text-foreground read-only:opacity-70"
          />
          <input
            name="entry_key"
            required
            readOnly={!!editingId}
            value={draft.entry_key}
            onChange={(e) => setDraft((d) => ({ ...d, entry_key: e.target.value }))}
            placeholder="entry_key"
            className="px-3 py-2 rounded-lg border border-border bg-background dark:bg-muted text-foreground read-only:opacity-70"
          />
        </div>
        <textarea
          name="text"
          rows={5}
          value={draft.text}
          onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
          placeholder="Isi teks yang akan tampil di situs (kosongkan tidak disarankan)"
          className="px-3 py-2 rounded-lg border border-border bg-background dark:bg-muted text-foreground"
        />
        <div className="grid md:grid-cols-2 gap-3">
          <input
            type="number"
            name="sort_order"
            value={draft.sort_order}
            onChange={(e) => setDraft((d) => ({ ...d, sort_order: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-border bg-background dark:bg-muted text-foreground"
          />
          <select
            name="is_published"
            value={draft.is_published}
            onChange={(e) => setDraft((d) => ({ ...d, is_published: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-border bg-background dark:bg-muted text-foreground"
          >
            <option value="true">Published (tampil di situs)</option>
            <option value="false">Draft (hanya di admin)</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="submit"
            disabled={pending}
            className="justify-self-start bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
          >
            {pending ? "Menyimpan..." : editingId ? "Perbarui konten" : "Simpan konten"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium"
            >
              Batal edit
            </button>
          )}
        </div>
        {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
        {state?.success && <p className="text-sm text-emerald-600 dark:text-emerald-400">{state.success}</p>}
      </form>

      {rowError && (
        <p className="text-sm text-red-500 mb-4" role="alert">
          {rowError}
        </p>
      )}

      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-sm font-semibold text-foreground underline"
        >
          {showAdvanced ? "Sembunyikan" : "Tampilkan"} kunci kustom &amp; daftar mentah
        </button>
      </div>

      {showAdvanced && (
        <>
          <div className="bg-background dark:bg-card border border-border rounded-xl overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground flex justify-between items-center gap-2">
              <span>Entri kustom / luar peta ({customEntries.length})</span>
              {pendingRow && <span className="text-xs font-normal text-muted-foreground">Memproses…</span>}
            </div>
            <div className="divide-y divide-border">
              {customEntries.map((entry) => (
                <div key={entry.id} className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">
                        {entry.section_key} / {entry.entry_key}
                        <span
                          className={`ml-2 text-xs font-normal px-2 py-0.5 rounded ${
                            entry.is_published
                              ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {entry.is_published ? "Published" : "Draft"}
                        </span>
                      </p>
                      <p className="text-muted-foreground mt-1 break-words">
                        {entry.payload?.text ?? "—"}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        Kunci ini tidak cocok dengan blok terpetakan — tidak akan tampil di situs kecuali kode
                        ditambah memanggil getCmsText untuk pasangan ini.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => loadEntryForEdit(entry)}
                        disabled={pendingRow}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-foreground hover:bg-muted/80 disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTogglePublished(entry.id)}
                        disabled={pendingRow}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-foreground hover:bg-muted/80 disabled:opacity-50"
                      >
                        {entry.is_published ? "Draft" : "Publish"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        disabled={pendingRow}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {customEntries.length === 0 && (
                <p className="px-4 py-6 text-sm text-muted-foreground">
                  Tidak ada entri di luar daftar terpetakan.
                </p>
              )}
            </div>
          </div>

          <div className="bg-muted/50 dark:bg-card/50 border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">
              Semua entri di halaman ini ({initialEntries.length})
            </div>
            <div className="divide-y divide-border max-h-80 overflow-y-auto">
              {initialEntries.map((entry) => (
                <div key={entry.id} className="px-4 py-2 text-xs font-mono text-muted-foreground">
                  {entry.section_key}/{entry.entry_key} — {entry.is_published ? "pub" : "draft"}
                </div>
              ))}
              {initialEntries.length === 0 && (
                <p className="px-4 py-6 text-sm text-muted-foreground">Kosong.</p>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
