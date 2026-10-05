export type SholatName = "subuh" | "dzuhur" | "ashar" | "maghrib" | "isya";

export type Status = "tepat" | "terlambat" | "qadha" | "udzur";

export interface Profile {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Settings {
  lat: number;
  lng: number;
  label: string;
  method: number;
}

export type Checks = Record<string, Record<string, Partial<Record<SholatName, Status>>>>;

export interface StoreShape {
  profiles: Profile[];
  activeProfileId: string | null;
  checks: Checks;
  settings: Settings;
}

export const SHOLAT_LIST: { key: SholatName; label: string }[] = [
  { key: "subuh", label: "Subuh" },
  { key: "dzuhur", label: "Dzuhur" },
  { key: "ashar", label: "Ashar" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isya", label: "Isya" },
];

export const STATUS_META: Record<Status, { label: string; hint: string }> = {
  tepat: { label: "Tepat waktu", hint: "Alhamdulillah" },
  terlambat: { label: "Terlambat", hint: "Tetap dicatat" },
  qadha: { label: "Qadha", hint: "Diganti di luar waktu" },
  udzur: { label: "Udzur", hint: "Haid / sakit / safar" },
};

export const PROFILE_COLORS = [
  "#1d3b2e",
  "#5b4a35",
  "#b4532a",
  "#3f5a5a",
  "#6b3f3f",
  "#4a4a3a",
  "#7a6a4a",
  "#2e2e2e",
];
