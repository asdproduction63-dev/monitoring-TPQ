/**
 * Deretan angka ringkas bergaya pembukuan: satu blok dengan garis rambut
 * sebagai pemisah, bukan kartu-kartu melayang yang terpisah.
 */
export function StatBand({
  className = "sm:grid-cols-4",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`grid grid-cols-2 gap-px rounded bg-ink-200 p-px ${className}`}>{children}</div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="bg-white px-4 py-3.5">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-ink-500">{label}</p>
      <p className="tnum mt-2 font-serif text-[26px] font-semibold leading-none tracking-tight text-ink-900">
        {value}
      </p>
      {hint ? <p className="mt-2 text-[12px] leading-snug text-ink-500">{hint}</p> : null}
    </div>
  );
}

/** Batang proporsi tipis, bersudut tajam, dipakai untuk rekap per murid. */
export function Meter({
  value,
  tone = "brand",
}: {
  value: number;
  tone?: "brand" | "mint" | "ink";
}) {
  const pct = Math.max(0, Math.min(100, value));
  const warna = tone === "mint" ? "bg-mint-500" : tone === "ink" ? "bg-ink-300" : "bg-brand-600";
  return (
    <div className="h-[5px] w-full overflow-hidden rounded-sm bg-ink-100">
      <div className={`h-full ${warna}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
