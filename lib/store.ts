"use client";

import { useCallback, useEffect, useState } from "react";
import type { Checks, Profile, Settings, SholatName, Status, StoreShape } from "./types";
import { PROFILE_COLORS } from "./types";
import { todayKey } from "./dates";

const KEY = "absen-solat-v1";

export const DEFAULT_SETTINGS: Settings = {
  lat: -6.2,
  lng: 106.8,
  label: "Jakarta (default)",
  method: 20, // Kemenag Indonesia (Aladhan)
};

function defaultStore(): StoreShape {
  return { profiles: [], activeProfileId: null, checks: {}, settings: DEFAULT_SETTINGS };
}

function load(): StoreShape {
  if (typeof window === "undefined") return defaultStore();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw) as StoreShape;
    return {
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
      activeProfileId: parsed.activeProfileId ?? null,
      checks: parsed.checks ?? {},
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    };
  } catch {
    return defaultStore();
  }
}

function persist(s: StoreShape) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // abaikan (storage penuh / privat)
  }
}

function nid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

export function dayChecks(checks: Checks, profileId: string, dateKey: string) {
  return checks[profileId]?.[dateKey] ?? {};
}

export function countFilled(day: Partial<Record<SholatName, Status>>): number {
  return Object.keys(day).length;
}

export function isFullDay(day: Partial<Record<SholatName, Status>>): boolean {
  return countFilled(day) === 5;
}

export function useAbsen() {
  const [store, setStore] = useState<StoreShape>(() => defaultStore());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Hydration dari localStorage hanya boleh jalan di client setelah mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStore(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) persist(store);
  }, [store, ready]);

  const activeProfile: Profile | null =
    store.profiles.find((p) => p.id === store.activeProfileId) ?? store.profiles[0] ?? null;

  const addProfile = useCallback((name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setStore((s) => {
      const p: Profile = {
        id: nid(),
        name: clean.slice(0, 24),
        color: PROFILE_COLORS[s.profiles.length % PROFILE_COLORS.length],
        createdAt: new Date().toISOString(),
      };
      return {
        ...s,
        profiles: [...s.profiles, p],
        activeProfileId: s.activeProfileId ?? p.id,
      };
    });
  }, []);

  const renameProfile = useCallback((id: string, name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setStore((s) => ({
      ...s,
      profiles: s.profiles.map((p) => (p.id === id ? { ...p, name: clean.slice(0, 24) } : p)),
    }));
  }, []);

  const removeProfile = useCallback((id: string) => {
    setStore((s) => {
      const profiles = s.profiles.filter((p) => p.id !== id);
      const checks: Checks = { ...s.checks };
      delete checks[id];
      return {
        ...s,
        profiles,
        checks,
        activeProfileId:
          s.activeProfileId === id ? (profiles[0]?.id ?? null) : s.activeProfileId,
      };
    });
  }, []);

  const setActive = useCallback((id: string) => {
    setStore((s) => ({ ...s, activeProfileId: id }));
  }, []);

  const setCheck = useCallback(
    (profileId: string, dateKey: string, sholat: SholatName, status: Status) => {
      setStore((s) => ({
        ...s,
        checks: {
          ...s.checks,
          [profileId]: {
            ...(s.checks[profileId] ?? {}),
            [dateKey]: { ...(s.checks[profileId]?.[dateKey] ?? {}), [sholat]: status },
          },
        },
      }));
    },
    []
  );

  const toggleCheck = useCallback(
    (profileId: string, dateKey: string, sholat: SholatName) => {
      setStore((s) => {
        const cur = s.checks[profileId]?.[dateKey]?.[sholat];
        const next: Checks = {
          ...s.checks,
          [profileId]: { ...(s.checks[profileId] ?? {}), [dateKey]: { ...(s.checks[profileId]?.[dateKey] ?? {}) } },
        };
        if (cur) delete next[profileId][dateKey][sholat];
        else next[profileId][dateKey][sholat] = "tepat";
        return { ...s, checks: next };
      });
    },
    []
  );

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setStore((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const resetAll = useCallback(() => {
    setStore(defaultStore());
  }, []);

  return {
    ready,
    store,
    activeProfile,
    today: todayKey(),
    addProfile,
    renameProfile,
    removeProfile,
    setActive,
    setCheck,
    toggleCheck,
    setSettings,
    resetAll,
  };
}

export type AbsenApi = ReturnType<typeof useAbsen>;
