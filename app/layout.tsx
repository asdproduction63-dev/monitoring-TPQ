import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const serif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-serif",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TPQ Monitor",
    template: "%s | TPQ Monitor",
  },
  description: "Aplikasi monitoring setoran dan kegiatan harian murid TPQ.",
  applicationName: "TPQ Monitor",
  // iOS tidak membaca manifest, jadi keterangan aplikasinya ditulis terpisah
  // di sini. Next menuliskannya sebagai "mobile-web-app-capable", sedangkan
  // Safari versi lama masih membaca nama lamanya, jadi dua-duanya disertakan.
  other: { "apple-mobile-web-app-capable": "yes" },
  appleWebApp: {
    capable: true,
    title: "TPQ Monitor",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f3a3a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans">
        {children}
        {/* Pendaftaran service worker sengaja ditulis langsung di HTML, bukan
            lewat komponen klien: supaya berjalan sedini mungkin dan supaya
            alat pemeriksa PWA bisa menemukannya tanpa membongkar bundel JS.
            Hanya di production — di mode dev, simpanannya justru membuat
            perubahan kode tidak kelihatan. */}
        {process.env.NODE_ENV === "production" ? (
          <script
            dangerouslySetInnerHTML={{
              __html:
                "if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}",
            }}
          />
        ) : null}
      </body>
    </html>
  );
}
