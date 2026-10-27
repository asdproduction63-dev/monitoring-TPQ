import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { isISODate } from "@/lib/format";
import { akhirPekan, awalPekan, daftarPekan, labelPekan, pekanBerjalan } from "@/lib/pekan";
import { nomorWa, pesanPemberitahuan, tampilNomor, tautanWa } from "@/lib/wa";
import { Badge } from "@/components/badges";
import {
  btnSecondary,
  cardClass,
  cardHeadClass,
  cardSubClass,
  cardTitleClass,
  labelClass,
  noteClass,
  pageSubClass,
  pageTitleClass,
  rowClass,
  selectClass,
  tdClass,
  thClass,
} from "@/lib/ui";

export const metadata = { title: "Pemberitahuan Wali" };

function IkonWa() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M8 1.3a6.6 6.6 0 0 0-5.6 10.1L1.3 14.7l3.4-1.1A6.6 6.6 0 1 0 8 1.3Zm0 1.2a5.4 5.4 0 1 1-2.8 10l-.2-.1-2 .653.66-1.95-.13-.21A5.4 5.4 0 0 1 8 2.5Zm-2.1 2.6c-.14 0-.36.05-.55.26-.19.21-.72.7-.72 1.71s.74 1.98.84 2.12c.1.13 1.43 2.28 3.52 3.1 1.74.69 2.1.55 2.48.51.38-.03 1.21-.49 1.38-.97.17-.48.17-.89.12-.97-.05-.09-.19-.14-.4-.24-.21-.1-1.21-.6-1.4-.67-.19-.07-.33-.1-.47.1-.14.21-.53.67-.65.81-.12.14-.24.15-.45.05-.21-.1-.88-.33-1.67-1.03-.62-.55-1.03-1.22-1.15-1.43-.12-.21-.01-.32.09-.42.1-.09.21-.24.31-.36.1-.12.14-.21.21-.35.07-.14.03-.26-.02-.36-.05-.1-.46-1.11-.63-1.52-.16-.39-.33-.34-.45-.34h-.39Z" />
    </svg>
  );
}

