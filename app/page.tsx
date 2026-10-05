"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SholatName } from "@/lib/types";
import { SHOLAT_LIST } from "@/lib/types";
import { addDaysKey, formatHijriah, formatTanggalID, todayKey } from "@/lib/dates";
import {
  fetchPrayerTimes,
  nextPrayer,
  formatCountdown,
  sholatWindow,
  type PrayerTimes,
} from "@/lib/prayer";
import { useSettings } from "@/lib/settings";
import { useCloudProfile } from "@/lib/cloud/use-profile";
import { useAnggota } from "@/lib/cloud/use-anggota";
import AnggotaList from "@/components/AnggotaList";
import { useCloudDayPhotos } from "@/lib/cloud/use-day-photos";
import { deleteCloudPhoto } from "@/lib/cloud/attendance";
import { flushOutbox, pendingCount } from "@/lib/cloud/outbox";
import PhotoThumb from "@/components/PhotoThumb";
import CameraSheet from "@/components/CameraSheet";
import { IcoCek, IcoJam, IcoKamera, IcoPin } from "@/components/icons";

const FALLBACK_TIMES: PrayerTimes = {
  subuh: "04:40",
  dzuhur: "12:00",
  ashar: "15:15",
  maghrib: "18:05",
  isya: "19:20",
};

function jamSaja(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(
    new Date(iso)
  );
}

