import Link from "next/link";
import { btnPrimary } from "@/lib/ui";

export default function NotFound() {
  return (
    <div className="bg-app flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm border-t-2 border-brand-700 bg-white px-7 py-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-400">Galat 404</p>
        <h1 className="mt-3 font-serif text-[22px] font-semibold tracking-tight text-ink-900">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
          Data atau halaman yang dituju mungkin sudah dihapus, atau alamatnya keliru.
        </p>
        <Link href="/dashboard" className={`${btnPrimary} mt-6`}>
          Kembali ke dashboard
        </Link>
      </div>
    </div>
  );
}
