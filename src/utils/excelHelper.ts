import * as XLSX from "xlsx";

export interface ParsedVoterRow {
  nisn: string;
  nama: string;
  kelas: string;
}

/**
 * Parse an uploaded Excel (.xlsx, .xls) or CSV file into an array of voters
 */
export async function parseVoterFile(file: File): Promise<ParsedVoterRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const voters: ParsedVoterRow[] = [];

        json.forEach((row, idx) => {
          // Normalize various possible header names in Indonesian or English
          const nama =
            row["Nama"] ||
            row["nama"] ||
            row["NAMA"] ||
            row["Nama Lengkap"] ||
            row["nama_lengkap"] ||
            row["Name"] ||
            row["Student Name"];

          const kelas =
            row["Kelas"] ||
            row["kelas"] ||
            row["KELAS"] ||
            row["Class"] ||
            row["Jurusan"] ||
            row["Tingkat"];

          const nisn =
            row["NISN"] ||
            row["nisn"] ||
            row["NIS"] ||
            row["nis"] ||
            row["No Induk"] ||
            `NIS-${1000 + idx + 1}`;

          if (nama && kelas) {
            voters.push({
              nisn: String(nisn).trim(),
              nama: String(nama).trim(),
              kelas: String(kelas).trim()
            });
          }
        });

        resolve(voters);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Download a starter template for DPT in Excel format (.xlsx)
 */
export function downloadVoterTemplate() {
  const sampleData = [
    { NISN: "0081234501", "Nama Lengkap": "Ahmad Fauzi", Kelas: "X TKJ 1" },
    { NISN: "0081234502", "Nama Lengkap": "Bella Safira", Kelas: "X RPL 1" },
    { NISN: "0081234503", "Nama Lengkap": "Candra Wijaya", Kelas: "XI TKJ 2" },
    { NISN: "0081234504", "Nama Lengkap": "Dina Maulida", Kelas: "XI OTKP 1" },
    { NISN: "0081234505", "Nama Lengkap": "Eko Prasetyo", Kelas: "XII AKL 1" }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template_DPT");
  XLSX.writeFile(workbook, "Template_DPT_SMK_Lentera_Bangsa_2.xlsx");
}

/**
 * Export current DPT list to Excel
 */
export function exportDptToExcel(dpt: any[], filename = "DPT_SMK_Lentera_Bangsa_2.xlsx") {
  const data = dpt.map((item, index) => ({
    No: index + 1,
    NISN: item.nisn,
    Nama: item.nama,
    Kelas: item.kelas,
    "Status Memilih": item.hasVoted ? "Sudah Memilih" : "Belum Memilih",
    "Waktu Memilih": item.votedAt ? new Date(item.votedAt).toLocaleString("id-ID") : "-"
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data_DPT");
  XLSX.writeFile(workbook, filename);
}

/**
 * Export voting recap to Excel
 */
export function exportRecapToExcel(paslon: any[], totalSuara: number, filename = "Hasil_Suara_OSIS.xlsx") {
  const data = paslon.map((p) => {
    const pct = totalSuara > 0 ? ((p.suara / totalSuara) * 100).toFixed(2) : "0.00";
    return {
      "Nomor Urut": p.nomorUrut,
      "Pasangan Calon": `${p.namaKetua} & ${p.namaWakil}`,
      "Kelas Ketua": p.kelasKetua,
      "Kelas Wakil": p.kelasWakil,
      "Perolehan Suara": p.suara,
      "Persentase (%)": `${pct}%`
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap_Suara");
  XLSX.writeFile(workbook, filename);
}
