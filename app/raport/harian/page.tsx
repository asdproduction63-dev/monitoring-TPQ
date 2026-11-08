import { requireWali } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JENIS_SETORAN, PREDIKAT } from "@/lib/constants";
import { formatPersen, formatTanggalPanjang, isISODate } from "@/lib/format";
import { akhirBulan, awalBulan, bulanBerjalan, daftarBulan, labelBulan } from "@/lib/bulan";
import { PresensiBadge, SetoranBadge } from "@/components/badges";
import { Stat, StatBand } from "@/components/stat-band";
import {
  btnPrimary,
  cardClass,
  cardHeadClass,
  cardSubClass,
  cardTitleClass,
  labelClass,
  noteClass,
  pageSubClass,
  pageTitleClass,
  selectClass,
} from "@/lib/ui";

export const metadata = { title: "Perkembangan Harian" };

const judulBagian = "font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-400";

/** Satu kalimat pendek di bawah tanggal, supaya isi hari terbaca sekilas. */
function ringkasHari(jumlahSetoran: number, presensi: { status: string }[]) {
  const bagian: string[] = [];

  if (jumlahSetoran > 0) bagian.push(`${jumlahSetoran} setoran`);

  if (presensi.length > 0) {
    const hadir = presensi.filter((p) => p.status === "HADIR").length;
    bagian.push(
      hadir === presensi.length
        ? `hadir di ${presensi.length} kegiatan`
        : `hadir di ${hadir} dari ${presensi.length} kegiatan`,
    );
  }

  return bagian.join(" · ");
}

