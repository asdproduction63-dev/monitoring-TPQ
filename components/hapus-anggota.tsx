"use client";

import { useEffect, useRef, useState } from "react";
import { btnDanger, btnDangerSolid, btnSecondary, inputClass, labelClass } from "@/lib/ui";

/**
 * Dialog hapus permanen untuk murid dan akun pengguna.
 *
 * Di aplikasi ini hampir semua yang terlihat "dihapus" sebenarnya hanya
 * dinonaktifkan, dan riwayatnya tetap utuh. Yang ini tidak: barisnya benar-
 * benar hilang beserta jejak yang menempel padanya. Karena itu urutannya
 * dibuat berat di depan — perlihatkan dulu apa saja yang akan ikut hilang
 * beserta jumlahnya, baru minta namanya diketik ulang. Tombol terakhirnya
 * mati sampai ketikannya cocok, supaya tidak ada yang terhapus karena
 * tangan yang lebih cepat daripada mata.
 */

export type RincianHapus = { label: string; jumlah: number };

export function HapusAnggota({
  aksi,
  id,
  nama,
  jenis,
  rincian,
  keterangan,
  ringkas = false,
}: {
  aksi: (formData: FormData) => void;
  id: number;
  nama: string;
  /// Masuk ke judul dialog: "Hapus murid Fulan?" atau "Hapus akun Fulan?".
  jenis: string;
  rincian: RincianHapus[];
  /// Kalimat tambahan untuk hal yang justru TIDAK ikut terhapus.
  keterangan?: string;
  /// Pemicu versi kecil, untuk diselipkan di kaki kartu.
  ringkas?: boolean;
}) {
  const [terbuka, setTerbuka] = useState(false);
  const [ketikan, setKetikan] = useState("");
  const kolom = useRef<HTMLInputElement>(null);

  const cocok = ketikan.trim().toLowerCase() === nama.trim().toLowerCase();
  const terdampak = rincian.filter((r) => r.jumlah > 0);

  useEffect(() => {
    if (!terbuka) return;

    kolom.current?.focus();

    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTerbuka(false);
    };
    window.addEventListener("keydown", tekan);

    // Halaman di belakang dialog tidak boleh ikut bergulir.
    const semula = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", tekan);
      document.body.style.overflow = semula;
    };
  }, [terbuka]);

  function buka() {
    setKetikan("");
    setTerbuka(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={buka}
        className={
          ringkas
            ? "shrink-0 text-[12px] font-medium text-clay-600 underline-offset-2 transition hover:underline"
            : btnDanger
        }
      >
        Hapus permanen
      </button>

      {terbuka ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/45 px-4 py-6 sm:items-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setTerbuka(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`hapus-judul-${id}`}
            className="w-full max-w-md border-l-2 border-clay-600 bg-white shadow-kartu"
          >
            <div className="border-b border-ink-100 px-5 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-clay-600">
                Tindakan permanen
              </p>
              <h2
                id={`hapus-judul-${id}`}
                className="mt-1.5 font-serif text-[18px] font-semibold leading-tight tracking-tight text-ink-900"
              >
                Hapus {jenis} {nama}?
              </h2>
            </div>

            <div className="space-y-4 px-5 py-4">
              {terdampak.length > 0 ? (
                <div>
                  <p className="text-[12.5px] leading-relaxed text-ink-600">
                    Ikut terhapus dan tidak bisa dikembalikan:
                  </p>
                  <ul className="mt-2.5 border-y border-ink-100">
                    {terdampak.map((r) => (
                      <li
                        key={r.label}
                        className="flex items-baseline justify-between gap-4 border-b border-ink-100 py-1.5 last:border-b-0"
                      >
                        <span className="text-[12.5px] text-ink-600">{r.label}</span>
                        <span className="font-mono text-[13px] font-medium text-clay-600">
                          {r.jumlah}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-[12.5px] leading-relaxed text-ink-600">
                  Belum ada riwayat yang menempel, jadi yang hilang hanya datanya sendiri.
                </p>
              )}

              {keterangan ? (
                <p className="rounded-sm border border-brass-200 bg-brass-50 px-3 py-2.5 text-[12px] leading-[1.6] text-ink-600">
                  {keterangan}
                </p>
              ) : null}

              <form action={aksi} className="space-y-3">
                <input type="hidden" name="id" value={id} />

                <div>
                  <label htmlFor={`hapus-ketik-${id}`} className={labelClass}>
                    Ketik <span className="font-semibold text-ink-900">{nama}</span> untuk
                    mengonfirmasi
                  </label>
                  <input
                    id={`hapus-ketik-${id}`}
                    ref={kolom}
                    name="konfirmasi"
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    value={ketikan}
                    onChange={(e) => setKetikan(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setTerbuka(false)} className={btnSecondary}>
                    Batal
                  </button>
                  <button type="submit" disabled={!cocok} className={btnDangerSolid}>
                    Hapus permanen
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
