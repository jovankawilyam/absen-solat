export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDaysKey(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return toDateKey(dt);
}

export function parseKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatTanggalID(dateKey: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseKey(dateKey));
}

export function formatPendekID(dateKey: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(parseKey(dateKey));
}

export function formatHijriah(dateKey: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(parseKey(dateKey));
  } catch {
    return "";
  }
}

export function lastNDaysKeys(n: number, endKey: string): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDaysKey(endKey, -i));
  return out;
}

export function monthMatrix(year: number, monthIdx0: number): string[] {
  // Senin sebagai awal minggu
  const first = new Date(year, monthIdx0, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, monthIdx0, 1 - startOffset);
  const out: string[] = [];
  for (let i = 0; i < 42; i++) {
    const dt = new Date(start);
    dt.setDate(start.getDate() + i);
    out.push(toDateKey(dt));
  }
  return out;
}
