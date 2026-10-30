"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/actions/auth";
import { inputClass, labelClass } from "@/lib/ui";

const initialState: LoginState = { error: "" };

const ikonClass =
  "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300 transition-colors peer-focus:text-brand-600";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <div
          role="alert"
          className="animate-naik rounded border border-clay-100 border-l-[3px] border-l-clay-500 bg-clay-50 px-3.5 py-2.5 text-[13px] text-clay-700"
        >
          {state.error}
        </div>
      ) : null}

      <div>
        <label htmlFor="username" className={labelClass}>
          Username
        </label>
        <div className="relative">
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            autoFocus
            placeholder="contoh: admin"
            className={`${inputClass} peer pr-10`}
          />
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={ikonClass}
            aria-hidden="true"
          >
            <circle cx="8" cy="5.2" r="2.4" />
            <path d="M2.9 13.4c.5-2.6 2.5-4.1 5.1-4.1s4.6 1.5 5.1 4.1" />
          </svg>
        </div>
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Masukkan password"
            className={`${inputClass} peer pr-10`}
          />
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={ikonClass}
            aria-hidden="true"
          >
            <rect x="3.2" y="7" width="9.6" height="6.4" rx="1" />
            <path d="M5.6 7V5.2a2.4 2.4 0 0 1 4.8 0V7" />
          </svg>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded border border-brand-900 bg-brand-800 px-4 py-2.5 text-[13px] font-medium text-white transition duration-200 hover:-translate-y-px hover:bg-brand-900 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {pending ? (
          <>
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="h-3.5 w-3.5 animate-spin"
              aria-hidden="true"
            >
              <path d="M8 1.6a6.4 6.4 0 1 0 6.4 6.4" />
            </svg>
            Memproses…
          </>
        ) : (
          "Masuk"
        )}
      </button>
    </form>
  );
}
