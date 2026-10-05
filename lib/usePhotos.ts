"use client";

import { useCallback, useEffect, useState } from "react";
import type { SholatName } from "./types";
import { getDayRecords, type PhotoRecord } from "./attendance";
import { todayKey } from "./dates";

export type DayPhotoMap = Partial<Record<SholatName, PhotoRecord>>;

export function useDayPhotos(profileId: string | null, dateKey: string) {
  const [map, setMap] = useState<DayPhotoMap>({});
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!profileId) return;
    let cancel = false;
    getDayRecords(profileId, dateKey)
      .then((rows) => {
        if (cancel) return;
        const m: DayPhotoMap = {};
        rows.forEach((r) => {
          m[r.sholat] = r;
        });
        setMap(m);
        setReady(true);
      })
      .catch(() => {
        if (!cancel) setReady(true);
      });
    return () => {
      cancel = true;
    };
  }, [profileId, dateKey, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  if (!profileId) return { map: {} as DayPhotoMap, ready: true, refresh, filled: 0 };
  return { map, ready, refresh, filled: Object.keys(map).length };
}

export function objectUrlOf(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export { todayKey };
