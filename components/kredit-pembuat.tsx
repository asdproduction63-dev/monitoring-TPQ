import Image from "next/image";

/**
 * Kredit pembuat aplikasi. Sengaja dibuat lirih: memakai huruf mono kecil
 * yang sama dengan label-label lain, supaya tidak bersaing dengan nama TPQ
 * yang jadi identitas utama tiap halaman.
 *
 * Logo baru tampil bila berkasnya ada di public/. Selama belum ada, yang
 * muncul hanya namanya, dan tata letaknya tetap rapi.
 */

const NAMA = "ASD.Production";

/// Isi dengan "/asd-production.png" begitu berkas logonya tersedia.
const LOGO: { src: string; width: number; height: number } | null = null;

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

      {LOGO ? (
        <Image
          src={LOGO.src}
          alt={NAMA}
          width={LOGO.width}
          height={LOGO.height}
          className={lega ? "h-5 w-auto" : "h-4 w-auto"}
        />
      ) : (
        <p
          className={`font-serif font-semibold leading-none tracking-tight text-ink-600 ${
            lega ? "text-[13.5px]" : "text-[12.5px]"
          }`}
        >
          {NAMA}
        </p>
      )}
    </div>
  );
}
