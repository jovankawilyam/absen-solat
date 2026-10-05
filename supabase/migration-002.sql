-- Absen Solat — migrasi 002
-- Cara pakai: dashboard Supabase → SQL Editor → New query → tempel seluruh file → Run.
-- Tujuan: anggota yang login boleh saling membaca NAMA + AVATAR profil lain.
-- Data solat/foto/statistik tetap terkunci per akun (tidak diubah).

drop policy if exists "members_read_names" on public.profiles;
create policy "members_read_names" on public.profiles
  for select using (auth.role() = 'authenticated');

-- Policy lama "own_profile_all" tetap: tulis/hapus profil hanya milik sendiri.
