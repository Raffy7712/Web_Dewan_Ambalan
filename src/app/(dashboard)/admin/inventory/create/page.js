'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function CreateInventoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    quantity: 1,
    unit: 'unit',
    location: '',
    purchase_date: '',
    purchase_price: '',
  });

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/inventory/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch {
      // Categories are optional, no need to block
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Build payload — only include non-empty values
      const payload = {
        name: formData.name,
        quantity: parseInt(formData.quantity) || 1,
        unit: formData.unit || 'unit',
      };
      if (formData.category_id) payload.category_id = formData.category_id;
      if (formData.description) payload.description = formData.description;
      if (formData.location) payload.location = formData.location;
      if (formData.purchase_date) payload.purchase_date = formData.purchase_date;
      if (formData.purchase_price) payload.purchase_price = parseFloat(formData.purchase_price);

      const res = await fetch('/api/inventory/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal membuat item');
        return;
      }

      router.push(`/admin/inventory/${data.item.id}`);
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary";
  const labelClass = "block text-sm font-medium text-foreground mb-2";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <Link
        href="/admin/inventory"
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-4"
      >
        <ArrowLeft size={16} />
        Kembali ke inventaris
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
          Tambah Item Inventaris
        </h1>
        <p className="text-sm text-muted-foreground">
          Tambahkan barang baru ke sistem inventaris sarana prasarana.
        </p>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-border bg-card p-5 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>Nama Barang *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Contoh: Meja Lipat"
              required
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Kategori</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Tanpa kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Unit</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="unit">Unit</option>
                <option value="pieces">Pieces</option>
                <option value="set">Set</option>
                <option value="meter">Meter</option>
                <option value="liter">Liter</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Deskripsi</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detail barang..."
              rows="3"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Jumlah</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Lokasi</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Contoh: Gudang A"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Tanggal Pembelian</label>
              <input
                type="date"
                name="purchase_date"
                value={formData.purchase_date}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Harga Pembelian</label>
              <input
                type="number"
                name="purchase_price"
                value={formData.purchase_price}
                onChange={handleChange}
                placeholder="0"
                step="0.01"
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-muted-foreground/20 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              <Save size={16} />
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-muted hover:bg-background text-muted-foreground font-bold py-2.5 px-4 rounded-lg text-sm border border-border transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
