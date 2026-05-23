const XLSX = require("xlsx");
const { Pool } = require("pg");

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    options: "-c search_path=app,public",
  });

  const wb = XLSX.utils.book_new();

  // ── Sertifikat ──
  const certRes = await pool.query(
    `SELECT kode, nomor, nama_penerima, jenis_sertifikat,
            penerbit, status, created_at, keterangan
     FROM certificates ORDER BY created_at DESC`
  );

  const certRows = certRes.rows.map((r) => ({
    Kode: r.kode ?? "",
    Nomor: r.nomor ?? "",
    "Nama Penerima": r.nama_penerima ?? "",
    "Jenis Sertifikat": r.jenis_sertifikat ?? "",
    Penerbit: r.penerbit ?? "",
    Status:
      r.status === "issued"
        ? "Diterbitkan"
        : r.status === "revoked"
          ? "Dibatalkan"
          : r.status ?? "",
    Dibuat: r.created_at
      ? new Date(r.created_at).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })
      : "",
    Keterangan: r.keterangan ?? "",
  }));

  const certWs = XLSX.utils.json_to_sheet(
    certRows.length > 0
      ? certRows
      : [{ Keterangan: "Belum ada data sertifikat" }],
    { header: [
      "Kode", "Nomor", "Nama Penerima", "Jenis Sertifikat",
      "Penerbit", "Status", "Dibuat", "Keterangan"
    ]}
  );
  certWs["!cols"] = [
    { wch: 22 }, { wch: 38 }, { wch: 25 }, { wch: 22 },
    { wch: 25 }, { wch: 14 }, { wch: 14 }, { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, certWs, "Sertifikat");

  // ── Voucher ──
  const vocRes = await pool.query(
    `SELECT kode, judul, keterangan, status, kadaluarsa, created_at
     FROM vouchers ORDER BY created_at DESC`
  );

  const statusMap = {
    active: "Aktif",
    used: "Digunakan",
    expired: "Kadaluarsa",
    revoked: "Dibatalkan",
  };

  const vocRows = vocRes.rows.map((r) => ({
    Kode: r.kode ?? "",
    Judul: r.judul ?? "",
    Keterangan: r.keterangan ?? "",
    Status: statusMap[r.status] || r.status || "",
    Kadaluarsa: r.kadaluarsa
      ? new Date(r.kadaluarsa).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })
      : "-",
    Dibuat: r.created_at
      ? new Date(r.created_at).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })
      : "",
  }));

  const vocWs = XLSX.utils.json_to_sheet(
    vocRows.length > 0
      ? vocRows
      : [{ Keterangan: "Belum ada data voucher" }],
    { header: ["Kode", "Judul", "Keterangan", "Status", "Kadaluarsa", "Dibuat"] }
  );
  vocWs["!cols"] = [
    { wch: 22 }, { wch: 30 }, { wch: 40 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, vocWs, "Voucher");

  // ── Simpan ──
  const outPath = "Buku sertifikat dan piagam.xlsx";
  XLSX.writeFile(wb, outPath);
  console.log(`✅ ${outPath} — ${certRows.length} sertifikat, ${vocRows.length} voucher`);
  await pool.end();
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
