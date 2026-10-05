"use client";

import type { SholatName } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export interface CloudPhoto {
  id: string;
  sholat: SholatName;
  takenAt: string;
  lateMin: number | null;
  w: number | null;
  h: number | null;
  size: number | null;
  path: string;
  url: string;
}

interface Row {
  id: string;
  sholat: string;
  taken_at: string;
  late_min: number | null;
  w: number | null;
  h: number | null;
  size: number | null;
  photo_path: string;
}

async function withUrls(rows: Row[]): Promise<CloudPhoto[]> {
  if (rows.length === 0) return [];
  const supabase = createClient();
  const { data } = await supabase.storage
    .from("absen-foto")
    .createSignedUrls(
      rows.map((r) => r.photo_path),
      3600
    );
  const urlByPath = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  return rows.flatMap((r) => {
    const url = urlByPath.get(r.photo_path);
    if (!url) return [];
    return [
      {
        id: r.id,
        sholat: r.sholat as SholatName,
        takenAt: r.taken_at,
        lateMin: r.late_min,
        w: r.w,
        h: r.h,
        size: r.size,
        path: r.photo_path,
        url,
      },
    ];
  });
}

export async function getDayPhotos(profileId: string, dateKey: string): Promise<CloudPhoto[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("attendance")
    .select("id, sholat, taken_at, late_min, w, h, size, photo_path")
    .eq("profile_id", profileId)
    .eq("date_key", dateKey);
  if (error || !data) return [];
  return withUrls(data as Row[]);
}

export async function getRangeMeta(
  profileId: string,
  dateKeys: string[]
): Promise<{ dateKey: string; sholat: SholatName }[]> {
  if (dateKeys.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("attendance")
    .select("date_key, sholat")
    .eq("profile_id", profileId)
    .in("date_key", dateKeys);
  if (error || !data) return [];
  return (data as { date_key: string; sholat: string }[]).map((r) => ({
    dateKey: r.date_key,
    sholat: r.sholat as SholatName,
  }));
}

/** Upload foto lalu catat via API server (server menolak susulan hari lampau). */
export async function saveCloudPhoto(args: {
  profileId: string;
  dateKey: string;
  sholat: SholatName;
  takenAt: Date;
  lateMin: number | null;
  w: number;
  h: number;
  size: number;
  blob: Blob;
}): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum masuk. Muat ulang lalu masuk lagi.");

  const path = `${user.id}/${args.dateKey}/${args.sholat}.jpg`;
  const { error: upErr } = await supabase.storage
    .from("absen-foto")
    .upload(path, args.blob, { upsert: true, contentType: "image/jpeg" });
  if (upErr) throw new Error(`Upload foto gagal: ${upErr.message}`);

  const res = await fetch("/api/absen", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profile_id: args.profileId,
      date_key: args.dateKey,
      sholat: args.sholat,
      taken_at: args.takenAt.toISOString(),
      late_min: args.lateMin,
      photo_path: path,
      w: args.w,
      h: args.h,
      size: args.size,
    }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error((j as { error?: string } | null)?.error ?? `Gagal mencatat (${res.status})`);
  }
}

export async function deleteCloudPhoto(id: string): Promise<void> {
  const res = await fetch(`/api/absen?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error((j as { error?: string } | null)?.error ?? `Gagal menghapus (${res.status})`);
  }
}

export async function cloudStorageStats(profileId: string): Promise<{ count: number; bytes: number }> {
  const supabase = createClient();
  const { data } = await supabase.from("attendance").select("size").eq("profile_id", profileId);
  const rows = (data ?? []) as { size: number | null }[];
  return { count: rows.length, bytes: rows.reduce((a, r) => a + (r.size || 0), 0) };
}

/** Hapus seluruh foto + catatan milik profil ini. */
export async function deleteAllMine(profileId: string): Promise<void> {
  const supabase = createClient();
  const { data } = await supabase.from("attendance").select("photo_path").eq("profile_id", profileId);
  const paths = ((data ?? []) as { photo_path: string }[]).map((r) => r.photo_path);
  if (paths.length > 0) await supabase.storage.from("absen-foto").remove(paths);
  await supabase.from("attendance").delete().eq("profile_id", profileId);
}
