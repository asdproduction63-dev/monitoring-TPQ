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
}: {
  catatan: CatatanRingkas[];
  idPengguna: number;
  admin?: boolean;
  kosong: string;
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
            <p className="text-[12.5px] font-medium text-ink-800">{c.penulis.name}</p>
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
