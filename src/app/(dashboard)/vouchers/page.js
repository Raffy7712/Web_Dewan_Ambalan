'use client';

import { useState, useRef, useEffect } from 'react';
import { ClipboardCheck, CheckCircle, XCircle, History, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function VoucherVerificationPage() {
  const [scanned, setScanned] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [code, setCode] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verifikasi gagal');
        return;
      }

      // Hanya tampilkan jika tipe voucher
      if (data.type && data.type !== 'voucher') {
        setError('Kode ini bukan voucher. Untuk verifikasi sertifikat, gunakan halaman Verifikasi Sertifikat.');
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
        const form = document.getElementById('verify-voucher-form');
        if (form) form.requestSubmit();
      }, 300);
    }
  }, []);

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
            <ClipboardCheck size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Verifikasi Voucher
            </h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Masukkan kode voucher untuk memverifikasi validitasnya. Voucher diterbitkan oleh Dewan Ambalan.
        </p>
      </div>

      {/* Code Input */}
      <div className="rounded-xl border border-border bg-card p-5 md:p-6 mb-6">
        <form id="verify-voucher-form" onSubmit={handleVerify}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Kode Voucher
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Contoh: VCH-2026-ABC123"
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted-foreground/20 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Memverifikasi...' : 'Verifikasi Voucher'}
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
              <span className="font-medium text-foreground">Tipe:</span> Voucher
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Kode:</span> <span className="font-mono text-primary">{scanned.item.code}</span>
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Nama:</span> {scanned.item.title}
            </p>
            {scanned.item.description && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Deskripsi:</span> {scanned.item.description}
              </p>
            )}
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Status:</span> {scanned.item.status}
            </p>
            {scanned.item.expires_at && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Kadaluarsa:</span>{' '}
                {new Date(scanned.item.expires_at).toLocaleDateString('id-ID')}
              </p>
            )}
          </div>
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
