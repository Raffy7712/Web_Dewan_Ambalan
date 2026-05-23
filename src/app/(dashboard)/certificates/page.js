'use client';

import { useState, useRef, useEffect } from 'react';
import { Award, CheckCircle, XCircle, History, ArrowLeft, Download, QrCode, Copy } from 'lucide-react';
import Link from 'next/link';
import { QRCodeCanvas } from 'qrcode.react';

/* ── QR Code Download Helper ────────────────────────────── */
function downloadQRCode(canvasContainer, filename) {
  const canvas = canvasContainer?.querySelector('canvas');
  if (!canvas) return;
  const url = canvas.toDataURL('image/png', 1.0);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function CertificateVerificationPage() {
  const [scanned, setScanned] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [code, setCode] = useState('');
  const qrRef = useRef(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          nomor_sertifikat: code.trim().includes('/') ? code.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verifikasi gagal');
        return;
      }

      // Hanya tampilkan jika tipe certificate
      if (data.type && data.type !== 'certificate') {
        setError('Kode ini bukan sertifikat. Untuk verifikasi voucher, gunakan halaman Verifikasi Voucher.');
        return;
      }

      setScanned(data);
      setScanHistory([
        {
          timestamp: new Date().toLocaleString('id-ID'),
          code: code.trim(),
          valid: data.valid,
          type: data.type,
        },
        ...scanHistory,
      ]);
      setCode('');
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if code param exists in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      setCode(codeParam);
      setTimeout(() => {
        const form = document.getElementById('verify-cert-form');
        if (form) form.requestSubmit();
      }, 300);
    }
  }, []);

  const verifyUrl = scanned?.item?.code
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://da-alf.web.id'}/certificates?code=${scanned.item.code}`
    : '';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      {/* Back Link */}
      <Link
        href="/home"
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-4"
      >
        <ArrowLeft size={16} />
        Kembali ke beranda
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Award size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Verifikasi Sertifikat
            </h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Masukkan kode sertifikat atau nomor sertifikat untuk memverifikasi validitasnya. Sertifikat diterbitkan oleh Dewan Ambalan untuk anggota Pramuka.
        </p>
      </div>

      {/* Code Input */}
      <div className="rounded-xl border border-border bg-card p-5 md:p-6 mb-6">
        <form id="verify-cert-form" onSubmit={handleVerify}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Kode / Nomor Sertifikat
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Contoh: CERT-2026-ABC123 atau 001/11.29.02.165-02.166-C/2026"
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted-foreground/20 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Memverifikasi...' : 'Verifikasi Sertifikat'}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <XCircle size={18} className="text-red-500" />
            <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Verification Result */}
      {scanned && (
        <div
          className={`rounded-xl border p-5 md:p-6 mb-6 ${
            scanned.valid
              ? 'bg-primary/5 border-primary/20'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                scanned.valid ? 'bg-primary' : 'bg-red-500'
              }`}
            >
              {scanned.valid ? <CheckCircle size={18} /> : <XCircle size={18} />}
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {scanned.valid ? 'Valid' : 'Tidak Valid'}
            </h2>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Pesan:</span> {scanned.message}
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Tipe:</span> Sertifikat
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Kode:</span> <span className="font-mono text-primary">{scanned.item.code}</span>
            </p>

            {scanned.item.nomor_sertifikat && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">No. Sertifikat:</span> <span className="font-medium">{scanned.item.nomor_sertifikat}</span>
              </p>
            )}
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Nama:</span> {scanned.item.recipient_name}
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Jenis:</span> {scanned.item.certificate_type}
            </p>
            {scanned.item.dewan_ambalan && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Penerbit:</span> {scanned.item.dewan_ambalan}
              </p>
            )}
            {scanned.item.description && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Deskripsi:</span> {scanned.item.description}
              </p>
            )}
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Status:</span> {scanned.item.status}
            </p>
          </div>

          {/* QR Code for verified certificate */}
          {scanned.valid && (
            <div className="mt-5 pt-4 border-t border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <QrCode size={16} className="text-primary" />
                <p className="text-sm font-semibold text-foreground">QR Code Verifikasi</p>
              </div>
              <div className="flex flex-col items-center">
                <div ref={qrRef} className="inline-block p-3 bg-white rounded-lg border border-border">
                  <QRCodeCanvas value={verifyUrl} size={160} level="M" includeMargin={false} bgColor="#ffffff" fgColor="#000000" />
                </div>
                <button
                  onClick={() => downloadQRCode(qrRef.current, `QR-${scanned.item.code}.png`)}
                  className="mt-3 inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                >
                  <Download size={14} /> Download QR
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <History size={17} className="text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">
              Riwayat Pemindaian ({scanHistory.length})
            </h2>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {scanHistory.map((scan, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border-l-4 ${
                  scan.valid
                    ? 'bg-primary/5 border-primary'
                    : 'bg-red-50 dark:bg-red-900/10 border-red-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono text-sm font-medium text-foreground">{scan.code}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{scan.timestamp}</p>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      scan.valid ? 'text-primary' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {scan.valid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
