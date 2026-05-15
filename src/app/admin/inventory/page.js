'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Inventaris Sarana Prasarana</h1>
            <Link
              href="/admin/inventory/create"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              + Tambah Item
            </Link>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <input
                type="text"
                placeholder="Cari kode atau nama..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination({ ...pagination, offset: 0 });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={condition}
                onChange={(e) => {
                  setCondition(e.target.value);
                  setPagination({ ...pagination, offset: 0 });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Kondisi</option>
                <option value="baik">Baik</option>
                <option value="perlu_perbaikan">Perlu Perbaikan</option>
                <option value="rusak">Rusak</option>
              </select>
            </div>
            <div>
              <Link
                href="/admin/inventory/export"
                className="w-full block text-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                📥 Export Barcode
              </Link>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Memuat data...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Tidak ada item ditemukan</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Kode
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Nama
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Kondisi
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Lokasi
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Qty
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-sm text-blue-600">
                        {item.code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">{item.name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getConditionColor(
                            item.condition
                          )}`}
                        >
                          {item.condition === 'baik'
                            ? 'Baik'
                            : item.condition === 'perlu_perbaikan'
                            ? 'Perlu Perbaikan'
                            : 'Rusak'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.location || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.quantity} {item.unit || 'unit'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href={`/admin/inventory/${item.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
                <p className="text-sm text-gray-600">
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
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
                  >
                    ← Sebelumnya
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
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
                  >
                    Berikutnya →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
