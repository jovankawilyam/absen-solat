"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { CloudProfile } from "@/lib/supabase/ensure-profile";

export function useCloudProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CloudProfile | null>(null);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUser(null);
      setProfile(null);
      setReady(true);
      return;
    }
    setUser(user);
    const { data: existing } = await supabase
      .from("profiles")
      .select("id, user_id, name, avatar_url, color")
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) {
      setProfile(existing as CloudProfile);
    } else {
      // Pengaman bila callback terlewat: buat di sini juga
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const fullName = typeof meta.full_name === "string" ? meta.full_name.trim() : "";
      const fallback = (user.email ?? "Saya").split("@")[0].slice(0, 24);
      const { data: created } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          name: (fullName || fallback).slice(0, 24),
          avatar_url: typeof meta.avatar_url === "string" ? meta.avatar_url : null,
        })
        .select("id, user_id, name, avatar_url, color")
        .single();
      if (created) setProfile(created as CloudProfile);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rename = useCallback(
    async (name: string) => {
      const clean = name.trim().slice(0, 24);
      if (!clean || !profile) return;
      const supabase = createClient();
      await supabase.from("profiles").update({ name: clean }).eq("id", profile.id);
      setProfile({ ...profile, name: clean });
    },
    [profile]
  );

  const keluar = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/masuk";
  }, []);

  return { user, profile, ready, refresh: load, rename, keluar };
}
