'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Download, Package, ArrowLeft } from 'lucide-react';

export default function InventoryListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [condition, setCondition] = useState('');
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0 });

  useEffect(() => {
    fetchItems();
  }, [search, condition, pagination.offset]);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: pagination.limit,
        offset: pagination.offset,
      });

      if (search) params.append('search', search);
      if (condition) params.append('condition', condition);

      const res = await fetch(`/api/inventory/items?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal mengambil data');
        return;
      }

      setItems(data.items || []);
      setPagination(data.pagination);
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-1">
          Inventaris Sarana Prasarana
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Kelola barang inventaris, riwayat perawatan, dan pengecekan berkala.
        </p>
      </div>

      {/* Actions Bar */}
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {pagination.total} item terdaftar
            </span>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/inventory/create"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
            >
              <Plus size={16} />
              Tambah Item
            </Link>
            <Link
              href="/admin/inventory/export"
              className="inline-flex items-center gap-2 bg-[var(--surface-app)] border border-[var(--border-primary)] hover:border-emerald-500 text-[var(--text-primary)] font-medium py-2 px-4 rounded-lg text-sm transition-colors"
            >
              <Download size={16} />
              Export
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Cari kode atau nama..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination({ ...pagination, offset: 0 });
              }}
              className="w-full pl-9 pr-4 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--surface-app)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <select
            value={condition}
            onChange={(e) => {
              setCondition(e.target.value);
              setPagination({ ...pagination, offset: 0 });
            }}
            className="w-full px-4 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--surface-app)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Semua Kondisi</option>
            <option value="baik">Baik</option>
            <option value="perlu_perbaikan">Perlu Perbaikan</option>
            <option value="rusak">Rusak</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Items Table */}
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-[var(--text-secondary)]">Memuat data...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <Package size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
            <p className="text-[var(--text-secondary)]">Tidak ada item ditemukan</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--surface-muted)] border-b border-[var(--border-primary)]">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Kode
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Kondisi
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">
                      Lokasi
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">
                      Qty
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-primary)]">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--surface-muted)] transition-colors">
                      <td className="px-4 md:px-6 py-3 font-mono text-sm text-emerald-600 dark:text-emerald-400">
                        {item.code}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-[var(--text-primary)]">
                        {item.name}
                      </td>
                      <td className="px-4 md:px-6 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getConditionBadge(
                            item.condition
                          )}`}
                        >
                          {getConditionLabel(item.condition)}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-[var(--text-secondary)] hidden md:table-cell">
                        {item.location || '-'}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-[var(--text-secondary)] hidden sm:table-cell">
                        {item.quantity} {item.unit || 'unit'}
                      </td>
                      <td className="px-4 md:px-6 py-3">
                        <Link
                          href={`/admin/inventory/${item.id}`}
                          className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium text-sm"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 md:px-6 py-3 border-t border-[var(--border-primary)] bg-[var(--surface-muted)] flex flex-col sm:flex-row justify-between items-center gap-2">
              <p className="text-xs text-[var(--text-muted)]">
                Menampilkan {pagination.offset + 1} -{' '}
                {Math.min(pagination.offset + pagination.limit, pagination.total)} dari{' '}
                {pagination.total} item
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination({
                      ...pagination,
                      offset: Math.max(0, pagination.offset - pagination.limit),
                    })
                  }
                  disabled={pagination.offset === 0}
                  className="px-3 py-1.5 bg-[var(--surface-elevated)] border border-[var(--border-primary)] text-[var(--text-secondary)] rounded-lg text-xs font-medium disabled:opacity-50 hover:border-emerald-500 transition-colors"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() =>
                    setPagination({
                      ...pagination,
                      offset: pagination.offset + pagination.limit,
                    })
                  }
                  disabled={
                    pagination.offset + pagination.limit >= pagination.total
                  }
                  className="px-3 py-1.5 bg-[var(--surface-elevated)] border border-[var(--border-primary)] text-[var(--text-secondary)] rounded-lg text-xs font-medium disabled:opacity-50 hover:border-emerald-500 transition-colors"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
