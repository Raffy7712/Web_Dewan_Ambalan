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
      // Reset form
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Generate Voucher & Sertifikat
          </h1>
          <p className="text-gray-600">
            Admin panel untuk membuat voucher dan sertifikat dengan kode unik
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <form onSubmit={handleGenerate}>
              {/* Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipe Item
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="voucher"
                      checked={type === 'voucher'}
                      onChange={(e) => setType(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-2 text-gray-700">Voucher</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="certificate"
                      checked={type === 'certificate'}
                      onChange={(e) => setType(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-2 text-gray-700">Sertifikat</span>
                  </label>
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Common Fields */}
              {type === 'voucher' ? (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Voucher *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Contoh: Diskon 20% Produk Unggulan"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deskripsi
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detail voucher..."
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kadaluarsa
                    </label>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Penerima *
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Nama lengkap penerima"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jenis Sertifikat *
                    </label>
                    <select
                      value={certificateType}
                      onChange={(e) => setCertificateType(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Pilih Jenis --</option>
                      <option value="Penghargaan">Penghargaan</option>
                      <option value="Sertifikat Keahlian">Sertifikat Keahlian</option>
                      <option value="Sertifikat Partisipasi">Sertifikat Partisipasi</option>
                      <option value="Piagam Penghargaan">Piagam Penghargaan</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dewan Ambalan
                    </label>
                    <input
                      type="text"
                      value={dewanAmbalan}
                      onChange={(e) => setDewanAmbalan(e.target.value)}
                      placeholder="Nama dewan ambalan"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                {loading ? 'Membuat...' : 'Generate'}
              </button>
            </form>
          </div>

          {/* Results Preview */}
          {generated && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Hasil ({generated.count})
              </h2>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-medium">
                  ✓ Berhasil membuat {generated.count} {type}
                </p>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {generated.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    <p className="font-mono font-bold text-blue-600">
                      {item.code}
                    </p>
                    <p className="text-sm text-gray-700">
                      {item.title || item.recipient_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleDownloadCsv}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Download CSV
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
