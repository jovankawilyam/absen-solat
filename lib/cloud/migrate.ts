"use client";

import { createClient } from "@/lib/supabase/client";

const LOCAL_KEY = "absen-solat-v1";
const PHOTO_DB = "absen-solat-foto-v1";
const PHOTO_STORE = "records";

interface LocalProfile {
  id: string;
  name: string;
}

interface LocalRecord {
  id: string;
  profileId: string;
  dateKey: string;
  sholat: string;
  takenAt: string;
  lateMin: number | null;
  w: number;
  h: number;
  size: number;
  photo: Blob;
}

function readLocalProfiles(): LocalProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { profiles?: LocalProfile[] };
    return Array.isArray(parsed.profiles) ? parsed.profiles : [];
  } catch {
    return [];
  }
}

function readAllLocalPhotos(): Promise<LocalRecord[]> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(PHOTO_DB, 1);
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(PHOTO_STORE)) {
          db.close();
          resolve([]);
          return;
        }
        const t = db.transaction(PHOTO_STORE, "readonly");
        const get = t.objectStore(PHOTO_STORE).getAll();
        get.onsuccess = () => {
          db.close();
          resolve((get.result ?? []) as LocalRecord[]);
        };
        get.onerror = () => {
          db.close();
          resolve([]);
        };
      };
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

/**
 * Pindahkan foto-foto lama di HP ini ke cloud (profil Google sekarang).
 * Melewati API harian — migrasi boleh membawa tanggal lampau.
 */
export async function migrateLocalToCloud(
  cloudProfileId: string,
  onProgress?: (done: number, total: number) => void
): Promise<{ pindah: number; total: number }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum masuk.");

  const localIds = new Set(readLocalProfiles().map((p) => p.id));
  const all = await readAllLocalPhotos();
  const milik = all.filter((r) => localIds.has(r.profileId) && r.photo instanceof Blob);
  let pindah = 0;

  for (const r of milik) {
    const path = `${user.id}/${r.dateKey}/${r.sholat}.jpg`;
    const { error: upErr } = await supabase.storage
      .from("absen-foto")
      .upload(path, r.photo, { upsert: true, contentType: "image/jpeg" });
    if (upErr) {
      onProgress?.(pindah, milik.length);
      continue;
    }
    const { error: insErr } = await supabase.from("attendance").upsert(
      {
        user_id: user.id,
        profile_id: cloudProfileId,
        date_key: r.dateKey,
        sholat: r.sholat,
        taken_at: r.takenAt,
        late_min: r.lateMin,
        photo_path: path,
        w: r.w,
        h: r.h,
        size: r.size,
      },
      { onConflict: "profile_id,date_key,sholat" }
    );
    if (!insErr) pindah++;
    onProgress?.(pindah, milik.length);
  }

  // Bersihkan penyimpanan lokal setelah pindah
  try {
    localStorage.removeItem(LOCAL_KEY);
    const req = indexedDB.deleteDatabase(PHOTO_DB);
    await new Promise((resolve) => {
      req.onsuccess = () => resolve(null);
      req.onerror = () => resolve(null);
    });
  } catch {
    // abaikan
  }
  return { pindah, total: milik.length };
}

/** Ada data lokal yang bisa dipindah? */
export async function hasLocalData(): Promise<number> {
  const ids = new Set(readLocalProfiles().map((p) => p.id));
  if (ids.size === 0) return 0;
  const all = await readAllLocalPhotos();
  return all.filter((r) => ids.has(r.profileId)).length;
}
