'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function InventoryDetailPage({ params }) {
  const router = useRouter();
  const { id } = params;
  const [item, setItem] = useState(null);
  const [maintenance, setMaintenance] = useState([]);
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [showCheckForm, setShowCheckForm] = useState(false);

  useEffect(() => {
    fetchItemData();
  }, [id]);

  const fetchItemData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [itemRes, mainRes, checkRes] = await Promise.all([
        fetch(`/api/inventory/items/${id}`),
        fetch(`/api/inventory/maintenance?item_id=${id}`),
        fetch(`/api/inventory/checks?item_id=${id}`),
      ]);

      if (!itemRes.ok || !mainRes.ok || !checkRes.ok) {
        setError('Gagal mengambil data');
        return;
      }

      const itemData = await itemRes.json();
      const mainData = await mainRes.json();
      const checkData = await checkRes.json();

      setItem(itemData.item);
      setMaintenance(mainData.logs || []);
      setChecks(checkData.checks || []);
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const res = await fetch('/api/inventory/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: id,
          maintenance_type: formData.get('maintenance_type'),
          description: formData.get('description'),
          cost: formData.get('cost') ? parseFloat(formData.get('cost')) : null,
          notes: formData.get('notes'),
        }),
      });

      if (res.ok) {
        setShowMaintenanceForm(false);
        fetchItemData();
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  const handleAddCheck = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const res = await fetch('/api/inventory/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: id,
          condition: formData.get('condition'),
          notes: formData.get('notes'),
          requires_maintenance: formData.get('requires_maintenance') === 'on',
        }),
      });

      if (res.ok) {
        setShowCheckForm(false);
        fetchItemData();
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  if (loading)
    return <div className="text-center p-8">Memuat data...</div>;
  if (!item)
    return <div className="text-center p-8">Item tidak ditemukan</div>;

  const getConditionColor = (cond) => {
    switch (cond) {
      case 'baik':
        return 'bg-green-100 text-green-800';
      case 'perlu_perbaikan':
        return 'bg-yellow-100 text-yellow-800';
      case 'rusak':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div className="bg-white rounded-lg shadow p-6 flex-1">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Kode Item</p>
                <p className="text-3xl font-bold font-mono text-blue-600">
                  {item.code}
                </p>
              </div>
              <span
                className={`px-4 py-2 rounded-full font-medium ${getConditionColor(
                  item.condition
                )}`}
              >
                {item.condition === 'baik'
                  ? 'Baik'
                  : item.condition === 'perlu_perbaikan'
                  ? 'Perlu Perbaikan'
                  : 'Rusak'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {item.name}
            </h1>
            {item.description && (
              <p className="text-gray-600">{item.description}</p>
            )}
          </div>

          <Link
            href="/admin/inventory"
            className="ml-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg"
          >
            ← Kembali
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            {['overview', 'maintenance', 'checks'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab === 'overview'
                  ? 'Overview'
                  : tab === 'maintenance'
                  ? 'Maintenance'
                  : 'Pengecekan'}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Kategori</p>
                <p className="text-lg font-medium">{item.category_id || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Lokasi</p>
                <p className="text-lg font-medium">{item.location || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Jumlah</p>
                <p className="text-lg font-medium">
                  {item.quantity} {item.unit || 'unit'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Tanggal Pembelian</p>
                <p className="text-lg font-medium">
                  {item.purchase_date
                    ? new Date(item.purchase_date).toLocaleDateString('id-ID')
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Harga Pembelian</p>
                <p className="text-lg font-medium">
                  {item.purchase_price
                    ? `Rp ${item.purchase_price.toLocaleString('id-ID')}`
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Pengecekan Terakhir</p>
                <p className="text-lg font-medium">
                  {item.last_checked
                    ? new Date(item.last_checked).toLocaleDateString('id-ID')
                    : 'Belum pernah'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Riwayat Perawatan</h2>
              <button
                onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                + Tambah Perawatan
              </button>
            </div>

            {showMaintenanceForm && (
              <form onSubmit={handleAddMaintenance} className="mb-6 p-4 border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Jenis Perawatan *
                    </label>
                    <select
                      name="maintenance_type"
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">-- Pilih --</option>
                      <option value="cleaning">Pembersihan</option>
                      <option value="repair">Perbaikan</option>
                      <option value="replacement">Penggantian</option>
                      <option value="calibration">Kalibrasi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Biaya (Rp)
                    </label>
                    <input
                      type="number"
                      name="cost"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    name="description"
                    rows="2"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Catatan</label>
                  <textarea
                    name="notes"
                    rows="2"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMaintenanceForm(false)}
                    className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {maintenance.length === 0 ? (
                <p className="text-gray-600">Belum ada riwayat perawatan</p>
              ) : (
                maintenance.map((m) => (
                  <div
                    key={m.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">
                          {m.maintenance_type}
                        </p>
                        <p className="text-sm text-gray-600">{m.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(m.maintenance_date).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      {m.cost && (
                        <p className="font-bold text-gray-800">
                          Rp {m.cost.toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'checks' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Riwayat Pengecekan</h2>
              <button
                onClick={() => setShowCheckForm(!showCheckForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                + Tambah Pengecekan
              </button>
            </div>

            {showCheckForm && (
              <form onSubmit={handleAddCheck} className="mb-6 p-4 border rounded-lg">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Kondisi *
                  </label>
                  <select
                    name="condition"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">-- Pilih --</option>
                    <option value="baik">Baik</option>
                    <option value="perlu_perbaikan">Perlu Perbaikan</option>
                    <option value="rusak">Rusak</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Catatan
                  </label>
                  <textarea
                    name="notes"
                    rows="2"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="requires_maintenance"
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm">Perlu Perawatan</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCheckForm(false)}
                    className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {checks.length === 0 ? (
                <p className="text-gray-600">Belum ada riwayat pengecekan</p>
              ) : (
                checks.map((check) => (
                  <div
                    key={check.id}
                    className={`border rounded-lg p-4 ${
                      check.condition === 'baik'
                        ? 'border-green-300 bg-green-50'
                        : check.condition === 'perlu_perbaikan'
                        ? 'border-yellow-300 bg-yellow-50'
                        : 'border-red-300 bg-red-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          Kondisi:{' '}
                          <span
                            className={getConditionColor(check.condition)}
                          >
                            {check.condition === 'baik'
                              ? 'Baik'
                              : check.condition === 'perlu_perbaikan'
                              ? 'Perlu Perbaikan'
                              : 'Rusak'}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {check.notes}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(check.check_date).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      {check.requires_maintenance && (
                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                          Perlu Perbaikan
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
