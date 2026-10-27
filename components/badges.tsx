import { PRESENSI_STATUS, PREDIKAT, ROLES, STATUS_SETORAN } from "@/lib/constants";

type Tone = "brand" | "mint" | "brass" | "steel" | "pink" | "clay" | "ink" | "solid";

const toneClass: Record<Tone, string> = {
  brand: "border-brand-200 bg-brand-50 text-brand-700",
  mint: "border-mint-200 bg-mint-50 text-mint-700",
  brass: "border-brass-200 bg-brass-50 text-brass-700",
  steel: "border-steel-200 bg-steel-50 text-steel-700",
  pink: "border-pink-200 bg-pink-50 text-pink-700",
  clay: "border-clay-200 bg-clay-50 text-clay-700",
  ink: "border-ink-200 bg-paper-200 text-ink-500",
  solid: "border-ink-800 bg-ink-800 text-paper-100",
};

export function Badge({ tone = "ink", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[11px] font-medium leading-[1.35] ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}

// Mint dan pink berasal dari logo. Teal sengaja tidak dipakai di sini supaya
// tidak tertukar dengan tombol dan menu yang juga teal.
const presensiTone: Record<string, Tone> = {
  HADIR: "mint",
  IZIN: "brass",
  SAKIT: "steel",
  ALPA: "pink",
};

export function PresensiBadge({ status }: { status: string }) {
  const info = PRESENSI_STATUS[status as keyof typeof PRESENSI_STATUS];
  if (!info) return <Badge>{status}</Badge>;
  return <Badge tone={presensiTone[status] ?? "ink"}>{info.label}</Badge>;
}

export function SetoranBadge({ status }: { status: string }) {
  const info = STATUS_SETORAN[status as keyof typeof STATUS_SETORAN];
  if (!info) return <Badge>{status}</Badge>;
  return <Badge tone={status === "LULUS" ? "brand" : "brass"}>{info.label}</Badge>;
}

export function PredikatLabel({ value }: { value: string }) {
  const info = PREDIKAT[value as keyof typeof PREDIKAT];
  return <span className="text-[13px] text-ink-600">{info?.label ?? value}</span>;
}

export function RoleBadge({ role }: { role: string }) {
  const info = ROLES[role as keyof typeof ROLES];
  if (!info) return <Badge>{role}</Badge>;
  return <Badge tone={role === "ADMIN" ? "solid" : "steel"}>{info.label}</Badge>;
}
