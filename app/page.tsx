"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAbsen } from "@/lib/store";
import { SHOLAT_LIST, type SholatName } from "@/lib/types";
import { addDaysKey, formatHijriah, formatTanggalID, todayKey } from "@/lib/dates";
import { fetchPrayerTimes, nextPrayer, formatCountdown, type PrayerTimes } from "@/lib/prayer";
import { useDayPhotos } from "@/lib/usePhotos";
import { deletePhotoRecord } from "@/lib/attendance";
import ProfileSwitcher from "@/components/ProfileSwitcher";
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
  const api = useAbsen();
  const { store, activeProfile, ready } = api;
  const [dateKey, setDateKey] = useState(todayKey());
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [offline, setOffline] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [newName, setNewName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [shoot, setShoot] = useState<SholatName | null>(null);
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

  const photos = useDayPhotos(activeProfile?.id ?? null, dateKey);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancel = false;
    fetchPrayerTimes(dateKey, store.settings.lat, store.settings.lng, store.settings.method)
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
  }, [ready, dateKey, store.settings.lat, store.settings.lng, store.settings.method]);

  if (!ready) return <div className="p-6 text-sm text-[#6b655a]">Membuka buku…</div>;

  if (store.profiles.length === 0) {
    return (
      <main className="px-5 py-8">
        <p className="kicker text-[#6b655a]">Assalamu&apos;alaikum</p>
        <h1 className="font-catatan mt-2 text-[32px] leading-[1.05]">
          Absen solat,
          <br />
          <em className="font-normal">dengan foto.</em>
        </h1>
        <p className="mt-3 max-w-[32ch] text-sm leading-relaxed text-[#6b655a]">
          Setiap solat dicatat lewat kamera langsung. Tanggal dan jam ditempel otomatis di foto — tidak bisa
          pakai galeri.
        </p>
        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newName.trim()) return;
            api.addProfile(newName);
            setNewName("");
          }}
        >
          <label htmlFor="nama-pertama" className="kicker text-[#6b655a]">
            Anggota pertama
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="nama-pertama"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nama, misal: Ayah"
              className="min-w-0 flex-1 border-b-2 border-[#1c1a15] bg-transparent px-0 py-2.5 text-[15px] placeholder:text-[#a39c8b] focus:border-[#1d3b2e] focus:outline-none dark:border-[#ece7db] dark:placeholder:text-[#5c665c]"
            />
            <button className="bg-[#1d3b2e] px-5 py-2.5 text-sm font-semibold text-[#faf7f0] transition hover:bg-[#142a21] active:scale-[0.98] dark:bg-[#dcead7] dark:text-[#12241c]">
              Tambah
            </button>
          </div>
          <p className="mt-3 text-xs text-[#8a8474]">Contoh: Ayah, Ibu, Kakak. Bisa tambah lagi nanti.</p>
        </form>
      </main>
    );
  }

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
            {store.settings.label}
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

      <div className="mt-4">
        <ProfileSwitcher
          profiles={store.profiles}
          activeId={activeProfile?.id ?? null}
          onPick={api.setActive}
          onAdd={() => setShowAdd((v) => !v)}
        />
        {showAdd && (
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newName.trim()) return;
              api.addProfile(newName);
              setNewName("");
              setShowAdd(false);
            }}
          >
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nama anggota baru"
              className="min-w-0 flex-1 border border-[#e3d9c4] bg-white px-3 py-2 text-sm placeholder:text-[#a39c8b] focus:outline-none dark:border-[#263027] dark:bg-[#161c17] dark:placeholder:text-[#5c665c]"
            />
            <button className="bg-[#1c1a15] px-4 py-2 text-sm font-semibold text-[#faf7f0] dark:bg-[#ece7db] dark:text-[#12241c]">
              Simpan
            </button>
          </form>
        )}
      </div>

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
            <span className="font-catatan text-[17px] font-semibold">{activeProfile?.name}</span>
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
          return (
            <div key={s.key} className="ledger-row flex items-center gap-3 py-3">
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
                <PhotoThumb blob={rec.photo} alt={`Absen ${s.label}`} onClick={() => openZoom(rec.photo)} />
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
                ) : (
                  <p className="text-xs leading-relaxed text-[#8a8474]">Belum dicatat. Jepret langsung dari kamera.</p>
                )}
              </div>
              {!done ? (
                <button
                  onClick={() => setShoot(s.key)}
                  className="shrink-0 border border-[#1c1a15] px-4 py-2 text-[13px] font-semibold transition hover:bg-[#1c1a15] hover:text-[#faf7f0] active:scale-[0.97] dark:border-[#ece7db] dark:hover:bg-[#ece7db] dark:hover:text-[#12241c]"
                >
                  Absen
                </button>
              ) : (
                <button
                  onClick={async () => {
                    if (!rec) return;
                    if (confirm(`Hapus foto ${s.label} dan absen ulang?`)) {
                      await deletePhotoRecord(rec.id);
                      photos.refresh();
                    }
                  }}
                  className="shrink-0 text-xs text-[#8a8474] underline decoration-dotted underline-offset-4 hover:text-[#1c1a15] dark:hover:text-[#ece7db]"
                >
                  Ulangi
                </button>
              )}
            </div>
          );
        })}
      </div>

      {filled === 5 && (
        <div className="mt-4 border border-[#e3d9c4] px-4 py-3 text-center dark:border-[#263027]">
          <p className="font-catatan text-[15px] italic">
            Lengkap lima waktu hari ini, {activeProfile?.name}. Alhamdulillah.
          </p>
        </div>
      )}
      {filled < 5 && (
        <p className="mt-3 text-center text-[11px] tracking-wide text-[#a39c8b]">
          {5 - filled} catatan tersisa hari ini · foto tersimpan di perangkat
        </p>
      )}

      {shoot && activeProfile && (
        <CameraSheet
          profileId={activeProfile.id}
          profileName={activeProfile.name}
          dateKey={dateKey}
          sholat={shoot}
          sholatLabel={shootLabel}
          jadwalHHMM={times?.[shoot] ?? "--:--"}
          onClose={() => setShoot(null)}
          onSaved={() => {
            setShoot(null);
            photos.refresh();
          }}
        />
      )}

      {zoomUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={closeZoom}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoomUrl} alt="Foto absen besar" className="max-h-full max-w-full" />
        </div>
      )}
    </main>
  );
}
