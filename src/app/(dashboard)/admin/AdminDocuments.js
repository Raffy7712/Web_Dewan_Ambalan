"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Search,
  Loader2,
  Ban,
  Trash2,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

const JENIS_LABEL = {
  sertifikat: "Sertifikat",
  piagam: "Piagam",
  surat: "Surat",
  voucher: "Voucher",
};

function fmt(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminDocuments({ jenisOptions, query }) {
  const router = useRouter();
  const [jenis, setJenis] = useState(query.jenis);
  const [q, setQ] = useState(query.q);
  const [page, setPage] = useState(query.page);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [created, setCreated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (jenis) params.set("jenis", jenis);
    if (q) params.set("q", q);
    params.set("page", String(page));
    const res = await fetch(`/api/admin/documents?${params.toString()}`, { cache: "no-store" });
    const data = res.ok ? await res.json() : { items: [], totalPages: 1, total: 0 };
    setItems(data.items || []);
    setTotalPages(data.totalPages || 1);
    setTotal(data.total || 0);
    setLoading(false);
  }, [jenis, q, page]);

  useEffect(() => {
    load();
  }, [load]);

  function applyFilters(e) {
    e.preventDefault();
    setPage(1);
    syncUrl({ jenis, q, page: 1 });
  }

  function syncUrl(next) {
    const params = new URLSearchParams();
    if (next.jenis) params.set("jenis", next.jenis);
    if (next.q) params.set("q", next.q);
    if (next.page > 1) params.set("page", String(next.page));
    const qs = params.toString();
    router.push(`/admin${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  function goPage(p) {
    setPage(p);
    syncUrl({ jenis, q, page: p });
  }

  async function revoke(item) {
    if (!confirm(`Batalkan dokumen ${item.kode}?`)) return;
    setBusyId(item.id);
    await fetch(`/api/admin/documents/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "revoked" }),
    });
    setBusyId(null);
    load();
  }

  async function remove(item) {
    if (!confirm(`Hapus dokumen ${item.kode} secara permanen?`)) return;
    setBusyId(item.id);
    await fetch(`/api/admin/documents/${item.id}`, { method: "DELETE" });
    setBusyId(null);
    load();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kelola Dokumen</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total} dokumen terdaftar. Tambah, batalkan, atau hapus dokumen verifikasi.
          </p>
        </div>
        <Button onClick={() => { setCreated(null); setShowForm(true); }} className="h-11">
          <Plus size={16} /> Dokumen
        </Button>
      </div>

      <form onSubmit={applyFilters} className="flex flex-col sm:flex-row gap-3 mb-5">
        <select
          value={jenis}
          onChange={(e) => setJenis(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:w-44"
        >
          <option value="">Semua jenis</option>
          {jenisOptions.map((j) => (
            <option key={j} value={j}>{JENIS_LABEL[j]}</option>
          ))}
        </select>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari kode, judul, nomor, penerima…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary" className="h-9">Filter</Button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 size={20} className="animate-spin mr-2" /> Memuat…
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            <FileText size={28} className="mx-auto mb-2 opacity-50" />
            Belum ada dokumen yang cocok.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant="outline">{JENIS_LABEL[item.jenis] || item.jenis}</Badge>
                    {item.status === "revoked" ? (
                      <Badge variant="destructive"><Ban size={12} className="mr-1" /> Dibatalkan</Badge>
                    ) : (
                      <Badge variant="default" className="bg-primary/10 text-primary border-primary/30">Aktif</Badge>
                    )}
                  </div>
                  <p className="font-semibold text-foreground truncate">{item.judul}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.kode}
                    {item.penerima ? ` · ${item.penerima}` : ""}
                    {item.nomor ? ` · No. ${item.nomor}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Terbit: {fmt(item.tanggal_terbit)} · Kadaluarsa: {fmt(item.tanggal_kadaluarsa)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === item.id || item.status === "revoked"}
                    onClick={() => revoke(item)}
                  >
                    <Ban size={14} /> Batalkan
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={busyId === item.id}
                    onClick={() => remove(item)}
                  >
                    <Trash2 size={14} /> Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => goPage(page - 1)}
          >
            Sebelumnya
          </Button>
          <span className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => goPage(page + 1)}
          >
            Berikutnya
          </Button>
        </div>
      )}

      {showForm && (
        <DocumentForm
          jenisOptions={jenisOptions}
          onClose={() => setShowForm(false)}
          onCreated={(item) => { setShowForm(false); setCreated(item); load(); }}
        />
      )}

      {created && (
        <CreatedDialog item={created} onClose={() => setCreated(null)} />
      )}
    </div>
  );
}

function DocumentForm({ jenisOptions, onClose, onCreated }) {
  const [form, setForm] = useState({
    jenis: jenisOptions[0],
    judul: "",
    nomor: "",
    penerima: "",
    penerbit: "",
    keterangan: "",
    tanggal_terbit: "",
    tanggal_kadaluarsa: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = { ...form };
    if (!payload.tanggal_terbit) delete payload.tanggal_terbit;
    if (!payload.tanggal_kadaluarsa) delete payload.tanggal_kadaluarsa;
    const res = await fetch("/api/admin/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Gagal menyimpan dokumen.");
      return;
    }
    onCreated(data.item);
  }

  const fields = [
    { key: "nomor", label: "Nomor dokumen" },
    { key: "penerima", label: "Penerima" },
    { key: "penerbit", label: "Penerbit" },
    { key: "keterangan", label: "Keterangan" },
  ];

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-background w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-border max-h-[92vh] overflow-y-auto">
        <form onSubmit={submit} className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Tambah Dokumen</h2>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">Tutup</button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
              <AlertTriangle size={16} className="mt-0.5" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Jenis dokumen</Label>
              <select
                value={form.jenis}
                onChange={(e) => set("jenis", e.target.value)}
                className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {jenisOptions.map((j) => (
                  <option key={j} value={j}>{JENIS_LABEL[j]}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <Label>Judul <span className="text-destructive">*</span></Label>
              <Input value={form.judul} onChange={(e) => set("judul", e.target.value)} required className="mt-1.5" />
            </div>

            {fields.map((f) => (
              <div key={f.key}>
                <Label>{f.label}</Label>
                <Input value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} className="mt-1.5" />
              </div>
            ))}

            <div>
              <Label>Tanggal terbit</Label>
              <Input type="date" value={form.tanggal_terbit} onChange={(e) => set("tanggal_terbit", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Tanggal kadaluarsa</Label>
              <Input type="date" value={form.tanggal_kadaluarsa} onChange={(e) => set("tanggal_kadaluarsa", e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11">Batal</Button>
            <Button type="submit" disabled={saving} className="flex-1 h-11">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Menyimpan…</> : "Simpan Dokumen"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreatedDialog({ item, onClose }) {
  const qrUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/verify?kode=${encodeURIComponent(item.kode)}`;
  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
            <CheckCircle2 size={26} />
          </div>
          <h2 className="font-bold text-foreground">Dokumen dibuat</h2>
          <p className="text-sm text-muted-foreground mt-1">{item.judul}</p>
          <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Kode dokumen</p>
            <p className="font-mono font-bold text-foreground break-all">{item.kode}</p>
          </div>
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="bg-white p-3 rounded-lg">
              <QRCodeSVG value={qrUrl} size={132} />
            </div>
            <p className="text-xs text-muted-foreground">Pindai untuk membuka halaman verifikasi.</p>
          </div>
          <Button onClick={onClose} className="mt-5 w-full h-11">Selesai</Button>
        </CardContent>
      </Card>
    </div>
  );
}