export default async function PerkembanganHarianPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string }>;
}) {
  const { santri } = await requireWali();
  const sp = await searchParams;

  if (!santri) {
    return (
      <div className={`${cardClass} border-l-2 border-l-brand-700 px-5 py-6`}>
        <h1 className="font-serif text-[20px] font-semibold tracking-tight text-ink-900">
          Akun belum ditautkan ke murid
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-600">
          Hubungi admin TPQ untuk menautkan akun ini ke data anak Anda.
        </p>
      </div>
    );
  }

  const pilihanBulan = daftarBulan(santri.createdAt, 12);
  const diminta = isISODate(sp.bulan) ? awalBulan(sp.bulan) : "";
  const bulan = pilihanBulan.includes(diminta) ? diminta : pilihanBulan[0];

  const [setoran, presensi] = await Promise.all([
    prisma.hafalanSetoran.findMany({
      where: { santriId: santri.id, date: { gte: bulan, lte: akhirBulan(bulan) } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        date: true,
        type: true,
        materi: true,
        status: true,
        predikat: true,
        catatan: true,
        penguji: { select: { name: true } },
      },
    }),
    prisma.presensi.findMany({
      where: { santriId: santri.id, date: { gte: bulan, lte: akhirBulan(bulan) } },
      orderBy: [{ date: "desc" }, { id: "asc" }],
      select: {
        id: true,
        date: true,
        status: true,
        note: true,
        kegiatan: { select: { name: true } },
      },
    }),
  ]);

  // Kedua daftar digabung per tanggal supaya satu hari terbaca sebagai satu
  // kesatuan: apa yang disetor dan kegiatan apa yang diikuti pada hari itu.
  const perHari = new Map<string, { setoran: typeof setoran; presensi: typeof presensi }>();
  const wadah = (tanggal: string) => {
    const ada = perHari.get(tanggal);
    if (ada) return ada;
    const baru = { setoran: [] as typeof setoran, presensi: [] as typeof presensi };
    perHari.set(tanggal, baru);
    return baru;
  };
  for (const s of setoran) wadah(s.date).setoran.push(s);
  for (const p of presensi) wadah(p.date).presensi.push(p);

  const hari = [...perHari.keys()].sort().reverse();

  const jumlahLulus = setoran.filter((s) => s.status === "LULUS").length;
  const jumlahHadir = presensi.filter((p) => p.status === "HADIR").length;
  const persenHadir = presensi.length > 0 ? (jumlahHadir / presensi.length) * 100 : null;

  return (
    <div>
      <div className="mb-6 border-b border-ink-200 pb-5">
        <h1 className={pageTitleClass}>Perkembangan Harian</h1>
        <p className={pageSubClass}>
          {santri.name} · Kelas {santri.kelas} · NIS <span className="font-mono">{santri.nis}</span>
        </p>
      </div>

      <div className={`${cardClass} mb-5 p-4`}>
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="bulan" className={labelClass}>
              Pilih bulan
            </label>
            <select id="bulan" name="bulan" defaultValue={bulan} className={selectClass}>
              {pilihanBulan.map((item) => (
                <option key={item} value={item}>
                  {labelBulan(item)}
                  {item === bulanBerjalan() ? " (bulan berjalan)" : ""}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={btnPrimary}>
            Tampilkan
          </button>
        </form>
      </div>

      <StatBand className="mb-5 sm:grid-cols-3">
        <Stat label="Setoran" value={setoran.length} hint={`${labelBulan(bulan)}`} />
        <Stat label="Lulus" value={jumlahLulus} hint="dinyatakan lulus" />
        <Stat
          label="Kehadiran"
          value={persenHadir === null ? "—" : formatPersen(persenHadir)}
          hint={
            presensi.length > 0
              ? `${jumlahHadir} dari ${presensi.length} kegiatan`
              : "belum ada catatan"
          }
        />
      </StatBand>

      {hari.length === 0 ? (
        <div className={`${cardClass} px-5 py-8 text-center`}>
          <p className="text-[13.5px] text-ink-600">
            Belum ada catatan pada {labelBulan(bulan)}.
          </p>
          <p className="mt-1.5 text-[12.5px] text-ink-400">
            Pilih bulan lain di atas untuk melihat catatan sebelumnya.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {hari.map((tanggal) => {
            const isi = perHari.get(tanggal)!;
            return (
              <article key={tanggal} className={cardClass}>
                <div className={cardHeadClass}>
                  <div className="min-w-0">
                    <h2 className={cardTitleClass}>{formatTanggalPanjang(tanggal)}</h2>
                    <p className={cardSubClass}>
                      {ringkasHari(isi.setoran.length, isi.presensi)}
                    </p>
                  </div>
                </div>

                <div className="space-y-5 px-4 py-4">
                  {isi.setoran.length > 0 ? (
                    <section>
                      <h3 className={judulBagian}>Setoran hafalan</h3>
                      <ul className="mt-2.5 space-y-3.5">
                        {isi.setoran.map((s) => (
                          <li key={s.id} className="border-l-2 border-brand-200 pl-3">
                            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                              <p className="text-[13.5px] font-medium leading-snug text-ink-900">
                                {s.materi}
                              </p>
                              <SetoranBadge status={s.status} />
                            </div>
                            <p className="mt-1 text-[12.5px] text-ink-500">
                              {JENIS_SETORAN[s.type as keyof typeof JENIS_SETORAN]?.label ?? s.type}
                              {" · "}
                              {PREDIKAT[s.predikat as keyof typeof PREDIKAT]?.label ?? s.predikat}
                            </p>
                            {s.catatan ? (
                              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-700">
                                “{s.catatan}”
                              </p>
                            ) : null}
                            <p className="mt-1 text-[11.5px] text-ink-400">
                              Diuji {s.penguji.name}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {isi.presensi.length > 0 ? (
                    <section>
                      <h3 className={judulBagian}>Kehadiran</h3>
                      <ul className="mt-2.5 border-t border-ink-100">
                        {isi.presensi.map((p) => (
                          <li
                            key={p.id}
                            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-ink-100 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-[13px] text-ink-800">{p.kegiatan.name}</p>
                              {p.note ? (
                                <p className="mt-0.5 text-[12px] leading-snug text-ink-500">
                                  {p.note}
                                </p>
                              ) : null}
                            </div>
                            <PresensiBadge status={p.status} />
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className={`${noteClass} mt-5`}>
        Halaman ini hanya untuk dilihat. Semua yang tercatat di sini ditulis ustadz di TPQ; kalau
        ada yang perlu dikoreksi, sampaikan langsung kepada ustadz atau admin TPQ.
      </p>
    </div>
  );
}
