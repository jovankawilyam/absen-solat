"use client";

import type { SholatName } from "@/lib/types";
import { saveCloudPhoto } from "./attendance";

export function nid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

export interface PendingUpload {
  id: string;
  profileId: string;
  dateKey: string;
  sholat: SholatName;
  takenAt: string;
  lateMin: number | null;
  w: number;
  h: number;
  size: number;
  photo: Blob;
}

const DB = "absen-solat-outbox-v1";
const STORE = "pending";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Simpan sementara saat jaringan gagal (foto tetap di HP). */
export async function stashPending(p: PendingUpload): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE, "readwrite");
    t.objectStore(STORE).put(p);
    t.oncomplete = () => {
      db.close();
      resolve();
    };
    t.onerror = () => {
      db.close();
      reject(t.error);
    };
  });
}

export async function pendingCount(): Promise<number> {
  try {
    const db = await openDB();
    const n = await new Promise<number>((resolve, reject) => {
      const t = db.transaction(STORE, "readonly");
      const req = t.objectStore(STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return n;
  } catch {
    return 0;
  }
}

/** Kirim semua antrean (dipanggil saat aplikasi dibuka & online). */
export async function flushOutbox(): Promise<{ terkirim: number; sisa: number }> {
  let terkirim = 0;
  try {
    const db = await openDB();
    const items = await new Promise<PendingUpload[]>((resolve, reject) => {
      const t = db.transaction(STORE, "readonly");
      const req = t.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result as PendingUpload[]);
      req.onerror = () => reject(req.error);
    });
    db.close();
    for (const p of items) {
      try {
        await saveCloudPhoto({
          profileId: p.profileId,
          dateKey: p.dateKey,
          sholat: p.sholat,
          takenAt: new Date(p.takenAt),
          lateMin: p.lateMin,
          w: p.w,
          h: p.h,
          size: p.size,
          blob: p.photo,
        });
        const db2 = await openDB();
        await new Promise<void>((resolve) => {
          const t = db2.transaction(STORE, "readwrite");
          t.objectStore(STORE).delete(p.id);
          t.oncomplete = () => {
            db2.close();
            resolve();
          };
          t.onerror = () => {
            db2.close();
            resolve();
          };
        });
        terkirim++;
      } catch {
        // berhenti di antrean pertama yang gagal (kemungkinan masih offline)
        break;
      }
    }
  } catch {
    // abaikan
  }
  return { terkirim, sisa: await pendingCount() };
}
