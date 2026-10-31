"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { tandaiCatatanDibaca } from "@/lib/actions/catatan-rumah";

/**
 * Menandai daftar laporan rumah sebagai sudah dibaca begitu halamannya
 * terbuka. Tidak menampilkan apa pun.
 */
export function TandaiDibaca({ adaYangBaru }: { adaYangBaru: boolean }) {
  const router = useRouter();
  const sudah = useRef(false);

  useEffect(() => {
    if (!adaYangBaru || sudah.current) return;
    sudah.current = true;

    tandaiCatatanDibaca()
      .then(() => router.refresh())
      .catch(() => undefined);
  }, [adaYangBaru, router]);

  return null;
}
