'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Save, Wrench, ClipboardCheck } from 'lucide-react';

export default function InventoryDetailPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
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
    return <div className="text-center p-8 text-[var(--text-secondary)]">Memuat data...</div>;
  if (!item)
    return <div className="text-center p-8 text-[var(--text-secondary)]">Item tidak ditemukan</div>;

  const getConditionBadge = (cond) => {
    switch (cond) {
      case 'baik':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
      case 'perlu_perbaikan':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
      case 'rusak':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  const getConditionLabel = (cond) => {
    switch (cond) {
      case 'baik': return 'Baik';
      case 'perlu_perbaikan': return 'Perlu Perbaikan';
      case 'rusak': return 'Rusak';
      default: return cond;
    }
  };

  const inputClass = "w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--surface-app)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
      {/* Back Link */}
      <Link
        href="/admin/inventory"
        className="inline-flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 hover:underline mb-4"
      >
        <ArrowLeft size={16} />
        Kembali ke inventaris
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-5 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">Kode Item</p>
            <p className="text-2xl md:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {item.code}
            </p>
            <h1 className="text-xl font-bold text-[var(--text-primary)] mt-2">
              {item.name}
            </h1>
            {item.description && (
              <p className="text-sm text-[var(--text-secondary)] mt-1">{item.description}</p>
            )}
          </div>
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getConditionBadge(
              item.condition
            )}`}
          >
            {getConditionLabel(item.condition)}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] mb-6 overflow-hidden">
        <div className="flex border-b border-[var(--border-primary)]">
          {[
            { key: 'overview', label: 'Overview', icon: null },
            { key: 'maintenance', label: 'Maintenance', icon: Wrench },
            { key: 'checks', label: 'Pengecekan', icon: ClipboardCheck },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.icon && <tab.icon size={15} />}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-5 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { label: 'Kategori', value: item.category_id || '-' },
              { label: 'Lokasi', value: item.location || '-' },
              { label: 'Jumlah', value: `${item.quantity} ${item.unit || 'unit'}` },
              { label: 'Tanggal Pembelian', value: item.purchase_date ? new Date(item.purchase_date).toLocaleDateString('id-ID') : '-' },
              { label: 'Harga Pembelian', value: item.purchase_price ? `Rp ${item.purchase_price.toLocaleString('id-ID')}` : '-' },
              { label: 'Pengecekan Terakhir', value: item.last_checked ? new Date(item.last_checked).toLocaleDateString('id-ID') : 'Belum pernah' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-5 md:p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Riwayat Perawatan</h2>
            <button
              onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
            >
              <Plus size={15} />
              Tambah
            </button>
          </div>

          {showMaintenanceForm && (
            <form onSubmit={handleAddMaintenance} className="mb-6 p-4 border border-[var(--border-primary)] rounded-lg bg-[var(--surface-app)] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Jenis Perawatan *
                  </label>
                  <select name="maintenance_type" required className={inputClass}>
                    <option value="">-- Pilih --</option>
                    <option value="cleaning">Pembersihan</option>
                    <option value="repair">Perbaikan</option>
                    <option value="replacement">Penggantian</option>
                    <option value="calibration">Kalibrasi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Biaya (Rp)
                  </label>
                  <input type="number" name="cost" step="0.01" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Deskripsi</label>
                <textarea name="description" rows="2" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Catatan</label>
                <textarea name="notes" rows="2" className={inputClass} />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                >
                  <Save size={14} />
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setShowMaintenanceForm(false)}
                  className="bg-[var(--surface-muted)] text-[var(--text-secondary)] font-medium py-2 px-4 rounded-lg text-sm border border-[var(--border-primary)] transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {maintenance.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Belum ada riwayat perawatan</p>
            ) : (
              maintenance.map((m) => (
                <div
                  key={m.id}
                  className="border border-[var(--border-primary)] rounded-lg p-4 hover:bg-[var(--surface-muted)] transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-[var(--text-primary)] text-sm">
                        {m.maintenance_type}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">{m.description}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {new Date(m.maintenance_date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    {m.cost && (
                      <p className="font-bold text-[var(--text-primary)] text-sm">
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
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-5 md:p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Riwayat Pengecekan</h2>
            <button
              onClick={() => setShowCheckForm(!showCheckForm)}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
            >
              <Plus size={15} />
              Tambah
            </button>
          </div>

          {showCheckForm && (
            <form onSubmit={handleAddCheck} className="mb-6 p-4 border border-[var(--border-primary)] rounded-lg bg-[var(--surface-app)] space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Kondisi *
                </label>
                <select name="condition" required className={inputClass}>
                  <option value="">-- Pilih --</option>
                  <option value="baik">Baik</option>
                  <option value="perlu_perbaikan">Perlu Perbaikan</option>
                  <option value="rusak">Rusak</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Catatan</label>
                <textarea name="notes" rows="2" className={inputClass} />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="requires_maintenance"
                    className="w-4 h-4 text-emerald-600 accent-emerald-600"
                  />
                  <span className="text-sm text-[var(--text-primary)]">Perlu Perawatan</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                >
                  <Save size={14} />
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setShowCheckForm(false)}
                  className="bg-[var(--surface-muted)] text-[var(--text-secondary)] font-medium py-2 px-4 rounded-lg text-sm border border-[var(--border-primary)] transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {checks.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Belum ada riwayat pengecekan</p>
            ) : (
              checks.map((check) => (
                <div
                  key={check.id}
                  className={`border rounded-lg p-4 ${
                    check.condition === 'baik'
                      ? 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/10'
                      : check.condition === 'perlu_perbaikan'
                      ? 'border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10'
                      : 'border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm text-[var(--text-primary)]">
                        Kondisi:{' '}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getConditionBadge(check.condition)}`}>
                          {getConditionLabel(check.condition)}
                        </span>
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {check.notes}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-2">
                        {new Date(check.check_date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    {check.requires_maintenance && (
                      <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs px-2 py-1 rounded font-medium">
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
  );
}
