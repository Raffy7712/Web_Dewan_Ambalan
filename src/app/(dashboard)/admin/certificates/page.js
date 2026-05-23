'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Award, Plus, Search, FileSpreadsheet, Edit3, Trash2,
  ChevronLeft, ChevronRight, X, CheckCircle, AlertTriangle,
  Download, QrCode, Copy
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

/* ── Shared helpers ────────────────────────────────────────── */
const inputClass = "w-full px-4 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--surface-app)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";
const labelClass = "block text-sm font-medium text-[var(--text-primary)] mb-2";

const PRAMUKA_CERT_TYPES = [
  'Sertifikat Penghargaan',
  'Sertifikat Partisipasi Kegiatan',
  'Sertifikat Keahlian Pramuka',
  'Piagam Penghargaan',
  'Sertifikat Pelatihan',
  'Sertifikat Lulus SKU',
  'Sertifikat Danrantis',
  'Sertifikat Jambore',
  'Sertifikat Perkemahan',
  'Lainnya',
];

function getStatusBadge(status) {
  const map = {
    issued: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    revoked: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };
  return map[status] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
}

function getStatusLabel(status) {
  const map = {
    issued: 'Diterbitkan',
    revoked: 'Dibatalkan',
  };
  return map[status] || status;
}

/* ── QR Code Download Helper ────────────────────────────── */
function downloadQRCode(canvasContainer, filename) {
  const canvas = canvasContainer?.querySelector('canvas');
  if (!canvas) return;
  const url = canvas.toDataURL('image/png', 1.0);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ── QR Code Card with Download ─────────────────────────── */
function QRCertificateCard({ item }) {
  const qrRef = useRef(null);
  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/certificates?code=${item.code}`
    : `https://da-alf.web.id/certificates?code=${item.code}`;

  return (
    <div className="bg-[var(--surface-app)] rounded-lg p-4 border border-[var(--border-primary)]">
      <div ref={qrRef} className="flex justify-center mb-3">
        <QRCodeCanvas value={verifyUrl} size={180} level="M" includeMargin={true} bgColor="#ffffff" fgColor="#000000" />
      </div>
      <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm text-center">{item.code}</p>
      {item.nomor_sertifikat && (
        <p className="text-xs text-[var(--text-muted)] text-center mt-0.5">{item.nomor_sertifikat}</p>
      )}
      <p className="text-sm text-[var(--text-primary)] mt-1 text-center">{item.recipient_name || item.title}</p>
      <p className="text-xs text-[var(--text-muted)] mt-1 text-center">{new Date(item.created_at).toLocaleString('id-ID')}</p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => downloadQRCode(qrRef.current, `QR-${item.code}.png`)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors"
        >
          <Download size={13} /> QR Code
        </button>
        <button
          onClick={() => { navigator.clipboard.writeText(verifyUrl); }}
          className="inline-flex items-center justify-center gap-1.5 bg-[var(--surface-muted)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-emerald-600 font-medium py-2 px-3 rounded-lg text-xs transition-colors"
          title="Salin link verifikasi"
        >
          <Copy size={13} />
        </button>
      </div>
    </div>
  );
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

/* ── Edit Certificate Modal ──────────────────────────────── */
function EditCertificateModal({ item, open, onClose, onSave }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        recipient_name: item.recipient_name || '',
        certificate_type: item.certificate_type || '',
        dewan_ambalan: item.dewan_ambalan || '',
        nomor_sertifikat: item.nomor_sertifikat || '',
        description: item.description || '',
        status: item.status || 'issued',
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
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Edit Sertifikat</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Kode</label>
            <input type="text" value={item.code} disabled className={`${inputClass} opacity-60`} />
          </div>
          <div>
            <label className={labelClass}>Nomor Sertifikat</label>
            <input type="text" value={form.nomor_sertifikat} onChange={(e) => setForm({ ...form, nomor_sertifikat: e.target.value })} placeholder="Contoh: 001/11.29.02.165-02.166-C/2026" maxLength={100} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Nama Penerima *</label>
            <input type="text" value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} required maxLength={200} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Jenis Sertifikat *</label>
            <select value={form.certificate_type} onChange={(e) => setForm({ ...form, certificate_type: e.target.value })} required className={inputClass}>
              <option value="">-- Pilih Jenis --</option>
              {PRAMUKA_CERT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Penerbit</label>
            <input type="text" value={form.dewan_ambalan} onChange={(e) => setForm({ ...form, dewan_ambalan: e.target.value })} placeholder="Nama penerbit sertifikat" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Deskripsi / Alasan Penerbitan</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Jelaskan nama penerima dan alasan sertifikat ini diterbitkan..." rows={3} maxLength={1000} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
              <option value="issued">Diterbitkan</option>
              <option value="revoked">Dibatalkan</option>
            </select>
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

/* ── Certificate Detail Modal with QR ────────────────────── */
function CertificateDetailModal({ item, open, onClose }) {
  const qrRef = useRef(null);
  if (!open || !item) return null;

  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/certificates?code=${item.code}`
    : `https://da-alf.web.id/certificates?code=${item.code}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[var(--surface-elevated)] border border-[var(--border-primary)] rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Award size={20} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Detail Sertifikat</h3>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={18} /></button>
        </div>

        <div className="flex justify-center mb-5">
          <div ref={qrRef} className="inline-block p-3 bg-white rounded-xl border border-[var(--border-primary)]">
            <QRCodeCanvas value={verifyUrl} size={200} level="M" includeMargin={false} bgColor="#ffffff" fgColor="#000000" />
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex justify-between">
            <span className="text-sm text-[var(--text-secondary)]">Kode</span>
            <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">{item.code}</span>
          </div>
          {item.nomor_sertifikat && (
            <div className="flex justify-between">
              <span className="text-sm text-[var(--text-secondary)]">No. Sertifikat</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">{item.nomor_sertifikat}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-[var(--text-secondary)]">Penerima</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">{item.recipient_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[var(--text-secondary)]">Jenis</span>
            <span className="text-sm text-[var(--text-primary)]">{item.certificate_type}</span>
          </div>
          {item.description && (
            <div className="pt-1">
              <span className="text-sm text-[var(--text-secondary)] block mb-1">Deskripsi</span>
              <p className="text-sm text-[var(--text-primary)] bg-[var(--surface-muted)] rounded-lg p-3 leading-relaxed">{item.description}</p>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-[var(--text-secondary)]">Status</span>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>{getStatusLabel(item.status)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => downloadQRCode(qrRef.current, `QR-${item.code}.png`)}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors"
          >
            <Download size={15} /> Download QR
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(verifyUrl); }}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[var(--surface-muted)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-emerald-600 font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
          >
            <Copy size={15} /> Salin Link
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */
export default function AdminCertificatesPage() {
  const [activeTab, setActiveTab] = useState('generate');

  // Generate form state
  const [quantity, setQuantity] = useState(1);
  const [recipientName, setRecipientName] = useState('');
  const [certificateType, setCertificateType] = useState('');
  const [dewanAmbalan, setDewanAmbalan] = useState('');
  const [nomorSertifikat, setNomorSertifikat] = useState('');
  const [certDescription, setCertDescription] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState(null);
  const [generated, setGenerated] = useState(null);

  // List state
  const [certificates, setCertificates] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 25, offset: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);

  // Modal state
  const [editCertificate, setEditCertificate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewCertificate, setViewCertificate] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch certificates
  const fetchCertificates = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const params = new URLSearchParams({ limit: pagination.limit, offset: pagination.offset });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const res = await fetch(`/api/certificates/list?${params}`);
      const data = await res.json();
      if (!res.ok) { setListError(data.error || 'Gagal'); return; }
      setCertificates(data.items || []);
      setPagination(data.pagination);
    } catch (err) { setListError('Error: ' + err.message); }
    finally { setListLoading(false); }
  }, [pagination.offset, pagination.limit, search, statusFilter]);

  useEffect(() => {
    if (activeTab === 'list') fetchCertificates();
  }, [activeTab, fetchCertificates]);

  // Generate handler
  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenLoading(true);
    setGenError(null);
    try {
      const payload = {
        type: 'certificate',
        quantity: parseInt(quantity),
        title: `Sertifikat ${certificateType} - ${recipientName}`,
        recipient_name: recipientName,
        certificate_type: certificateType,
        dewan_ambalan: dewanAmbalan,
        nomor_sertifikat: nomorSertifikat || null,
        description: certDescription || null,
      };
      const res = await fetch('/api/vouchers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setGenError(data.error || 'Gagal membuat sertifikat'); return; }
      setGenerated(data);
      showToast(`Berhasil membuat ${data.count} sertifikat`);
      setRecipientName(''); setCertificateType(''); setDewanAmbalan(''); setNomorSertifikat(''); setCertDescription(''); setQuantity(1);
    } catch (err) { setGenError('Error: ' + err.message); }
    finally { setGenLoading(false); }
  };

  // Edit save handler
  const handleEditSave = async (id, form) => {
    try {
      const res = await fetch(`/api/certificates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Gagal menyimpan', 'error'); return; }
      showToast('Berhasil diperbarui');
      setEditCertificate(null);
      fetchCertificates();
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/certificates/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); showToast(d.error || 'Gagal menghapus', 'error'); return; }
      showToast('Berhasil dihapus');
      setDeleteTarget(null);
      fetchCertificates();
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
    const headers = ['Code', 'Nomor Sertifikat', 'Penerima', 'Jenis', 'Status', 'Created At'];
    const rows = generated.items.map((item) =>
      [item.code, item.nomor_sertifikat || '', item.recipient_name, item.certificate_type, getStatusLabel(item.status), new Date(item.created_at).toLocaleString('id-ID')]
    );
    const csv = [headers.map(escapeCsv).join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sertifikat-${Date.now()}.csv`;
    a.click();
  };

  const linkBtnClass = "inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-primary)] bg-[var(--surface-app)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors";

  const tabs = [
    { key: 'generate', label: 'Generate', icon: Plus },
    { key: 'list', label: 'Daftar Sertifikat', icon: Award },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-1">
          Kelola Sertifikat
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Terbitkan dan kelola sertifikat Dewan Ambalan untuk anggota Pramuka. Verifikasi sertifikat bisa dilakukan di halaman publik.
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
            <a href="/api/admin/vouchers/export?scope=certificate" className={linkBtnClass}>Sertifikat</a>
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
                  <label className={labelClass}>Nomor Sertifikat</label>
                  <input type="text" value={nomorSertifikat} onChange={(e) => setNomorSertifikat(e.target.value)} placeholder="Contoh: 001/11.29.02.165-02.166-C/2026" maxLength={100} className={inputClass} />
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">Nomor urut sertifikat, diisi manual. Format bebas sesuai kebutuhan.</p>
                </div>
                <div>
                  <label className={labelClass}>Nama Penerima *</label>
                  <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Nama lengkap anggota Pramuka" required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Jenis Sertifikat *</label>
                  <select value={certificateType} onChange={(e) => setCertificateType(e.target.value)} required className={inputClass}>
                    <option value="">-- Pilih Jenis --</option>
                    {PRAMUKA_CERT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Penerbit</label>
                  <input type="text" value={dewanAmbalan} onChange={(e) => setDewanAmbalan(e.target.value)} placeholder="Nama penerbit sertifikat" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Deskripsi / Alasan Penerbitan</label>
                  <textarea value={certDescription} onChange={(e) => setCertDescription(e.target.value)} placeholder="Jelaskan nama penerima dan alasan sertifikat ini diterbitkan..." rows={3} maxLength={1000} className={inputClass} />
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">Contoh: &quot;Diberikan kepada Ahmad atas pencapaian Lulus SKU Penegak Bantara&quot;</p>
                </div>
                {genError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg p-4">
                    <p className="text-red-700 dark:text-red-300 text-sm">{genError}</p>
                  </div>
                )}
                <button type="submit" disabled={genLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white font-bold py-2.5 px-4 rounded-lg transition-colors">
                  {genLoading ? 'Membuat...' : 'Generate Sertifikat'}
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
                    {generated.count} sertifikat berhasil dibuat
                  </p>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {generated.items.map((item, idx) => (
                    <QRCertificateCard key={idx} item={item} />
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleDownloadCsv} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                    <Download size={14} className="inline mr-1.5" /> CSV
                  </button>
                  {generated.items.length > 0 && (
                    <button
                      onClick={() => {
                        generated.items.forEach((item, idx) => {
                          setTimeout(() => {
                            const container = document.getElementById(`qr-result-${idx}`);
                            if (container) downloadQRCode(container, `QR-${item.code}.png`);
                          }, idx * 300);
                        });
                      }}
                      className="flex-1 bg-[var(--surface-app)] border border-[var(--border-primary)] hover:border-emerald-500 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      <QrCode size={14} className="inline mr-1.5" /> Download Semua QR
                    </button>
                  )}
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
                  type="text" placeholder="Cari kode, penerima, atau nomor..." value={search}
                  onChange={(e) => { setSearch(e.target.value); setPagination({ ...pagination, offset: 0 }); }}
                  className="w-full pl-9 pr-4 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--surface-app)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPagination({ ...pagination, offset: 0 }); }} className={inputClass}>
                <option value="">Semua Status</option>
                <option value="issued">Diterbitkan</option>
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
            ) : certificates.length === 0 ? (
              <div className="p-8 text-center">
                <Award size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
                <p className="text-[var(--text-secondary)]">Tidak ada sertifikat ditemukan</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--surface-muted)] border-b border-[var(--border-primary)]">
                      <tr>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Kode</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">No. Sertifikat</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Penerima</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">Jenis</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden lg:table-cell">Status</th>
                        <th className="px-4 md:px-6 py-3 text-right text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-primary)]">
                      {certificates.map((c) => (
                        <tr key={c.id} className="hover:bg-[var(--surface-muted)]/50 transition-colors">
                          <td className="px-4 md:px-6 py-3 font-mono text-sm font-medium text-emerald-600 dark:text-emerald-400">{c.code}</td>
                          <td className="px-4 md:px-6 py-3 text-sm text-[var(--text-secondary)] hidden sm:table-cell">{c.nomor_sertifikat || '-'}</td>
                          <td className="px-4 md:px-6 py-3 text-sm text-[var(--text-primary)]">{c.recipient_name}</td>
                          <td className="px-4 md:px-6 py-3 text-sm text-[var(--text-secondary)] hidden md:table-cell">{c.certificate_type}</td>
                          <td className="px-4 md:px-6 py-3 hidden lg:table-cell">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(c.status)}`}>{getStatusLabel(c.status)}</span>
                          </td>
                          <td className="px-4 md:px-6 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => setViewCertificate(c)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" title="Detail & QR"><QrCode size={15} /></button>
                              <button onClick={() => setEditCertificate(c)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" title="Edit"><Edit3 size={15} /></button>
                              <button onClick={() => setDeleteTarget({ id: c.id, name: c.code })} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Hapus"><Trash2 size={15} /></button>
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
      <EditCertificateModal item={editCertificate} open={!!editCertificate} onClose={() => setEditCertificate(null)} onSave={handleEditSave} />
      <CertificateDetailModal item={viewCertificate} open={!!viewCertificate} onClose={() => setViewCertificate(null)} />
      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus Sertifikat"
        message={`Yakin ingin menghapus sertifikat "${deleteTarget?.name}"? Tindakan ini tidak bisa dibatalkan.`}
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
