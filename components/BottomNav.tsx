"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IcoHariIni, IcoKeluarga, IcoRiwayat, IcoStatistik } from "./icons";

const ITEMS = [
  { href: "/", label: "Hari ini", Icon: IcoHariIni },
  { href: "/riwayat", label: "Riwayat", Icon: IcoRiwayat },
  { href: "/statistik", label: "Statistik", Icon: IcoStatistik },
  { href: "/keluarga", label: "Profil", Icon: IcoKeluarga },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-[#e3d9c4] bg-[#faf7f0]/95 backdrop-blur dark:border-[#263027] dark:bg-[#101511]/95">
      <div className="mx-auto grid max-w-md grid-cols-4 px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] transition ${
                active
                  ? "text-[#1d3b2e] dark:text-[#dcead7]"
                  : "text-[#8a8474] hover:text-[#1c1a15] dark:text-[#7a8478] dark:hover:text-[#ece7db]"
              }`}
            >
              <span
                className={`flex h-7 items-center justify-center rounded-full px-5 ${
                  active ? "bg-[#1d3b2e] text-[#faf7f0] dark:bg-[#dcead7] dark:text-[#12241c]" : ""
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className={active ? "font-semibold" : "font-medium"}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
