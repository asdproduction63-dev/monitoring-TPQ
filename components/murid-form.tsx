import Link from "next/link";
import { btnPrimary, btnSecondary, inputClass, labelClass, selectClass } from "@/lib/ui";

type SantriData = {
  id?: number;
  nis?: string;
  name?: string;
  gender?: string;
  kelas?: string;
  phone?: string | null;
};

function Wajib() {
  return <span className="text-clay-500">*</span>;
}

export function SantriForm({
  action,
  santri,
  cancelHref,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  santri?: SantriData;
  cancelHref: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-5">
      {santri?.id ? <input type="hidden" name="id" value={santri.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nis" className={labelClass}>
            NIS <Wajib />
          </label>
          <input
            id="nis"
            name="nis"
            type="text"
            required
            defaultValue={santri?.nis ?? ""}
            placeholder="Contoh: 2026001"
            className={`${inputClass} font-mono`}
          />
        </div>
        <div>
          <label htmlFor="name" className={labelClass}>
            Nama lengkap <Wajib />
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={santri?.name ?? ""}
            placeholder="Nama murid"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="gender" className={labelClass}>
            Jenis kelamin
          </label>
          <select id="gender" name="gender" defaultValue={santri?.gender ?? "L"} className={selectClass}>
            <option value="L">Putra</option>
            <option value="P">Putri</option>
          </select>
        </div>
        <div>
          <label htmlFor="kelas" className={labelClass}>
            Kelas / jenjang <Wajib />
          </label>
          <input
            id="kelas"
            name="kelas"
            type="text"
            required
            defaultValue={santri?.kelas ?? ""}
            placeholder="Contoh: Iqro 2 / Al-Qur'an"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>
            No. HP wali
          </label>
          <input
            id="phone"
            name="phone"
            type="text"
            defaultValue={santri?.phone ?? ""}
            placeholder="08xxxxxxxxxx"
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-ink-100 pt-5">
        <button type="submit" className={btnPrimary}>
          {submitLabel}
        </button>
        <Link href={cancelHref} className={btnSecondary}>
          Batal
        </Link>
      </div>
    </form>
  );
}
