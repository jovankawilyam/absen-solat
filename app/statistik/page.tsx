"use client";

import { useEffect, useState } from "react";
import { addDaysKey, formatPendekID, lastNDaysKeys, todayKey } from "@/lib/dates";
import { useCloudProfile } from "@/lib/cloud/use-profile";
import { getRangeMeta } from "@/lib/cloud/attendance";

export default function Statistik() {
  const { profile, ready } = useCloudProfile();
  const [rows7, setRows7] = useState<{ dateKey: string; count: number }[]>([]);
  const [weekCount, setWeekCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!ready || !profile) return;
    let cancel = false;
    const pid = profile.id;
    const weekKeys = lastNDaysKeys(7, todayKey());
    const monthKeys = lastNDaysKeys(30, todayKey());
    getRangeMeta(pid, monthKeys).then((metas) => {
      if (cancel) return;
      const byDay = new Map<string, number>();
      metas.forEach((m) => byDay.set(m.dateKey, (byDay.get(m.dateKey) ?? 0) + 1));
      setRows7(weekKeys.map((k) => ({ dateKey: k, count: byDay.get(k) ?? 0 })));
      setWeekCount(weekKeys.reduce((a, k) => a + (byDay.get(k) ?? 0), 0));
      setMonthCount(metas.length);
      let s = 0;
      for (let i = 0; i < 60; i++) {
        const k = addDaysKey(todayKey(), -i);
        const c = byDay.get(k) ?? 0;
        if (i >= 30 && !byDay.has(k)) {
          // di luar jangkauan data yang diambil — hentikan tanpa menghukum
          if (c === 0) break;
        }
        if (c >= 5) s++;
        else if (i === 0 && c > 0) break;
        else break;
      }
      setStreak(s);
    });
    return () => {
      cancel = true;
    };
  }, [ready, profile]);

  if (!ready) return <div className="p-6 text-sm text-[#6b655a]">Membuka buku…</div>;
  if (!profile) return <div className="p-6 text-sm text-[#6b655a]">Menyiapkan profil…</div>;

  const weekPct = Math.round((weekCount / 35) * 100);
  const monthPct = Math.round((monthCount / 150) * 100);

  return (
    <main className="px-5 pt-5 pb-6">
      <p className="kicker text-[#b4532a]">Rekap pribadimu</p>
      <h1 className="font-catatan mt-1 text-[26px] leading-tight">Statistik</h1>
      <p className="mt-1 text-xs text-[#6b655a] dark:text-[#9a937f]">
        {profile.name} · runtutan = hari penuh 5 foto berturut-turut.
      </p>

      <div className="mt-4 border-y border-[#1c1a15]/80 py-3 dark:border-[#3a443b]">
        <div className="flex items-center gap-2.5">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={profile.name} className="h-8 w-8 rounded-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: profile.color }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </span>
          )}
          <p className="flex-1 text-sm font-semibold">{profile.name}</p>
          <span className="text-xs text-[#6b655a] dark:text-[#9a937f]">
            <span className="tabular font-semibold text-[#1c1a15] dark:text-[#ece7db]">{streak}</span> hari beruntun
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-xs">
              <span className="text-[#6b655a]">7 hari</span>
              <span className="tabular font-semibold">{weekPct}%</span>
            </div>
            <div className="mt-1.5 h-[3px] bg-[#e8dfcc] dark:bg-[#263027]">
              <div className="h-full bg-[#1c1a15] dark:bg-[#ece7db]" style={{ width: `${weekPct}%` }} />
            </div>
            <p className="tabular mt-1 text-[11px] text-[#8a8474]">{weekCount}/35 foto</p>
          </div>
          <div>
            <div className="flex justify-between text-xs">
              <span className="text-[#6b655a]">30 hari</span>
              <span className="tabular font-semibold">{monthPct}%</span>
            </div>
            <div className="mt-1.5 h-[3px] bg-[#e8dfcc] dark:bg-[#263027]">
              <div className="h-full bg-[#8a8474]" style={{ width: `${monthPct}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-[#8a8474]">sebulan terakhir</p>
          </div>
        </div>
      </div>

      <h2 className="kicker mt-6 text-[#6b655a]">Grafik 7 hari — foto per hari</h2>
      <div className="mt-2 border border-[#e3d9c4] px-3 pt-3 pb-2 dark:border-[#263027]">
        <div className="flex h-28 items-end gap-2">
          {rows7.map(({ dateKey, count }) => {
            const h = Math.round((count / 5) * 100);
            return (
              <div key={dateKey} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="tabular text-[10px] text-[#8a8474]">{count}</span>
                <div className="flex w-full flex-1 items-end bg-[#f1ebe0] dark:bg-[#1a221b]">
                  <div
                    className="w-full bg-[#1d3b2e] dark:bg-[#8fb69f]"
                    style={{ height: `${h}%`, minHeight: count ? 6 : 1 }}
                    title={`${count}`}
                  />
                </div>
                <span className="text-[10px] text-[#8a8474]">{formatPendekID(dateKey).split(",")[0]}</span>
              </div>
            );
          })}
        </div>
        <p className="tabular mt-2 border-t border-dashed border-[#e3d9c4] pt-1.5 text-center text-[11px] text-[#8a8474] dark:border-[#263027]">
          Maksimal 5 foto per hari
        </p>
      </div>
    </main>
  );
}
