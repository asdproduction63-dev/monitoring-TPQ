import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { JENIS_SETORAN, PREDIKAT, STATUS_SETORAN } from "@/lib/constants";
import { formatTanggal, isISODate, todayISO } from "@/lib/format";
import { akhirPekan, awalPekan, formatRentangPekan } from "@/lib/pekan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LEBAR = 1000;
const TINGGI = 1414;

// Diselaraskan dengan palet aplikasi.
const KERTAS = "#faf7f0";
const TINTA = "#2c2822";
const TINTA_REDUP = "#736c5d";
const GARIS = "#d5cec0";
const GARIS_TIPIS = "#e8e3d7";
const HIJAU = "#0f3a3a";
const HIJAU_MUDA = "#6ebfbc";
const TANAH = "#8c442b";
const KUNINGAN = "#926917";
// Warna status presensi, diambil dari logo (mint dan pink) agar sama dengan aplikasi.
const MINT = "#255a45";
const PINK = "#872b47";
const BAJA = "#2f4155";

const MAKS_BARIS_SETORAN = 8;

/**
 * Satori tidak bisa mengambil berkas lewat URL relatif, jadi lambangnya
 * dibaca dari disk lalu disisipkan sebagai data URI. Dibaca sekali saja.
 */
let lambangCache: string | null = null;
async function lambangDataUri() {
  if (lambangCache === null) {
    const berkas = await readFile(path.join(process.cwd(), "public", "logo-lambang.png"));
    lambangCache = `data:image/png;base64,${berkas.toString("base64")}`;
  }
  return lambangCache;
}

function potong(teks: string, batas: number) {
  return teks.length > batas ? `${teks.slice(0, batas - 1)}…` : teks;
}

