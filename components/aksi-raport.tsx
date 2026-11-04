"use client";

import { useEffect, useState } from "react";
import { btnPrimary, btnSecondary } from "@/lib/ui";

/**
 * Tombol-tombol di bawah gambar raport pekanan.
 *
 * "Simpan ke galeri" memakai Web Share API. Halaman web tidak punya izin
 * menulis langsung ke galeri ponsel — yang bisa dilakukan hanya menyerahkan
 * berkasnya ke sistem, lalu penggunanya memilih Foto/Galeri dari lembar
 * berbagi. Itulah satu-satunya jalan resmi, dan hanya ada di peramban ponsel;
 * di komputer tombolnya tidak ditampilkan sama sekali.
 *
 * "Cetak A4" menyisipkan aturan @page sesaat sebelum mencetak, karena @page
 * tidak bisa dibatasi lewat selektor CSS. Pasangannya ada di globals.css,
 * pada blok .cetak-lembar.
 */

const ATURAN_HALAMAN = "@page { size: A4 portrait; margin: 0; }";

/** Ambil nama berkas dari header unduhan, supaya tidak ditulis dua kali. */
function namaDariHeader(header: string | null) {
  const cocok = header ? /filename="([^"]+)"/.exec(header) : null;
  return cocok?.[1] ?? "raport.png";
}

export function AksiRaport({ sumber }: { sumber: string }) {
  const [bisaBagikan, setBisaBagikan] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");

  useEffect(() => {
    // Diuji dengan berkas tiruan: sebagian peramban punya navigator.share
    // tapi menolak berkas, dan bedanya baru ketahuan lewat canShare.
    try {
      const contoh = new File([new Blob()], "uji.png", { type: "image/png" });
      setBisaBagikan(Boolean(navigator.canShare?.({ files: [contoh] })));
    } catch {
      setBisaBagikan(false);
    }
  }, []);

  async function simpanKeGaleri() {
    setGalat("");
    setSibuk(true);
    try {
      const jawaban = await fetch(`${sumber}&unduh=1`);
      if (!jawaban.ok) throw new Error("gambar gagal diambil");

      const berkas = new File(
        [await jawaban.blob()],
        namaDariHeader(jawaban.headers.get("content-disposition")),
        { type: "image/png" },
      );
      if (!navigator.canShare({ files: [berkas] })) throw new Error("berkas tidak didukung");

      await navigator.share({ files: [berkas], title: berkas.name });
    } catch (e) {
      // Menutup lembar berbagi bukan kegagalan, jadi tidak perlu diberi pesan.
      if ((e as Error)?.name !== "AbortError") {
        setGalat("Belum berhasil. Pakai tombol Unduh gambar, lalu simpan dari sana.");
      }
    } finally {
      setSibuk(false);
    }
  }

  function cetak() {
    const gaya = document.createElement("style");
    gaya.textContent = ATURAN_HALAMAN;
    document.head.appendChild(gaya);
    document.body.classList.add("cetak-lembar");

    const bersihkan = () => {
      document.body.classList.remove("cetak-lembar");
      gaya.remove();
      window.removeEventListener("afterprint", bersihkan);
      clearTimeout(jam);
    };

    // Safari di iPhone tidak selalu memicu afterprint; tanpa jaring ini
    // aturannya menempel sampai halaman dimuat ulang.
    const jam = setTimeout(bersihkan, 60000);
    window.addEventListener("afterprint", bersihkan);
    window.print();
  }

  return (
    <div className="no-print">
      <div className="flex flex-wrap gap-2">
        {bisaBagikan ? (
          <button type="button" onClick={simpanKeGaleri} disabled={sibuk} className={btnPrimary}>
            {sibuk ? "Menyiapkan…" : "Simpan ke galeri"}
          </button>
        ) : null}

        <a
          href={`${sumber}&unduh=1`}
          download
          className={bisaBagikan ? btnSecondary : btnPrimary}
        >
          Unduh gambar
        </a>

        <button type="button" onClick={cetak} className={btnSecondary}>
          Cetak A4
        </button>
      </div>

      {galat ? <p className="mt-2 text-[12px] text-clay-600">{galat}</p> : null}
    </div>
  );
}
