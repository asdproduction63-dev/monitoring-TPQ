"use client";

import { useEffect, useState } from "react";

/**
 * Tombol pasang aplikasi ke layar utama.
 *
 * Chrome dan Edge menawarkan pemasangan lewat peristiwa `beforeinstallprompt`.
 * Peristiwa itu bisa muncul sebelum React sempat hidup, jadi penangkapnya
 * ditaruh sebagai skrip kecil di app/layout.tsx; komponen ini tinggal memakai
 * hasil tangkapannya.
 *
 * Safari di iPhone tidak punya API itu sama sekali — satu-satunya jalan lewat
 * menu Bagikan. Jadi di sana tombolnya tidak memaksa apa-apa, hanya membuka
 * petunjuk dua langkah.
 *
 * Kalau perambannya tidak mendukung keduanya, atau aplikasinya memang sudah
 * terpasang, komponen ini tidak menggambar apa pun.
 */

type PeristiwaPasang = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __pasang?: PeristiwaPasang | null;
  }
}

function sudahTerpasang() {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // Safari iOS memakai penandanya sendiri, bukan display-mode.
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function perangkatApple() {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
  // iPad yang disetel "minta situs versi desktop" menyamar jadi Mac.
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

function IkonUnduh({ kelas }: { kelas: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={kelas}
    >
      <path d="M8 2v7.5" />
      <path d="m5.2 6.9 2.8 2.8 2.8-2.8" />
      <path d="M2.6 10.8v1.6A1.6 1.6 0 0 0 4.2 14h7.6a1.6 1.6 0 0 0 1.6-1.6v-1.6" />
    </svg>
  );
}

export function TombolPasang({
  lega = false,
  className = "",
}: {
  /// Versi lebih lapang untuk halaman login, yang ruangnya banyak.
  lega?: boolean;
  className?: string;
}) {
  const [mode, setMode] = useState<"diam" | "siap" | "apple">("diam");
  const [petunjukTerbuka, setPetunjukTerbuka] = useState(false);

  useEffect(() => {
    if (sudahTerpasang()) return;

    if (window.__pasang) setMode("siap");
    else if (perangkatApple()) setMode("apple");

    const jadiSiap = () => setMode("siap");
    const selesaiDipasang = () => setMode("diam");

    window.addEventListener("pasang-siap", jadiSiap);
    window.addEventListener("appinstalled", selesaiDipasang);
    return () => {
      window.removeEventListener("pasang-siap", jadiSiap);
      window.removeEventListener("appinstalled", selesaiDipasang);
    };
  }, []);

  if (mode === "diam") return null;

  async function tekan() {
    if (mode === "apple") {
      setPetunjukTerbuka((terbuka) => !terbuka);
      return;
    }

    const peristiwa = window.__pasang;
    if (!peristiwa) return;

    await peristiwa.prompt();
    await peristiwa.userChoice;

    // Tawaran dari peramban hanya berlaku sekali pakai. Kalau penggunanya
    // menolak, Chrome akan menawarkannya lagi sendiri di kunjungan berikutnya.
    window.__pasang = null;
    setMode("diam");
  }

  const petunjuk = petunjukTerbuka ? (
    <p
      className={`rounded-sm border border-brass-200 bg-brass-50 px-3 py-2.5 text-left text-[12px] leading-[1.6] text-ink-600 ${
        lega ? "mt-2.5" : "mt-2 max-w-xs"
      }`}
    >
      Di iPhone pemasangannya lewat Safari: ketuk tombol{" "}
      <span className="font-medium text-ink-900">Bagikan</span> di bilah bawah,
      gulir ke bawah, lalu pilih{" "}
      <span className="font-medium text-ink-900">Add to Home Screen</span>.
    </p>
  ) : null;

  if (lega) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={tekan}
          aria-expanded={mode === "apple" ? petunjukTerbuka : undefined}
          className="flex w-full items-center justify-center gap-2 rounded-[6px] border border-ink-200 bg-white/80 px-4 py-2.5 text-[13px] font-medium text-ink-700 transition hover:border-brand-500 hover:bg-white hover:text-brand-600"
        >
          <IkonUnduh kelas="h-[15px] w-[15px]" />
          Pasang aplikasi
        </button>

        <p className="mt-2 text-center text-[11.5px] leading-[1.6] text-ink-500">
          Terbuka langsung dari layar utama, tanpa lewat browser.
        </p>

        {petunjuk}
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={tekan}
        aria-expanded={mode === "apple" ? petunjukTerbuka : undefined}
        className="inline-flex items-center gap-1.5 text-[11px] text-ink-500 transition hover:text-brand-600"
      >
        <IkonUnduh kelas="h-3.5 w-3.5" />
        Pasang aplikasi
      </button>

      {petunjuk}
    </div>
  );
}
