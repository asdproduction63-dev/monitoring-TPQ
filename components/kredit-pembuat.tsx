import Image from "next/image";

/**
 * Kredit pembuat aplikasi. Sengaja dibuat lirih: memakai huruf mono kecil
 * yang sama dengan label-label lain, supaya tidak bersaing dengan nama TPQ
 * yang jadi identitas utama tiap halaman.
 *
 * Yang dipakai hanya monogramnya. Logo utuh memuat tulisan "ASD PRODUCTION"
 * di bawah monogram, dan pada ukuran footer tulisan itu tinggal sekitar
 * empat piksel sehingga tidak terbaca; jadi namanya ditulis sebagai teks.
 * Logo utuhnya tersimpan di public/asd-production.png.
 */

const NAMA = "ASD.Production";

export function KreditPembuat({
  lega = false,
  className = "",
}: {
  /// Versi lebih lapang untuk halaman login, yang ruangnya banyak.
  lega?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span aria-hidden="true" className="h-px w-5 bg-brass-300" />

      <p
        className={`font-mono uppercase leading-none tracking-[0.16em] text-ink-400 ${
          lega ? "text-[9.5px]" : "text-[9px]"
        }`}
      >
        Project by
      </p>

      <span className="flex items-center gap-1.5">
        {/* Monogramnya tidak perlu terbaca huruf per huruf, karena namanya
            sudah tertulis tepat di sebelahnya. Jadi ukurannya dipatok
            sedikit di atas tinggi huruf namanya saja, supaya kreditnya
            tidak menarik perhatian lebih dari isi halaman. */}
        <Image
          src="/asd-monogram.png"
          alt=""
          width={197}
          height={195}
          className={lega ? "h-[18px] w-auto" : "h-4 w-auto"}
        />
        <span
          className={`font-serif font-medium leading-none tracking-tight text-ink-500 ${
            lega ? "text-[12px]" : "text-[11px]"
          }`}
        >
          {NAMA}
        </span>
      </span>
    </div>
  );
}
