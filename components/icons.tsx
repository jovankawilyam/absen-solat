"use client";

type P = { className?: string };

export function IcoHariIni({ className = "h-5 w-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3L19 19M19 5l-1.7 1.7M6.7 17.3L5 19" strokeLinecap="round" />
    </svg>
  );
}

export function IcoRiwayat({ className = "h-5 w-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden>
      <rect x="3.5" y="4.5" width="17" height="16" rx="1.5" />
      <path d="M3.5 9.5h17M8 3v3M16 3v3" strokeLinecap="round" />
      <path d="M7.5 13.5h3M7.5 16.5h6" strokeLinecap="round" />
    </svg>
  );
}

export function IcoStatistik({ className = "h-5 w-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden>
      <path d="M4 20h16" strokeLinecap="round" />
      <path d="M7 20v-6M12 20V8M17 20v-9" strokeLinecap="round" />
    </svg>
  );
}

export function IcoKeluarga({ className = "h-5 w-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden>
      <circle cx="9" cy="8.5" r="3" />
      <circle cx="16.5" cy="10" r="2.3" />
      <path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M14.5 14.7c2.3.3 4 1.8 4.5 4.3" strokeLinecap="round" />
    </svg>
  );
}

export function IcoKamera({ className = "h-4 w-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden>
      <path d="M4 8.5h3l1.6-2.3h6.8L17 8.5h3v10H4z" strokeLinejoin="round" />
      <circle cx="12" cy="13.2" r="3.2" />
    </svg>
  );
}

export function IcoJam({ className = "h-3.5 w-3.5" }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" />
    </svg>
  );
}

export function IcoCek({ className = "h-4 w-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path d="M4.5 12.5l5 5 10-11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IcoPin({ className = "h-3.5 w-3.5" }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden>
      <path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </svg>
  );
}
