// Helper kamera + tempel timestamp ke foto (canvas, tanpa dependency).

export const MAX_DIM = 1280;
export const JPEG_Q = 0.7;

export function formatStampID(d: Date): { baris1: string; baris2: string } {
  const tgl = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
  const jam = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
  return { baris1: tgl, baris2: `${jam} WIB` };
}

export async function captureStamped(
  video: HTMLVideoElement,
  opts: { profileName: string; sholatLabel: string; mirror?: boolean }
): Promise<{ blob: Blob; dataUrl: string; w: number; h: number; size: number; takenAt: Date }> {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) throw new Error("Kamera belum siap. Tunggu sebentar lalu coba lagi.");
  const scale = Math.min(1, MAX_DIM / Math.max(vw, vh));
  const w = Math.round(vw * scale);
  const h = Math.round(vh * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung browser ini.");

  if (opts.mirror) {
    // Kamera depan: kembalikan hasil agar tidak terbalik seperti kaca.
    // Preview sudah di-mirror via CSS, jadi balik frame di sini sebelum tempel teks.
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(video, 0, 0, w, h);
  }

  const takenAt = new Date();
  const { baris1, baris2 } = formatStampID(takenAt);
  const line1 = `${opts.profileName} • ${opts.sholatLabel}`;
  const line2 = baris1;
  const line3 = baris2;

  const barH = Math.round(h * 0.17);
  ctx.fillStyle = "rgba(0,0,0,0.62)";
  ctx.fillRect(0, h - barH, w, barH);
  ctx.fillStyle = "#22c55e";
  ctx.fillRect(0, h - barH, Math.max(4, w * 0.012), barH);

  const pad = Math.round(w * 0.035);
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "alphabetic";
  let fs = Math.max(15, Math.round(w * 0.038));
  ctx.font = `700 ${fs}px system-ui, sans-serif`;
  // kecilkan font bila teks kepanjangan
  while (ctx.measureText(line1).width > w - pad * 2 && fs > 12) {
    fs -= 1;
    ctx.font = `700 ${fs}px system-ui, sans-serif`;
  }
  const y3 = h - pad * 0.55;
  const y2 = y3 - fs * 1.25;
  const y1 = y2 - fs * 1.25;
  ctx.fillText(line1, pad, y1);
  ctx.font = `${Math.max(12, fs - 3)}px system-ui, sans-serif`;
  ctx.fillStyle = "#e5e7eb";
  ctx.fillText(line2, pad, y2);
  ctx.font = `700 ${Math.max(13, fs - 1)}px system-ui, monospace`;
  ctx.fillStyle = "#fbbf24";
  ctx.fillText(line3, pad, y3);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_Q)
  );
  if (!blob) throw new Error("Gagal memproses foto.");
  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_Q);
  return { blob, dataUrl, w, h, size: blob.size, takenAt };
}

export function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop());
}
