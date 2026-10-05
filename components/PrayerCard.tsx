"use client";

import { useState } from "react";
import type { SholatName, Status } from "@/lib/types";
import { STATUS_META } from "@/lib/types";

const DOT: Record<Status, string> = {
  tepat: "bg-emerald-500",
  terlambat: "bg-amber-500",
  qadha: "bg-orange-600",
  udzur: "bg-zinc-400",
};

export default function PrayerCard({
  label,
  time,
  status,
  onToggle,
  onStatus,
}: {
  name: SholatName;
  label: string;
  time: string;
  status?: Status;
  onToggle: () => void;
  onStatus: (s: Status) => void;
}) {
  const [open, setOpen] = useState(false);
  const done = !!status;

  return (
    <div
      className={`rounded-2xl border p-3 transition ${
        done
          ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/40"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          aria-label={`Tandai ${label}`}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-lg font-bold transition active:scale-95 ${
            done
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-zinc-300 text-transparent dark:border-zinc-600"
          }`}
        >
          ✓
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{label}</p>
            {status && (
              <span className={`h-2 w-2 rounded-full ${DOT[status]}`} title={STATUS_META[status].label} />
            )}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {time} • {status ? STATUS_META[status].label : "Belum dicatat"}
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-full px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400"
          aria-label="Pilihan status"
        >
          {open ? "▴" : "▾"}
        </button>
      </div>
      {open && (
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {(Object.keys(STATUS_META) as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                onStatus(s);
                setOpen(false);
              }}
              className={`rounded-xl px-2 py-2 text-xs font-medium ${
                status === s
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              {STATUS_META[s].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
