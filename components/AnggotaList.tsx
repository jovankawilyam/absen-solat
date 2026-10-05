"use client";

import type { Anggota } from "@/lib/cloud/use-anggota";

/** Daftar anggota lain — nama saja, tanpa progress/foto. */
export default function AnggotaList({ anggota, loading }: { anggota: Anggota[]; loading: boolean }) {
  if (loading || anggota.length === 0) return null;
  return (
    <section className="mt-4">
      <p className="kicker text-[#6b655a] dark:text-[#9a937f]">Anggota lain — {anggota.length}</p>
      <div className="mt-1.5 border-t border-[#e3d9c4] dark:border-[#263027]">
        {anggota.map((a) => (
          <div key={a.id} className="ledger-row flex items-center gap-2.5 py-2">
            {a.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.avatar_url}
                alt={a.name}
                className="h-6 w-6 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ background: a.color }}
              >
                {a.name.charAt(0).toUpperCase()}
              </span>
            )}
            <p className="flex-1 text-sm font-medium">{a.name}</p>
            <span className="text-[11px] text-[#a39c8b]">anggota</span>
          </div>
        ))}
      </div>
    </section>
  );
}
