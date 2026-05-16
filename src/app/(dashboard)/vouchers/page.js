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
        className="inline-flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 hover:underline mb-4"
      >
        <ArrowLeft size={16} />
        Kembali ke beranda
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center">
            <ClipboardCheck size={20} className="text-emerald-700 dark:text-emerald-300" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
              Verifikasi Voucher
            </h1>
          </div>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Masukkan kode voucher untuk memverifikasi validitasnya. Voucher diterbitkan oleh Dewan Ambalan.
        </p>
      </div>

      {/* Code Input */}
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-5 md:p-6 mb-6">
        <form id="verify-voucher-form" onSubmit={handleVerify}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Kode Voucher
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Contoh: VCH-2026-ABC123"
              className="w-full px-4 py-2.5 border border-[var(--border-primary)] rounded-lg bg-[var(--surface-app)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm"
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
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                scanned.valid ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            >
              {scanned.valid ? <CheckCircle size={18} /> : <XCircle size={18} />}
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {scanned.valid ? 'Valid' : 'Tidak Valid'}
            </h2>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--text-primary)]">Pesan:</span> {scanned.message}
            </p>
            <p className="text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--text-primary)]">Tipe:</span> Voucher
            </p>
            <p className="text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--text-primary)]">Kode:</span> <span className="font-mono text-emerald-600 dark:text-emerald-400">{scanned.item.code}</span>
            </p>
            <p className="text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--text-primary)]">Nama:</span> {scanned.item.title}
            </p>
            {scanned.item.description && (
              <p className="text-[var(--text-secondary)]">
                <span className="font-medium text-[var(--text-primary)]">Deskripsi:</span> {scanned.item.description}
              </p>
            )}
            <p className="text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--text-primary)]">Status:</span> {scanned.item.status}
            </p>
            {scanned.item.expires_at && (
              <p className="text-[var(--text-secondary)]">
                <span className="font-medium text-[var(--text-primary)]">Kadaluarsa:</span>{' '}
                {new Date(scanned.item.expires_at).toLocaleDateString('id-ID')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <History size={17} className="text-[var(--text-muted)]" />
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Riwayat Pemindaian ({scanHistory.length})
            </h2>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {scanHistory.map((scan, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border-l-4 ${
                  scan.valid
                    ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500'
                    : 'bg-red-50 dark:bg-red-900/10 border-red-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono text-sm font-medium text-[var(--text-primary)]">{scan.code}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{scan.timestamp}</p>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      scan.valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
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
