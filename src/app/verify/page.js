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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#6B5E52]">Memuat…</div>}>
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
    <div className="min-h-screen bg-[#FBF6EE] text-[#3A2E25] flex flex-col">
      <header className="sticky top-0 z-50 bg-[#FBF6EE]/90 backdrop-blur border-b border-[#E5DDD0]">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#5B3A1F] flex items-center justify-center overflow-hidden">
              <LogoImage size={28} />
            </div>
            <span className="font-bold text-[#3A2E25] text-sm">Dewan Ambalan</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/verify"
              className="text-sm font-medium text-[#6B5E52] hover:text-[#5B3A1F] transition-colors"
            >
              Verifikasi
            </Link>
            <Link
              href="/admin"
              className="text-sm font-medium text-[#6B5E52] hover:text-[#5B3A1F] transition-colors"
            >
              Admin
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#5B3A1F] hover:bg-[#4A2F18] text-[#FBF6EE] text-sm font-semibold transition-colors"
            >
              Masuk
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-10 sm:py-14">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-[#EDE3D6] text-[#5B3A1F] text-xs font-semibold px-3.5 py-1.5 rounded-full mb-3">
              <ShieldCheck size={14} />
              Layanan Resmi Dewan Ambalan
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Verifikasi Dokumen
            </h1>
            <p className="text-[#6B5E52] text-sm mt-2 leading-relaxed">
              Masukkan kode unik yang tertera pada dokumen atau pindai QR code.
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2 rounded-xl border border-[#E5DDD0] bg-white p-2 shadow-sm">
              <input
                id="kode"
                value={kode}
                onChange={(e) => setKode(e.target.value)}
                placeholder="SRT-2026-TQUIKT"
                autoComplete="off"
                className="flex-1 h-11 px-3 bg-transparent text-sm outline-none placeholder:text-[#6B5E52]"
              />
              <Button
                type="submit"
                disabled={status === "loading"}
                className="h-11 rounded-lg bg-[#5B3A1F] hover:bg-[#4A2F18] text-[#FBF6EE] shadow-none"
              >
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
            </div>

            <div className="flex items-center gap-3 text-xs text-[#6B5E52]">
              <span className="h-px flex-1 bg-[#E5DDD0]" />
              atau
              <span className="h-px flex-1 bg-[#E5DDD0]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jenis" className="text-[#6B5E52]">Jenis dokumen</Label>
                <select
                  id="jenis"
                  value={jenis}
                  onChange={(e) => setJenis(e.target.value)}
                  className="mt-1.5 flex h-11 w-full rounded-lg border border-[#E5DDD0] bg-white px-3 py-1 text-sm text-[#3A2E25] shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-[#5B3A1F]"
                >
                  {JENIS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="nomor" className="text-[#6B5E52]">Nomor dokumen</Label>
                <Input
                  id="nomor"
                  value={nomor}
                  onChange={(e) => setNomor(e.target.value)}
                  placeholder="Nomor dokumen"
                  className="mt-1.5 h-11 rounded-lg border-[#E5DDD0]"
                />
              </div>
            </div>
          </form>

          {status === "valid" && result?.jitem && (
            <ResultCard tone="valid" message={message} item={result.jitem} qrUrl={qrUrl} />
          )}
          {status === "invalid" && result?.jitem && (
            <ResultCard tone="invalid" message={message} item={result.jitem} qrUrl={qrUrl} />
          )}
          {status === "notfound" && (
            <Card className="mt-5 border-[#C62828]/50 bg-white">
              <CardContent className="p-5 flex items-start gap-3">
                <AlertTriangle className="text-[#C62828] mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-[#C62828]">Dokumen tidak ditemukan</p>
                  <p className="text-sm text-[#6B5E52] mt-1">
                    {message || "Periksa kembali kode atau nomor dokumen yang dimasukkan."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {history.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold flex items-center gap-2 text-[#3A2E25]">
                  <History size={16} className="text-[#6B5E52]" />
                  Riwayat scan
                </h2>
                <Button variant="ghost" size="sm" onClick={clearHistory} className="h-8 text-[#6B5E52] hover:text-[#5B3A1F]">
                  <Trash2 size={14} />
                  Bersihkan
                </Button>
              </div>
              <ul className="flex flex-col gap-2">
                {history.map((h) => (
                  <li
                    key={h.kode + h.time}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#E5DDD0] bg-white px-3 py-2"
                  >
                    <Link href={`/verify?kode=${encodeURIComponent(h.kode)}`} className="min-w-0">
                      <p className="text-sm font-medium truncate text-[#3A2E25]">{h.judul || h.kode}</p>
                      <p className="text-xs text-[#6B5E52] truncate">
                        {JENIS_LABEL[h.jenis] || h.jenis} · {h.kode}
                      </p>
                    </Link>
                    {h.valid ? (
                      <Badge className="shrink-0 bg-[#0F6B3C]/10 text-[#0F6B3C] border-[#0F6B3C]/30">
                        <CheckCircle2 size={12} className="mr-1" /> Sah
                      </Badge>
                    ) : (
                      <Badge className="shrink-0 bg-[#C62828] text-white border-transparent">
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

      <footer className="bg-[#5B3A1F] text-[#FBF6EE]">
        <div className="max-w-3xl mx-auto px-4 py-5 text-center text-xs">
          <p>&copy; 2026 Dewan Ambalan &mdash; Layanan Verifikasi Resmi</p>
        </div>
      </footer>
    </div>
  );
}

function ResultCard({ tone, message, item, qrUrl }) {
  const valid = tone === "valid";
  return (
    <Card className={`mt-5 ${valid ? "border-[#0F6B3C] bg-white" : "border-[#C62828]/50 bg-white"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {valid ? (
            <span className="inline-flex items-center gap-1.5 bg-[#0F6B3C] text-white text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full">
              <CheckCircle2 size={14} /> Dokumen Terverifikasi
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-[#C62828] text-white text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full">
              <XCircle size={14} /> Dokumen Tidak Valid
            </span>
          )}
          <span className="text-xs text-[#6B5E52]">
            {JENIS_LABEL[item.jenis] || item.jenis}
          </span>
        </div>
        {message && <p className="text-sm text-[#6B5E52] mt-2">{message}</p>}
      </CardHeader>
      <CardContent className="pt-0">
        <dl className="divide-y divide-[#E5DDD0]">
          <Row label="Jenis" value={JENIS_LABEL[item.jenis] || item.jenis} />
          <Row label="Kode" value={item.kode} />
          <Row label="Nomor" value={item.nomor} />
          <Row label="Nama" value={item.penerima} />
          <Row label="Penerbit" value={item.penerbit} />
          <Row label="Status" value={item.status} />
          <Row label="Diterbitkan" value={fmt(item.tanggal_terbit)} />
          <Row label="Kadaluarsa" value={fmt(item.tanggal_kadaluarsa)} />
          {item.keterangan && <Row label="Keterangan" value={item.keterangan} />}
        </dl>

        {qrUrl && (
          <div className="mt-5 flex flex-col items-center gap-2 border-t border-[#E5DDD0] pt-4">
            <div className="bg-white p-3 rounded-lg border border-[#E5DDD0]">
              <QRCodeSVG value={qrUrl} size={132} />
            </div>
            <p className="text-xs text-[#6B5E52] text-center">
              Pindai untuk membuka verifikasi dokumen ini.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-xs text-[#6B5E52]">{label}</dt>
      <dd className="text-sm font-medium text-[#3A2E25] text-right break-words">{value || "-"}</dd>
    </div>
  );
}