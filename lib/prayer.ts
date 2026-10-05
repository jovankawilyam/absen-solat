import type { SholatName } from "./types";

export interface PrayerTimes {
  subuh: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
}

const CACHE_KEY = "absen-solat-prayer-cache-v1";

function cacheKey(dateKey: string, lat: number, lng: number): string {
  return `${dateKey}|${lat.toFixed(3)}|${lng.toFixed(3)}`;
}

function readCache(k: string): PrayerTimes | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as Record<string, PrayerTimes>;
    return obj[k] ?? null;
  } catch {
    return null;
  }
}

function writeCache(k: string, v: PrayerTimes) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const obj = raw ? (JSON.parse(raw) as Record<string, PrayerTimes>) : {};
    obj[k] = v;
    // batasi 30 entri
    const keys = Object.keys(obj);
    if (keys.length > 30) delete obj[keys[0]];
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch {
    // abaikan
  }
}

function toHHMM(t: string): string {
  // Aladhan mengembalikan "05:04 (WIB)" -> ambil HH:MM
  const m = t.match(/(\d{1,2}):(\d{2})/);
  if (!m) return t;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

export async function fetchPrayerTimes(
  dateKey: string,
  lat: number,
  lng: number,
  method = 20
): Promise<PrayerTimes> {
  const k = cacheKey(dateKey, lat, lng);
  if (typeof window !== "undefined") {
    const hit = readCache(k);
    if (hit) return hit;
  }
  const [y, m, d] = dateKey.split("-");
  const url = `https://api.aladhan.com/v1/timings/${d}-${m}-${y}?latitude=${lat}&longitude=${lng}&method=${method}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Jadwal gagal dimuat (${res.status})`);
  const json = await res.json();
  const t = json?.data?.timings;
  if (!t) throw new Error("Format jadwal tidak dikenal");
  const out: PrayerTimes = {
    subuh: toHHMM(String(t.Fajr)),
    dzuhur: toHHMM(String(t.Dhuhr)),
    ashar: toHHMM(String(t.Asr)),
    maghrib: toHHMM(String(t.Maghrib)),
    isya: toHHMM(String(t.Isha)),
  };
  if (typeof window !== "undefined") writeCache(k, out);
  return out;
}

export function prayerDate(dateKey: string, hhmm: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [h, min] = hhmm.split(":").map(Number);
  return new Date(y, m - 1, d, h || 0, min || 0, 0);
}

const ORDER: SholatName[] = ["subuh", "dzuhur", "ashar", "maghrib", "isya"];

export function nextPrayer(now: Date, dateKey: string, times: PrayerTimes | null) {
  if (!times) return null;
  for (const name of ORDER) {
    const dt = prayerDate(dateKey, times[name]);
    if (dt.getTime() > now.getTime()) {
      return { name, at: dt, label: labelOf(name), time: times[name], diffMs: dt.getTime() - now.getTime() };
    }
  }
  return null;
}

export function labelOf(name: SholatName): string {
  return { subuh: "Subuh", dzuhur: "Dzuhur", ashar: "Ashar", maghrib: "Maghrib", isya: "Isya" }[name];
}

export function formatCountdown(ms: number): string {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const mnt = Math.floor((s % 3600) / 60);
  const det = s % 60;
  if (h > 0) return `${h} jam ${mnt} mnt`;
  if (mnt > 0) return `${mnt} mnt ${det} dtk`;
  return `${det} dtk`;
}
