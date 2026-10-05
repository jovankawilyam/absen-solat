"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Anggota {
  id: string;
  name: string;
  avatar_url: string | null;
  color: string;
}

/** Daftar anggota lain (nama + avatar saja, tanpa data solat). */
export function useAnggota(myUserId: string | null, ready: boolean) {
  const [anggota, setAnggota] = useState<Anggota[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !myUserId) {
      setLoading(false);
      return;
    }
    let cancel = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("profiles")
          .select("id, name, avatar_url, color, user_id")
          .neq("user_id", myUserId)
          .order("name");
        if (cancel) return;
        setAnggota(((data ?? []) as (Anggota & { user_id: string })[]).map(({ user_id: _u, ...a }) => a));
      } catch {
        // abaikan — daftar kosong
      }
      if (!cancel) setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [myUserId, ready]);

  return { anggota, loading };
}
