"use client";

import { useCallback, useEffect, useState } from "react";
import type { SholatName } from "@/lib/types";
import { getDayPhotos, type CloudPhoto } from "./attendance";

export type CloudDayMap = Partial<Record<SholatName, CloudPhoto>>;

export function useCloudDayPhotos(profileId: string | null, dateKey: string) {
  const [map, setMap] = useState<CloudDayMap>({});
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }
    let cancel = false;
    setLoading(true);
    getDayPhotos(profileId, dateKey)
      .then((rows) => {
        if (cancel) return;
        const m: CloudDayMap = {};
        rows.forEach((r) => {
          m[r.sholat] = r;
        });
        setMap(m);
        setLoading(false);
      })
      .catch(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [profileId, dateKey, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  return { map, loading, refresh, filled: Object.keys(map).length };
}
