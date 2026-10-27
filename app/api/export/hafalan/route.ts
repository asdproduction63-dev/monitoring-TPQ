import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isISODate, monthStartISO, todayISO } from "@/lib/format";
import { csvResponse, toCsv } from "@/lib/csv";
import { JENIS_SETORAN, PREDIKAT, STATUS_SETORAN } from "@/lib/constants";

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

  const data = await prisma.hafalanSetoran.findMany({
    where: { date: { gte: dari, lte: sampai } },
    orderBy: [{ date: "asc" }, { santriId: "asc" }],
    include: {
      santri: { select: { nis: true, name: true, kelas: true } },
      penguji: { select: { name: true } },
    },
  });

  const rows: (string | number | null)[][] = [
    [
      "Tanggal",
      "NIS",
      "Nama Murid",
      "Kelas",
      "Jenis",
      "Materi",
      "Predikat",
      "Status",
      "Penguji",
      "Catatan",
    ],
    ...data.map((row) => [
      row.date,
      row.santri.nis,
      row.santri.name,
      row.santri.kelas,
      JENIS_SETORAN[row.type as keyof typeof JENIS_SETORAN]?.short ?? row.type,
      row.materi,
      PREDIKAT[row.predikat as keyof typeof PREDIKAT]?.label ?? row.predikat,
      STATUS_SETORAN[row.status as keyof typeof STATUS_SETORAN]?.label ?? row.status,
      row.penguji.name,
      row.catatan ?? "",
    ]),
  ];

  return csvResponse(`setoran-${dari}-${sampai}.csv`, toCsv(rows));
}
