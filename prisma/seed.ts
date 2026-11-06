import { prisma } from "../src/lib/prisma";

type Jenis = "sertifikat" | "piagam" | "surat" | "voucher";

const PREFIX: Record<Jenis, string> = {
  sertifikat: "SRT",
  piagam: "PIG",
  surat: "SUR",
  voucher: "VCH",
};

function rand6(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function genKode(jenis: Jenis, used: Set<string>): string {
  const year = new Date().getFullYear();
  let kode = "";
  do {
    kode = `${PREFIX[jenis]}-${year}-${rand6()}`;
  } while (used.has(kode));
  used.add(kode);
  return kode;
}

async function main() {
  await prisma.verificationScan.deleteMany();
  await prisma.document.deleteMany();

  const used = new Set<string>();
  const now = new Date();
  const past = new Date();
  past.setDate(past.getDate() - 30);
  const future = new Date();
  future.setFullYear(future.getFullYear() + 1);

  const raw: Array<{
    jenis: Jenis;
    judul: string;
    nomor: string;
    penerima: string;
    keterangan: string;
    status: "issued" | "revoked";
    tanggalTerbit: Date;
    tanggalKadaluarsa: Date | null;
  }> = [
    {
      jenis: "sertifikat",
      judul: "Sertifikat Kegiatan Perkemahan Bakti",
      nomor: "001/SRT/DA/VI/2026",
      penerima: "Ahmad Fauzi",
      keterangan: "Telah mengikuti perkemahan bakti selama 3 hari.",
      status: "issued",
      tanggalTerbit: new Date("2026-03-12"),
      tanggalKadaluarsa: null,
    },
    {
      jenis: "sertifikat",
      judul: "Sertifikat Latihan Dasar Kepemimpinan",
      nomor: "002/SRT/DA/VI/2026",
      penerima: "Siti Nurhaliza",
      keterangan: "Lulus latihan dasar kepemimpinan cabang.",
      status: "issued",
      tanggalTerbit: new Date("2026-04-20"),
      tanggalKadaluarsa: null,
    },
    {
      jenis: "piagam",
      judul: "Piagam Penghargaan Peserta Terbaik",
      nomor: "010/PIG/DA/VI/2026",
      penerima: "Budi Santoso",
      keterangan: "Peserta terbaik tingkat Racana.",
      status: "issued",
      tanggalTerbit: new Date("2026-05-02"),
      tanggalKadaluarsa: null,
    },
    {
      jenis: "surat",
      judul: "Surat Keterangan Aktif Organisasi",
      nomor: "075/SRT/DA/VI/2026",
      penerima: "Dewi Lestari",
      keterangan: "Keterangan aktif sebagai anggota Dewan Ambalan.",
      status: "issued",
      tanggalTerbit: new Date("2026-06-01"),
      tanggalKadaluarsa: future,
    },
    {
      jenis: "voucher",
      judul: "Voucher Diskon Merchandise",
      nomor: "VCH-0001/DA/VI/2026",
      penerima: "Rina Maharani",
      keterangan: "Diskon 20% pembelian merchandise resmi.",
      status: "issued",
      tanggalTerbit: now,
      tanggalKadaluarsa: future,
    },
    {
      jenis: "voucher",
      judul: "Voucher Makan Kegiatan",
      nomor: "VCH-0002/DA/VI/2026",
      penerima: "Joko Widodo",
      keterangan: "Dibatalkan: permintaan ganda.",
      status: "revoked",
      tanggalTerbit: now,
      tanggalKadaluarsa: future,
    },
    {
      jenis: "surat",
      judul: "Surat Izin Kegiatan Eksternal",
      nomor: "076/SRT/DA/VI/2026",
      penerima: "Eko Prasetyo",
      keterangan: "Kadaluarsa: tidak diperpanjang.",
      status: "issued",
      tanggalTerbit: past,
      tanggalKadaluarsa: past,
    },
  ];

  const data = raw.map((r) => ({
    kode: genKode(r.jenis, used),
    jenis: r.jenis,
    nomor: r.nomor,
    judul: r.judul,
    penerima: r.penerima,
    penerbit: "Dewan Ambalan Racana",
    keterangan: r.keterangan,
    status: r.status,
    tanggalTerbit: r.tanggalTerbit,
    tanggalKadaluarsa: r.tanggalKadaluarsa,
    createdBy: null,
  }));

  await prisma.document.createMany({ data });

  const count = await prisma.document.count();
  console.log(`Seeded ${count} documents.`);
  console.log("Sample kode:", data.slice(0, 3).map((d) => d.kode).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
