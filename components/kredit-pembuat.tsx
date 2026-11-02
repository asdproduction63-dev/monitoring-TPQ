/**
 * Kredit pembuat aplikasi. Sengaja dibuat lirih: memakai huruf mono kecil
 * yang sama dengan label-label lain, supaya tidak bersaing dengan nama TPQ
 * yang jadi identitas utama tiap halaman.
 *
 * Yang dipakai hanya monogramnya. Logo utuh memuat tulisan "ASD PRODUCTION"
 * di bawah monogram, dan pada ukuran footer tulisan itu tinggal sekitar tiga
 * piksel sehingga tidak terbaca; jadi namanya ditulis sebagai teks. Logo
 * utuhnya tersimpan di public/asd-production.svg.
 */

const NAMA = "ASD.Production";

/// Diwarnai currentColor, jadi monogram ikut warna teks di sebelahnya dan
/// tidak muncul sebagai hitam pekat yang asing di palet aplikasi.
function Monogram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="108.96 172.8 192.96 172.32"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <g transform="translate(0,594) scale(0.1,-0.1)">
        <path d="M1531 4168 c-281 -188 -441 -484 -441 -813 0 -66 5 -140 10 -165 22 -99 13 -90 90 -90 l69 0 3 88 3 87 90 0 90 0 3 -338 c2 -305 4 -340 20 -357 16 -17 134 -90 146 -90 3 0 6 387 6 860 0 713 -2 860 -13 860 -8 0 -42 -19 -76 -42z m-83 -519 l-3 -184 -82 -3 c-97 -3 -95 -6 -64 116 30 113 122 285 143 264 4 -4 7 -91 6 -193z" />
        <path d="M2510 3356 c0 -471 2 -856 4 -856 11 0 84 46 126 79 312 244 447 644 345 1025 -28 105 -89 235 -155 327 -43 61 -179 193 -226 221 -16 9 -44 26 -61 38 l-33 22 0 -856z m202 457 c9 -10 34 -52 55 -93 106 -200 109 -505 6 -703 -44 -86 -71 -127 -84 -127 -5 0 -9 186 -9 470 0 259 4 470 8 470 5 0 16 -8 24 -17z" />
      </g>
    </svg>
  );
}

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

      <span className="flex items-center gap-1.5 text-ink-600">
        {/* Di bawah 20px rongga huruf A dan D mulai menutup dan monogramnya
            terbaca sekadar dua kurung, jadi ukurannya tidak diturunkan lagi. */}
        <Monogram className={lega ? "h-6 w-auto" : "h-5 w-auto"} />
        <span
          className={`font-serif font-semibold leading-none tracking-tight ${
            lega ? "text-[13.5px]" : "text-[12.5px]"
          }`}
        >
          {NAMA}
        </span>
      </span>
    </div>
  );
}