export default async function PemberitahuanPage({
  searchParams,
}: {
  searchParams: Promise<{ pekan?: string }>;
}) {
  await requireStaff();
  const sp = await searchParams;

  const [settings, santri] = await Promise.all([
    getSettings(),
    prisma.santri.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        kelas: true,
        phone: true,
        createdAt: true,
        wali: { select: { name: true, active: true } },
      },
    }),
  ]);

  const terawal = santri.reduce<Date | null>(
    (min, s) => (min === null || s.createdAt < min ? s.createdAt : min),
    null,
  );
  const pilihanPekan = daftarPekan(terawal ?? new Date(), 12);
  const diminta = isISODate(sp.pekan) ? awalPekan(sp.pekan) : "";
  const pekan = pilihanPekan.includes(diminta) ? diminta : pilihanPekan[0];
  const sampai = akhirPekan(pekan);

  // Dipakai admin untuk melihat mana yang memang ada isinya pekan itu.
  const [setoranPekan, presensiPekan] = await Promise.all([
    prisma.hafalanSetoran.groupBy({
      by: ["santriId"],
      where: { date: { gte: pekan, lte: sampai } },
      _count: { _all: true },
    }),
    prisma.presensi.findMany({
      where: { date: { gte: pekan, lte: sampai } },
      select: { santriId: true, status: true },
    }),
  ]);

  const jumlahSetoran = new Map(setoranPekan.map((r) => [r.santriId, r._count._all]));
  const presensi = new Map<number, { hadir: number; total: number }>();
  for (const row of presensiPekan) {
    const a = presensi.get(row.santriId) ?? { hadir: 0, total: 0 };
    a.total += 1;
    if (row.status === "HADIR") a.hadir += 1;
    presensi.set(row.santriId, a);
  }

  const asal = process.env.APP_URL?.replace(/\/+$/, "") || null;
  const tautanRaport = asal ? `${asal}/raport` : null;

  const baris = santri.map((s) => {
    const nomor = nomorWa(s.phone);
    const punyaAkun = Boolean(s.wali?.active);
    const pesan = pesanPemberitahuan({
      namaTpq: settings.namaTpq,
      nama: s.name,
      kelas: s.kelas,
      pekan,
      tautan: tautanRaport,
    });
    return {
      santri: s,
      nomor,
      punyaAkun,
      setoran: jumlahSetoran.get(s.id) ?? 0,
      presensi: presensi.get(s.id) ?? { hadir: 0, total: 0 },
      tautan: nomor && punyaAkun ? tautanWa(nomor, pesan) : null,
    };
  });

  const siap = baris.filter((b) => b.tautan).length;
  const tanpaNomor = baris.filter((b) => !b.nomor).length;
  const tanpaAkun = baris.filter((b) => b.nomor && !b.punyaAkun).length;
  const berjalan = pekan === pekanBerjalan();

  return (
    <div>
      <div className="mb-6 border-b border-ink-200 pb-5">
        <h1 className={pageTitleClass}>Pemberitahuan Wali</h1>
        <p className={pageSubClass}>
          Kabari wali lewat WhatsApp bahwa raport pekanan anaknya sudah bisa dibuka. Isi raportnya
          tetap dilihat wali di aplikasi, tidak ikut dikirim lewat chat.
        </p>
      </div>

      <div className={`${cardClass} mb-5 p-4`}>
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:w-80">
            <label htmlFor="pekan" className={labelClass}>
              Pekan yang diberitahukan
            </label>
            <select id="pekan" name="pekan" defaultValue={pekan} className={selectClass}>
              {pilihanPekan.map((p) => (
                <option key={p} value={p}>
                  {labelPekan(p)}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={btnSecondary}>
            Tampilkan
          </button>
        </form>
      </div>

      {berjalan ? (
        <p className={`${noteClass} mb-4`}>
          Pekan ini masih berjalan. Biasanya pemberitahuan dikirim setelah pekannya selesai.
        </p>
      ) : null}

      <div className={cardClass}>
        <div className={cardHeadClass}>
          <div>
            <h2 className={cardTitleClass}>Daftar murid aktif</h2>
            <p className={cardSubClass}>
              {siap} siap dikabari
              {tanpaNomor > 0 ? ` · ${tanpaNomor} tanpa nomor` : ""}
              {tanpaAkun > 0 ? ` · ${tanpaAkun} tanpa akun wali` : ""}
            </p>
          </div>
        </div>

        {baris.length === 0 ? (
          <p className="px-5 py-14 text-center text-[13px] text-ink-500">Belum ada murid aktif.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr>
                  <th className={thClass}>Murid</th>
                  <th className={thClass}>No. HP wali</th>
                  <th className={thClass}>Akun wali</th>
                  <th className={`${thClass} text-right`}>Setoran</th>
                  <th className={`${thClass} text-right`}>Hadir</th>
                  <th className={`${thClass} text-right`}>Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {baris.map((b) => (
                  <tr key={b.santri.id} className={rowClass}>
                    <td className={tdClass}>
                      <Link
                        href={`/murid/${b.santri.id}`}
                        className="font-medium text-ink-900 hover:text-brand-700"
                      >
                        {b.santri.name}
                      </Link>
                      <p className="mt-0.5 text-[12px] text-ink-500">{b.santri.kelas}</p>
                    </td>

                    <td className={tdClass}>
                      {b.nomor ? (
                        <span className="font-mono text-[12.5px] text-ink-700">
                          {tampilNomor(b.santri.phone)}
                        </span>
                      ) : (
                        <Link
                          href={`/murid/${b.santri.id}/edit`}
                          className="text-[12.5px] font-medium text-clay-600 underline-offset-2 hover:underline"
                        >
                          {b.santri.phone ? "Tidak valid — perbaiki" : "Belum diisi — tambahkan"}
                        </Link>
                      )}
                    </td>

                    <td className={tdClass}>
                      {b.santri.wali ? (
                        b.santri.wali.active ? (
                          <Badge tone="mint">Aktif</Badge>
                        ) : (
                          <Badge tone="clay">Nonaktif</Badge>
                        )
                      ) : (
                        <Link
                          href="/pengaturan?tab=pengguna"
                          className="text-[12.5px] font-medium text-clay-600 underline-offset-2 hover:underline"
                        >
                          Belum dibuat
                        </Link>
                      )}
                    </td>

                    <td className={`${tdClass} tnum text-right`}>{b.setoran}</td>
                    <td className={`${tdClass} tnum text-right`}>
                      {b.presensi.total > 0 ? `${b.presensi.hadir}/${b.presensi.total}` : "—"}
                    </td>

                    <td className={`${tdClass} text-right`}>
                      {b.tautan ? (
                        <a
                          href={b.tautan}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center justify-center gap-1.5 rounded border border-mint-600 bg-mint-600 px-2.5 py-1 text-[12px] font-medium text-white transition hover:bg-mint-700"
                        >
                          <IkonWa />
                          Kabari
                        </a>
                      ) : (
                        <span className="text-[12px] text-ink-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className={`${noteClass} mt-4`}>
        Tombol Kabari membuka WhatsApp dengan pesan yang sudah terisi; pengiriman tetap kamu yang
        menekan. Tombolnya baru aktif bila nomor wali sudah benar dan akun walinya sudah dibuat,
        karena pesannya mengarahkan wali untuk masuk ke aplikasi.
        {tautanRaport
          ? ""
          : " Alamat aplikasi belum diisi, jadi pesannya belum memuat tautan — isi APP_URL setelah aplikasi dideploy."}
      </p>
    </div>
  );
}
