-- Absen Solat — migrasi 001
-- Cara pakai: buka dashboard Supabase → SQL Editor → New query → tempel seluruh file → Run.
-- Model: 1 akun Google = 1 profil otomatis (nama + avatar dari Google).

-- 1. Tabel profil (satu baris per user, dibuat otomatis saat login pertama)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null,
  avatar_url text,
  color text not null default '#1d3b2e',
  created_at timestamptz not null default now()
);

-- 2. Tabel absen (metadata; file foto di Storage)
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  date_key date not null,
  sholat text not null check (sholat in ('subuh', 'dzuhur', 'ashar', 'maghrib', 'isya')),
  taken_at timestamptz not null,
  late_min int,
  photo_path text not null,
  w int,
  h int,
  size int,
  created_at timestamptz not null default now(),
  unique (profile_id, date_key, sholat)
);
create index if not exists attendance_user_date_idx on public.attendance (user_id, date_key);

-- 3. Row Level Security — user hanya bisa menyentuh datanya sendiri
alter table public.profiles enable row level security;
alter table public.attendance enable row level security;

drop policy if exists "own_profile_all" on public.profiles;
create policy "own_profile_all" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_attendance_all" on public.attendance;
create policy "own_attendance_all" on public.attendance
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4. Bucket foto privat (path: {user_id}/{date_key}/{sholat}.jpg)
insert into storage.buckets (id, name, public)
values ('absen-foto', 'absen-foto', false)
on conflict (id) do nothing;

drop policy if exists "own_photo_all" on storage.objects;
create policy "own_photo_all" on storage.objects
  for all using (
    bucket_id = 'absen-foto'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'absen-foto'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
