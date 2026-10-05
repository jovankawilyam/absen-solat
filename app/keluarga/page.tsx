"use client";

import { useEffect, useState } from "react";
import { useCloudProfile } from "@/lib/cloud/use-profile";
import { useSettings } from "@/lib/settings";
import { cloudStorageStats, deleteAllMine } from "@/lib/cloud/attendance";
import { hasLocalData, migrateLocalToCloud } from "@/lib/cloud/migrate";

function fmtMB(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const KOTA = [
  { n: "Jakarta", lat: -6.2, lng: 106.8 },
  { n: "Bandung", lat: -6.9, lng: 107.6 },
  { n: "Surabaya", lat: -7.25, lng: 112.75 },
  { n: "Medan", lat: 3.59, lng: 98.67 },
  { n: "Makassar", lat: -5.14, lng: 119.42 },
  { n: "Yogyakarta", lat: -7.8, lng: 110.36 },
];

export default function Keluarga() {
  const { profile, user, ready, rename, keluar } = useCloudProfile();
  const { settings, patch, ready: settingSiap } = useSettings();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [label, setLabel] = useState("");
  const [locating, setLocating] = useState(false);
  const [msg, setMsg] = useState("");
  const [photoCount, setPhotoCount] = useState(0);
  const [photoBytes, setPhotoBytes] = useState(0);
  const [localCount, setLocalCount] = useState(0);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    if (ready && profile) {
      cloudStorageStats(profile.id)
        .then((s) => {
          setPhotoCount(s.count);
          setPhotoBytes(s.bytes);
        })
        .catch(() => {});
      hasLocalData()
        .then(setLocalCount)
        .catch(() => {});
    }
  }, [ready, profile]);

  if (!ready || !settingSiap) return <div className="p-6 text-sm text-[#6b655a]">Membuka buku…</div>;
  if (!profile) return <div className="p-6 text-sm text-[#6b655a]">Menyiapkan profil…</div>;

  const useGPS = () => {
    if (!("geolocation" in navigator)) {
      setMsg("Browser tidak mendukung lokasi.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        patch({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Lokasi saya (GPS)" });
        setLocating(false);
        setMsg("Lokasi diperbarui dari GPS.");
      },
      () => {
        setLocating(false);
        setMsg("Izin lokasi ditolak. Isi manual di bawah.");
      }
    );
  };

  const inputCls =
    "border border-[#e3d9c4] bg-white px-3 py-2.5 text-sm placeholder:text-[#a39c8b] focus:outline-none dark:border-[#263027] dark:bg-[#161c17] dark:placeholder:text-[#5c665c]";

  return (
    <main className="px-5 pt-5 pb-6">
      <p className="kicker text-[#b4532a]">Akunmu</p>
      <h1 className="font-catatan mt-1 text-[26px] leading-tight">Profil saya</h1>

      <div className="mt-3 flex items-center gap-3 border border-[#e3d9c4] p-3 dark:border-[#263027]">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt={profile.name} className="h-11 w-11 rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ background: profile.color }}
          >
            {profile.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          {editing ? (
            <form
              className="flex gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                rename(editName);
                setEditing(false);
              }}
            >
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={`min-w-0 flex-1 ${inputCls} !py-1.5`}
              />
              <button className="bg-[#1c1a15] px-3 py-1.5 text-xs font-semibold text-[#faf7f0] dark:bg-[#ece7db] dark:text-[#12241c]">
                OK
              </button>
            </form>
          ) : (
            <>
              <p className="truncate text-sm font-semibold">{profile.name}</p>
              <p className="truncate text-xs text-[#8a8474]">{user?.email}</p>
            </>
          )}
        </div>
        {!editing && (
          <button
            onClick={() => {
              setEditing(true);
              setEditName(profile.name);
            }}
            className="border border-[#e3d9c4] px-2.5 py-1.5 text-xs dark:border-[#263027]"
          >
            Ubah nama
          </button>
        )}
      </div>
      <button
        onClick={keluar}
        className="mt-2 w-full border border-[#e3d9c4] px-3 py-2.5 text-sm transition hover:border-[#1c1a15] dark:border-[#263027]"
      >
        Keluar dari akun
      </button>

      <h2 className="kicker mt-7 text-[#6b655a]">Foto tersimpan — cloud</h2>
      <div className="mt-2 border border-[#e3d9c4] p-3.5 dark:border-[#263027]">
        <p className="tabular text-sm font-semibold">
          {photoCount} foto · {fmtMB(photoBytes)}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[#6b655a] dark:text-[#9a937f]">
          Foto tersimpan di cloud dan tampil di semua browser/HP-mu.
        </p>
        <button
          onClick={async () => {
            if (!confirm("Hapus SEMUA foto absen milikmu di cloud?")) return;
            await deleteAllMine(profile.id);
            const s = await cloudStorageStats(profile.id);
            setPhotoCount(s.count);
            setPhotoBytes(s.bytes);
            setMsg("Semua foto dihapus.");
          }}
          className="mt-2.5 w-full border border-[#e3d9c4] px-3 py-2 text-xs font-medium transition hover:border-[#1c1a15] dark:border-[#263027]"
        >
          Hapus semua foto saya
        </button>
      </div>

      <h2 className="kicker mt-7 text-[#6b655a]">Pindahan dari HP ini</h2>
      <div className="mt-2 border border-[#e3d9c4] p-3.5 dark:border-[#263027]">
        {localCount > 0 ? (
          <>
            <p className="text-sm">
              Ditemukan <span className="tabular font-semibold">{localCount}</span> foto lama di browser ini.
            </p>
            <button
              onClick={async () => {
                setMigrating(true);
                try {
                  const r = await migrateLocalToCloud(profile.id);
                  const s = await cloudStorageStats(profile.id);
                  setPhotoCount(s.count);
                  setPhotoBytes(s.bytes);
                  setLocalCount(0);
                  setMsg(`Pindah ${r.pindah} dari ${r.total} foto lama ke cloud.`);
                } catch (e) {
                  setMsg(`Gagal pindah: ${(e as Error).message}`);
                }
                setMigrating(false);
              }}
              disabled={migrating}
              className="mt-2.5 w-full bg-[#1d3b2e] px-3 py-2.5 text-sm font-semibold text-[#faf7f0] transition hover:bg-[#142a21] disabled:opacity-50 dark:bg-[#dcead7] dark:text-[#12241c]"
            >
              {migrating ? "Memindahkan…" : `Pindahkan ${localCount} foto ke cloud`}
            </button>
          </>
        ) : (
          <p className="text-xs leading-relaxed text-[#8a8474]">
            Tidak ada data lama di browser ini. Semua sudah di cloud.
          </p>
        )}
      </div>

      <h2 className="kicker mt-7 text-[#6b655a]">Lokasi jadwal solat — HP ini</h2>
      <p className="tabular mt-1.5 text-xs text-[#6b655a] dark:text-[#9a937f]">
        {settings.label} — {settings.lat.toFixed(2)}, {settings.lng.toFixed(2)}
      </p>
      <button
        onClick={useGPS}
        disabled={locating}
        className="mt-2 w-full border border-[#1d3b2e] px-3 py-2.5 text-sm font-semibold text-[#1d3b2e] transition hover:bg-[#1d3b2e] hover:text-[#faf7f0] disabled:opacity-50 dark:border-[#8fb69f] dark:text-[#b9d3c0] dark:hover:bg-[#8fb69f] dark:hover:text-[#12241c]"
      >
        {locating ? "Mencari lokasi…" : "Gunakan lokasi saya (GPS)"}
      </button>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {KOTA.map((c) => (
          <button
            key={c.n}
            onClick={() => {
              patch({ lat: c.lat, lng: c.lng, label: c.n });
              setMsg(`Lokasi: ${c.n}`);
            }}
            className={`border px-2 py-2 text-xs transition ${
              settings.label === c.n
                ? "border-[#1c1a15] font-semibold dark:border-[#ece7db]"
                : "border-[#e3d9c4] text-[#4a463d] hover:border-[#1c1a15] dark:border-[#263027] dark:text-[#b9bfae]"
            }`}
          >
            {c.n}
          </button>
        ))}
      </div>
      <form
        className="mt-2 flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const la = parseFloat(lat);
          const ln = parseFloat(lng);
          if (Number.isNaN(la) || Number.isNaN(ln)) {
            setMsg("Latitude/longitude tidak valid.");
            return;
          }
          patch({ lat: la, lng: ln, label: label.trim() || "Manual" });
          setMsg("Lokasi manual disimpan.");
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <input
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            inputMode="decimal"
            placeholder="Lat, misal -6.2"
            className={inputCls}
          />
          <input
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            inputMode="decimal"
            placeholder="Lng, misal 106.8"
            className={inputCls}
          />
        </div>
        <div className="flex gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nama lokasi (opsional)"
            className={`min-w-0 flex-1 ${inputCls}`}
          />
          <button className="bg-[#1c1a15] px-4 py-2 text-sm text-[#faf7f0] dark:bg-[#ece7db] dark:text-[#12241c]">
            Simpan
          </button>
        </div>
      </form>
      {msg && <p className="mt-2 border-l-2 border-[#1d3b2e] pl-2 text-xs dark:border-[#8fb69f]">{msg}</p>}
    </main>
  );
}
