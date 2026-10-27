import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "WALI" ? "/raport" : "/dashboard");

  const settings = await getSettings();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/*
        Lapisan latar. Untuk memakai foto gedung TPQ, simpan gambarnya di
        public/login.jpg lalu ganti div gradien di bawah ini dengan:
        <div className="absolute inset-0 bg-[url('/login.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-paper-50/80" />
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-login"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 animate-geser-pola bg-khatam-tinta opacity-50"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9rem] top-1/2 hidden -translate-y-1/2 text-brand-800 opacity-[0.09] lg:block"
      >
        <svg
          viewBox="0 0 200 200"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          className="h-[42rem] w-[42rem] animate-putar-pelan"
        >
          <circle cx="100" cy="100" r="92" />
          <circle cx="100" cy="100" r="76" />
          <rect x="40" y="40" width="120" height="120" />
          <rect x="40" y="40" width="120" height="120" transform="rotate(45 100 100)" />
          <rect x="56" y="56" width="88" height="88" />
          <rect x="56" y="56" width="88" height="88" transform="rotate(45 100 100)" />
          <circle cx="100" cy="100" r="34" />
        </svg>
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-10 px-5 py-14 lg:flex-row lg:justify-between lg:gap-16 lg:px-10">
        <section className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <Image
            src="/logo.png"
            alt={settings.namaTpq}
            width={710}
            height={665}
            priority
            className="h-auto w-[210px] animate-muncul sm:w-[250px] lg:w-[320px]"
          />

          <span
            aria-hidden="true"
            className="mt-7 h-px w-20 origin-center animate-garis bg-brass-400 lg:origin-left"
            style={{ animationDelay: "240ms" }}
          />

          <p
            className="mt-6 max-w-md animate-naik text-[15.5px] leading-relaxed text-ink-600 lg:text-[17px] lg:leading-[1.65]"
            style={{ animationDelay: "320ms" }}
          >
            Sistem monitoring setoran hafalan dan kegiatan harian santri.
          </p>

          <p
            className="mt-7 animate-naik font-mono text-[11px] uppercase tracking-[0.18em] text-ink-600"
            style={{ animationDelay: "420ms" }}
          >
            T.A. {settings.tahunAjaran} · Semester {settings.semester}
          </p>
        </section>

        <section
          className="w-full max-w-[370px] animate-naik"
          style={{ animationDelay: "540ms" }}
        >
          <div className="rounded-[10px] border border-ink-200/80 bg-white/95 px-6 py-7 shadow-kartu sm:px-7">
            <h2 className="font-serif text-[20px] font-semibold tracking-tight text-ink-900">
              Masuk ke akun
            </h2>
            <p className="mb-6 mt-1.5 text-[13px] leading-relaxed text-ink-500">
              Gunakan akun yang diberikan administrator TPQ.
            </p>

            <LoginForm />
          </div>

          <p className="mt-4 text-center text-[12px] text-ink-600">
            Lupa password? Hubungi admin TPQ untuk mengatur ulang.
          </p>
        </section>
      </div>
    </div>
  );
}
