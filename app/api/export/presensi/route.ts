import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isISODate, monthStartISO, todayISO } from "@/lib/format";
import { csvResponse, toCsv } from "@/lib/csv";
import { PRESENSI_STATUS } from "@/lib/constants";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const dariParam = url.searchParams.get("dari");
  const sampaiParam = url.searchParams.get("sampai");
  const dari = isISODate(dariParam) ? dariParam : monthStartISO();
  const sampai = isISODate(sampaiParam) ? sampaiParam : todayISO();

  const data = await prisma.presensi.findMany({
    where: { date: { gte: dari, lte: sampai } },
    orderBy: [{ date: "asc" }, { kegiatanId: "asc" }, { santriId: "asc" }],
    include: {
      santri: { select: { nis: true, name: true, kelas: true } },
      kegiatan: { select: { name: true } },
      recordedBy: { select: { name: true } },
    },
  });

  const rows: (string | number | null)[][] = [
    ["Tanggal", "NIS", "Nama Murid", "Kelas", "Kegiatan", "Status", "Catatan", "Dicatat Oleh"],
    ...data.map((row) => [
      row.date,
      row.santri.nis,
      row.santri.name,
      row.santri.kelas,
      row.kegiatan.name,
      PRESENSI_STATUS[row.status as keyof typeof PRESENSI_STATUS]?.label ?? row.status,
      row.note ?? "",
      row.recordedBy?.name ?? "",
    ]),
  ];

  return csvResponse(`presensi-${dari}-${sampai}.csv`, toCsv(rows));
}
