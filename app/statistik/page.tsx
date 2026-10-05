"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAbsen } from "@/lib/store";
import { addDaysKey, formatPendekID, lastNDaysKeys, todayKey } from "@/lib/dates";
import { getRangeRecords, type PhotoMeta } from "@/lib/attendance";

export default function Statistik() {
  const api = useAbsen();
  const { store, ready } = api;
  const [metas, setMetas] = useState<PhotoMeta[]>([]);
  const profileIdsKey = store.profiles.map((p) => p.id).join(",");

  useEffect(() => {
    if (!ready) return;
    const ids = profileIdsKey ? profileIdsKey.split(",") : [];
    if (ids.length === 0) return;
    let cancel = false;
    const keys = lastNDaysKeys(30, todayKey());
    getRangeRecords(ids, keys)
      .then((rows) => {
        if (!cancel) setMetas(rows);
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, [ready, profileIdsKey]);

  if (!ready) return <div className="p-6 text-sm text-[#6b655a]">Membuka buku…</div>;
  if (store.profiles.length === 0)
    return (
      <main className="px-5 py-6 text-sm">
        Belum ada data.{" "}
        <Link className="underline underline-offset-4" href="/">
          Mulai absen
        </Link>
      </main>
    );

  const weekKeys = lastNDaysKeys(7, todayKey());
  const monthKeys = lastNDaysKeys(30, todayKey());

  const rows = store.profiles.map((p) => {
    const w = metas.filter((m) => m.profileId === p.id && weekKeys.includes(m.dateKey)).length;
    const m = metas.filter((m) => m.profileId === p.id && monthKeys.includes(m.dateKey)).length;
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const k = addDaysKey(todayKey(), -i);
      const c = metas.filter((x) => x.profileId === p.id && x.dateKey === k).length;
      if (c >= 5) streak++;
      else if (i === 0 && c > 0) break;
      else break;
    }
    return {
      p,
      weekPct: Math.round((w / 35) * 100),
      monthPct: Math.round((m / 150) * 100),
      weekCount: w,
      streak,
    };
  });
  const leaderboard = [...rows].sort((a, b) => b.weekPct - a.weekPct);

  return (
    <main className="px-5 pt-5 pb-6">
      <p className="kicker text-[#b4532a]">Rekap keluarga</p>
      <h1 className="font-catatan mt-1 text-[26px] leading-tight">Statistik</h1>
      <p className="mt-1 text-xs text-[#6b655a] dark:text-[#9a937f]">
        Dihitung dari foto tersimpan. Runtutan = hari penuh 5 foto berturut-turut.
      </p>

      <div className="mt-4 border-t border-[#1c1a15]/80 dark:border-[#3a443b]">
        {leaderboard.map((r, i) => (
          <div key={r.p.id} className="ledger-row py-3">
            <div className="flex items-center gap-2.5">
              <span className="tabular w-5 text-xs text-[#a39c8b]">{String(i + 1).padStart(2, "0")}</span>
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: r.p.color }}
              >
                {r.p.name.charAt(0).toUpperCase()}
              </span>
              <p className="flex-1 text-sm font-semibold">{r.p.name}</p>
              <span className="text-xs text-[#6b655a] dark:text-[#9a937f]">
                <span className="tabular font-semibold text-[#1c1a15] dark:text-[#ece7db]">{r.streak}</span> hari
                beruntun
              </span>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b655a]">7 hari</span>
                  <span className="tabular font-semibold">{r.weekPct}%</span>
                </div>
                <div className="mt-1.5 h-[3px] bg-[#e8dfcc] dark:bg-[#263027]">
                  <div className="h-full bg-[#1c1a15] dark:bg-[#ece7db]" style={{ width: `${r.weekPct}%` }} />
                </div>
                <p className="tabular mt-1 text-[11px] text-[#8a8474]">{r.weekCount}/35 foto</p>
              </div>
              <div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b655a]">30 hari</span>
                  <span className="tabular font-semibold">{r.monthPct}%</span>
                </div>
                <div className="mt-1.5 h-[3px] bg-[#e8dfcc] dark:bg-[#263027]">
                  <div className="h-full bg-[#8a8474]" style={{ width: `${r.monthPct}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-[#8a8474]">sebulan terakhir</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="kicker mt-6 text-[#6b655a]">Grafik 7 hari — foto keluarga per hari</h2>
      <div className="mt-2 border border-[#e3d9c4] px-3 pt-3 pb-2 dark:border-[#263027]">
        <div className="flex h-28 items-end gap-2">
          {weekKeys.map((k) => {
            const total = metas.filter((m) => m.dateKey === k).length;
            const max = Math.max(1, store.profiles.length * 5);
            const h = Math.round((total / max) * 100);
            return (
              <div key={k} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="tabular text-[10px] text-[#8a8474]">{total}</span>
                <div className="flex w-full flex-1 items-end bg-[#f1ebe0] dark:bg-[#1a221b]">
                  <div
                    className="w-full bg-[#1d3b2e] dark:bg-[#8fb69f]"
                    style={{ height: `${h}%`, minHeight: total ? 6 : 1 }}
                    title={`${total}`}
                  />
                </div>
                <span className="text-[10px] text-[#8a8474]">{formatPendekID(k).split(",")[0]}</span>
              </div>
            );
          })}
        </div>
        <p className="tabular mt-2 border-t border-dashed border-[#e3d9c4] pt-1.5 text-center text-[11px] text-[#8a8474] dark:border-[#263027]">
          Maksimal {store.profiles.length * 5} foto per hari
        </p>
      </div>
    </main>
  );
}
