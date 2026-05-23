'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Ticket, Plus, Search, FileSpreadsheet, Edit3, Trash2,
  ChevronLeft, ChevronRight, X, CheckCircle, AlertTriangle,
  Download
} from 'lucide-react';

/* ── Shared helpers ────────────────────────────────────────── */
const inputClass = "w-full px-4 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--surface-app)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";
const labelClass = "block text-sm font-medium text-[var(--text-primary)] mb-2";

function getStatusBadge(status) {
  const map = {
    active: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    used: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    expired: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    revoked: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };
  return map[status] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
}

function getStatusLabel(status) {
  const map = {
    active: 'Aktif',
    used: 'Digunakan',
    expired: 'Kadaluarsa',
    revoked: 'Dibatalkan',
  };
  return map[status] || status;
}

/* ── Confirmation Modal ────────────────────────────────────── */
function ConfirmModal({ open, title, message, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[var(--surface-elevated)] border border-[var(--border-primary)] rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={20} className="text-amber-500" />
          <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-slate-400 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
            {loading ? 'Menghapus...' : 'Hapus'}
          </button>
          <button onClick={onCancel} disabled={loading} className="flex-1 bg-[var(--surface-muted)] text-[var(--text-secondary)] font-medium py-2 px-4 rounded-lg text-sm border border-[var(--border-primary)] transition-colors">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Edit Voucher Modal ──────────────────────────────────── */
function EditVoucherModal({ item, open, onClose, onSave }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        judul: item.judul || '',
        keterangan: item.keterangan || '',
        status: item.status || 'active',
        kadaluarsa: item.kadaluarsa ? item.kadaluarsa.slice(0, 10) : '',
      });
    }
  }, [item]);

  if (!open || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(item.id, form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[var(--surface-elevated)] border border-[var(--border-primary)] rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Edit Voucher</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Kode</label>
            <input type="text" value={item.kode} disabled className={`${inputClass} opacity-60`} />
          </div>
          <div>
            <label className={labelClass}>Judul *</label>
            <input type="text" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} required maxLength={200} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Deskripsi</label>
            <textarea value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} rows={3} maxLength={500} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
              <option value="active">Aktif</option>
              <option value="used">Digunakan</option>
              <option value="expired">Kadaluarsa</option>
              <option value="revoked">Dibatalkan</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Kadaluarsa</label>
            <input type="date" value={form.kadaluarsa} onChange={(e) => setForm({ ...form, kadaluarsa: e.target.value })} className={inputClass} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-[var(--surface-muted)] text-[var(--text-secondary)] font-medium py-2 px-4 rounded-lg text-sm border border-[var(--border-primary)]">
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */
export default function AdminVouchersPage() {
  const [activeTab, setActiveTab] = useState('generate');

  // Generate form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState(null);
  const [generated, setGenerated] = useState(null);

  // List state
  const [vouchers, setVouchers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 25, offset: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);

  // Edit/Delete modal state
  const [editVoucher, setEditVoucher] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch vouchers
  const fetchVouchers = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const params = new URLSearchParams({ limit: pagination.limit, offset: pagination.offset });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const res = await fetch(`/api/vouchers/list?${params}`);
      const data = await res.json();
      if (!res.ok) { setListError(data.error || 'Gagal'); return; }
      setVouchers(data.items || []);
      setPagination(data.pagination);
    } catch (err) { setListError('Error: ' + err.message); }
    finally { setListLoading(false); }
  }, [pagination.offset, pagination.limit, search, statusFilter]);

  useEffect(() => {
    if (activeTab === 'list') fetchVouchers();
  }, [activeTab, fetchVouchers]);

  // Generate handler
  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenLoading(true);
    setGenError(null);
    try {
      const payload = {
        type: 'voucher',
        quantity: parseInt(quantity),
        title,
        description,
        kadaluarsa: expiresAt ? new Date(expiresAt).toISOString() : null,
      };
      const res = await fetch('/api/vouchers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setGenError(data.error || 'Gagal membuat voucher'); return; }
      setGenerated(data);
      showToast(`Berhasil membuat ${data.count} voucher`);
      setTitle(''); setDescription(''); setExpiresAt(''); setQuantity(1);
    } catch (err) { setGenError('Error: ' + err.message); }
    finally { setGenLoading(false); }
  };

  // Edit save handler
  const handleEditSave = async (id, form) => {
    try {
      const res = await fetch(`/api/vouchers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Gagal menyimpan', 'error'); return; }
      showToast('Berhasil diperbarui');
      setEditVoucher(null);
      fetchVouchers();
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/vouchers/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); showToast(d.error || 'Gagal menghapus', 'error'); return; }
      showToast('Berhasil dihapus');
      setDeleteTarget(null);
      fetchVouchers();
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
    finally { setDeleteLoading(false); }
  };

  // CSV download
  const handleDownloadCsv = () => {
    if (!generated?.items) return;
    const escapeCsv = (cell) => {
      const str = String(cell);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) return `"${str.replace(/"/g, '""')}"`;
      return str;
    };
    const headers = ['Kode', 'Judul', 'Keterangan', 'Status', 'Kadaluarsa', 'Dibuat'];
    const rows = generated.items.map((item) =>
      [item.kode, item.judul, item.keterangan || '', getStatusLabel(item.status), item.kadaluarsa ? new Date(item.kadaluarsa).toLocaleDateString('id-ID') : '-', new Date(item.created_at).toLocaleString('id-ID')]
    );
    const csv = [headers.map(escapeCsv).join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voucher-${Date.now()}.csv`;
    a.click();
  };

  const linkBtnClass = "inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-primary)] bg-[var(--surface-app)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors";

  const tabs = [
    { key: 'generate', label: 'Generate', icon: Plus },
    { key: 'list', label: 'Daftar Voucher', icon: Ticket },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-1">
          Kelola Voucher
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Generate dan kelola voucher Dewan Ambalan. Verifikasi voucher bisa dilakukan di halaman publik.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-emerald-600 text-white'
                : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── GENERATE TAB ─────────────────────────────── */}
      {activeTab === 'generate' && (
        <>
          {/* Export */}
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <FileSpreadsheet size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              Unduh Excel (.xlsx)
            </div>
            <a href="/api/admin/vouchers/export?scope=voucher" className={linkBtnClass}>Voucher</a>
            <p className="text-[11px] text-[var(--text-muted)] w-full">
              Unduhan memakai sesi login Anda (cookie). Buka tautan di tab yang sama setelah login sebagai admin.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-5 md:p-6">
              <form onSubmit={handleGenerate} className="space-y-5">
                <div>
                  <label className={labelClass}>Jumlah</label>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" max="25" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Nama Voucher *</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Diskon 20% Produk Unggulan" required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Deskripsi / Alasan Penerbitan</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Jelaskan nama dan alasan voucher ini diterbitkan..." rows="3" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Kadaluarsa</label>
                  <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputClass} />
                </div>
                {genError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg p-4">
                    <p className="text-red-700 dark:text-red-300 text-sm">{genError}</p>
                  </div>
                )}
                <button type="submit" disabled={genLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white font-bold py-2.5 px-4 rounded-lg transition-colors">
                  {genLoading ? 'Membuat...' : 'Generate Voucher'}
                </button>
              </form>
            </div>

            {/* Results Preview */}
            {generated && (
              <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-5 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle size={18} className="text-emerald-500" />
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Berhasil ({generated.count})</h2>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-lg p-3 mb-4">
                  <p className="text-emerald-700 dark:text-emerald-300 font-medium text-sm">
                    {generated.count} voucher berhasil dibuat
                  </p>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {generated.items.map((item, idx) => (
                    <div key={idx} className="bg-[var(--surface-app)] rounded-lg p-3 border border-[var(--border-primary)]">
                      <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">{item.kode}</p>
                      <p className="text-sm text-[var(--text-primary)] mt-0.5">{item.judul}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{new Date(item.created_at).toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleDownloadCsv} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                    <Download size={14} className="inline mr-1.5" /> CSV
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── LIST TAB ─────────────────────────────── */}
      {activeTab === 'list' && (
        <div>
          {/* Filters */}
          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative md:col-span-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text" placeholder="Cari kode atau judul..." value={search}
                  onChange={(e) => { setSearch(e.target.value); setPagination({ ...pagination, offset: 0 }); }}
                  className="w-full pl-9 pr-4 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--surface-app)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPagination({ ...pagination, offset: 0 }); }} className={inputClass}>
                <option value="">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="used">Digunakan</option>
                <option value="expired">Kadaluarsa</option>
                <option value="revoked">Dibatalkan</option>
              </select>
            </div>
          </div>

          {listError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg p-4 mb-6">
              <p className="text-red-700 dark:text-red-300 text-sm">{listError}</p>
            </div>
          )}

          {/* Table */}
          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] overflow-hidden">
            {listLoading ? (
              <div className="p-8 text-center"><p className="text-[var(--text-secondary)]">Memuat data...</p></div>
            ) : vouchers.length === 0 ? (
              <div className="p-8 text-center">
                <Ticket size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
                <p className="text-[var(--text-secondary)]">Tidak ada voucher ditemukan</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--surface-muted)] border-b border-[var(--border-primary)]">
                      <tr>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Kode</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Judul</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">Status</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">Kadaluarsa</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden lg:table-cell">Dibuat</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden 2xl:table-cell min-w-[200px]">Keterangan</th>
                        <th className="px-4 md:px-6 py-3 text-right text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-primary)]">
                      {vouchers.map((v) => (
                        <tr key={v.id} className="hover:bg-[var(--surface-muted)]/50 transition-colors">
                          <td className="px-4 md:px-6 py-3 font-mono text-sm font-medium text-emerald-600 dark:text-emerald-400">{v.kode}</td>
                          <td className="px-4 md:px-6 py-3 text-sm text-[var(--text-primary)] max-w-[200px] truncate">{v.judul}</td>
                          <td className="px-4 md:px-6 py-3 hidden sm:table-cell">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(v.status)}`}>{getStatusLabel(v.status)}</span>
                          </td>
                          <td className="px-4 md:px-6 py-3 text-sm text-[var(--text-secondary)] hidden md:table-cell">{v.kadaluarsa ? new Date(v.kadaluarsa).toLocaleDateString('id-ID') : '-'}</td>
                          <td className="px-4 md:px-6 py-3 text-sm text-[var(--text-secondary)] hidden lg:table-cell">{v.created_at ? new Date(v.created_at).toLocaleDateString('id-ID') : '-'}</td>
                          <td className="px-4 md:px-6 py-3 text-sm text-[var(--text-secondary)] hidden 2xl:table-cell max-w-[200px] truncate">{v.keterangan || '-'}</td>
                          <td className="px-4 md:px-6 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => setEditVoucher(v)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" title="Edit"><Edit3 size={15} /></button>
                              <button onClick={() => setDeleteTarget({ id: v.id, name: v.kode })} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Hapus"><Trash2 size={15} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {pagination.total > pagination.limit && (
                  <div className="flex items-center justify-between px-4 md:px-6 py-3 border-t border-[var(--border-primary)]">
                    <p className="text-xs text-[var(--text-muted)]">
                      {pagination.offset + 1}–{Math.min(pagination.offset + pagination.limit, pagination.total)} dari {pagination.total}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })}
                        disabled={pagination.offset === 0}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors"
                      ><ChevronLeft size={16} /></button>
                      <button
                        onClick={() => setPagination({ ...pagination, offset: pagination.offset + pagination.limit })}
                        disabled={pagination.offset + pagination.limit >= pagination.total}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors"
                      ><ChevronRight size={16} /></button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <EditVoucherModal item={editVoucher} open={!!editVoucher} onClose={() => setEditVoucher(null)} onSave={handleEditSave} />
      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus Voucher"
        message={`Yakin ingin menghapus voucher "${deleteTarget?.name}"? Tindakan ini tidak bisa dibatalkan.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl text-sm font-medium transition-all ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
