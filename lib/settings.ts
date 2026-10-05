"use client";

import { useCallback, useEffect, useState } from "react";
import type { Settings } from "./types";

const KEY = "absen-solat-settings-v1";

export const DEFAULT_SETTINGS: Settings = {
  lat: -6.2,
  lng: 106.8,
  label: "Jakarta (default)",
  method: 20, // Kemenag Indonesia (Aladhan)
};

/** Pengaturan lokasi jadwal — per perangkat (tidak ikut akun). */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) });
    } catch {
      // abaikan
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(KEY, JSON.stringify(settings));
      } catch {
        // abaikan
      }
    }
  }, [settings, ready]);

  const patch = useCallback((p: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...p }));
  }, []);

  return { settings, patch, ready };
}
