"use client";

import { useEffect, useState } from "react";
import { useAbsen } from "@/lib/store";
import { clearAllPhotos, storageStats } from "@/lib/attendance";

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
  const api = useAbsen();
  const { store, ready } = api;
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [label, setLabel] = useState("");
  const [locating, setLocating] = useState(false);
  const [msg, setMsg] = useState("");
  const [photoCount, setPhotoCount] = useState(0);
  const [photoBytes, setPhotoBytes] = useState(0);

  const refreshStorage = () => {
    storageStats(store.profiles.map((p) => p.id))
      .then((s) => {
        setPhotoCount(s.count);
        setPhotoBytes(s.bytes);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (ready) refreshStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, store.profiles.length]);

  if (!ready) return <div className="p-6 text-sm text-[#6b655a]">Membuka buku…</div>;

  const useGPS = () => {
    if (!("geolocation" in navigator)) {
      setMsg("Browser tidak mendukung lokasi.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        api.setSettings({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Lokasi saya (GPS)",
        });
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
      <p className="kicker text-[#b4532a]">Pengaturan</p>
      <h1 className="font-catatan mt-1 text-[26px] leading-tight">Keluarga</h1>
      <p className="mt-1 text-xs text-[#6b655a] dark:text-[#9a937f]">Anggota · lokasi jadwal · penyimpanan foto</p>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          api.addProfile(name);
          setName("");
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tambah anggota, misal: Adik"
          className={`min-w-0 flex-1 ${inputCls}`}
        />
        <button className="bg-[#1c1a15] px-4 py-2.5 text-sm font-semibold text-[#faf7f0] dark:bg-[#ece7db] dark:text-[#12241c]">
          Tambah
        </button>
      </form>

      <div className="mt-3 border-t border-[#1c1a15]/80 dark:border-[#3a443b]">
        {store.profiles.map((p) => (
          <div key={p.id} className="ledger-row flex items-center gap-2.5 py-2.5">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: p.color }}
            >
              {p.name.charAt(0).toUpperCase()}
            </span>
            {editing === p.id ? (
              <form
                className="flex flex-1 gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  api.renameProfile(p.id, editName);
                  setEditing(null);
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
                <p className="flex-1 text-sm font-medium">
                  {p.name}
                  {store.activeProfileId === p.id && (
                    <span className="ml-2 text-[11px] font-normal text-[#8a8474]">· aktif</span>
                  )}
                </p>
                <button
                  onClick={() => api.setActive(p.id)}
                  className="px-2 py-1.5 text-xs underline decoration-dotted underline-offset-4 hover:text-black dark:hover:text-white"
                >
                  Pilih
                </button>
                <button
                  onClick={() => {
                    setEditing(p.id);
                    setEditName(p.name);
                  }}
                  className="border border-[#e3d9c4] px-2 py-1.5 text-xs dark:border-[#263027]"
                  aria-label={`Ubah nama ${p.name}`}
                >
                  Ubah
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Hapus ${p.name}? Foto absennya ikut terhapus dari daftar profil ini.`))
                      api.removeProfile(p.id);
                  }}
                  className="px-1.5 py-1.5 text-xs text-[#9b2c1f]"
                  aria-label={`Hapus ${p.name}`}
                >
                  Hapus
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <h2 className="kicker mt-7 text-[#6b655a]">Penyimpanan foto — perangkat ini</h2>
      <div className="mt-2 border border-[#e3d9c4] p-3.5 dark:border-[#263027]">
        <p className="tabular text-sm font-semibold">
          {photoCount} foto · {fmtMB(photoBytes)}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[#6b655a] dark:text-[#9a937f]">
          Foto disimpan di IndexedDB peramban, bukan galeri HP. Hapus yang lama bila memori penuh.
        </p>
        <button
          onClick={async () => {
            if (!confirm("Hapus SEMUA foto absen di perangkat ini?")) return;
            await clearAllPhotos();
            refreshStorage();
            setMsg("Semua foto dihapus.");
          }}
          className="mt-2.5 w-full border border-[#e3d9c4] px-3 py-2 text-xs font-medium transition hover:border-[#1c1a15] dark:border-[#263027]"
        >
          Hapus semua foto
        </button>
      </div>

      <h2 className="kicker mt-7 text-[#6b655a]">Lokasi jadwal solat</h2>
      <p className="tabular mt-1.5 text-xs text-[#6b655a] dark:text-[#9a937f]">
        {store.settings.label} — {store.settings.lat.toFixed(2)}, {store.settings.lng.toFixed(2)}
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
              api.setSettings({ lat: c.lat, lng: c.lng, label: c.n });
              setMsg(`Lokasi: ${c.n}`);
            }}
            className={`border px-2 py-2 text-xs transition ${
              store.settings.label === c.n
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
          api.setSettings({ lat: la, lng: ln, label: label.trim() || "Manual" });
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

      <h2 className="kicker mt-8 text-[#9b2c1f]">Zona berbahaya</h2>
      <button
        onClick={() => {
          if (confirm("Hapus SEMUA profil dan catatan di perangkat ini?")) api.resetAll();
        }}
        className="mt-2 w-full border border-[#9b2c1f]/40 px-3 py-2.5 text-sm text-[#9b2c1f] transition hover:bg-[#9b2c1f] hover:text-white"
      >
        Hapus semua data profil
      </button>
    </main>
  );
}
