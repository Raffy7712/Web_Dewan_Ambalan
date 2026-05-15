'use client';

import { useState, useRef, useEffect } from 'react';

export default function VoucherScannerPage() {
  const [scanned, setScanned] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [code, setCode] = useState('');
  const fileInputRef = useRef(null);

  // Manual code input
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/vouchers/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          verification_type: 'code',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Verifikasi Voucher & Sertifikat
          </h1>
          <p className="text-gray-600">
            Scan atau masukkan kode voucher/sertifikat untuk memverifikasi validitasnya
          </p>
        </div>

        {/* Manual Code Input */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <form onSubmit={handleVerify}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kode Voucher/Sertifikat
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Contoh: VCH-2025-ABC123"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              {loading ? 'Memverifikasi...' : 'Verifikasi'}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Verification Result */}
        {scanned && (
          <div
            className={`rounded-lg shadow-lg p-6 mb-6 border-l-4 ${
              scanned.valid
                ? 'bg-green-50 border-green-500'
                : 'bg-red-50 border-red-500'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  scanned.valid ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                {scanned.valid ? '✓' : '✗'}
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                {scanned.valid ? 'Valid' : 'Tidak Valid'}
              </h2>
            </div>

            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Pesan:</strong> {scanned.message}
              </p>
              <p>
                <strong>Tipe:</strong> {scanned.type === 'voucher' ? 'Voucher' : 'Sertifikat'}
              </p>
              <p>
                <strong>Kode:</strong> {scanned.item.code}
              </p>
              <p>
                <strong>Nama:</strong> {scanned.item.title}
              </p>
              {scanned.type === 'certificate' && (
                <p>
                  <strong>Penerima:</strong> {scanned.item.recipient_name}
                </p>
              )}
              <p>
                <strong>Status:</strong> {scanned.item.status}
              </p>
              {scanned.item.expires_at && (
                <p>
                  <strong>Kadaluarsa:</strong>{' '}
                  {new Date(scanned.item.expires_at).toLocaleDateString('id-ID')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Riwayat Pemindaian ({scanHistory.length})
            </h2>
            <div className="space-y-2">
              {scanHistory.map((scan, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-l-4 ${
                    scan.valid
                      ? 'bg-green-50 border-green-500'
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{scan.code}</p>
                      <p className="text-sm text-gray-600">{scan.timestamp}</p>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        scan.valid ? 'text-green-600' : 'text-red-600'
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
    </div>
  );
}
