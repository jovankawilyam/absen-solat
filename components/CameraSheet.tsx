"use client";

import { useEffect, useRef, useState } from "react";
import type { SholatName } from "@/lib/types";
import { captureStamped, stopStream } from "@/lib/photos";
import { nid, savePhotoRecord } from "@/lib/attendance";
import { prayerDate } from "@/lib/prayer";

export default function CameraSheet({
  profileId,
  profileName,
  dateKey,
  sholat,
  sholatLabel,
  jadwalHHMM,
  onClose,
  onSaved,
}: {
  profileId: string;
  profileName: string;
  dateKey: string;
  sholat: SholatName;
  sholatLabel: string;
  jadwalHHMM: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const pendingRef = useRef<{ blob: Blob; w: number; h: number; size: number; takenAt: Date } | null>(null);
  const [supported] = useState(
    () =>
      typeof navigator !== "undefined" &&
      "mediaDevices" in navigator &&
      !!navigator.mediaDevices?.getUserMedia
  );

  const flipFacing = () => {
    pendingRef.current = null;
    setPreview(null);
    setError("");
    setLoading(true);
    setFacing((f) => (f === "user" ? "environment" : "user"));
  };

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    let s: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing }, audio: false })
      .then((st) => {
        if (cancelled) {
          stopStream(st);
          return;
        }
        s = st;
        setStream(st);
        const v = videoRef.current;
        if (v) {
          v.srcObject = st;
          v.play().catch(() => {});
        }
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        const name = (e as Error)?.name ?? "";
        setError(
          name === "NotAllowedError"
            ? "Izin kamera ditolak. Absen ini wajib pakai kamera — izinkan akses kamera di browser lalu coba lagi."
            : "Kamera gagal dibuka. Pastikan lewat HTTPS/HP dan tidak dipakai aplikasi lain."
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
      stopStream(s);
    };
  }, [facing, supported]);

  const jepret = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      const r = await captureStamped(v, { profileName, sholatLabel });
      pendingRef.current = { blob: r.blob, w: r.w, h: r.h, size: r.size, takenAt: r.takenAt };
      setPreview(r.dataUrl);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const simpan = async () => {
    const p = pendingRef.current;
    if (!p || saving) return;
    setSaving(true);
    try {
      let lateMin: number | null = null;
      try {
        const jadwal = prayerDate(dateKey, jadwalHHMM).getTime();
        lateMin = Math.max(0, Math.round((p.takenAt.getTime() - jadwal) / 60000));
      } catch {
        lateMin = null;
      }
      await savePhotoRecord({
        id: nid(),
        profileId,
        dateKey,
        sholat,
        takenAt: p.takenAt.toISOString(),
        lateMin,
        w: p.w,
        h: p.h,
        size: p.size,
        photo: p.blob,
      });
      stopStream(stream);
      onSaved();
    } catch (e) {
      setError(`Gagal menyimpan: ${(e as Error).message}`);
      setSaving(false);
    }
  };

  const blocked = !supported || !!error;
  const hint = !supported
    ? "Kamera tidak tersedia di browser ini. Buka lewat HP (Chrome/Safari) dengan HTTPS."
    : error;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0d0f0d] text-[#ece7db]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <p className="text-sm">
          <span className="font-semibold">{profileName}</span>
          <span className="mx-2 text-white/30">/</span>
          <span>{sholatLabel}</span>
          <span className="tabular ml-2 text-white/50">{jadwalHHMM}</span>
        </p>
        <button
          onClick={() => {
            stopStream(stream);
            onClose();
          }}
          className="border border-white/20 px-3 py-1.5 text-[13px] transition hover:bg-white/10"
        >
          Tutup
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden bg-black">
        {!preview ? (
          <video ref={videoRef} playsInline muted autoPlay className="h-full w-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview absen" className="h-full w-full object-contain" />
        )}
        {loading && !blocked && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-zinc-300">
            Membuka kamera…
          </p>
        )}
      </div>

      {hint && <p className="border-t border-white/10 bg-[#3a1d12] px-4 py-2 text-xs">{hint}</p>}
      {!hint && !preview && (
        <p className="border-t border-white/10 px-4 py-2 text-center text-[11px] tracking-wide text-white/50">
          Nama, tanggal, dan jam ditempel otomatis saat menjepret.
        </p>
      )}

      <div className="flex items-center justify-center gap-3 border-t border-white/10 p-4">
        {!preview ? (
          <>
            <button
              onClick={flipFacing}
              className="border border-white/20 px-4 py-3 text-[13px] transition hover:bg-white/10"
            >
              Balik kamera
            </button>
            <button
              onClick={jepret}
              disabled={loading || blocked}
              className="h-16 w-16 rounded-full border-2 border-[#ece7db] bg-[#ece7db] text-[#0d0f0d] transition hover:bg-white disabled:opacity-30"
              aria-label="Jepret foto absen"
            >
              <span className="mx-auto block h-12 w-12 rounded-full border border-[#0d0f0d]/30" />
            </button>
            <span className="w-[76px] text-center text-[11px] leading-tight text-white/40">kamera langsung, tanpa galeri</span>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setPreview(null);
                pendingRef.current = null;
              }}
              className="border border-white/20 px-5 py-3 text-sm transition hover:bg-white/10"
            >
              Ulangi
            </button>
            <button
              onClick={simpan}
              disabled={saving}
              className="bg-[#ece7db] px-8 py-3 text-sm font-bold text-[#0d0f0d] transition hover:bg-white disabled:opacity-50"
            >
              {saving ? "Menyimpan…" : "Simpan absen"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
