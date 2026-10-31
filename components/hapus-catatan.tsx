"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { hapusCatatan } from "@/lib/actions/catatan-rumah";

export function HapusCatatan({ catatanId }: { catatanId: number }) {
  const router = useRouter();
  const [menunggu, mulai] = useTransition();
  const [galat, setGalat] = useState("");

  function jalankan() {
    if (!window.confirm("Hapus catatan ini beserta foto dan videonya? Tindakan ini tidak bisa dibatalkan.")) {
      return;
    }
    mulai(async () => {
      const hasil = await hapusCatatan(catatanId);
      if (!hasil.ok) {
        setGalat(hasil.pesan);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {galat ? <span className="text-[11.5px] text-clay-600">{galat}</span> : null}
      <button
        type="button"
        onClick={jalankan}
        disabled={menunggu}
        className="shrink-0 text-[12px] font-medium text-clay-600 underline-offset-2 hover:underline disabled:opacity-50"
      >
        {menunggu ? "Menghapus…" : "Hapus"}
      </button>
    </div>
  );
}
