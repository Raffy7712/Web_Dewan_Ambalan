"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import LogoImage from "@/components/LogoImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Loader2,
  ShieldCheck,
  History,
  Trash2,
} from "lucide-react";

const JENIS = [
  { value: "", label: "Pilih jenis dokumen" },
  { value: "sertifikat", label: "Sertifikat" },
  { value: "piagam", label: "Piagam" },
  { value: "surat", label: "Surat" },
  { value: "voucher", label: "Voucher" },
];

const JENIS_LABEL = {
  sertifikat: "Sertifikat",
  piagam: "Piagam",
  surat: "Surat",
  voucher: "Voucher",
};

const HISTORY_KEY = "verify_history";

function fmt(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Memuat…</div>}>
      <VerifyForm />
    </Suspense>
  );
}

function VerifyForm() {
  const searchParams = useSearchParams();
  const [kode, setKode] = useState(searchParams.get("kode") ?? "");
  const [jenis, setJenis] = useState(searchParams.get("jenis") ?? "");
  const [nomor, setNomor] = useState("");
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    const k = searchParams.get("kode");
    const j = searchParams.get("jenis");
    if (k && k !== kode) {
      setKode(k);
      setJenis(j ?? "");
      submit(k, j ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pushHistory(item) {
    const next = [item, ...history.filter((h) => h.kode !== item.kode)].slice(0, 10);
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {}
  }

  async function submit(k, j) {
    const body = {};
    if (k) body.kode = k;
    else if (j && nomor) {
      body.nomor = nomor;
      body.jenis = j;
    } else {
      setMessage("Masukkan kode dokumen, atau pilih jenis dan isi nomor dokumen.");
      setStatus("idle");
      return;
    }

    setStatus("loading");
    setMessage("");
    setResult(null);
    try {
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.status === 404 || res.status === 429) {
        setStatus("notfound");
        setMessage(data.message || "Dokumen tidak ditemukan");
        return;
      }
      if (!data.ok) {
        setStatus("notfound");
        setMessage(data.message || data.error || "Dokumen tidak ditemukan");
        return;
      }
      setResult(data);
      setStatus(data.valid ? "valid" : "invalid");
      setMessage(data.message || "");
      if (data.jitem?.kode) {
        pushHistory({
          kode: data.jitem.kode,
          jenis: data.jitem.jenis,
          judul: data.jitem.judul,
          valid: data.valid,
          time: Date.now(),
        });
      }
    } catch {
      setStatus("notfound");
      setMessage("Gagal terhubung ke server. Coba lagi nanti.");
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    submit(kode.trim(), jenis);
  }

  function clearHistory() {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {}
  }

  const qrUrl = result?.jitem?.kode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/verify?kode=${encodeURIComponent(result.jitem.kode)}`
    : "";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center">
              <LogoImage size={32} />
            </div>
            <span className="font-bold text-foreground text-sm">Verifikasi Dokumen</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Beranda
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/30 text-secondary text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
              <ShieldCheck size={14} />
              Verifikasi Keaslian Dokumen
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold">
              Cek Keaslian Dokumen
            </h1>
            <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
              Masukkan kode dokumen, atau pilih jenis dan nomor dokumen untuk
              memastikan dokumen sah.
            </p>
          </div>

          <Card>
            <CardContent className="p-5 sm:p-6">
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="kode">Kode dokumen</Label>
                  <Input
                    id="kode"
                    value={kode}
                    onChange={(e) => setKode(e.target.value)}
                    placeholder="Contoh: SRT-2026-AB12CD"
                    autoComplete="off"
                    className="mt-1.5"
                  />
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  atau
                  <span className="h-px flex-1 bg-border" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jenis">Jenis dokumen</Label>
                    <select
                      id="jenis"
                      value={jenis}
                      onChange={(e) => setJenis(e.target.value)}
                      className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {JENIS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="nomor">Nomor dokumen</Label>
                    <Input
                      id="nomor"
                      value={nomor}
                      onChange={(e) => setNomor(e.target.value)}
                      placeholder="Nomor dokumen"
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={status === "loading"} className="h-11">
                  {status === "loading" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Memeriksa…
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      Verifikasi
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {status === "valid" && result?.jitem && (
            <ResultCard tone="valid" message={message} item={result.jitem} qrUrl={qrUrl} />
          )}
          {status === "invalid" && result?.jitem && (
            <ResultCard tone="invalid" message={message} item={result.jitem} qrUrl={qrUrl} />
          )}
          {status === "notfound" && (
            <Card className="mt-5 border-destructive/40">
              <CardContent className="p-5 flex items-start gap-3">
                <AlertTriangle className="text-destructive mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-destructive">Dokumen tidak ditemukan</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {message || "Periksa kembali kode atau nomor dokumen yang dimasukkan."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {history.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <History size={16} className="text-muted-foreground" />
                  Riwayat scan
                </h2>
                <Button variant="ghost" size="sm" onClick={clearHistory} className="h-8">
                  <Trash2 size={14} />
                  Bersihkan
                </Button>
              </div>
              <ul className="flex flex-col gap-2">
                {history.map((h) => (
                  <li
                    key={h.kode + h.time}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <Link href={`/verify?kode=${encodeURIComponent(h.kode)}`} className="min-w-0">
                      <p className="text-sm font-medium truncate">{h.judul || h.kode}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {JENIS_LABEL[h.jenis] || h.jenis} · {h.kode}
                      </p>
                    </Link>
                    {h.valid ? (
                      <Badge variant="default" className="shrink-0 bg-primary/10 text-primary border-primary/30">
                        <CheckCircle2 size={12} className="mr-1" /> Sah
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="shrink-0">
                        <XCircle size={12} className="mr-1" /> Tidak sah
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-card border-t border-border py-5 px-4 text-center">
        <p className="text-muted-foreground text-xs">
          &copy; {new Date().getFullYear()} Dewan Ambalan SMK Al Furqon Bantarkawung.
        </p>
      </footer>
    </div>
  );
}

function ResultCard({ tone, message, item, qrUrl }) {
  const valid = tone === "valid";
  return (
    <Card className={`mt-5 ${valid ? "border-primary/40" : "border-destructive/40"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {valid ? (
            <Badge variant="default" className="bg-primary/10 text-primary border-primary/30">
              <CheckCircle2 size={14} className="mr-1" /> Dokumen Sah
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle size={14} className="mr-1" /> Tidak Valid
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {JENIS_LABEL[item.jenis] || item.jenis}
          </span>
        </div>
        {message && <p className="text-sm text-muted-foreground mt-2">{message}</p>}
      </CardHeader>
      <CardContent className="pt-0">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Field label="Judul" value={item.judul} />
          <Field label="Kode" value={item.kode} />
          <Field label="Nomor" value={item.nomor} />
          <Field label="Penerima" value={item.penerima} />
          <Field label="Penerbit" value={item.penerbit} />
          <Field label="Status" value={item.status} />
          <Field label="Tanggal terbit" value={fmt(item.tanggal_terbit)} />
          <Field label="Tanggal kadaluarsa" value={fmt(item.tanggal_kadaluarsa)} />
          {item.keterangan && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Keterangan</dt>
              <dd className="mt-0.5">{item.keterangan}</dd>
            </div>
          )}
        </dl>

        {qrUrl && (
          <div className="mt-5 flex flex-col items-center gap-2 border-t border-border pt-4">
            <div className="bg-white p-3 rounded-lg">
              <QRCodeSVG value={qrUrl} size={132} />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Pindai untuk membuka verifikasi dokumen ini.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words">{value || "-"}</dd>
    </div>
  );
}

