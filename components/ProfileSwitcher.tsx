"use client";

import type { Profile } from "@/lib/types";

export default function ProfileSwitcher({
  profiles,
  activeId,
  onPick,
  onAdd,
}: {
  profiles: Profile[];
  activeId: string | null;
  onPick: (id: string) => void;
  onAdd: () => void;
}) {
  if (profiles.length === 0) return null;
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {profiles.map((p) => {
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            onClick={() => onPick(p.id)}
            aria-pressed={active}
            className={`flex shrink-0 items-center gap-2 border px-2.5 py-1.5 text-[13px] transition ${
              active
                ? "border-[#1c1a15] bg-[#1c1a15] text-[#faf7f0] dark:border-[#ece7db] dark:bg-[#ece7db] dark:text-[#12241c]"
                : "border-[#e3d9c4] bg-transparent text-[#4a463d] hover:border-[#1c1a15] dark:border-[#263027] dark:text-[#b9bfae]"
            }`}
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: p.color }}
            >
              {p.name.charAt(0).toUpperCase()}
            </span>
            <span className={active ? "font-semibold" : "font-medium"}>{p.name}</span>
          </button>
        );
      })}
      <button
        onClick={onAdd}
        className="shrink-0 border border-dashed border-[#c9bfa9] px-3 py-1.5 text-[13px] text-[#8a8474] transition hover:border-[#1c1a15] hover:text-[#1c1a15] dark:border-[#3a443b] dark:hover:border-[#ece7db] dark:hover:text-[#ece7db]"
      >
        + Tambah
      </button>
    </div>
  );
}
