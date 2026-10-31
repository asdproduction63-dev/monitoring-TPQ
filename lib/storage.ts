/**
 * Lapisan tipis di atas Supabase Storage, memakai fetch biasa supaya tidak
 * menambah dependensi.
 *
 * Berkas tidak pernah melewati server aplikasi. Vercel membatasi badan
 * permintaan sekitar 4,5 MB, sedangkan video bisa puluhan MB. Jadi server
 * hanya menerbitkan izin unggah sekali pakai, lalu peramban mengirim
 * berkasnya langsung ke Supabase.
 *
 * Bucketnya privat. Foto dan video anak tidak boleh bisa dibuka siapa pun
 * yang menebak alamatnya, jadi setiap penayangan memakai tautan berbatas
 * waktu yang diterbitkan server setelah memeriksa hak akses.
 */

export const BUCKET = "dokumentasi";

/** Batas per berkas. Paket gratis Supabase sendiri membatasi di 50 MB. */
export const BATAS_UKURAN = 50 * 1024 * 1024;

export const JENIS_DIIZINKAN = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

function asal() {
  return process.env.SUPABASE_URL?.replace(/\/+$/, "") ?? "";
}

function kunci() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

/** Apakah kredensial penyimpanan sudah terpasang. */
export function storageSiap() {
  return Boolean(asal() && kunci());
}

function kepala() {
  return {
    apikey: kunci(),
    Authorization: `Bearer ${kunci()}`,
    "Content-Type": "application/json",
  };
}

async function galat(res: Response, konteks: string): Promise<never> {
  let pesan = `${res.status} ${res.statusText}`;
  try {
    const isi = await res.json();
    if (isi?.message) pesan = isi.message;
  } catch {
    // Jawaban bukan JSON; pakai kode status apa adanya.
  }
  throw new Error(`${konteks}: ${pesan}`);
}

/** Jadikan nama berkas aman untuk dipakai sebagai jalur penyimpanan. */
export function jalurAman(santriId: number, namaAsli: string) {
  const ext = (namaAsli.match(/\.([A-Za-z0-9]{1,8})$/)?.[1] ?? "bin").toLowerCase();
  const acak = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `santri/${santriId}/${acak}.${ext}`;
}

/**
 * Buat bucket privat bila belum ada. Dipanggil sekali saat penyiapan.
 */
export async function siapkanBucket() {
  const res = await fetch(`${asal()}/storage/v1/bucket`, {
    method: "POST",
    headers: kepala(),
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: false,
      file_size_limit: BATAS_UKURAN,
      allowed_mime_types: JENIS_DIIZINKAN,
    }),
  });

  if (res.ok) return "dibuat" as const;
  const isi = await res.json().catch(() => ({}));
  // Bucket yang sudah ada bukan kegagalan.
  if (res.status === 409 || /already exists/i.test(isi?.message ?? "")) {
    return "sudah ada" as const;
  }
  throw new Error(`Gagal membuat bucket: ${isi?.message ?? res.status}`);
}

/** Izin unggah sekali pakai untuk satu jalur. Peramban memakainya langsung. */
export async function izinUnggah(jalur: string) {
  const res = await fetch(
    `${asal()}/storage/v1/object/upload/sign/${BUCKET}/${jalur}`,
    { method: "POST", headers: kepala(), body: JSON.stringify({}) },
  );
  if (!res.ok) await galat(res, "Gagal menyiapkan izin unggah");

  const isi = (await res.json()) as { url?: string; token?: string };
  if (!isi.url) throw new Error("Supabase tidak mengembalikan alamat unggah.");

  // url yang dikembalikan bersifat relatif terhadap /storage/v1.
  const penuh = isi.url.startsWith("http")
    ? isi.url
    : `${asal()}/storage/v1/${isi.url.replace(/^\/+/, "")}`;

  return { url: penuh, token: isi.token ?? "" };
}

/** Tautan baca berbatas waktu. Dipakai saat menampilkan foto atau video. */
export async function tautanBaca(jalur: string, detik = 60 * 60) {
  const res = await fetch(`${asal()}/storage/v1/object/sign/${BUCKET}/${jalur}`, {
    method: "POST",
    headers: kepala(),
    body: JSON.stringify({ expiresIn: detik }),
  });
  if (!res.ok) return null;

  const isi = (await res.json()) as { signedURL?: string; signedUrl?: string };
  const relatif = isi.signedURL ?? isi.signedUrl;
  if (!relatif) return null;

  return relatif.startsWith("http")
    ? relatif
    : `${asal()}/storage/v1/${relatif.replace(/^\/+/, "")}`;
}

/** Hapus beberapa berkas sekaligus. Kegagalan tidak dilempar ke pemanggil. */
export async function hapusBerkas(jalurs: string[]) {
  if (jalurs.length === 0) return;
  await fetch(`${asal()}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: kepala(),
    body: JSON.stringify({ prefixes: jalurs }),
  }).catch(() => undefined);
}

/** Tentukan jenis media dari tipe berkasnya. */
export function jenisMedia(tipe: string): "FOTO" | "VIDEO" | null {
  if (tipe.startsWith("image/")) return "FOTO";
  if (tipe.startsWith("video/")) return "VIDEO";
  return null;
}
