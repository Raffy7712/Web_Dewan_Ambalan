'use client';

import { useState } from 'react';

export default function AdminVouchersPage() {
  const [type, setType] = useState('voucher');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [recipientName, setRecipientName] = useState('');
  const [certificateType, setCertificateType] = useState('');
  const [dewanAmbalan, setDewanAmbalan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generated, setGenerated] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        type,
        title,
        description,
        quantity: parseInt(quantity),
        ...(type === 'voucher' && {
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
        ...(type === 'certificate' && {
          recipient_name: recipientName,
          certificate_type: certificateType,
          dewan_ambalan: dewanAmbalan,
        }),
      };

      const res = await fetch('/api/vouchers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal membuat item');
        return;
      }

      setGenerated(data);
      if (type === 'voucher') {
        setTitle('');
        setDescription('');
        setExpiresAt('');
      } else {
        setRecipientName('');
        setCertificateType('');
        setDewanAmbalan('');
      }
      setQuantity(1);
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!generated?.items) return;

    const headers = ['Code', 'Title', 'Status', 'Created At'];
    const rows = generated.items.map((item) => [
      item.code,
      item.title || item.recipient_name,
      item.status,
      new Date(item.created_at).toLocaleString('id-ID'),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-1">
          Voucher & Sertifikat
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Generate voucher dan sertifikat dengan kode unik untuk verifikasi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-5 md:p-6">
          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                Tipe Item
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="voucher"
                    checked={type === 'voucher'}
                    onChange={(e) => setType(e.target.value)}
                    className="w-4 h-4 text-emerald-600 accent-emerald-600"
                  />
                  <span className="text-sm text-[var(--text-primary)]">Voucher</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="certificate"
                    checked={type === 'certificate'}
                    onChange={(e) => setType(e.target.value)}
                    className="w-4 h-4 text-emerald-600 accent-emerald-600"
                  />
                  <span className="text-sm text-[var(--text-primary)]">Sertifikat</span>
                </label>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Jumlah
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                max="100"
                className="w-full px-4 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--surface-app)] text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Voucher Fields */}
            {type === 'voucher' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Nama Voucher *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Diskon 20% Produk Unggulan"
                    required
                    className="w-full px-4 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--surface-app)] text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detail voucher..."
                    rows="3"
                    className="w-full px-4 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--surface-app)] text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Kadaluarsa
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-4 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--surface-app)] text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Nama Penerima *
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Nama lengkap penerima"
                    required
                    className="w-full px-4 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--surface-app)] text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Jenis Sertifikat *
                  </label>
                  <select
                    value={certificateType}
                    onChange={(e) => setCertificateType(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--surface-app)] text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">-- Pilih Jenis --</option>
                    <option value="Penghargaan">Penghargaan</option>
                    <option value="Sertifikat Keahlian">Sertifikat Keahlian</option>
                    <option value="Sertifikat Partisipasi">Sertifikat Partisipasi</option>
                    <option value="Piagam Penghargaan">Piagam Penghargaan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Dewan Ambalan
                  </label>
                  <input
                    type="text"
                    value={dewanAmbalan}
                    onChange={(e) => setDewanAmbalan(e.target.value)}
                    placeholder="Nama dewan ambalan"
                    className="w-full px-4 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--surface-app)] text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg p-4">
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white font-bold py-2.5 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Membuat...' : 'Generate'}
            </button>
          </form>
        </div>

        {/* Results Preview */}
        {generated && (
          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-5 md:p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
              Hasil ({generated.count})
            </h2>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-lg p-4 mb-4">
              <p className="text-emerald-700 dark:text-emerald-300 font-medium text-sm">
                Berhasil membuat {generated.count} {type}
              </p>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {generated.items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[var(--surface-app)] rounded-lg p-3 border border-[var(--border-primary)]"
                >
                  <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {item.code}
                  </p>
                  <p className="text-sm text-[var(--text-primary)] mt-0.5">
                    {item.title || item.recipient_name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {new Date(item.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={handleDownloadCsv}
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Download CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
