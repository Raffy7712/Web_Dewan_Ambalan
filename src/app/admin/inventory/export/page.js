'use client';

import { useState, useEffect } from 'react';

export default function InventoryExportPage() {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllItems();
  }, []);

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

      // Title
      pdf.setFontSize(16);
      pdf.text('KODE INVENTARIS SARANA PRASARANA', pageWidth / 2, 10, { align: 'center' });

      for (const itemId of selectedItems) {
        const item = items.find((i) => i.id === itemId);
        if (!item) continue;

        const xCenter = pageWidth / 2;

        // Barcode-like code display (large font)
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text(item.code, xCenter, yPosition, { align: 'center' });
        yPosition += 8;

        // Item info
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

        // Separator line
        yPosition += 8;
        pdf.setDrawColor(150, 150, 150);
        pdf.line(15, yPosition, pageWidth - 15, yPosition);
        yPosition += 5;

        itemCount++;

        // Check if need new page
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Export Kode Inventaris</h1>
          <p className="text-gray-600 mt-2">
            Pilih item dan export ke PDF untuk print label atau CSV untuk data
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Item List */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow p-6">
            {loading ? (
              <p className="text-center text-gray-600">Memuat data...</p>
            ) : (
              <>
                <div className="mb-4 flex justify-between items-center pb-4 border-b">
                  <h2 className="text-lg font-bold text-gray-800">
                    Item ({items.length})
                  </h2>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === items.length && items.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Pilih Semua</span>
                  </label>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {items.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleToggleItem(item.id)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="ml-3 flex-1">
                        <p className="font-mono font-bold text-blue-600 text-sm">
                          {item.code}
                        </p>
                        <p className="text-sm text-gray-700">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          Lokasi: {item.location || '-'}
                        </p>
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {item.quantity} {item.unit || 'unit'}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6 h-fit">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Dipilih: <span className="font-bold">{selectedItems.size}</span>
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleDownloadPDF}
                disabled={selectedItems.size === 0 || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                📄 Download PDF
              </button>
              <button
                onClick={handleDownloadCSV}
                disabled={selectedItems.size === 0}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                📊 Download CSV
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>💡 Tips:</strong> PDF siap untuk di-print dan di-attach ke barang sebagai label inventaris.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
