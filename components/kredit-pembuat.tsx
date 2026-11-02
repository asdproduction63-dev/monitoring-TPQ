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
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span aria-hidden="true" className="h-px w-6 bg-brass-300" />

      <p
        className={`font-mono uppercase leading-none tracking-[0.18em] text-ink-400 ${
          lega ? "text-[10.5px]" : "text-[10px]"
        }`}
      >
        Project by
      </p>

      <span className="flex items-center gap-2">
        {/* Di bawah 28px huruf A, S, dan D saling menempel dan monogramnya
            terbaca sekadar satu blok warna, jadi ukurannya tidak diturunkan. */}
        <Image
          src="/asd-monogram.png"
          alt=""
          width={197}
          height={195}
          className={lega ? "h-8 w-auto" : "h-7 w-auto"}
        />
        <span
          className={`font-serif font-semibold leading-none tracking-tight text-ink-700 ${
            lega ? "text-[13.5px]" : "text-[12.5px]"
          }`}
        >
          {NAMA}
        </span>
      </span>
    </div>
  );
}
