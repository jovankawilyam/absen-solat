"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAbsen } from "@/lib/store";
import { SHOLAT_LIST } from "@/lib/types";
import { formatPendekID, lastNDaysKeys, todayKey } from "@/lib/dates";
import { getDayRecords, type PhotoRecord } from "@/lib/attendance";
import ProfileSwitcher from "@/components/ProfileSwitcher";

function jamSaja(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(
    new Date(iso)
  );
}

export default function Riwayat() {
  const api = useAbsen();
  const { store, activeProfile, ready } = api;
  const [days, setDays] = useState<{ key: string; rows: PhotoRecord[] }[]>([]);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);

  const openZoom = (blob: Blob) => {
    setZoomUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
  };
  const closeZoom = () => {
    setZoomUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const profileId = activeProfile?.id ?? null;

  useEffect(() => {
    if (!ready || !profileId) return;
    let cancel = false;
    const pid = profileId;
    const keys = lastNDaysKeys(7, todayKey()).slice().reverse();
    Promise.all(keys.map(async (k) => ({ key: k, rows: await getDayRecords(pid, k) }))).then(
      (res) => {
        if (!cancel) setDays(res);
      }
    );
    return () => {
      cancel = true;
    };
  }, [ready, profileId]);

  if (!ready) return <div className="p-6 text-sm text-[#6b655a]">Membuka buku…</div>;
  if (!activeProfile)
    return (
      <main className="px-5 py-6 text-sm">
        Belum ada profil.{" "}
        <Link className="underline underline-offset-4" href="/">
          Tambah dulu
        </Link>
      </main>
    );

  return (
    <main className="px-5 pt-5 pb-6">
      <p className="kicker text-[#b4532a]">Arsip foto</p>
      <h1 className="font-catatan mt-1 text-[26px] leading-tight">Riwayat tujuh hari</h1>
      <p className="mt-1 text-xs text-[#6b655a] dark:text-[#9a937f]">
        Ketuk foto untuk memperbesar. Stempel waktu menempel di foto.
      </p>
      <div className="mt-3">
        <ProfileSwitcher
          profiles={store.profiles}
          activeId={activeProfile.id}
          onPick={api.setActive}
          onAdd={() => {}}
        />
      </div>

      <div className="mt-4 border-t border-[#1c1a15]/80 dark:border-[#3a443b]">
        {days.map((d) => (
          <section key={d.key} className="ledger-row py-3">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold">
                {d.key === todayKey() ? "Hari ini" : formatPendekID(d.key)}
              </p>
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
                      <div className="aspect-[3/4] bg-[#e8dfcc] dark:bg-[#1a221b]">
                        <FullThumb blob={r.photo} alt={`${s.label} ${d.key}`} onClick={() => openZoom(r.photo)} />
                      </div>
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

      {zoomUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={closeZoom}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoomUrl} alt="Foto absen besar" className="max-h-full max-w-full" />
        </div>
      )}
    </main>
  );
}

function FullThumb({ blob, alt, onClick }: { blob: Blob; alt: string; onClick: () => void }) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <button onClick={onClick} className="h-full w-full" aria-label={alt}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} className="h-full w-full object-cover" />
    </button>
  );
}
