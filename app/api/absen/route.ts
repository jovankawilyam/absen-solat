import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function todayJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Catat absen. Server menolak susulan: hanya hari ini (WIB) yang boleh ditulis. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
  const profile_id = body.profile_id;
  const date_key = body.date_key;
  const sholat = body.sholat;
  if (typeof profile_id !== "string" || typeof date_key !== "string" || typeof sholat !== "string") {
    return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
  }
  if (date_key !== todayJakarta()) {
    return NextResponse.json(
      { error: "Hari sudah lewat — tak bisa susulan." },
      { status: 403 }
    );
  }
  const { data: prof } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profile_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!prof) return NextResponse.json({ error: "Profil tidak dikenal." }, { status: 403 });

  const { error } = await supabase.from("attendance").upsert(
    {
      user_id: user.id,
      profile_id,
      date_key,
      sholat,
      taken_at: body.taken_at,
      late_min: body.late_min ?? null,
      photo_path: body.photo_path,
      w: body.w ?? null,
      h: body.h ?? null,
      size: body.size ?? null,
    },
    { onConflict: "profile_id,date_key,sholat" }
  );
  if (error) return NextResponse.json({ error: `Gagal mencatat: ${error.message}` }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** Hapus absen milik sendiri (baris + file foto). */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID tidak ada." }, { status: 400 });

  const { data: row } = await supabase
    .from("attendance")
    .select("id, photo_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });

  await supabase.storage.from("absen-foto").remove([(row as { photo_path: string }).photo_path]);
  await supabase.from("attendance").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
