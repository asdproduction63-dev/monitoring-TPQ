"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tabBarClass, tabClass } from "@/lib/ui";

const menu = [
  { href: "/raport", label: "Raport Pekanan" },
  { href: "/raport/rumah", label: "Laporan Rumah" },
];

export function NavWali() {
  const pathname = usePathname();

  return (
    <nav className={`${tabBarClass} mb-6`}>
      {menu.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={pathname === item.href ? "page" : undefined}
          className={tabClass(pathname === item.href)}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
