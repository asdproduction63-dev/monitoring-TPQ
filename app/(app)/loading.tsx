import { cardClass, pageHeadClass } from "@/lib/ui";

/**
 * Kerangka yang langsung tampil begitu menu diklik, selagi data halaman
 * diambil dari database. Bentuknya mengikuti tata letak halaman pada
 * umumnya: judul, deretan angka, lalu kartu berisi tabel.
 */
function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-sm bg-ink-100 ${className}`} />;
}

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat halaman…</span>

      <div className={pageHeadClass}>
        <div className="space-y-2.5">
          <Bar className="h-6 w-56" />
          <Bar className="h-3.5 w-72 max-w-full" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px rounded bg-ink-200 p-px sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 bg-white px-4 py-3.5">
            <Bar className="h-2.5 w-20" />
            <Bar className="h-6 w-12" />
            <Bar className="h-2.5 w-28" />
          </div>
        ))}
      </div>

      <section className={`${cardClass} mt-6`}>
        <div className="border-b border-ink-100 px-4 py-3">
          <Bar className="h-4 w-40" />
        </div>
        <ul className="divide-y divide-ink-100">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="flex items-center gap-4 px-4 py-3">
              <Bar className="h-3.5 w-1/4" />
              <Bar className="h-3.5 w-1/3" />
              <Bar className="ml-auto h-3.5 w-16" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
