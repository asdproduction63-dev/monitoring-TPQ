import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateSantri } from "@/lib/actions/murid";
import { SantriForm } from "@/components/murid-form";
import { Alert } from "@/components/alert";
import { cardClass, pageSubClass, pageTitleClass } from "@/lib/ui";

export const metadata = { title: "Edit Murid" };

export default async function EditMuridPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const sp = await searchParams;
  const santriId = Number(id);
  if (!Number.isInteger(santriId) || santriId <= 0) notFound();

  const santri = await prisma.santri.findUnique({ where: { id: santriId } });
  if (!santri) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 border-b border-ink-200 pb-5">
        <Link
          href={`/murid/${santri.id}`}
          className="text-[12.5px] font-medium text-ink-500 underline-offset-2 hover:text-ink-900 hover:underline"
        >
          ← Detail murid
        </Link>
        <h1 className={`${pageTitleClass} mt-3`}>Edit Murid</h1>
        <p className={pageSubClass}>Perbarui data {santri.name}.</p>
      </div>

      {sp.error ? (
        <div className="mb-5">
          <Alert type="error" message={sp.error} />
        </div>
      ) : null}

      <div className={`${cardClass} p-5 sm:p-6`}>
        <SantriForm
          action={updateSantri}
          santri={santri}
          cancelHref={`/murid/${santri.id}`}
          submitLabel="Simpan perubahan"
        />
      </div>
    </div>
  );
}
