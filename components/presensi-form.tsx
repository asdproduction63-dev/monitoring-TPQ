"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { savePresensi } from "@/lib/actions/presensi";
import { PRESENSI_STATUS, type PresensiStatus } from "@/lib/constants";
import {
  btnMini,
  btnPrimary,
  cardClass,
  cardHeadClass,
  cardSubClass,
  cardTitleClass,
  inputClass,
} from "@/lib/ui";

type SantriRow = { id: number; name: string; kelas: string };

type Props = {
  santri: SantriRow[];
  existing: Record<number, { status: string; note: string }>;
  date: string;
  kegiatanId: number;
  kegiatanName: string;
};

// Semua memakai nada 600 agar teks putih di atasnya tetap lolos kontras.
const activeClass: Record<string, string> = {
  HADIR: "bg-mint-600 text-white",
  IZIN: "bg-brass-600 text-white",
  SAKIT: "bg-steel-600 text-white",
  ALPA: "bg-pink-600 text-white",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${btnPrimary} w-full sm:w-auto`}>
      {pending ? "Menyimpan…" : "Simpan presensi"}
    </button>
  );
}

export function PresensiForm({ santri, existing, date, kegiatanId, kegiatanName }: Props) {
  const [statuses, setStatuses] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    for (const s of santri) {
      const status = existing[s.id]?.status;
      initial[s.id] = status && status in PRESENSI_STATUS ? status : "HADIR";
    }
    return initial;
  });

  const counts = useMemo(() => {
    const result: Record<string, number> = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
    for (const s of santri) {
      const status = statuses[s.id] ?? "HADIR";
      result[status] = (result[status] ?? 0) + 1;
    }
    return result;
  }, [statuses, santri]);

  function setSemua(value: PresensiStatus) {
    const next: Record<number, string> = {};
    for (const s of santri) next[s.id] = value;
    setStatuses(next);
  }

  return (
    <form action={savePresensi}>
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="kegiatanId" value={kegiatanId} />

      <div className={cardClass}>
        <div className={cardHeadClass}>
          <div>
            <h2 className={cardTitleClass}>Daftar kehadiran</h2>
            <p className={cardSubClass}>
              {kegiatanName} · {santri.length} murid aktif
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setSemua("HADIR")} className={btnMini}>
              Tandai semua hadir
            </button>
            <span className="tnum rounded border border-ink-200 bg-paper-100 px-2 py-1 font-mono text-[11.5px] text-ink-600">
              H {counts.HADIR} · I {counts.IZIN} · S {counts.SAKIT} · A {counts.ALPA}
            </span>
          </div>
        </div>

        {santri.length === 0 ? (
          <p className="px-5 py-12 text-center text-[13px] text-ink-500">
            Belum ada murid aktif. Tambahkan murid terlebih dahulu.
          </p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {santri.map((s) => {
              const current = statuses[s.id] ?? "HADIR";
              return (
                <li
                  key={s.id}
                  className="flex flex-col gap-3 px-4 py-3 transition hover:bg-paper-100 lg:flex-row lg:items-center"
                >
                  <div className="min-w-0 lg:w-52">
                    <p className="truncate text-[13px] font-medium text-ink-800">{s.name}</p>
                    <p className="text-[12px] text-ink-500">{s.kelas}</p>
                  </div>

                  <div className="inline-flex shrink-0 self-start overflow-hidden rounded border border-ink-200">
                    {(Object.keys(PRESENSI_STATUS) as PresensiStatus[]).map((value) => {
                      const info = PRESENSI_STATUS[value];
                      const active = current === value;
                      return (
                        <label
                          key={value}
                          className={`cursor-pointer border-l border-ink-200 px-2.5 py-1.5 text-[12px] font-medium transition first:border-l-0 ${
                            active ? activeClass[value] : "bg-white text-ink-500 hover:bg-paper-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`status_${s.id}`}
                            value={value}
                            checked={active}
                            onChange={() => setStatuses((prev) => ({ ...prev, [s.id]: value }))}
                            className="sr-only"
                          />
                          {info.label}
                        </label>
                      );
                    })}
                  </div>

                  <div className="lg:ml-auto lg:w-64">
                    <input
                      type="text"
                      name={`note_${s.id}`}
                      defaultValue={existing[s.id]?.note ?? ""}
                      placeholder="Catatan (opsional)"
                      className={`${inputClass} py-1.5 text-[12.5px]`}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {santri.length > 0 ? (
          <div className="flex flex-col gap-3 border-t border-ink-200 bg-paper-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-ink-500">
              Menyimpan akan menimpa catatan pada tanggal dan kegiatan yang sama.
            </p>
            <SubmitButton />
          </div>
        ) : null}
      </div>
    </form>
  );
}
