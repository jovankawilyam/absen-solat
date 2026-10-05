import type { SholatName } from "./types";

export interface PhotoRecord {
  id: string;
  profileId: string;
  dateKey: string; // YYYY-MM-DD
  sholat: SholatName;
  takenAt: string; // ISO
  lateMin: number | null;
  w: number;
  h: number;
  size: number;
  photo: Blob;
}

export interface PhotoMeta {
  id: string;
  profileId: string;
  dateKey: string;
  sholat: SholatName;
  takenAt: string;
  lateMin: number | null;
  w: number;
  h: number;
  size: number;
}

const DB = "absen-solat-foto-v1";
const STORE = "records";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: "id" });
        s.createIndex("by-profile-date", ["profileId", "dateKey"], { unique: false });
        s.createIndex("by-date", "dateKey", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const store = t.objectStore(STORE);
        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
        t.onerror = () => {
          db.close();
          reject(t.error);
        };
      })
  );
}

export function stripPhoto(r: PhotoRecord): PhotoMeta {
  const { photo: _p, ...meta } = r;
  void _p;
  return meta;
}

export async function savePhotoRecord(r: PhotoRecord): Promise<void> {
  // hapus record lama profil+tanggal+sholat yang sama (1 foto per waktu)
  const existing = await getDayRecords(r.profileId, r.dateKey);
  const dup = existing.find((e) => e.sholat === r.sholat);
  if (dup) await tx("readwrite", (s) => s.delete(dup.id));
  await tx("readwrite", (s) => s.put(r));
}

export async function getDayRecords(profileId: string, dateKey: string): Promise<PhotoRecord[]> {
  const all = await tx<PhotoRecord[]>("readonly", (s) => s.getAll());
  return all.filter((r) => r.profileId === profileId && r.dateKey === dateKey);
}

export async function getDayRecordsAll(dateKey: string): Promise<PhotoRecord[]> {
  const all = await tx<PhotoRecord[]>("readonly", (s) => s.getAll());
  return all.filter((r) => r.dateKey === dateKey);
}

export async function getRangeRecords(profileIds: string[], dateKeys: string[]): Promise<PhotoMeta[]> {
  const setP = new Set(profileIds);
  const setD = new Set(dateKeys);
  const all = await tx<PhotoRecord[]>("readonly", (s) => s.getAll());
  return all
    .filter((r) => setP.has(r.profileId) && setD.has(r.dateKey))
    .map(stripPhoto);
}

export async function deletePhotoRecord(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
}

export async function storageStats(profileIds: string[]): Promise<{ count: number; bytes: number }> {
  const all = await tx<PhotoRecord[]>("readonly", (s) => s.getAll());
  const mine = profileIds.length ? all.filter((r) => profileIds.includes(r.profileId)) : all;
  return { count: mine.length, bytes: mine.reduce((a, r) => a + (r.size || 0), 0) };
}

export async function clearAllPhotos(): Promise<void> {
  await tx("readwrite", (s) => s.clear());
}

export function nid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}
