import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createSantri } from "@/lib/actions/murid";
import { SantriForm } from "@/components/murid-form";
import { Alert } from "@/components/alert";
import { cardClass, pageSubClass, pageTitleClass } from "@/lib/ui";

export const metadata = { title: "Tambah Murid" };

export default async function MuridBaruPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireStaff();
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 border-b border-ink-200 pb-5">
        <Link
          href="/murid"
          className="text-[12.5px] font-medium text-ink-500 underline-offset-2 hover:text-ink-900 hover:underline"
        >
          ← Data murid
        </Link>
        <h1 className={`${pageTitleClass} mt-3`}>Tambah Murid</h1>
        <p className={pageSubClass}>Kolom bertanda bintang wajib diisi.</p>
      </div>

      {sp.error ? (
        <div className="mb-5">
          <Alert type="error" message={sp.error} />
        </div>
      ) : null}

      <div className={`${cardClass} p-5 sm:p-6`}>
        <SantriForm action={createSantri} cancelHref="/murid" submitLabel="Simpan murid" />
      </div>
    </div>
  );
}
