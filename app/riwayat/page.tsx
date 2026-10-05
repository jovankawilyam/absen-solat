"use client";

import { useEffect, useState } from "react";
import { SHOLAT_LIST } from "@/lib/types";
import { formatPendekID, lastNDaysKeys, todayKey } from "@/lib/dates";
import { useCloudProfile } from "@/lib/cloud/use-profile";
import { getDayPhotos, type CloudPhoto } from "@/lib/cloud/attendance";

function jamSaja(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(
    new Date(iso)
  );
}

export default function Riwayat() {
  const { profile, ready } = useCloudProfile();
  const [days, setDays] = useState<{ key: string; rows: CloudPhoto[] }[]>([]);
  const [zoom, setZoom] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !profile) return;
    let cancel = false;
    const pid = profile.id;
    const keys = lastNDaysKeys(7, todayKey()).slice().reverse();
    Promise.all(keys.map(async (k) => ({ key: k, rows: await getDayPhotos(pid, k) }))).then((res) => {
      if (!cancel) setDays(res);
    });
    return () => {
      cancel = true;
    };
  }, [ready, profile]);

  if (!ready) return <div className="p-6 text-sm text-[#6b655a]">Membuka buku…</div>;
  if (!profile) return <div className="p-6 text-sm text-[#6b655a]">Menyiapkan profil…</div>;

  return (
    <main className="px-5 pt-5 pb-6">
      <p className="kicker text-[#b4532a]">Arsip foto</p>
      <h1 className="font-catatan mt-1 text-[26px] leading-tight">Riwayat tujuh hari</h1>
      <p className="mt-1 text-xs text-[#6b655a] dark:text-[#9a937f]">
        {profile.name} · ketuk foto untuk memperbesar.
      </p>

      <div className="mt-4 border-t border-[#1c1a15]/80 dark:border-[#3a443b]">
        {days.map((d) => (
          <section key={d.key} className="ledger-row py-3">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold">{d.key === todayKey() ? "Hari ini" : formatPendekID(d.key)}</p>
              <p className="tabular text-xs text-[#8a8474]">{d.rows.length}/5 tercatat</p>
            </div>
            {d.rows.length === 0 ? (
              <p className="mt-1.5 text-xs text-[#a39c8b]">— kosong, tidak ada foto hari ini.</p>
            ) : (
              <div className="mt-2 grid grid-cols-5 gap-1.5">
                {SHOLAT_LIST.map((s) => {
                  const r = d.rows.find((x) => x.sholat === s.key);
                  if (!r)
                    return (
                      <div
                        key={s.key}
                        className="flex aspect-[3/4] flex-col items-center justify-center gap-1 border border-dashed border-[#e0d6bf] text-[#b3ab97] dark:border-[#263027]"
                      >
                        <span className="text-[10px] font-medium">{s.label.slice(0, 3)}</span>
                        <span className="text-[10px]">–</span>
                      </div>
                    );
                  return (
                    <div key={s.key} className="border border-[#1c1a15]/15 dark:border-[#3a443b]">
                      <button className="block aspect-[3/4] w-full" onClick={() => setZoom(r.url)} aria-label={`${s.label} ${d.key}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.url} alt={`${s.label} ${d.key}`} className="h-full w-full object-cover" loading="lazy" />
                      </button>
                      <p className="tabular border-t border-[#1c1a15]/15 px-1 py-1 text-center text-[10px] dark:border-[#3a443b]">
                        {s.label.slice(0, 3)} · {jamSaja(r.takenAt)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>

      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setZoom(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="Foto absen besar" className="max-h-full max-w-full" />
        </div>
      )}
    </main>
  );
}
