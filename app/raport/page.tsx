import { requireWali } from "@/lib/auth";
import { isISODate } from "@/lib/format";
import { awalPekan, daftarPekan, formatRentangPekan, labelPekan, pekanBerjalan } from "@/lib/pekan";
import {
  btnPrimary,
  btnSecondary,
  cardClass,
  labelClass,
  noteClass,
  pageSubClass,
  pageTitleClass,
  selectClass,
} from "@/lib/ui";

export const metadata = { title: "Raport Pekanan" };

export default async function RaportPage({
  searchParams,
}: {
  searchParams: Promise<{ pekan?: string }>;
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
          Akun wali ini belum dihubungkan dengan data murid, jadi raportnya belum bisa ditampilkan.
          Silakan hubungi admin TPQ untuk menautkannya.
        </p>
      </div>
    );
  }

  const pilihanPekan = daftarPekan(santri.createdAt, 12);
  const diminta = isISODate(sp.pekan) ? awalPekan(sp.pekan) : "";
  const pekan = pilihanPekan.includes(diminta) ? diminta : pilihanPekan[0];

  const sumber = `/api/raport/gambar?pekan=${pekan}`;
  const berjalan = pekan === pekanBerjalan();

  return (
    <div>
      <div className="mb-6 border-b border-ink-200 pb-5">
        <h1 className={pageTitleClass}>Raport Pekanan</h1>
        <p className={pageSubClass}>
          {santri.name} · Kelas {santri.kelas} · NIS <span className="font-mono">{santri.nis}</span>
        </p>
      </div>

      <div className={`${cardClass} mb-5 p-4`}>
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="pekan" className={labelClass}>
              Pilih pekan
            </label>
            <select id="pekan" name="pekan" defaultValue={pekan} className={selectClass}>
              {pilihanPekan.map((item) => (
                <option key={item} value={item}>
                  {labelPekan(item)}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={btnSecondary}>
            Tampilkan
          </button>
          <a href={`${sumber}&unduh=1`} className={btnPrimary} download>
            Unduh gambar
          </a>
        </form>
      </div>

      {berjalan ? (
        <p className={`${noteClass} mb-4`}>
          Pekan ini masih berjalan, jadi isinya masih bertambah sampai Minggu malam. Raport pekan
          yang sudah lewat tetap bisa dibuka lewat pilihan di atas.
        </p>
      ) : null}

      <div className="overflow-hidden rounded border border-ink-200 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sumber}
          alt={`Raport ${santri.name} pekan ${formatRentangPekan(pekan)}`}
          width={1000}
          height={1414}
          className="block h-auto w-full"
        />
      </div>

      <p className={`${noteClass} mt-4`}>
        Raport diterbitkan tiap pekan, Senin sampai Minggu. Gambar yang diunduh berisi setoran
        hafalan, presensi kegiatan, dan catatan ustadz pada pekan tersebut.
      </p>
    </div>
  );
}
