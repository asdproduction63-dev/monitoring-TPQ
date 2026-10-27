import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { KATEGORI_KEGIATAN, ROLES } from "@/lib/constants";
import { updateSettings } from "@/lib/actions/settings";
import { createKegiatan, deleteKegiatan, updateKegiatan } from "@/lib/actions/kegiatan";
import { createUser, updateOwnAccount, updateUser } from "@/lib/actions/users";
import { Badge, RoleBadge } from "@/components/badges";
import { Alert } from "@/components/alert";
import { ConfirmSubmit } from "@/components/confirm-submit";
import {
  btnMini,
  btnPrimary,
  cardClass,
  cardHeadClass,
  cardSubClass,
  cardTitleClass,
  inputClass,
  labelClass,
  noteClass,
  pageSubClass,
  pageTitleClass,
  selectClass,
  tabBarClass,
  tabClass,
} from "@/lib/ui";

export const metadata = { title: "Pengaturan" };

type Tab = "akun" | "tpq" | "kegiatan" | "pengguna";

function Wajib() {
  return <span className="text-clay-500">*</span>;
}

/** Kotak keterangan di samping form — kertas polos dengan garis tegak, bukan kartu berwarna. */
function Catatan({ title, items }: { title: string; items: string[] }) {
  return (
    <aside className="border-l-2 border-ink-300 bg-paper-200 px-4 py-4">
      <h3 className="font-serif text-[14px] font-semibold text-ink-900">{title}</h3>
      <ul className="mt-2.5 space-y-2 text-[12.5px] leading-relaxed text-ink-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}

function Checkbox({
  id,
  name,
  defaultChecked,
  label,
}: {
  id: string;
  name: string;
  defaultChecked: boolean;
  label: string;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-[12.5px] font-medium text-ink-600">
      <input
        id={id}
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-3.5 w-3.5 rounded-sm border-ink-300 accent-brand-700"
      />
      {label}
    </label>
  );
}

export default async function PengaturanPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; saved?: string; deleted?: string; error?: string }>;
}) {
  const user = await requireStaff();
  const isAdmin = user.role === "ADMIN";
  const sp = await searchParams;
  const requestedTab: Tab =
    sp.tab === "akun"
      ? "akun"
      : sp.tab === "kegiatan"
        ? "kegiatan"
        : sp.tab === "pengguna"
          ? "pengguna"
          : "tpq";
  const tab: Tab = isAdmin ? requestedTab : "akun";

  const account = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { name: true, username: true, role: true },
  });

  const adminData = isAdmin
    ? await Promise.all([
        getSettings(),
        prisma.kegiatan.findMany({
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
          include: { _count: { select: { presensi: true } } },
        }),
        prisma.user.findMany({
          orderBy: [{ role: "asc" }, { name: "asc" }],
          include: { anak: { select: { id: true, name: true, kelas: true } } },
        }),
        prisma.santri.findMany({
          orderBy: [{ active: "desc" }, { name: "asc" }],
          select: { id: true, name: true, kelas: true, waliId: true },
        }),
      ])
    : null;

  const settings = adminData?.[0] ?? null;
  const kegiatanList = adminData?.[1] ?? [];
  const users = adminData?.[2] ?? [];
  const santriList = adminData?.[3] ?? [];

  const tabs: { value: Tab; label: string }[] = [
    { value: "akun", label: "Akun Saya" },
    ...(isAdmin
      ? ([
          { value: "tpq", label: "Profil TPQ" },
          { value: "kegiatan", label: `Kegiatan (${kegiatanList.length})` },
          { value: "pengguna", label: `Pengguna (${users.length})` },
        ] satisfies { value: Tab; label: string }[])
      : []),
  ];

  return (
    <div>
      <div className="mb-6 border-b border-ink-200 pb-5">
        <h1 className={pageTitleClass}>Pengaturan</h1>
        <p className={pageSubClass}>
          {isAdmin
            ? "Akun, profil TPQ, daftar kegiatan, dan pengguna aplikasi."
            : "Profil dan password akun Anda."}
        </p>
      </div>

      {sp.error ? (
        <div className="mb-5">
          <Alert type="error" message={sp.error} />
        </div>
      ) : null}
      {sp.saved ? (
        <div className="mb-5">
          <Alert type="success" message="Perubahan berhasil disimpan." />
        </div>
      ) : null}
      {sp.deleted ? (
        <div className="mb-5">
          <Alert type="success" message="Data berhasil dihapus." />
        </div>
      ) : null}

      <nav className={`${tabBarClass} mb-5`}>
        {tabs.map((item) => (
          <Link
            key={item.value}
            href={`/pengaturan?tab=${item.value}`}
            className={tabClass(tab === item.value)}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "akun" ? (
        <div className="grid items-start gap-5 lg:grid-cols-3">
          <section className={`${cardClass} lg:col-span-2`}>
            <div className={cardHeadClass}>
              <div>
                <h2 className={cardTitleClass}>Akun saya</h2>
                <p className={cardSubClass}>Nama, username, dan password akun yang sedang dipakai.</p>
              </div>
              <RoleBadge role={account.role} />
            </div>

            <form action={updateOwnAccount} className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="account-name" className={labelClass}>
                    Nama lengkap <Wajib />
                  </label>
                  <input
                    id="account-name"
                    name="name"
                    type="text"
                    required
                    maxLength={100}
                    defaultValue={account.name}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="account-username" className={labelClass}>
                    Username <Wajib />
                  </label>
                  <input
                    id="account-username"
                    name="username"
                    type="text"
                    required
                    minLength={3}
                    maxLength={30}
                    pattern="[a-zA-Z0-9._\-]+"
                    autoComplete="username"
                    autoCapitalize="none"
                    defaultValue={account.username}
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>

              <div className="border-t border-ink-100 pt-4">
                <h3 className="font-serif text-[14px] font-semibold text-ink-900">Ganti password</h3>
                <p className="mt-1 text-[12.5px] text-ink-500">
                  Kosongkan ketiga kolom di bawah jika password tidak diubah.
                </p>
              </div>

              <div>
                <label htmlFor="account-current-password" className={labelClass}>
                  Password saat ini
                </label>
                <input
                  id="account-current-password"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  className={inputClass}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="account-new-password" className={labelClass}>
                    Password baru
                  </label>
                  <input
                    id="account-new-password"
                    name="newPassword"
                    type="password"
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Minimal 6 karakter"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="account-confirm-password" className={labelClass}>
                    Konfirmasi password baru
                  </label>
                  <input
                    id="account-confirm-password"
                    name="confirmPassword"
                    type="password"
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Ulangi password baru"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="border-t border-ink-100 pt-4">
                <button type="submit" className={btnPrimary}>
                  Simpan perubahan
                </button>
              </div>
            </form>
          </section>

          <Catatan
            title={`Masuk sebagai @${account.username}`}
            items={[
              "Password minimal 6 karakter.",
              "Perubahan nama dan username langsung berlaku pada sesi ini.",
              "Hubungi admin bila akun perlu diubah atau dinonaktifkan.",
            ]}
          />
        </div>
      ) : null}

      {isAdmin && tab === "tpq" && settings ? (
        <div className="grid items-start gap-5 lg:grid-cols-3">
          <section className={`${cardClass} lg:col-span-2`}>
            <div className={cardHeadClass}>
              <div>
                <h2 className={cardTitleClass}>Profil TPQ</h2>
                <p className={cardSubClass}>Dipakai sebagai identitas aplikasi dan judul laporan.</p>
              </div>
            </div>

            <form action={updateSettings} className="space-y-4 p-5">
              <div>
                <label htmlFor="namaTpq" className={labelClass}>
                  Nama TPQ <Wajib />
                </label>
                <input
                  id="namaTpq"
                  name="namaTpq"
                  type="text"
                  required
                  defaultValue={settings.namaTpq}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="namaPengasuh" className={labelClass}>
                  Nama pengasuh
                </label>
                <input
                  id="namaPengasuh"
                  name="namaPengasuh"
                  type="text"
                  defaultValue={settings.namaPengasuh}
                  placeholder="Contoh: KH. Abdullah Syafi'i"
                  className={inputClass}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="tahunAjaran" className={labelClass}>
                    Tahun ajaran
                  </label>
                  <input
                    id="tahunAjaran"
                    name="tahunAjaran"
                    type="text"
                    required
                    defaultValue={settings.tahunAjaran}
                    placeholder="2026/2027"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="semester" className={labelClass}>
                    Semester
                  </label>
                  <select
                    id="semester"
                    name="semester"
                    defaultValue={settings.semester}
                    className={selectClass}
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>
              <div className="border-t border-ink-100 pt-4">
                <button type="submit" className={btnPrimary}>
                  Simpan pengaturan
                </button>
              </div>
            </form>
          </section>

          <Catatan
            title="Catatan"
            items={[
              "Nama TPQ tampil di sidebar dan halaman masuk.",
              "Tahun ajaran dan semester membantu membedakan periode laporan.",
              "Hanya admin yang dapat mengubah pengaturan ini.",
            ]}
          />
        </div>
      ) : null}

      {isAdmin && tab === "kegiatan" ? (
        <div className="space-y-5">
          <section className={cardClass}>
            <div className={cardHeadClass}>
              <div>
                <h2 className={cardTitleClass}>Tambah kegiatan</h2>
                <p className={cardSubClass}>Kegiatan aktif akan muncul di halaman presensi.</p>
              </div>
            </div>

            <form action={createKegiatan} className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-6">
              <div className="sm:col-span-2">
                <label htmlFor="new-name" className={labelClass}>
                  Nama kegiatan <Wajib />
                </label>
                <input
                  id="new-name"
                  name="name"
                  type="text"
                  required
                  placeholder="Contoh: Halaqah Tahfizh Sore"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="new-category" className={labelClass}>
                  Kategori
                </label>
                <select id="new-category" name="category" defaultValue="HARIAN" className={selectClass}>
                  {(Object.keys(KATEGORI_KEGIATAN) as (keyof typeof KATEGORI_KEGIATAN)[]).map((key) => (
                    <option key={key} value={key}>
                      {KATEGORI_KEGIATAN[key].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="new-start" className={labelClass}>
                  Mulai
                </label>
                <input id="new-start" name="startTime" type="time" className={inputClass} />
              </div>
              <div>
                <label htmlFor="new-end" className={labelClass}>
                  Selesai
                </label>
                <input id="new-end" name="endTime" type="time" className={inputClass} />
              </div>
              <div>
                <label htmlFor="new-order" className={labelClass}>
                  Urutan
                </label>
                <input
                  id="new-order"
                  name="sortOrder"
                  type="number"
                  min={0}
                  max={999}
                  defaultValue={kegiatanList.length + 1}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-6">
                <button type="submit" className={btnPrimary}>
                  Tambah kegiatan
                </button>
              </div>
            </form>
          </section>

          {kegiatanList.length === 0 ? (
            <div className={`${cardClass} px-6 py-14 text-center`}>
              <p className="text-[13px] text-ink-500">
                Belum ada kegiatan. Tambahkan kegiatan pertama di atas.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {kegiatanList.map((k) => (
                <div key={k.id} className={cardClass}>
                  <div className={cardHeadClass}>
                    <div className="min-w-0">
                      <h3 className={cardTitleClass}>{k.name}</h3>
                      <p className={cardSubClass}>
                        <span className="font-mono">
                          {k.startTime || "--:--"}–{k.endTime || "--:--"}
                        </span>{" "}
                        ·{" "}
                        {KATEGORI_KEGIATAN[k.category as keyof typeof KATEGORI_KEGIATAN]?.label ??
                          k.category}{" "}
                        · {k._count.presensi} catatan
                      </p>
                    </div>
                    {k.active ? <Badge tone="brand">Aktif</Badge> : <Badge>Nonaktif</Badge>}
                  </div>

                  <form action={updateKegiatan} className="space-y-3 p-4">
                    <input type="hidden" name="id" value={k.id} />
                    <div>
                      <label htmlFor={`keg-name-${k.id}`} className={labelClass}>
                        Nama
                      </label>
                      <input
                        id={`keg-name-${k.id}`}
                        name="name"
                        type="text"
                        required
                        defaultValue={k.name}
                        className={inputClass}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label htmlFor={`keg-cat-${k.id}`} className={labelClass}>
                          Kategori
                        </label>
                        <select
                          id={`keg-cat-${k.id}`}
                          name="category"
                          defaultValue={k.category}
                          className={selectClass}
                        >
                          {(Object.keys(KATEGORI_KEGIATAN) as (keyof typeof KATEGORI_KEGIATAN)[]).map(
                            (key) => (
                              <option key={key} value={key}>
                                {KATEGORI_KEGIATAN[key].label}
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                      <div>
                        <label htmlFor={`keg-start-${k.id}`} className={labelClass}>
                          Mulai
                        </label>
                        <input
                          id={`keg-start-${k.id}`}
                          name="startTime"
                          type="time"
                          defaultValue={k.startTime ?? ""}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor={`keg-end-${k.id}`} className={labelClass}>
                          Selesai
                        </label>
                        <input
                          id={`keg-end-${k.id}`}
                          name="endTime"
                          type="time"
                          defaultValue={k.endTime ?? ""}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Checkbox
                        id={`keg-active-${k.id}`}
                        name="active"
                        defaultChecked={k.active}
                        label="Aktif"
                      />
                      <div className="flex items-center gap-3">
                        <label
                          htmlFor={`keg-order-${k.id}`}
                          className="flex items-center gap-2 text-[12.5px] font-medium text-ink-600"
                        >
                          Urutan
                          <input
                            id={`keg-order-${k.id}`}
                            name="sortOrder"
                            type="number"
                            min={0}
                            max={999}
                            defaultValue={k.sortOrder}
                            className="w-14 rounded border border-ink-200 px-2 py-1 text-[12.5px] outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/25"
                          />
                        </label>
                        <button type="submit" className={btnMini}>
                          Simpan
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="flex items-center justify-between gap-3 border-t border-ink-100 px-4 py-2.5">
                    <p className={noteClass}>
                      {k._count.presensi > 0
                        ? "Nonaktifkan saja agar riwayat presensi tetap tersimpan."
                        : "Belum ada data presensi."}
                    </p>
                    {k._count.presensi === 0 ? (
                      <form action={deleteKegiatan}>
                        <input type="hidden" name="id" value={k.id} />
                        <ConfirmSubmit
                          className="shrink-0 text-[12.5px] font-medium text-clay-600 underline-offset-2 hover:text-clay-700 hover:underline"
                          message={`Hapus kegiatan "${k.name}"?`}
                        >
                          Hapus
                        </ConfirmSubmit>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {isAdmin && tab === "pengguna" ? (
        <div className="space-y-5">
          <section className={cardClass}>
            <div className={cardHeadClass}>
              <div>
                <h2 className={cardTitleClass}>Tambah pengguna</h2>
                <p className={cardSubClass}>
                  Admin mengelola pengaturan; ustadz mencatat setoran dan presensi.
                </p>
              </div>
            </div>

            <form action={createUser} className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-6">
              <div>
                <label htmlFor="user-name" className={labelClass}>
                  Nama lengkap <Wajib />
                </label>
                <input id="user-name" name="name" type="text" required className={inputClass} />
              </div>
              <div>
                <label htmlFor="user-username" className={labelClass}>
                  Username <Wajib />
                </label>
                <input
                  id="user-username"
                  name="username"
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="huruf kecil"
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label htmlFor="user-password" className={labelClass}>
                  Password <Wajib />
                </label>
                <input
                  id="user-password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Minimal 6 karakter"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="user-role" className={labelClass}>
                  Role
                </label>
                <select id="user-role" name="role" defaultValue="USTADZ" className={selectClass}>
                  {(Object.keys(ROLES) as (keyof typeof ROLES)[]).map((key) => (
                    <option key={key} value={key}>
                      {ROLES[key].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="user-santri" className={labelClass}>
                  Murid (khusus wali)
                </label>
                <select id="user-santri" name="santriId" defaultValue="" className={selectClass}>
                  <option value="">— tidak ditautkan —</option>
                  {santriList.map((s) => (
                    <option key={s.id} value={s.id} disabled={s.waliId !== null}>
                      {s.name} — {s.kelas}
                      {s.waliId !== null ? " (sudah ada wali)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit" className={`${btnPrimary} w-full`}>
                  Tambah
                </button>
              </div>
            </form>

            <p className={`${noteClass} border-t border-ink-100 px-5 py-3`}>
              Akun wali murid wajib ditautkan ke satu murid. Wali hanya bisa membuka raport
              pekanan anaknya, bukan halaman pencatatan.
            </p>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            {users.map((u) => (
              <div key={u.id} className={cardClass}>
                <div className={cardHeadClass}>
                  <div className="min-w-0">
                    <h3 className={cardTitleClass}>{u.name}</h3>
                    <p className={`${cardSubClass} font-mono`}>@{u.username}</p>
                    {u.role === "WALI" ? (
                      <p className={cardSubClass}>
                        {u.anak
                          ? `Wali dari ${u.anak.name} · ${u.anak.kelas}`
                          : "Belum ditautkan ke murid"}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <RoleBadge role={u.role} />
                    {u.active ? <Badge tone="brand">Aktif</Badge> : <Badge>Nonaktif</Badge>}
                  </div>
                </div>

                <form action={updateUser} className="space-y-3 p-4">
                  <input type="hidden" name="id" value={u.id} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor={`u-name-${u.id}`} className={labelClass}>
                        Nama
                      </label>
                      <input
                        id={`u-name-${u.id}`}
                        name="name"
                        type="text"
                        required
                        defaultValue={u.name}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor={`u-username-${u.id}`} className={labelClass}>
                        Username
                      </label>
                      <input
                        id={`u-username-${u.id}`}
                        name="username"
                        type="text"
                        required
                        defaultValue={u.username}
                        className={`${inputClass} font-mono`}
                      />
                    </div>
                    <div>
                      <label htmlFor={`u-password-${u.id}`} className={labelClass}>
                        Password baru
                      </label>
                      <input
                        id={`u-password-${u.id}`}
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Kosongkan jika tetap"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor={`u-role-${u.id}`} className={labelClass}>
                        Role
                      </label>
                      <select
                        id={`u-role-${u.id}`}
                        name="role"
                        defaultValue={u.role}
                        className={selectClass}
                      >
                        {(Object.keys(ROLES) as (keyof typeof ROLES)[]).map((key) => (
                          <option key={key} value={key}>
                            {ROLES[key].label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`u-santri-${u.id}`} className={labelClass}>
                        Murid (khusus wali)
                      </label>
                      <select
                        id={`u-santri-${u.id}`}
                        name="santriId"
                        defaultValue={u.anak ? String(u.anak.id) : ""}
                        className={selectClass}
                      >
                        <option value="">— tidak ditautkan —</option>
                        {santriList.map((s) => (
                          <option
                            key={s.id}
                            value={s.id}
                            disabled={s.waliId !== null && s.waliId !== u.id}
                          >
                            {s.name} — {s.kelas}
                            {s.waliId !== null && s.waliId !== u.id ? " (sudah ada wali)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Checkbox
                      id={`u-active-${u.id}`}
                      name="active"
                      defaultChecked={u.active}
                      label="Akun aktif"
                    />
                    <button type="submit" className={btnMini}>
                      Simpan perubahan
                    </button>
                  </div>
                </form>
              </div>
            ))}
          </div>

          <p className={noteClass}>
            Gunakan password yang kuat, dan ganti password bawaan begitu aplikasi mulai dipakai.
          </p>
        </div>
      ) : null}
    </div>
  );
}