function namaBerkas(nama: string, pekan: string) {
  const bersih = nama
    .normalize("NFD")
    .replace(/[^\p{ASCII}]/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `Raport-${bersih || "Murid"}-${pekan}.png`;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Silakan masuk terlebih dahulu.", { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const diminta = sp.get("pekan");
  const pekan = awalPekan(isISODate(diminta) ? diminta : todayISO());
  const sampai = akhirPekan(pekan);

  // Wali hanya boleh melihat anaknya sendiri; parameter santri diabaikan.
  let santriId: number;
  if (user.role === "WALI") {
    const milik = await prisma.santri.findFirst({
      where: { waliId: user.id },
      select: { id: true },
    });
    if (!milik) {
      return new Response("Akun wali ini belum ditautkan ke data murid.", { status: 404 });
    }
    santriId = milik.id;
  } else {
    santriId = Number(sp.get("santri"));
    if (!Number.isInteger(santriId) || santriId <= 0) {
      return new Response("Murid tidak valid.", { status: 400 });
    }
  }

  const [settings, santri, setoran, presensi] = await Promise.all([
    getSettings(),
    prisma.santri.findUnique({
      where: { id: santriId },
      select: { nis: true, name: true, kelas: true, gender: true },
    }),
    prisma.hafalanSetoran.findMany({
      where: { santriId, date: { gte: pekan, lte: sampai } },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      select: { date: true, materi: true, type: true, predikat: true, status: true, catatan: true },
    }),
    prisma.presensi.findMany({
      where: { santriId, date: { gte: pekan, lte: sampai } },
      orderBy: [{ date: "asc" }],
      select: { status: true, kegiatan: { select: { name: true } } },
    }),
  ]);

  if (!santri) {
    return new Response("Murid tidak ditemukan.", { status: 404 });
  }

  const lulus = setoran.filter((s) => s.status === "LULUS").length;
  const ulang = setoran.length - lulus;

  const hadir = presensi.filter((p) => p.status === "HADIR").length;
  const persenHadir = presensi.length ? Math.round((hadir / presensi.length) * 100) : null;

  const perKegiatan = new Map<string, { HADIR: number; IZIN: number; SAKIT: number; ALPA: number }>();
  for (const row of presensi) {
    const kunci = row.kegiatan.name;
    const agg = perKegiatan.get(kunci) ?? { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
    if (row.status === "HADIR" || row.status === "IZIN" || row.status === "SAKIT" || row.status === "ALPA") {
      agg[row.status] += 1;
    }
    perKegiatan.set(kunci, agg);
  }
  const barisKegiatan = [...perKegiatan.entries()].slice(0, 6);

  const catatan = setoran
    .map((s) => s.catatan?.trim())
    .filter((c): c is string => Boolean(c))
    .slice(0, 3);

  const barisSetoran = setoran.slice(0, MAKS_BARIS_SETORAN);
  const sisaSetoran = setoran.length - barisSetoran.length;

  const lambang = await lambangDataUri();

  const gambar = new ImageResponse(
    (
      <div
        style={{
          width: LEBAR,
          height: TINGGI,
          display: "flex",
          flexDirection: "column",
          backgroundColor: KERTAS,
          color: TINTA,
        }}
      >
        {/* Kop */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: HIJAU,
            padding: "40px 48px 34px 48px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {/* Alas terang supaya lambang teal tetap terbaca di atas kop gelap. */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 88,
                  height: 88,
                  marginRight: 22,
                  borderRadius: 8,
                  backgroundColor: KERTAS,
                }}
              >
                <img src={lambang} width={66} height={63} alt="" />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 13, letterSpacing: 5, color: HIJAU_MUDA }}>
                  LAPORAN PEKANAN
                </div>
                <div style={{ fontSize: 34, fontWeight: 600, color: "#ffffff", marginTop: 10 }}>
                  {potong(settings.namaTpq, 30)}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div
                style={{ fontSize: 14, color: HIJAU_MUDA }}
              >{`T.A. ${settings.tahunAjaran}`}</div>
              <div
                style={{ fontSize: 14, color: HIJAU_MUDA, marginTop: 6 }}
              >{`Semester ${settings.semester}`}</div>
            </div>
          </div>
          <div
            style={{ fontSize: 18, color: "#d2ebe9", marginTop: 22 }}
          >{`Pekan ${formatRentangPekan(pekan)}`}</div>
        </div>

        {/* Identitas murid */}
        <div
          style={{
            display: "flex",
            padding: "30px 48px",
            borderBottom: `1px solid ${GARIS}`,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", width: 440 }}>
            <div style={{ fontSize: 12, letterSpacing: 2, color: TINTA_REDUP }}>NAMA MURID</div>
            <div style={{ fontSize: 30, fontWeight: 600, marginTop: 8 }}>
              {potong(santri.name, 26)}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", width: 232 }}>
            <div style={{ fontSize: 12, letterSpacing: 2, color: TINTA_REDUP }}>NIS</div>
            <div style={{ fontSize: 20, marginTop: 12 }}>{santri.nis}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", width: 232 }}>
            <div style={{ fontSize: 12, letterSpacing: 2, color: TINTA_REDUP }}>KELAS</div>
            <div style={{ fontSize: 20, marginTop: 12 }}>{potong(santri.kelas, 18)}</div>
          </div>
        </div>

        {/* Ringkasan angka */}
        <div style={{ display: "flex", borderBottom: `1px solid ${GARIS}` }}>
          {[
            { label: "SETORAN", nilai: String(setoran.length), catatan: "pekan ini" },
            { label: "LULUS", nilai: String(lulus), catatan: "dinyatakan lulus" },
            { label: "PERLU DIULANG", nilai: String(ulang), catatan: "belum lulus" },
            {
              label: "KEHADIRAN",
              nilai: persenHadir === null ? "—" : `${persenHadir}%`,
              catatan:
                presensi.length === 0 ? "belum ada catatan" : `${hadir} dari ${presensi.length}`,
            },
          ].map((item, index) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                flexDirection: "column",
                width: 226,
                padding: "24px 0 24px 24px",
                borderLeft: index === 0 ? "none" : `1px solid ${GARIS_TIPIS}`,
                marginLeft: index === 0 ? 48 : 0,
              }}
            >
              <div style={{ fontSize: 11, letterSpacing: 2, color: TINTA_REDUP }}>{item.label}</div>
              <div style={{ fontSize: 38, fontWeight: 600, marginTop: 10 }}>{item.nilai}</div>
              <div style={{ fontSize: 13, color: TINTA_REDUP, marginTop: 8 }}>{item.catatan}</div>
            </div>
          ))}
        </div>

        {/* Setoran hafalan */}
        <div style={{ display: "flex", flexDirection: "column", padding: "26px 48px 0 48px" }}>
          <div style={{ fontSize: 20, fontWeight: 600 }}>Setoran hafalan</div>

          <div
            style={{
              display: "flex",
              marginTop: 14,
              paddingBottom: 8,
              borderBottom: `1px solid ${GARIS}`,
              fontSize: 11,
              letterSpacing: 2,
              color: TINTA_REDUP,
            }}
          >
            <div style={{ display: "flex", width: 110 }}>TANGGAL</div>
            <div style={{ display: "flex", width: 374 }}>MATERI</div>
            <div style={{ display: "flex", width: 260 }}>PREDIKAT</div>
            <div style={{ display: "flex", width: 160 }}>STATUS</div>
          </div>

          {barisSetoran.length === 0 ? (
            <div style={{ display: "flex", padding: "30px 0", fontSize: 16, color: TINTA_REDUP }}>
              Tidak ada setoran yang tercatat pada pekan ini.
            </div>
          ) : (
            barisSetoran.map((s, index) => (
              <div
                key={`${s.date}-${index}`}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  paddingTop: 11,
                  paddingBottom: 11,
                  borderBottom: `1px solid ${GARIS_TIPIS}`,
                  fontSize: 15,
                }}
              >
                <div style={{ display: "flex", width: 110, color: TINTA_REDUP }}>
                  {formatTanggal(s.date)}
                </div>
                <div style={{ display: "flex", flexDirection: "column", width: 374 }}>
                  <div style={{ display: "flex" }}>{potong(s.materi, 36)}</div>
                  <div style={{ display: "flex", fontSize: 13, color: TINTA_REDUP, marginTop: 3 }}>
                    {JENIS_SETORAN[s.type as keyof typeof JENIS_SETORAN]?.short ?? s.type}
                  </div>
                </div>
                <div style={{ display: "flex", width: 260 }}>
                  {potong(PREDIKAT[s.predikat as keyof typeof PREDIKAT]?.label ?? s.predikat, 30)}
                </div>
                <div
                  style={{
                    display: "flex",
                    width: 160,
                    color: s.status === "LULUS" ? HIJAU : KUNINGAN,
                  }}
                >
                  {STATUS_SETORAN[s.status as keyof typeof STATUS_SETORAN]?.label ?? s.status}
                </div>
              </div>
            ))
          )}

          {sisaSetoran > 0 ? (
            <div
              style={{ display: "flex", marginTop: 10, fontSize: 13, color: TINTA_REDUP }}
            >{`dan ${sisaSetoran} setoran lain pada pekan ini`}</div>
          ) : null}
        </div>

        {/* Presensi kegiatan */}
        <div style={{ display: "flex", flexDirection: "column", padding: "28px 48px 0 48px" }}>
          <div style={{ fontSize: 20, fontWeight: 600 }}>Presensi kegiatan</div>

          <div
            style={{
              display: "flex",
              marginTop: 14,
              paddingBottom: 8,
              borderBottom: `1px solid ${GARIS}`,
              fontSize: 11,
              letterSpacing: 2,
              color: TINTA_REDUP,
            }}
          >
            <div style={{ display: "flex", width: 424 }}>KEGIATAN</div>
            <div style={{ display: "flex", width: 120 }}>HADIR</div>
            <div style={{ display: "flex", width: 120 }}>IZIN</div>
            <div style={{ display: "flex", width: 120 }}>SAKIT</div>
            <div style={{ display: "flex", width: 120 }}>ALPA</div>
          </div>

          {barisKegiatan.length === 0 ? (
            <div style={{ display: "flex", padding: "30px 0", fontSize: 16, color: TINTA_REDUP }}>
              Belum ada catatan presensi pada pekan ini.
            </div>
          ) : (
            barisKegiatan.map(([nama, agg]) => (
              <div
                key={nama}
                style={{
                  display: "flex",
                  paddingTop: 11,
                  paddingBottom: 11,
                  borderBottom: `1px solid ${GARIS_TIPIS}`,
                  fontSize: 15,
                }}
              >
                <div style={{ display: "flex", width: 424 }}>{potong(nama, 40)}</div>
                {(
                  [
                    [agg.HADIR, MINT],
                    [agg.IZIN, KUNINGAN],
                    [agg.SAKIT, BAJA],
                    [agg.ALPA, PINK],
                  ] as const
                ).map(([jumlah, warna], kolom) => (
                  <div
                    key={kolom}
                    // Angka nol dibuat redup supaya yang berisi saja yang menonjol.
                    style={{ display: "flex", width: 120, color: jumlah === 0 ? GARIS : warna }}
                  >
                    {jumlah}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Catatan ustadz */}
        <div style={{ display: "flex", flexDirection: "column", padding: "28px 48px 0 48px" }}>
          <div style={{ fontSize: 20, fontWeight: 600 }}>Catatan ustadz</div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 12,
              padding: "16px 20px",
              borderLeft: `3px solid ${HIJAU}`,
              backgroundColor: "#f3efe4",
              fontSize: 15,
              color: TINTA,
            }}
          >
            {catatan.length === 0 ? (
              <div style={{ display: "flex", color: TINTA_REDUP }}>
                Tidak ada catatan khusus pada pekan ini.
              </div>
            ) : (
              catatan.map((teks, index) => (
                <div key={index} style={{ display: "flex", marginTop: index === 0 ? 0 : 8 }}>
                  {potong(teks, 96)}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kaki */}
        <div
          style={{
            display: "flex",
            marginTop: "auto",
            justifyContent: "space-between",
            alignItems: "flex-end",
            padding: "0 48px 36px 48px",
            fontSize: 13,
            color: TINTA_REDUP,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{ display: "flex" }}
            >{`Dicetak ${formatTanggal(todayISO())} dari aplikasi TPQ Monitor`}</div>
            <div style={{ display: "flex", marginTop: 6 }}>
              Laporan ini dihasilkan otomatis dari catatan harian ustadz.
            </div>
          </div>
          {settings.namaPengasuh ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ display: "flex", fontSize: 12, letterSpacing: 2 }}>PENGASUH</div>
              <div style={{ display: "flex", color: TINTA, fontSize: 16, marginTop: 8 }}>
                {potong(settings.namaPengasuh, 30)}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    ),
    {
      width: LEBAR,
      height: TINGGI,
      // Tanpa ini ImageResponse memasang cache panjang, padahal isi raport
      // berubah setiap ada setoran atau presensi baru.
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );

  if (sp.get("unduh") !== "1") {
    return gambar;
  }

  // Salin menjadi respons unduhan; ImageResponse sendiri bersifat stream.
  const isi = await gambar.arrayBuffer();
  return new Response(isi, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${namaBerkas(santri.name, pekan)}"`,
      "Cache-Control": "no-store",
    },
  });
}
