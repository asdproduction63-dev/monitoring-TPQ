/**
 * Mode lokal: menjalankan aplikasi di atas SQLite, tanpa Supabase.
 *
 * Skema SQLite diturunkan otomatis dari prisma/schema.prisma (hanya baris
 * provider yang ditukar), jadi tidak ada skema kedua yang perlu dirawat dan
 * tidak mungkin ketinggalan saat model berubah.
 *
 *   node prisma/local.mjs dev      jalankan dev server di atas SQLite
 *   node prisma/local.mjs setup    siapkan database saja
 *   tambahkan --reset              hapus database lalu seed ulang
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const prismaDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.join(prismaDir, "..");
const sourceSchema = path.join(prismaDir, "schema.prisma");
const localSchema = path.join(prismaDir, "schema.local.prisma");
const dbFile = path.join(prismaDir, "local.db");

// Path relatif pada URL SQLite dihitung dari folder skema, yaitu prisma/.
const DATABASE_URL = "file:./local.db";

const command = process.argv[2] ?? "dev";
const reset = process.argv.includes("--reset");

function run(cmd, args, extraEnv = {}) {
  const result = spawnSync(cmd, args, {
    cwd: projectDir,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...extraEnv },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function tulisSkemaLokal() {
  const schema = readFileSync(sourceSchema, "utf8");
  const local = schema.replace(/provider(\s*)=(\s*)"postgresql"/, 'provider$1=$2"sqlite"');

  if (local === schema) {
    console.error(
      'Tidak menemukan provider = "postgresql" di prisma/schema.prisma, mode lokal dibatalkan.',
    );
    process.exit(1);
  }

  writeFileSync(
    localSchema,
    `// Dibuat otomatis oleh prisma/local.mjs. Jangan diedit — ubah prisma/schema.prisma.\n${local}`,
  );
}

if (command !== "dev" && command !== "setup") {
  console.error(`Perintah tidak dikenal: ${command}. Gunakan "dev" atau "setup".`);
  process.exit(1);
}

tulisSkemaLokal();

console.log("\n> Menyiapkan Prisma Client untuk SQLite\n");
run("npx", ["prisma", "generate", "--schema", localSchema]);

if (reset && existsSync(dbFile)) {
  rmSync(dbFile, { force: true });
  rmSync(`${dbFile}-journal`, { force: true });
  console.log("\n> Database lokal lama dihapus\n");
}

const databaseBaru = !existsSync(dbFile);

console.log("\n> Menyamakan struktur database lokal dengan skema\n");
run(
  "npx",
  ["prisma", "db", "push", "--schema", localSchema, "--skip-generate", "--accept-data-loss"],
  { DATABASE_URL },
);

if (databaseBaru) {
  console.log("\n> Mengisi data awal\n");
  run("npx", ["tsx", "prisma/seed.ts"], { DATABASE_URL });
}

if (command === "setup") {
  console.log(
    [
      "",
      "Database lokal siap di prisma/local.db.",
      'Jalankan "npm run dev:local" untuk memakainya.',
      "",
    ].join("\n"),
  );
  process.exit(0);
}

console.log(
  [
    "",
    "Menjalankan aplikasi di atas prisma/local.db (Supabase tidak dipakai).",
    "Login: admin / admin123 atau ustadz / ustadz123",
    '"npm run dev" biasa akan mengembalikan mode Postgres.',
    "",
  ].join("\n"),
);

run("npx", ["next", "dev"], { DATABASE_URL });