export default function Home() {
  const { user, profile, ready: profilSiap } = useCloudProfile();
  const { settings, ready: settingSiap } = useSettings();
  const [dateKey, setDateKey] = useState(todayKey());
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [offline, setOffline] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [shoot, setShoot] = useState<SholatName | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const [antrean, setAntrean] = useState(0);

  const photos = useCloudDayPhotos(profile?.id ?? null, dateKey);
  const ready = profilSiap && settingSiap;
  const { anggota, loading: anggotaLoading } = useAnggota(user?.id ?? null, ready);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Kirim antrean offline begitu aplikasi dibuka
  useEffect(() => {
    if (!ready || !profile) return;
    pendingCount().then(setAntrean).catch(() => {});
    if (!navigator.onLine) return;
    flushOutbox().then((r) => {
      setAntrean(r.sisa);
      if (r.terkirim > 0) photos.refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, profile?.id]);

  useEffect(() => {
    if (!ready) return;
    let cancel = false;
    fetchPrayerTimes(dateKey, settings.lat, settings.lng, settings.method)
      .then((v) => {
        if (cancel) return;
        setTimes(v);
        setOffline(false);
      })
      .catch(() => {
        if (cancel) return;
        setTimes(FALLBACK_TIMES);
        setOffline(true);
      });
    return () => {
      cancel = true;
    };
  }, [ready, dateKey, settings.lat, settings.lng, settings.method]);

  if (!ready) return <div className="p-6 text-sm text-[#6b655a]">Membuka buku…</div>;
  if (!profile) return <div className="p-6 text-sm text-[#6b655a]">Menyiapkan profil…</div>;

  const upcoming = dateKey === todayKey() && times ? nextPrayer(now, dateKey, times) : null;
  const filled = photos.filled;
  const pct = Math.round((filled / 5) * 100);
  const shootLabel = SHOLAT_LIST.find((s) => s.key === shoot)?.label ?? "";
  const isToday = dateKey === todayKey();

  return (
    <main className="px-5 pt-5 pb-6">
      {/* tanggal */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="kicker text-[#b4532a]">{formatHijriah(dateKey)}</p>
          <h1 className="font-catatan mt-1 text-[26px] leading-tight">{formatTanggalID(dateKey)}</h1>
          <p className="mt-1.5 flex items-center gap-1 text-xs text-[#6b655a] dark:text-[#9a937f]">
            <IcoPin />
            {settings.label}
            <span aria-hidden className="text-[#c9bfa9]">
              ·
            </span>
            <span>wajib foto kamera</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center border border-[#e3d9c4] text-[13px] dark:border-[#263027]">
          <button
            onClick={() => setDateKey((k) => addDaysKey(k, -1))}
            className="px-2.5 py-1.5 text-[#6b655a] transition hover:bg-[#f1ebe0] dark:text-[#9a937f] dark:hover:bg-[#1a221b]"
            aria-label="Hari sebelumnya"
          >
            ←
          </button>
          <button
            onClick={() => setDateKey(todayKey())}
            className={`border-x border-[#e3d9c4] px-2.5 py-1.5 text-xs font-semibold dark:border-[#263027] ${
              isToday ? "text-[#8a8474]" : "text-[#1d3b2e] dark:text-[#dcead7]"
            }`}
          >
            {isToday ? "Hari ini" : "Kembali"}
          </button>
          <button
            onClick={() => setDateKey((k) => addDaysKey(k, 1))}
            disabled={addDaysKey(dateKey, 1) > todayKey()}
            className="px-2.5 py-1.5 text-[#6b655a] transition hover:bg-[#f1ebe0] disabled:opacity-30 dark:text-[#9a937f] dark:hover:bg-[#1a221b]"
            aria-label="Hari berikutnya"
          >
            →
          </button>
        </div>
      </div>

      {/* siapa yang absen */}
      <div className="mt-4 flex items-center gap-2.5 border border-[#e3d9c4] px-3 py-2 dark:border-[#263027]">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.name}
            className="h-7 w-7 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: profile.color }}
          >
            {profile.name.charAt(0).toUpperCase()}
          </span>
        )}
        <p className="flex-1 text-sm">
          <span className="font-semibold">{profile.name}</span>
          <span className="ml-2 text-[11px] text-[#8a8474]">akun Google-mu</span>
        </p>
      </div>
      <AnggotaList anggota={anggota} loading={anggotaLoading} />
      {antrean > 0 && (
        <p className="mt-2 border-b border-dashed border-[#c9bfa9] pb-2 text-xs text-[#8a8474]">
          {antrean} foto menunggu jaringan — terkirim otomatis saat online.
        </p>
      )}

      {/* pengingat berikutnya — strip, bukan blok solid */}
      {upcoming && (
        <div className="mt-4 flex items-baseline justify-between gap-3 border-l-2 border-[#1d3b2e] bg-[#f1ebe0]/60 py-2.5 pr-3 pl-3 dark:border-[#8fb69f] dark:bg-[#161c17]">
          <div>
            <p className="kicker text-[#6b655a] dark:text-[#9a937f]">
              Berikutnya — {upcoming.label} · {upcoming.time}
            </p>
            <p className="tabular font-catatan mt-0.5 text-[22px] leading-none">
              {formatCountdown(upcoming.diffMs)}
            </p>
          </div>
          <p className="shrink-0 text-[11px] text-[#8a8474]">menuju azan</p>
        </div>
      )}
      {offline && (
        <p className="mt-2 border-b border-dashed border-[#c9bfa9] pb-2 text-xs text-[#8a8474]">
          Jadwal perkiraan (luring). Sambungkan internet agar akurat.
        </p>
      )}

      {/* ringkasan */}
      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <p className="text-sm">
            <span className="font-catatan text-[17px] font-semibold">{profile.name}</span>
            <span className="tabular ml-2 text-[13px] text-[#6b655a] dark:text-[#9a937f]">
              {filled}/5 · {pct}%
            </span>
          </p>
          <Link
            href="/statistik"
            className="text-xs font-medium text-[#1d3b2e] underline decoration-[#e3d9c4] decoration-1 underline-offset-4 hover:decoration-[#1d3b2e] dark:text-[#b9d3c0]"
          >
            Lihat statistik
          </Link>
        </div>
        <div className="mt-2 h-[3px] bg-[#e8dfcc] dark:bg-[#263027]">
          <div className="h-full bg-[#1d3b2e] transition-all dark:bg-[#8fb69f]" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* daftar solat — ledger */}
      <div className="mt-4 border-y border-[#1c1a15]/80 dark:border-[#3a443b]">
        {SHOLAT_LIST.map((s, idx) => {
          const rec = photos.map[s.key];
          const done = !!rec;
          const win = sholatWindow(now, dateKey, s.key, times);
          const hangus = !done && win.state === "hangus";
          const menunggu = !done && win.state === "belum";
          return (
            <div key={s.key} className={`ledger-row flex items-center gap-3 py-3 ${hangus ? "opacity-60" : ""}`}>
              <span className="tabular w-6 shrink-0 text-xs text-[#a39c8b]">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="w-[86px] shrink-0">
                <p className="font-catatan text-[15px] leading-tight font-semibold">{s.label}</p>
                <p className="tabular mt-0.5 flex items-center gap-1 text-xs text-[#6b655a] dark:text-[#9a937f]">
                  <IcoJam />
                  {times?.[s.key] ?? "--:--"}
                </p>
              </div>
              {done && rec ? (
                <PhotoThumb src={rec.url} alt={`Absen ${s.label}`} onClick={() => setZoom(rec.url)} />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-dashed border-[#c9bfa9] text-[#a39c8b] dark:border-[#3a443b]">
                  <IcoKamera className="h-5 w-5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                {done && rec ? (
                  <>
                    <p className="flex items-center gap-1.5 text-[13px] font-medium">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1d3b2e] text-[#faf7f0] dark:bg-[#8fb69f] dark:text-[#12241c]">
                        <IcoCek className="h-2.5 w-2.5" />
                      </span>
                      <span className="tabular">{jamSaja(rec.takenAt)}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-[#6b655a] dark:text-[#9a937f]">
                      {rec.lateMin != null && rec.lateMin > 0 ? `Telat ${rec.lateMin} mnt` : "Tepat waktu"}
                    </p>
                  </>
                ) : hangus ? (
                  <>
                    <p className="text-[13px] font-medium text-[#9b2c1f]">Terlewat</p>
                    <p className="mt-0.5 text-xs text-[#8a8474]">
                      {win.nextLabel ? `Batas sampai masuk ${win.nextLabel}` : "Hari sudah lewat — tak bisa susulan"}
                    </p>
                  </>
                ) : menunggu ? (
                  <>
                    <p className="text-[13px] font-medium text-[#8a8474]">Belum masuk waktu</p>
                    <p className="tabular mt-0.5 text-xs text-[#8a8474]">Mulai {times?.[s.key] ?? "--:--"}</p>
                  </>
                ) : (
                  <p className="text-xs leading-relaxed text-[#8a8474]">Belum dicatat. Jepret langsung dari kamera.</p>
                )}
              </div>
              {!done ? (
                hangus ? (
                  <span className="shrink-0 border border-[#e3d9c4] px-4 py-2 text-[13px] text-[#a39c8b] dark:border-[#263027]">
                    Hangus
                  </span>
                ) : menunggu ? (
                  <span className="shrink-0 border border-[#e3d9c4] px-4 py-2 text-[13px] text-[#a39c8b] dark:border-[#263027]">
                    Tunggu
                  </span>
                ) : (
                  <button
                    onClick={() => setShoot(s.key)}
                    className="shrink-0 border border-[#1c1a15] px-4 py-2 text-[13px] font-semibold transition hover:bg-[#1c1a15] hover:text-[#faf7f0] active:scale-[0.97] dark:border-[#ece7db] dark:hover:bg-[#ece7db] dark:hover:text-[#12241c]"
                  >
                    Absen
                  </button>
                )
              ) : win.state === "bisa" ? (
                <button
                  onClick={async () => {
                    if (!rec) return;
                    if (confirm(`Hapus foto ${s.label} dan absen ulang?`)) {
                      await deleteCloudPhoto(rec.id);
                      photos.refresh();
                    }
                  }}
                  className="shrink-0 text-xs text-[#8a8474] underline decoration-dotted underline-offset-4 hover:text-[#1c1a15] dark:hover:text-[#ece7db]"
                >
                  Ulangi
                </button>
              ) : (
                <span className="shrink-0 text-[11px] text-[#a39c8b]">Terkunci</span>
              )}
            </div>
          );
        })}
      </div>

      {filled === 5 && (
        <div className="mt-4 border border-[#e3d9c4] px-4 py-3 text-center dark:border-[#263027]">
          <p className="font-catatan text-[15px] italic">Lengkap lima waktu hari ini, {profile.name}. Alhamdulillah.</p>
        </div>
      )}
      {filled < 5 && (
        <p className="mt-3 text-center text-[11px] tracking-wide text-[#a39c8b]">
          {5 - filled} catatan tersisa hari ini · tersimpan di cloud
        </p>
      )}

      {shoot && (
        <CameraSheet
          profileId={profile.id}
          profileName={profile.name}
          dateKey={dateKey}
          sholat={shoot}
          sholatLabel={shootLabel}
          jadwalHHMM={times?.[shoot] ?? "--:--"}
          batasISO={sholatWindow(now, dateKey, shoot, times).batas?.toISOString() ?? null}
          mulaiISO={sholatWindow(now, dateKey, shoot, times).mulai?.toISOString() ?? null}
          onClose={() => setShoot(null)}
          onSaved={() => {
            setShoot(null);
            photos.refresh();
            pendingCount().then(setAntrean).catch(() => {});
          }}
        />
      )}

      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setZoom(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="Foto absen besar" className="max-h-full max-w-full" />
        </div>
      )}
    </main>
  );
}
