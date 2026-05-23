"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  saveSuratMasukAction,
  saveSuratKeluarAction,
  deleteSuratMasukAction,
  deleteSuratKeluarAction,
} from "@/app/actions/agenda-surat";
import SuratMediaUpload from "@/components/SuratMediaUpload";
import { FileSpreadsheet, Inbox, Pencil, Send, Trash2 } from "lucide-react";

function formatIdDate(value) {
  if (!value) return "—";
  try {
    const d = new Date(value + (value.length <= 10 ? "T12:00:00" : ""));
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function clip(s, n) {
  if (!s) return "—";
  return s.length <= n ? s : `${s.slice(0, n)}…`;
}

/** Contoh pengisian — dipakai placeholder form + baris contoh di tabel kosong. */
const CONTOH_MASUK = {
  tanggal_diterima: "2026-05-14",
  tanggal_surat: "2026-05-12",
  nomor_surat: "UM-014/Bantarkawung/V/2026",
  dari: "Kwartir Cabang Brebes — Bagian Humas",
  perihal: "Undangan rapat koordinasi kegiatan penegak",
  catatan: "Diterima lewat pos; mohon balasan sebelum 20 Mei 2026.",
  lampiran_url: "https://drive.google.com/file/d/…/view",
};

const CONTOH_KELUAR = {
  tanggal_keluar: "2026-05-15",
  nomor_surat: "SK-003/D.A./V/2026",
  kepada: "Kepala SMK Al Furqon Bantarkawung",
  perihal: "Pemberitahuan jadwal latihan rutin ambalan",
  catatan: "Tembusan: Pembina ambalan",
  lampiran_url: "https://drive.google.com/file/d/…/view",
};

const emptyMasuk = () => ({
  id: "",
  tanggal_diterima: "",
  nomor_surat: "",
  tanggal_surat: "",
  dari: "",
  perihal: "",
  catatan: "",
  lampiran_url: "",
});

const emptyKeluar = () => ({
  id: "",
  tanggal_keluar: "",
  nomor_surat: "",
  kepada: "",
  perihal: "",
  catatan: "",
  lampiran_url: "",
});

  const linkBtnClass =
    "inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-colors";

export default function AgendaSuratManager({ initialMasuk, initialKeluar }) {
  const router = useRouter();
  const [tab, setTab] = useState("masuk");
  const [draftMasuk, setDraftMasuk] = useState(emptyMasuk);
  const [draftKeluar, setDraftKeluar] = useState(emptyKeluar);
  const [masukState, masukAction, masukPending] = useActionState(saveSuratMasukAction, null);
  const [keluarState, keluarAction, keluarPending] = useActionState(saveSuratKeluarAction, null);

  useEffect(() => {
    if (!masukState?.success) return;
    const id = requestAnimationFrame(() => {
      setDraftMasuk(emptyMasuk());
      router.refresh();
    });
    return () => cancelAnimationFrame(id);
  }, [masukState?.success, router]);

  useEffect(() => {
    if (!keluarState?.success) return;
    const id = requestAnimationFrame(() => {
      setDraftKeluar(emptyKeluar());
      router.refresh();
    });
    return () => cancelAnimationFrame(id);
  }, [keluarState?.success, router]);

  async function handleDeleteMasuk(id) {
    if (!window.confirm("Hapus entri surat masuk ini?")) return;
    const fd = new FormData();
    fd.set("id", id);
    const res = await deleteSuratMasukAction(null, fd);
    if (res?.error) {
      window.alert(res.error);
      return;
    }
    if (draftMasuk.id === id) setDraftMasuk(emptyMasuk());
    router.refresh();
  }

  async function handleDeleteKeluar(id) {
    if (!window.confirm("Hapus entri surat keluar ini?")) return;
    const fd = new FormData();
    fd.set("id", id);
    const res = await deleteSuratKeluarAction(null, fd);
    if (res?.error) {
      window.alert(res.error);
      return;
    }
    if (draftKeluar.id === id) setDraftKeluar(emptyKeluar());
    router.refresh();
  }

  function editMasuk(row) {
    setDraftMasuk({
      id: row.id,
      tanggal_diterima: row.tanggal_diterima?.slice(0, 10) ?? "",
      nomor_surat: row.nomor_surat ?? "",
      tanggal_surat: row.tanggal_surat?.slice(0, 10) ?? "",
      dari: row.dari ?? "",
      perihal: row.perihal ?? "",
      catatan: row.catatan ?? "",
      lampiran_url: row.lampiran_url ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editKeluar(row) {
    setDraftKeluar({
      id: row.id,
      tanggal_keluar: row.tanggal_keluar?.slice(0, 10) ?? "",
      nomor_surat: row.nomor_surat ?? "",
      kepada: row.kepada ?? "",
      perihal: row.perihal ?? "",
      catatan: row.catatan ?? "",
      lampiran_url: row.lampiran_url ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const inputClass =
    "w-full border border-border bg-background text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/80";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
        Agenda & arsip surat
      </h1>
      <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
        Buku surat masuk dan surat keluar (arsip operasional kantor dewan). Data hanya di panel admin dan tidak
        ditampilkan ke publik. Kolom tabel sama dengan kolom unduhan Excel.
      </p>

      <div className="mb-5 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileSpreadsheet size={18} className="text-primary shrink-0" />
          Unduh Excel (.xlsx)
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/api/admin/agenda-surat/export?scope=masuk" className={linkBtnClass}>
            Surat masuk
          </a>
          <a href="/api/admin/agenda-surat/export?scope=keluar" className={linkBtnClass}>
            Surat keluar
          </a>
          <a href="/api/admin/agenda-surat/export?scope=both" className={linkBtnClass}>
            Semua (2 lembar)
          </a>
        </div>
        <p className="text-[11px] text-muted-foreground w-full sm:ml-0">
          Unduhan memakai sesi login Anda (cookie). Buka tautan di tab yang sama setelah login sebagai admin.
        </p>
      </div>

      <div className="flex gap-1 p-1 mb-6 rounded-xl bg-muted border border-border w-fit">
        <button
          type="button"
          onClick={() => setTab("masuk")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === "masuk"
              ? "bg-card text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Inbox size={16} />
          Surat masuk
        </button>
        <button
          type="button"
          onClick={() => setTab("keluar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === "keluar"
              ? "bg-card text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Send size={16} />
          Surat keluar
        </button>
      </div>

      {tab === "masuk" && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold text-foreground text-sm mb-1">
              {draftMasuk.id ? "Ubah surat masuk" : "Tambah surat masuk"}
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Tip: isi mengikuti contoh di placeholder. Tanggal pakai pemilih kalender (format disimpan YYYY-MM-DD).
            </p>
            {masukState?.error && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">{masukState.error}</p>
            )}
            <form action={masukAction} className="grid sm:grid-cols-2 gap-3">
              <input type="hidden" name="id" value={draftMasuk.id} />
              <label className="sm:col-span-1 grid gap-1">
                <span className="text-xs font-medium text-muted-foreground">Tanggal diterima *</span>
                <input
                  type="date"
                  name="tanggal_diterima"
                  required
                  title={`Contoh: ${CONTOH_MASUK.tanggal_diterima}`}
                  value={draftMasuk.tanggal_diterima}
                  onChange={(e) => setDraftMasuk((d) => ({ ...d, tanggal_diterima: e.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className="sm:col-span-1 grid gap-1">
                <span className="text-xs font-medium text-muted-foreground">Tanggal surat</span>
                <input
                  type="date"
                  name="tanggal_surat"
                  title={`Contoh: ${CONTOH_MASUK.tanggal_surat}`}
                  value={draftMasuk.tanggal_surat}
                  onChange={(e) => setDraftMasuk((d) => ({ ...d, tanggal_surat: e.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className="sm:col-span-2 grid gap-1">
                <span className="text-xs font-medium text-muted-foreground">Nomor surat *</span>
                <input
                  type="text"
                  name="nomor_surat"
                  required
                  placeholder={CONTOH_MASUK.nomor_surat}
                  value={draftMasuk.nomor_surat}
                  onChange={(e) => setDraftMasuk((d) => ({ ...d, nomor_surat: e.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className="sm:col-span-2 grid gap-1">
                <span className="text-xs font-medium text-muted-foreground">Dari (pengirim / instansi) *</span>
                <input
                  type="text"
                  name="dari"
                  required
                  placeholder={CONTOH_MASUK.dari}
                  value={draftMasuk.dari}
                  onChange={(e) => setDraftMasuk((d) => ({ ...d, dari: e.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className="sm:col-span-2 grid gap-1">
                <span className="text-xs font-medium text-muted-foreground">Perihal *</span>
                <input
                  type="text"
                  name="perihal"
                  required
                  placeholder={CONTOH_MASUK.perihal}
                  value={draftMasuk.perihal}
                  onChange={(e) => setDraftMasuk((d) => ({ ...d, perihal: e.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className="sm:col-span-2 grid gap-1">
                <span className="text-xs font-medium text-muted-foreground">Catatan</span>
                <textarea
                  name="catatan"
                  rows={2}
                  placeholder={CONTOH_MASUK.catatan}
                  value={draftMasuk.catatan}
                  onChange={(e) => setDraftMasuk((d) => ({ ...d, catatan: e.target.value }))}
                  className={inputClass}
                />
              </label>
              <div className="sm:col-span-2">
                <SuratMediaUpload
                  initialUrl={draftMasuk.lampiran_url}
                  suratType="masuk"
                  onChange={(url) => setDraftMasuk((d) => ({ ...d, lampiran_url: url }))}
                />
                <input
                  type="hidden"
                  name="lampiran_url"
                  value={draftMasuk.lampiran_url}
                />
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={masukPending}
                    className="bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
                >
                  {masukPending ? "Menyimpan…" : draftMasuk.id ? "Simpan perubahan" : "Simpan"}
                </button>
                {draftMasuk.id && (
                  <button
                    type="button"
                    onClick={() => setDraftMasuk(emptyMasuk())}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium border border-border text-muted-foreground"
                  >
                    Batal edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">
              Daftar surat masuk ({initialMasuk.length}) — semua kolom
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[960px]">
                <thead>
                  <tr className="bg-muted text-left text-muted-foreground text-[10px] uppercase tracking-wide">
                    <th className="px-2 py-2 font-semibold whitespace-nowrap">Tgl diterima</th>
                    <th className="px-2 py-2 font-semibold whitespace-nowrap">Tgl surat</th>
                    <th className="px-2 py-2 font-semibold">Nomor surat</th>
                    <th className="px-2 py-2 font-semibold">Dari</th>
                    <th className="px-2 py-2 font-semibold">Perihal</th>
                    <th className="px-2 py-2 font-semibold">Catatan</th>
                    <th className="px-2 py-2 font-semibold">Lampiran</th>
                    <th className="px-2 py-2 font-semibold w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {initialMasuk.map((row) => (
                    <tr key={row.id} className="text-foreground align-top">
                      <td className="px-2 py-2 whitespace-nowrap text-xs">{formatIdDate(row.tanggal_diterima)}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs">{formatIdDate(row.tanggal_surat)}</td>
                      <td className="px-2 py-2 max-w-[140px] text-xs break-words" title={row.nomor_surat}>
                        {row.nomor_surat}
                      </td>
                      <td className="px-2 py-2 max-w-[160px] text-xs break-words" title={row.dari}>
                        {row.dari}
                      </td>
                      <td className="px-2 py-2 max-w-[180px] text-xs break-words" title={row.perihal}>
                        {row.perihal}
                      </td>
                      <td className="px-2 py-2 max-w-[160px] text-xs break-words text-muted-foreground">
                        {clip(row.catatan, 120)}
                      </td>
                      <td className="px-2 py-2 max-w-[120px] text-[10px] font-mono break-all text-primary">
                        {row.lampiran_url ? (
                          <a href={row.lampiran_url} className="underline" target="_blank" rel="noreferrer">
                            {clip(row.lampiran_url, 40)}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => editMasuk(row)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMasuk(row.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600"
                            title="Hapus"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {initialMasuk.length === 0 && (
                    <tr className="bg-muted/35 italic text-muted-foreground">
                      <td className="px-2 py-2 text-xs whitespace-nowrap">
                        {formatIdDate(CONTOH_MASUK.tanggal_diterima)}
                      </td>
                      <td className="px-2 py-2 text-xs whitespace-nowrap">
                        {formatIdDate(CONTOH_MASUK.tanggal_surat)}
                      </td>
                      <td className="px-2 py-2 text-xs max-w-[140px] break-words">{CONTOH_MASUK.nomor_surat}</td>
                      <td className="px-2 py-2 text-xs max-w-[160px] break-words">{CONTOH_MASUK.dari}</td>
                      <td className="px-2 py-2 text-xs max-w-[180px] break-words">{CONTOH_MASUK.perihal}</td>
                      <td className="px-2 py-2 text-xs max-w-[160px] break-words">{CONTOH_MASUK.catatan}</td>
                      <td className="px-2 py-2 text-[10px] font-mono break-all">{clip(CONTOH_MASUK.lampiran_url, 36)}</td>
                      <td className="px-2 py-2 text-xs not-italic text-accent font-medium">
                        Contoh
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {initialMasuk.length === 0 && (
              <p className="px-4 py-3 text-center text-xs text-muted-foreground border-t border-border">
                Baris di atas hanya contoh bentuk isian; simpan data asli lewat form &quot;Tambah surat masuk&quot;.
              </p>
            )}
          </div>
        </div>
      )}

      {tab === "keluar" && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold text-foreground text-sm mb-1">
              {draftKeluar.id ? "Ubah surat keluar" : "Tambah surat keluar"}
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Kolom sama dengan file Excel surat keluar. Gunakan placeholder sebagai acuan format.
            </p>
            {keluarState?.error && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">{keluarState.error}</p>
            )}
            <form action={keluarAction} className="grid sm:grid-cols-2 gap-3">
              <input type="hidden" name="id" value={draftKeluar.id} />
              <label className="sm:col-span-1 grid gap-1">
                <span className="text-xs font-medium text-muted-foreground">Tanggal keluar *</span>
                <input
                  type="date"
                  name="tanggal_keluar"
                  required
                  title={`Contoh: ${CONTOH_KELUAR.tanggal_keluar}`}
                  value={draftKeluar.tanggal_keluar}
                  onChange={(e) => setDraftKeluar((d) => ({ ...d, tanggal_keluar: e.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className="sm:col-span-1 grid gap-1">
                <span className="text-xs font-medium text-muted-foreground">Nomor surat *</span>
                <input
                  type="text"
                  name="nomor_surat"
                  required
                  placeholder={CONTOH_KELUAR.nomor_surat}
                  value={draftKeluar.nomor_surat}
                  onChange={(e) => setDraftKeluar((d) => ({ ...d, nomor_surat: e.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className="sm:col-span-2 grid gap-1">
                <span className="text-xs font-medium text-muted-foreground">Kepada *</span>
                <input
                  type="text"
                  name="kepada"
                  required
                  placeholder={CONTOH_KELUAR.kepada}
                  value={draftKeluar.kepada}
                  onChange={(e) => setDraftKeluar((d) => ({ ...d, kepada: e.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className="sm:col-span-2 grid gap-1">
                <span className="text-xs font-medium text-muted-foreground">Perihal *</span>
                <input
                  type="text"
                  name="perihal"
                  required
                  placeholder={CONTOH_KELUAR.perihal}
                  value={draftKeluar.perihal}
                  onChange={(e) => setDraftKeluar((d) => ({ ...d, perihal: e.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className="sm:col-span-2 grid gap-1">
                <span className="text-xs font-medium text-muted-foreground">Catatan</span>
                <textarea
                  name="catatan"
                  rows={2}
                  placeholder={CONTOH_KELUAR.catatan}
                  value={draftKeluar.catatan}
                  onChange={(e) => setDraftKeluar((d) => ({ ...d, catatan: e.target.value }))}
                  className={inputClass}
                />
              </label>
              <div className="sm:col-span-2">
                <SuratMediaUpload
                  initialUrl={draftKeluar.lampiran_url}
                  suratType="keluar"
                  onChange={(url) => setDraftKeluar((d) => ({ ...d, lampiran_url: url }))}
                />
                <input
                  type="hidden"
                  name="lampiran_url"
                  value={draftKeluar.lampiran_url}
                />
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={keluarPending}
                    className="bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
                >
                  {keluarPending ? "Menyimpan…" : draftKeluar.id ? "Simpan perubahan" : "Simpan"}
                </button>
                {draftKeluar.id && (
                  <button
                    type="button"
                    onClick={() => setDraftKeluar(emptyKeluar())}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium border border-border text-muted-foreground"
                  >
                    Batal edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">
              Daftar surat keluar ({initialKeluar.length}) — semua kolom
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[880px]">
                <thead>
                  <tr className="bg-muted text-left text-muted-foreground text-[10px] uppercase tracking-wide">
                    <th className="px-2 py-2 font-semibold whitespace-nowrap">Tgl keluar</th>
                    <th className="px-2 py-2 font-semibold">Nomor surat</th>
                    <th className="px-2 py-2 font-semibold">Kepada</th>
                    <th className="px-2 py-2 font-semibold">Perihal</th>
                    <th className="px-2 py-2 font-semibold">Catatan</th>
                    <th className="px-2 py-2 font-semibold">Lampiran</th>
                    <th className="px-2 py-2 font-semibold w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {initialKeluar.map((row) => (
                    <tr key={row.id} className="text-foreground align-top">
                      <td className="px-2 py-2 whitespace-nowrap text-xs">{formatIdDate(row.tanggal_keluar)}</td>
                      <td className="px-2 py-2 max-w-[130px] text-xs break-words" title={row.nomor_surat}>
                        {row.nomor_surat}
                      </td>
                      <td className="px-2 py-2 max-w-[160px] text-xs break-words" title={row.kepada}>
                        {row.kepada}
                      </td>
                      <td className="px-2 py-2 max-w-[180px] text-xs break-words" title={row.perihal}>
                        {row.perihal}
                      </td>
                      <td className="px-2 py-2 max-w-[160px] text-xs break-words text-muted-foreground">
                        {clip(row.catatan, 120)}
                      </td>
                      <td className="px-2 py-2 max-w-[120px] text-[10px] font-mono break-all text-primary">
                        {row.lampiran_url ? (
                          <a href={row.lampiran_url} className="underline" target="_blank" rel="noreferrer">
                            {clip(row.lampiran_url, 40)}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => editKeluar(row)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteKeluar(row.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600"
                            title="Hapus"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {initialKeluar.length === 0 && (
                    <tr className="bg-muted/35 italic text-muted-foreground">
                      <td className="px-2 py-2 text-xs whitespace-nowrap">
                        {formatIdDate(CONTOH_KELUAR.tanggal_keluar)}
                      </td>
                      <td className="px-2 py-2 text-xs max-w-[130px] break-words">{CONTOH_KELUAR.nomor_surat}</td>
                      <td className="px-2 py-2 text-xs max-w-[160px] break-words">{CONTOH_KELUAR.kepada}</td>
                      <td className="px-2 py-2 text-xs max-w-[180px] break-words">{CONTOH_KELUAR.perihal}</td>
                      <td className="px-2 py-2 text-xs max-w-[160px] break-words">{CONTOH_KELUAR.catatan}</td>
                      <td className="px-2 py-2 text-[10px] font-mono break-all">{clip(CONTOH_KELUAR.lampiran_url, 36)}</td>
                      <td className="px-2 py-2 text-xs not-italic text-accent font-medium">
                        Contoh
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {initialKeluar.length === 0 && (
              <p className="px-4 py-3 text-center text-xs text-muted-foreground border-t border-border">
                Baris contoh tidak tersimpan di database. Isi form lalu simpan untuk data pertama Anda.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
