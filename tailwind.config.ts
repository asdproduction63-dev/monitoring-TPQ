import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Segoe UI", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "Cambria", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Consolas", "monospace"],
      },
      // Sudut tajam: tidak ada yang membulat kecuali rounded-full.
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "3px",
        md: "4px",
        lg: "5px",
        xl: "7px",
        "2xl": "9px",
        "3xl": "12px",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 0 0 rgb(26 23 19 / 0.04)",
        DEFAULT: "0 1px 2px 0 rgb(26 23 19 / 0.06)",
        md: "0 2px 6px -2px rgb(26 23 19 / 0.10)",
        kartu: "0 24px 60px -32px rgb(16 38 32 / 0.45)",
      },
      // Gerak yang tenang: masuk sekali saat halaman dibuka, lalu diam.
      // Dua yang berulang sengaja sangat lambat supaya tidak menarik perhatian.
      keyframes: {
        naik: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        muncul: {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        garis: {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        putar: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        geserPola: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "128px 128px" },
        },
      },
      animation: {
        naik: "naik 800ms cubic-bezier(0.16, 0.84, 0.44, 1) both",
        muncul: "muncul 1000ms cubic-bezier(0.16, 0.84, 0.44, 1) both",
        garis: "garis 900ms cubic-bezier(0.16, 0.84, 0.44, 1) both",
        "putar-pelan": "putar 150s linear infinite",
        "geser-pola": "geserPola 70s linear infinite",
      },
      colors: {
        // Kertas: latar hangat, bukan abu-abu biru.
        paper: {
          50: "#fdfcf8",
          100: "#faf7f0",
          200: "#f3efe4",
          300: "#ebe5d6",
        },
        // Tinta: skala teks netral kehangatan.
        ink: {
          50: "#f5f2ea",
          100: "#e8e3d7",
          200: "#d5cec0",
          300: "#b5ad9c",
          400: "#928a79",
          500: "#736c5d",
          600: "#585145",
          700: "#423d34",
          800: "#2c2822",
          900: "#1a1713",
        },
        // Warna utama: teal dari logo Rumah Belajar Islam Bunayya (#1b8988).
        brand: {
          50: "#eef7f6",
          100: "#d2ebe9",
          200: "#a6d8d5",
          300: "#6ebfbc",
          400: "#38a5a3",
          500: "#1b8988",
          600: "#157270",
          700: "#135c5b",
          800: "#124a49",
          900: "#0f3a3a",
          950: "#0a2727",
        },
        clay: {
          50: "#fbf1ed",
          100: "#f5ded4",
          200: "#e8bda9",
          300: "#d7967b",
          400: "#c37152",
          500: "#ac5636",
          600: "#8c442b",
          700: "#6e3623",
          800: "#4f2719",
        },
        // Aksen: kuning dari logo (#f8c543).
        brass: {
          50: "#fef8e7",
          100: "#fdeec0",
          200: "#fbdd85",
          300: "#f8c543",
          400: "#e0a81f",
          500: "#b88416",
          600: "#926917",
          700: "#6f5015",
        },
        // Mint dan pink diambil dari logo, dipakai khusus untuk status presensi.
        // Nada 300 adalah warna logo aslinya; yang lebih tua dipakai agar
        // teksnya tetap lolos ambang kontras.
        mint: {
          50: "#eef7f2",
          100: "#d8ede3",
          200: "#b4dcc8",
          300: "#88c7ac",
          400: "#56a583",
          500: "#3a8a69",
          600: "#2d6f54",
          700: "#255a45",
        },
        pink: {
          50: "#fdf1f5",
          100: "#fbdfe7",
          200: "#f6bdcd",
          300: "#ee8ba9",
          400: "#e2648b",
          500: "#cb4870",
          600: "#a93659",
          700: "#872b47",
        },
        steel: {
          50: "#eef2f6",
          100: "#dbe3ed",
          200: "#b9c8da",
          300: "#8ea5c0",
          400: "#6682a2",
          500: "#4a6687",
          600: "#3b526c",
          700: "#2f4155",
        },
      },
    },
  },
  plugins: [],
};

export default config;
