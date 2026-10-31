import type { Prisma } from "@prisma/client";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LiniMasaRumah } from "@/components/lini-masa-rumah";
import { TandaiDibaca } from "@/components/tandai-dibaca";
import {
  btnSecondary,
  cardClass,
  labelClass,
  noteClass,
  pageSubClass,
  pageTitleClass,
  selectClass,
} from "@/lib/ui";

export const metadata = { title: "Laporan Rumah" };

const BATAS = 40;

export default async function LaporanRumahStafPage({
  searchParams,
}: {
  searchParams: Promise<{ murid?: string }>;
}) {
  const user = await requireStaff();
  const sp = await searchParams;

  const muridTerpilih =
    sp.murid && Number.isFinite(Number(sp.murid)) ? Number(sp.murid) : 0;

  const where: Prisma.CatatanRumahWhereInput = muridTerpilih
    ? { santriId: muridTerpilih }
    : {};

  const [akun, daftarMurid, catatan] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { catatanDibacaAt: true },
    }),
    prisma.santri.findMany({
      where: { catatanRumah: { some: {} } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, kelas: true },
    }),
    prisma.catatanRumah.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: BATAS,
      select: {
        id: true,
        isi: true,
        createdAt: true,
        penulisId: true,
        penulis: { select: { name: true } },
        santri: { select: { id: true, name: true, kelas: true } },
        media: { select: { id: true, jenis: true, jalur: true, namaAsli: true } },
      },
    }),
  ]);

  const batasBaru = akun?.catatanDibacaAt ?? null;
  const jumlahBaru = await prisma.catatanRumah.count({
    where: batasBaru ? { createdAt: { gt: batasBaru } } : {},
  });

  return (
    <div>
      <TandaiDibaca adaYangBaru={jumlahBaru > 0} />

      <div className="mb-6 border-b border-ink-200 pb-5">
        <h1 className={pageTitleClass}>Laporan Rumah</h1>
        <p className={pageSubClass}>
          Catatan kegiatan anak di rumah yang dikirim wali murid, terbaru di atas.
          {jumlahBaru > 0
            ? ` ${jumlahBaru} di antaranya belum pernah Anda buka.`
            : " Semuanya sudah Anda baca."}
        </p>
      </div>

      {daftarMurid.length > 1 ? (
        <div className={`${cardClass} mb-5 p-4`}>
          <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="sm:w-72">
              <label htmlFor="murid" className={labelClass}>
                Saring per murid
              </label>
              <select
                id="murid"
                name="murid"
                defaultValue={String(muridTerpilih || "")}
                className={selectClass}
              >
                <option value="">Semua murid</option>
                {daftarMurid.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.kelas}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className={btnSecondary}>
              Tampilkan
            </button>
          </form>
        </div>
      ) : null}

      <LiniMasaRumah
        catatan={catatan}
        idPengguna={user.id}
        admin={user.role === "ADMIN"}
        tandaiBaru
        batasBaru={batasBaru}
        kosong={
          muridTerpilih
            ? "Murid ini belum punya laporan rumah."
            : "Belum ada wali yang mengirim laporan rumah."
        }
      />

      {catatan.length === BATAS ? (
        <p className={`${noteClass} mt-4`}>
          Menampilkan {BATAS} catatan terbaru. Saring per murid untuk melihat yang lebih lama.
        </p>
      ) : null}
    </div>
  );
}
