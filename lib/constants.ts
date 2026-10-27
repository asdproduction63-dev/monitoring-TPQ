export const ROLES = {
  ADMIN: { label: "Administrator" },
  USTADZ: { label: "Ustadz / Ustadzah" },
  WALI: { label: "Wali Murid" },
} as const;

export type Role = keyof typeof ROLES;

/** Role yang boleh membuka aplikasi pencatatan. Wali murid hanya dapat halaman raport. */
export const STAFF_ROLES = ["ADMIN", "USTADZ"] as const;

export function isStaff(role: string): boolean {
  return role === "ADMIN" || role === "USTADZ";
}

export const PRESENSI_STATUS = {
  HADIR: { label: "Hadir" },
  IZIN: { label: "Izin" },
  SAKIT: { label: "Sakit" },
  ALPA: { label: "Alpa" },
} as const;

export type PresensiStatus = keyof typeof PRESENSI_STATUS;

export const STATUS_SETORAN = {
  LULUS: { label: "Lulus" },
  ULANG: { label: "Perlu Diulang" },
} as const;

export const JENIS_SETORAN = {
  ZIYADAH: { label: "Materi baru", short: "Materi baru" },
  MUROJAAH: { label: "Murojaah", short: "Murojaah" },
} as const;

export const PREDIKAT = {
  MUMTAZ: { label: "Mumtaz (istimewa)" },
  JAYYID_JIDDAN: { label: "Jayyid Jiddan (sangat baik)" },
  JAYYID: { label: "Jayyid (baik)" },
  MAQBUL: { label: "Maqbul (cukup)" },
  RASIB: { label: "Rasib (kurang)" },
} as const;

export const KATEGORI_KEGIATAN = {
  HARIAN: { label: "Harian" },
  TAHFIZH: { label: "Tahfizh" },
  KBM: { label: "KBM" },
  LAINNYA: { label: "Lainnya" },
} as const;

export const DEFAULT_SETTINGS = {
  namaTpq: "TPQ",
  namaPengasuh: "",
  tahunAjaran: "2026/2027",
  semester: "Ganjil",
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;
