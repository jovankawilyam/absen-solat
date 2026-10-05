import type { SupabaseClient } from "@supabase/supabase-js";

export interface CloudProfile {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  color: string;
}

const FALLBACK_COLORS = ["#1d3b2e", "#5b4a35", "#b4532a", "#3f5a5a"];

/** Ambil profil milik user; buat otomatis dari nama Google saat login pertama. */
export async function ensureProfile(supabase: SupabaseClient): Promise<CloudProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, user_id, name, avatar_url, color")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return existing as CloudProfile;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName = typeof meta.full_name === "string" ? meta.full_name.trim() : "";
  const fallback = (user.email ?? "Saya").split("@")[0].slice(0, 24);
  const name = (fullName || fallback).slice(0, 24);
  const avatarUrl = typeof meta.avatar_url === "string" ? meta.avatar_url : null;
  const color = FALLBACK_COLORS[user.id.charCodeAt(0) % FALLBACK_COLORS.length];

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({ user_id: user.id, name, avatar_url: avatarUrl, color })
    .select("id, user_id, name, avatar_url, color")
    .single();
  if (error) return null;
  return created as CloudProfile;
}
