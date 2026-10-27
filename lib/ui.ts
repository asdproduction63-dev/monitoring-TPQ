export const inputClass =
  "w-full rounded border border-ink-200 bg-white px-3 py-2 text-[13px] leading-5 text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/25 disabled:bg-paper-200 disabled:text-ink-400";

export const selectClass = inputClass;

export const labelClass = "mb-1 block text-[12px] font-medium text-ink-600";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded border border-brand-800 bg-brand-700 px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-55";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded border border-ink-200 bg-white px-3.5 py-2 text-[13px] font-medium text-ink-700 transition hover:border-ink-300 hover:bg-paper-50 disabled:cursor-not-allowed disabled:opacity-55";

export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded border border-clay-200 bg-white px-3.5 py-2 text-[13px] font-medium text-clay-600 transition hover:bg-clay-50 disabled:cursor-not-allowed disabled:opacity-55";

export const btnGhost =
  "inline-flex items-center gap-1.5 rounded px-2 py-1 text-[12px] font-medium text-ink-600 transition hover:bg-paper-200 hover:text-ink-900";

/** Tombol kecil untuk aksi sekunder di dalam header kartu atau baris tabel. */
export const btnMini =
  "inline-flex items-center justify-center gap-1.5 rounded border border-ink-200 bg-white px-2.5 py-1 text-[12px] font-medium text-ink-700 transition hover:border-ink-300 hover:bg-paper-50";

export const cardClass = "rounded border border-ink-200 bg-white";

export const cardHeadClass =
  "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-ink-100 px-4 py-3";

export const cardTitleClass = "font-serif text-[15px] font-semibold leading-tight text-ink-900";

export const cardSubClass = "mt-0.5 text-[12px] leading-snug text-ink-500";

export const thClass =
  "border-b border-ink-200 bg-paper-200/60 px-4 py-2 text-left text-[10.5px] font-semibold uppercase tracking-[0.09em] text-ink-500";

export const tdClass = "px-4 py-2.5 align-top text-[13px] text-ink-700";

export const rowClass = "transition hover:bg-paper-100";

export const linkClass =
  "font-medium text-brand-700 underline-offset-2 transition hover:text-brand-800 hover:underline";

/** Teks kecil berwarna redup untuk keterangan di bawah tabel atau form. */
export const noteClass = "text-[12px] leading-relaxed text-ink-400";

export const tabBarClass = "flex flex-wrap items-center gap-5 border-b border-ink-200";

export function tabClass(active: boolean) {
  return `-mb-px border-b-2 px-0.5 pb-2.5 text-[13px] font-medium transition ${
    active
      ? "border-brand-600 text-ink-900"
      : "border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-800"
  }`;
}

/** Judul halaman beserta garis pemisah di bawahnya. */
export const pageHeadClass =
  "mb-6 flex flex-col gap-4 border-b border-ink-200 pb-5 sm:flex-row sm:items-end sm:justify-between";

export const pageTitleClass =
  "font-serif text-[25px] font-semibold leading-tight tracking-tight text-ink-900";

export const pageSubClass = "mt-1 text-[13px] leading-relaxed text-ink-500";
