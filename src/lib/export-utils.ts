import type { jsPDF as JsPdfDoc } from "jspdf";
import { Kunjungan } from "./types";
import { formatNomorUrut, formatTanggal, formatJam, formatTanggalJam, getTodayWITA } from "./utils";

// Pustaka ekspor besar (xlsx, jspdf) dimuat hanya saat tombol ekspor ditekan,
// sehingga tidak membengkakkan bundel awal dashboard.

const TOTAL_PAGES_TOKEN = "{total_pages}";

interface ExportOptions {
  title?: string;
  subtitle?: string;
  filenamePrefix?: string;
}

/**
 * Ekspor data kunjungan ke Excel (.xlsx) dengan tata letak resmi dan rapi.
 */
export async function exportKunjunganToExcel(
  kunjunganList: Kunjungan[],
  options: ExportOptions = {}
): Promise<void> {
  const XLSX = await import("xlsx");
  const {
    title = "LAPORAN REKAPITULASI BUKU TAMU DIGITAL (SIKUNJUNG)",
    subtitle = "Inspektorat Daerah Kabupaten Bangli",
    filenamePrefix = "Rekap_Tamu_SIKUNJUNG",
  } = options;

  const nowStr = formatTanggalJam(new Date().toISOString());

  // 1. Baris Judul & Kop Resmi Laporan
  const rows: (string | number)[][] = [
    ["PEMERINTAH KABUPATEN BANGLI"],
    ["INSPEKTORAT DAERAH KABUPATEN BANGLI"],
    [title],
    [`Keterangan / Periode: ${subtitle}  |  Waktu Unduh: ${nowStr}`],
    [], // Baris kosong pemisah
    // 2. Baris Header Tabel
    [
      "No.",
      "No. Antrean",
      "Tanggal",
      "Jam Masuk",
      "Nama Tamu",
      "Jenis Kelamin",
      "No. Telepon / WA",
      "Asal Instansi",
      "Tujuan Bidang",
      "Keperluan",
      "Status Kehadiran",
      "Jumlah Tamu",
      "Jumlah Foto",
    ],
  ];

  // 3. Masukkan Data Kunjungan
  let totalTamuSum = 0;
  kunjunganList.forEach((k, idx) => {
    const jumlah = k.jumlah_tamu || 1;
    totalTamuSum += jumlah;

    rows.push([
      idx + 1,
      formatNomorUrut(k.nomor_urut),
      k.tanggal,
      formatJam(k.waktu_masuk),
      k.nama,
      k.jenis_kelamin || "Laki-laki",
      k.no_telepon || "-",
      k.instansi?.nama || k.instansi_lainnya || "-",
      k.bidang?.nama || "-",
      k.keperluan || "-",
      k.status === "tercatat"
        ? "Tercatat (Sah)"
        : k.status === "menunggu_foto"
        ? "Menunggu Foto"
        : "Tidak Diverifikasi",
      jumlah,
      k.foto_kehadiran?.length || 0,
    ]);
  });

  // 4. Baris Total / Ringkasan di Bawah
  rows.push([]);
  rows.push([
    "",
    "",
    "",
    "",
    "TOTAL KUNJUNGAN:",
    `${kunjunganList.length} Kunjungan`,
    "",
    "",
    "",
    "TOTAL ORANG TAMU:",
    `${totalTamuSum} Orang`,
    "",
    "",
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // 5. Atur Lebar Kolom yang Proporsional & Rapi
  worksheet["!cols"] = [
    { wch: 6 },  // No.
    { wch: 14 }, // No. Antrean
    { wch: 14 }, // Tanggal
    { wch: 12 }, // Jam Masuk
    { wch: 30 }, // Nama Tamu
    { wch: 16 }, // Jenis Kelamin
    { wch: 18 }, // No. Telepon
    { wch: 36 }, // Asal Instansi
    { wch: 32 }, // Tujuan Bidang
    { wch: 40 }, // Keperluan
    { wch: 20 }, // Status Kehadiran
    { wch: 14 }, // Jumlah Tamu
    { wch: 14 }, // Jumlah Foto
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Kunjungan");

  XLSX.writeFile(workbook, `${filenamePrefix}_${getTodayWITA()}.xlsx`);
}

/**
 * Ekspor data kunjungan ke PDF (.pdf) resmi, elegan, profesional, dan proporsional.
 */
export async function exportKunjunganToPdf(
  kunjunganList: Kunjungan[],
  options: ExportOptions = {}
): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const {
    title = "LAPORAN REKAPITULASI BUKU TAMU DIGITAL (SIKUNJUNG)",
    subtitle = "Inspektorat Daerah Kabupaten Bangli",
    filenamePrefix = "Laporan_Tamu_SIKUNJUNG",
  } = options;

  // A4 Landscape: 297mm x 210mm
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const now = new Date();
  const nowFormatted = formatTanggalJam(now.toISOString());
  const todayStr = getTodayWITA();
  const todayFormatted = formatTanggal(todayStr);

  // Statistik Ringkas
  const totalKunjungan = kunjunganList.length;
  const totalOrang = kunjunganList.reduce((acc, k) => acc + (k.jumlah_tamu || 1), 0);
  const tercatat = kunjunganList.filter((k) => k.status === "tercatat").length;
  const menungguFoto = kunjunganList.filter((k) => k.status === "menunggu_foto").length;

  // ================= 1. KOP SURAT / DOKUMEN RESMI =================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(31, 37, 71); // Deep Navy (#1F2547)
  doc.text("PEMERINTAH KABUPATEN BANGLI", 148.5, 12, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(59, 82, 196); // Indigo accent (#3B52C4)
  doc.text("INSPEKTORAT DAERAH", 148.5, 17, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(31, 37, 71);
  doc.text(title, 148.5, 22, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(110, 116, 145);
  doc.text(`Periode: ${subtitle}  •  Dicetak pada: ${nowFormatted}`, 148.5, 27, {
    align: "center",
  });

  // Garis Pembatas Kop Resmi (Double Line)
  doc.setDrawColor(31, 37, 71);
  doc.setLineWidth(0.8);
  doc.line(14, 30, 283, 30);
  doc.setLineWidth(0.2);
  doc.line(14, 31, 283, 31);

  // ================= 2. KARTU STATISTIK RINGKAS =================
  doc.setFillColor(244, 245, 253);
  doc.roundedRect(14, 33.5, 269, 7.5, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(31, 37, 71);

  const statsText = `Total Kunjungan: ${totalKunjungan}    |    Total Jiwa Tamu: ${totalOrang} Orang    |    Tercatat Sah: ${tercatat}    |    Menunggu Foto: ${menungguFoto}`;
  doc.text(statsText, 148.5, 38.5, { align: "center" });

  // ================= 3. TABEL DATA MENGGUNAKAN AUTOTABLE =================
  const tableData = kunjunganList.map((k, idx) => [
    idx + 1,
    formatNomorUrut(k.nomor_urut),
    k.tanggal,
    formatJam(k.waktu_masuk),
    k.nama + (k.jumlah_tamu && k.jumlah_tamu > 1 ? ` (+${k.jumlah_tamu - 1} org)` : ""),
    k.instansi?.nama || k.instansi_lainnya || "-",
    k.bidang?.nama || "-",
    k.keperluan || "-",
    k.status === "tercatat"
      ? "Tercatat"
      : k.status === "menunggu_foto"
      ? "Menunggu Foto"
      : "Belum Verifikasi",
    k.foto_kehadiran?.length || 0,
  ]);

  autoTable(doc, {
    startY: 43,
    margin: { left: 14, right: 14, bottom: 22 },
    head: [
      [
        "No.",
        "Antrean",
        "Tanggal",
        "Jam",
        "Nama Tamu",
        "Asal Instansi",
        "Tujuan Bidang",
        "Keperluan",
        "Status",
        "Foto",
      ],
    ],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [31, 37, 71], // #1F2547
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "left",
      cellPadding: 2.2,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [31, 37, 71],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 249, 254],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" }, // No.
      1: { cellWidth: 16, halign: "center" }, // Antrean
      2: { cellWidth: 20, halign: "center" }, // Tanggal
      3: { cellWidth: 14, halign: "center" }, // Jam
      4: { cellWidth: 44 },                  // Nama Tamu
      5: { cellWidth: 48 },                  // Asal Instansi
      6: { cellWidth: 40 },                  // Bidang
      7: { cellWidth: 47 },                  // Keperluan
      8: { cellWidth: 20, halign: "center" }, // Status
      9: { cellWidth: 10, halign: "center" }, // Foto
    },
    didDrawPage: () => {
      // Footer pada setiap halaman; total halaman diisi setelah tabel selesai (putTotalPages)
      const currentPage = doc.getCurrentPageInfo().pageNumber;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(140, 146, 175);

      // Garis footer tipis
      doc.setDrawColor(230, 232, 245);
      doc.setLineWidth(0.2);
      doc.line(14, 198, 283, 198);

      doc.text(
        "SIKUNJUNG • Sistem Informasi Buku Tamu Digital • Inspektorat Daerah Kabupaten Bangli",
        14,
        202
      );

      doc.text(
        `Halaman ${currentPage} dari ${TOTAL_PAGES_TOKEN}`,
        283,
        202,
        { align: "right" }
      );
    },
  });

  // ================= 4. AREA TANDA TANGAN DI HALAMAN TERAKHIR =================
  const lastTableY = (doc as JsPdfDoc & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 140;
  let signY = lastTableY + 8;

  // Jika posisi tanda tangan melebihi batas bawah halaman, buat halaman baru
  if (signY > 170) {
    doc.addPage();
    signY = 25;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(31, 37, 71);

  doc.text(`Bangli, ${todayFormatted}`, 235, signY, { align: "center" });
  doc.text("Petugas Pengelola Buku Tamu,", 235, signY + 4, { align: "center" });
  doc.text("Inspektorat Daerah Kab. Bangli", 235, signY + 8, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.text("( ............................................................ )", 235, signY + 23, {
    align: "center",
  });

  doc.putTotalPages(TOTAL_PAGES_TOKEN);
  doc.save(`${filenamePrefix}_${todayStr}.pdf`);
}

