"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { mintaIzinUnggah, simpanCatatan } from "@/lib/actions/catatan-rumah";
import { btnPrimary, btnSecondary, inputClass, labelClass, noteClass } from "@/lib/ui";

const BATAS_BERKAS = 6;
const BATAS_MB = 50;

type Terpilih = { berkas: File; id: string };

function ukuranTerbaca(byte: number) {
  if (byte < 1024 * 1024) return `${Math.max(1, Math.round(byte / 1024))} KB`;
  return `${(byte / 1024 / 1024).toFixed(1)} MB`;
}

export function FormLaporanRumah({ santriId }: { santriId: number }) {
  const router = useRouter();
  const inputBerkas = useRef<HTMLInputElement>(null);

  const [isi, setIsi] = useState("");
  const [terpilih, setTerpilih] = useState<Terpilih[]>([]);
  const [sibuk, setSibuk] = useState(false);
  const [kabar, setKabar] = useState("");
  const [galat, setGalat] = useState("");

  function tambahBerkas(daftar: FileList | null) {
    if (!daftar) return;
    setGalat("");

    const masuk: Terpilih[] = [];
    for (const berkas of Array.from(daftar)) {
      if (!berkas.type.startsWith("image/") && !berkas.type.startsWith("video/")) {
        setGalat(`${berkas.name} bukan foto atau video.`);
        continue;
      }
      if (berkas.size > BATAS_MB * 1024 * 1024) {
        setGalat(`${berkas.name} lebih dari ${BATAS_MB} MB.`);
        continue;
      }
      masuk.push({ berkas, id: `${berkas.name}-${berkas.size}-${Math.random()}` });
    }

    setTerpilih((lama) => {
      const gabung = [...lama, ...masuk];
      if (gabung.length > BATAS_BERKAS) {
        setGalat(`Maksimal ${BATAS_BERKAS} berkas per catatan.`);
        return gabung.slice(0, BATAS_BERKAS);
      }
      return gabung;
    });

    if (inputBerkas.current) inputBerkas.current.value = "";
  }

  function buang(id: string) {
    setTerpilih((lama) => lama.filter((t) => t.id !== id));
  }

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    if (sibuk) return;

    if (isi.trim().length === 0 && terpilih.length === 0) {
      setGalat("Tulis catatan atau lampirkan minimal satu berkas.");
      return;
    }

    setSibuk(true);
    setGalat("");
    setKabar("");

    try {
      const media = [];

      for (let i = 0; i < terpilih.length; i++) {
        const { berkas } = terpilih[i];
        setKabar(`Mengunggah ${i + 1} dari ${terpilih.length}: ${berkas.name}`);

        const izin = await mintaIzinUnggah(santriId, berkas.name, berkas.type, berkas.size);
        if (!izin.ok) {
          setGalat(izin.pesan);
          setSibuk(false);
          setKabar("");
          return;
        }

        // Berkas dikirim langsung ke Supabase, tidak lewat server aplikasi.
        const naik = await fetch(izin.url, {
          method: "PUT",
          headers: { "Content-Type": berkas.type },
          body: berkas,
        });
        if (!naik.ok) {
          setGalat(`Gagal mengunggah ${berkas.name}. Periksa sambungan lalu coba lagi.`);
          setSibuk(false);
          setKabar("");
          return;
        }

        media.push({
          jalur: izin.jalur,
          jenis: berkas.type.startsWith("video/") ? "VIDEO" : "FOTO",
          namaAsli: berkas.name.slice(0, 200),
          ukuran: berkas.size,
        });
      }

      setKabar("Menyimpan catatan…");
      const hasil = await simpanCatatan(santriId, isi, media);
      if (!hasil.ok) {
        setGalat(hasil.pesan);
        return;
      }

      setIsi("");
      setTerpilih([]);
      setKabar("");
      router.refresh();
    } catch {
      setGalat("Terjadi gangguan saat mengirim. Coba lagi sebentar lagi.");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <form onSubmit={kirim} className="space-y-4">
      <div>
        <label htmlFor="isi" className={labelClass}>
          Catatan
        </label>
        <textarea
          id="isi"
          rows={3}
          value={isi}
          onChange={(e) => setIsi(e.target.value)}
          maxLength={2000}
          disabled={sibuk}
          placeholder="Contoh: Hari ini murojaah Iqro 1 halaman 20 sampai 23, lancar tanpa dibantu."
          className={inputClass}
        />
        <p className={`${noteClass} mt-1`}>{isi.length} dari 2000 karakter</p>
      </div>

      <div>
        <label className={labelClass}>Foto atau video</label>
        <input
          ref={inputBerkas}
          type="file"
          accept="image/*,video/*"
          multiple
          disabled={sibuk || terpilih.length >= BATAS_BERKAS}
          onChange={(e) => tambahBerkas(e.target.files)}
          className="block w-full text-[12.5px] text-ink-600 file:mr-3 file:cursor-pointer file:rounded file:border file:border-ink-200 file:bg-white file:px-3 file:py-1.5 file:text-[12.5px] file:font-medium file:text-ink-700 hover:file:bg-paper-50 disabled:opacity-50"
        />
        <p className={`${noteClass} mt-1`}>
          Maksimal {BATAS_BERKAS} berkas, masing-masing sampai {BATAS_MB} MB.
        </p>
      </div>

      {terpilih.length > 0 ? (
        <ul className="divide-y divide-ink-100 rounded border border-ink-200">
          {terpilih.map(({ berkas, id }) => (
            <li key={id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-[12.5px] text-ink-800">{berkas.name}</p>
                <p className="text-[11.5px] text-ink-500">
                  {berkas.type.startsWith("video/") ? "Video" : "Foto"} ·{" "}
                  {ukuranTerbaca(berkas.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => buang(id)}
                disabled={sibuk}
                className="shrink-0 text-[12px] font-medium text-clay-600 underline-offset-2 hover:underline disabled:opacity-50"
              >
                Buang
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {galat ? (
        <p
          role="alert"
          className="rounded border border-clay-100 border-l-[3px] border-l-clay-500 bg-clay-50 px-3 py-2 text-[12.5px] text-clay-700"
        >
          {galat}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={sibuk} className={btnPrimary}>
          {sibuk ? "Mengirim…" : "Kirim catatan"}
        </button>
        {terpilih.length > 0 && !sibuk ? (
          <button type="button" onClick={() => setTerpilih([])} className={btnSecondary}>
            Kosongkan lampiran
          </button>
        ) : null}
        {kabar ? (
          <span aria-live="polite" className="text-[12.5px] text-ink-600">
            {kabar}
          </span>
        ) : null}
      </div>
    </form>
  );
}
