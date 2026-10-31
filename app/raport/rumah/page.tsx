import { requireWali } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storageSiap } from "@/lib/storage";
import { FormLaporanRumah } from "@/components/form-laporan-rumah";
import { LiniMasaRumah } from "@/components/lini-masa-rumah";
import {
  cardClass,
  cardHeadClass,
  cardSubClass,
  cardTitleClass,
  noteClass,
  pageSubClass,
  pageTitleClass,
} from "@/lib/ui";

export const metadata = { title: "Laporan Rumah" };

const BATAS_TAMPIL = 30;

export default async function LaporanRumahPage() {
  const { user, santri } = await requireWali();

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

  const catatan = await prisma.catatanRumah.findMany({
    where: { santriId: santri.id },
    orderBy: { createdAt: "desc" },
    take: BATAS_TAMPIL,
    select: {
      id: true,
      isi: true,
      createdAt: true,
      penulisId: true,
      penulis: { select: { name: true } },
      media: { select: { id: true, jenis: true, jalur: true, namaAsli: true } },
    },
  });

  const siap = storageSiap();

  return (
    <div>
      <div className="mb-6 border-b border-ink-200 pb-5">
        <h1 className={pageTitleClass}>Laporan Rumah</h1>
        <p className={pageSubClass}>
          Ceritakan kegiatan {santri.name} di rumah — murojaah, hafalan baru, atau kendala yang
          dialami. Boleh disertai foto dan video. Ustadz akan membacanya.
        </p>
      </div>

      <section className={`${cardClass} mb-6`}>
        <div className={cardHeadClass}>
          <div>
            <h2 className={cardTitleClass}>Tulis catatan baru</h2>
            <p className={cardSubClass}>Bisa ditulis kapan saja, tidak harus menunggu akhir pekan.</p>
          </div>
        </div>

        <div className="p-4">
          {siap ? (
            <FormLaporanRumah santriId={santri.id} />
          ) : (
            <p className="rounded border border-brass-200 bg-brass-50 px-3.5 py-2.5 text-[13px] text-brass-700">
              Penyimpanan berkas belum disiapkan admin, jadi catatan belum bisa dikirim dari
              halaman ini. Silakan hubungi pengurus TPQ.
            </p>
          )}
        </div>
      </section>

      <h2 className="mb-3 font-serif text-[16px] font-semibold text-ink-900">
        Riwayat catatan
      </h2>

      <LiniMasaRumah
        catatan={catatan}
        idPengguna={user.id}
        kosong="Belum ada catatan. Tulis yang pertama lewat kolom di atas."
      />

      {catatan.length === BATAS_TAMPIL ? (
        <p className={`${noteClass} mt-4`}>
          Menampilkan {BATAS_TAMPIL} catatan terbaru.
        </p>
      ) : null}
    </div>
  );
}
