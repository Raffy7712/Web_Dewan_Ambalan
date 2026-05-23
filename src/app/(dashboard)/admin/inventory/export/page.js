'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, FileText, FileSpreadsheet, Package } from 'lucide-react';

export default function InventoryExportPage() {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/inventory/items?limit=1000');
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal mengambil data');
        return;
      }

      setItems(data.items || []);
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllItems();
  }, []);

  const handleToggleItem = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map((item) => item.id)));
    }
  };

  const handleDownloadPDF = async () => {
    if (selectedItems.size === 0) {
      alert('Pilih minimal 1 item');
      return;
    }

    setLoading(true);

    try {
      const { jsPDF } = await import('jspdf');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 15;
      let itemCount = 0;

      pdf.setFontSize(16);
      pdf.text('KODE INVENTARIS SARANA PRASARANA', pageWidth / 2, 10, { align: 'center' });

      for (const itemId of selectedItems) {
        const item = items.find((i) => i.id === itemId);
        if (!item) continue;

        const xCenter = pageWidth / 2;

        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text(item.code, xCenter, yPosition, { align: 'center' });
        yPosition += 8;

        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(9);
        pdf.text(`Nama: ${item.name}`, 15, yPosition);
        yPosition += 5;
        pdf.text(`Lokasi: ${item.location || '-'}`, 15, yPosition);
        yPosition += 5;
        pdf.text(`Qty: ${item.quantity} ${item.unit || 'unit'}`, 15, yPosition);
        yPosition += 5;
        pdf.text(`Kondisi: ${item.condition === 'baik' ? 'Baik' : item.condition === 'perlu_perbaikan' ? 'Perlu Perbaikan' : 'Rusak'}`, 15, yPosition);
        yPosition += 5;
        pdf.text(`Tanggal Print: ${new Date().toLocaleDateString('id-ID')}`, 15, yPosition);

        yPosition += 8;
        pdf.setDrawColor(150, 150, 150);
        pdf.line(15, yPosition, pageWidth - 15, yPosition);
        yPosition += 5;

        itemCount++;

        if (yPosition > pageHeight - 20 && itemCount < selectedItems.size) {
          pdf.addPage();
          yPosition = 15;
        }
      }

      pdf.save(`inventory-codes-${Date.now()}.pdf`);
    } catch (err) {
      setError('Error generating PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (selectedItems.size === 0) {
      alert('Pilih minimal 1 item');
      return;
    }

    const headers = ['Code', 'Name', 'Location', 'Quantity', 'Unit', 'Condition'];
    const rows = Array.from(selectedItems).map((itemId) => {
      const item = items.find((i) => i.id === itemId);
      return [
        item.code,
        item.name,
        item.location || '-',
        item.quantity,
        item.unit || 'unit',
        item.condition,
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) =>
            typeof cell === 'string' && cell.includes(',')
              ? `"${cell}"`
              : cell
          )
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-codes-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      {/* Back Link */}
      <Link
        href="/admin/inventory"
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-4"
      >
        <ArrowLeft size={16} />
        Kembali ke inventaris
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
          Export Kode Inventaris
        </h1>
        <p className="text-sm text-muted-foreground">
          Pilih item dan export ke PDF untuk print label, Excel untuk laporan data, atau CSV.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Item List */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-5 md:p-6">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Memuat data...</p>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center pb-4 border-b border-border">
                <h2 className="text-sm font-bold text-foreground">
                  Item ({items.length})
                </h2>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === items.length && items.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary accent-primary"
                  />
                  <span className="ml-2 text-sm text-muted-foreground">Pilih Semua</span>
                </label>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {items.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleToggleItem(item.id)}
                      className="w-4 h-4 text-primary accent-primary"
                    />
                    <div className="ml-3 flex-1">
                      <p className="font-mono font-bold text-primary text-sm">
                        {item.code}
                      </p>
                      <p className="text-sm text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Lokasi: {item.location || '-'}
                      </p>
                    </div>
                    <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                      {item.quantity} {item.unit || 'unit'}
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="rounded-xl border border-border bg-card p-5 h-fit">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-1">
              Dipilih
            </p>
            <p className="text-2xl font-bold text-foreground">
              {selectedItems.size}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleDownloadPDF}
              disabled={selectedItems.size === 0 || loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-muted-foreground/20 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              <FileText size={16} />
              Download PDF
            </button>
            <a
              href={`/api/inventory/export?item_ids=${selectedItems.size === items.length && items.length > 0 ? 'all' : Array.from(selectedItems).join(',')}&format=xlsx`}
              className={`w-full inline-flex items-center justify-center gap-2 bg-background border border-border hover:border-primary text-foreground font-medium py-2.5 px-4 rounded-lg transition-colors text-sm ${selectedItems.size === 0 ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <FileSpreadsheet size={16} />
              Download Excel
            </a>
            <button
              onClick={handleDownloadCSV}
              disabled={selectedItems.size === 0}
              className="w-full inline-flex items-center justify-center gap-2 bg-background border border-border hover:border-primary text-foreground font-medium py-2.5 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              <FileSpreadsheet size={16} />
              Download CSV
            </button>
          </div>

          <div className="mt-6 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-xs text-primary">
              PDF siap untuk di-print dan di-attach ke barang sebagai label inventaris.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
