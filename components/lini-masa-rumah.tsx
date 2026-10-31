import Link from "next/link";
import { formatTanggalWaktu } from "@/lib/format";
import { tautanBaca } from "@/lib/storage";
import { HapusCatatan } from "@/components/hapus-catatan";
import { cardClass, noteClass } from "@/lib/ui";

export type MediaRingkas = {
  id: number;
  jenis: string;
  jalur: string;
  namaAsli: string;
};

export type CatatanRingkas = {
  id: number;
  isi: string;
  createdAt: Date;
  penulisId: number;
  penulis: { name: string };
  media: MediaRingkas[];
  /// Diisi hanya pada daftar gabungan, supaya terlihat ini catatan murid siapa.
  santri?: { id: number; name: string; kelas: string };
};

/**
 * Lini masa laporan rumah. Tautan media diterbitkan di server dan berumur
 * satu jam, jadi alamatnya tidak berguna bila disebar keluar.
 */
export async function LiniMasaRumah({
  catatan,
  idPengguna,
  admin = false,
  kosong,
  tandaiBaru = false,
  batasBaru = null,
}: {
  catatan: CatatanRingkas[];
  idPengguna: number;
  admin?: boolean;
  kosong: string;
  /// Nyalakan penanda "Baru" pada daftar gabungan milik staf.
  tandaiBaru?: boolean;
  /// Waktu terakhir staf membuka daftar. Kosong berarti belum pernah,
  /// sehingga seluruh catatan terhitung baru.
  batasBaru?: Date | null;
}) {
  if (catatan.length === 0) {
    return (
      <div className={`${cardClass} px-5 py-12 text-center`}>
        <p className="text-[13px] text-ink-500">{kosong}</p>
      </div>
    );
  }

  const denganTautan = await Promise.all(
    catatan.map(async (c) => ({
      ...c,
      media: await Promise.all(
        c.media.map(async (m) => ({ ...m, tautan: await tautanBaca(m.jalur) })),
      ),
    })),
  );

  return (
    <ul className="space-y-4">
      {denganTautan.map((c) => (
        <li key={c.id} className={cardClass}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ink-100 px-4 py-2.5">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              {c.santri ? (
                <Link
                  href={`/murid/${c.santri.id}`}
                  className="text-[13px] font-medium text-ink-900 hover:text-brand-700"
                >
                  {c.santri.name}
                </Link>
              ) : null}
              <p className="text-[12.5px] text-ink-600">
                {c.santri ? `${c.santri.kelas} · ` : ""}
                {c.penulis.name}
              </p>
              {tandaiBaru && (batasBaru === null || c.createdAt > batasBaru) ? (
                <span className="rounded-sm border border-brass-200 bg-brass-50 px-1.5 py-0.5 text-[10.5px] font-medium leading-[1.35] text-brass-700">
                  Baru
                </span>
              ) : null}
            </div>
            <time className="text-[12px] text-ink-500">{formatTanggalWaktu(c.createdAt)}</time>
          </div>

          <div className="px-4 py-3">
            {c.isi ? (
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-800">
                {c.isi}
              </p>
            ) : (
              <p className={noteClass}>Tanpa catatan tertulis.</p>
            )}

            {c.media.length > 0 ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {c.media.map((m) =>
                  m.tautan === null ? (
                    <div
                      key={m.id}
                      className="rounded border border-dashed border-ink-200 px-3 py-6 text-center text-[12px] text-ink-400"
                    >
                      Berkas {m.namaAsli} tidak dapat dimuat.
                    </div>
                  ) : m.jenis === "VIDEO" ? (
                    <video
                      key={m.id}
                      src={m.tautan}
                      controls
                      preload="metadata"
                      className="w-full rounded border border-ink-200 bg-ink-900"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={m.id}
                      src={m.tautan}
                      alt={m.namaAsli}
                      loading="lazy"
                      className="w-full rounded border border-ink-200 object-cover"
                    />
                  ),
                )}
              </div>
            ) : null}
          </div>

          {admin || c.penulisId === idPengguna ? (
            <div className="flex justify-end border-t border-ink-100 px-4 py-2">
              <HapusCatatan catatanId={c.id} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
