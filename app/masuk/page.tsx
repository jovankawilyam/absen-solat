"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function TombolMasuk() {
  const [loading, setLoading] = useState(false);
  const gagal = useSearchParams().get("gagal");

  const masukGoogle = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <>
      {gagal && (
        <p className="mt-4 border-l-2 border-[#9b2c1f] pl-2 text-xs text-[#9b2c1f]">
          Masuk gagal. Coba lagi.
        </p>
      )}

      <button
        onClick={masukGoogle}
        disabled={loading}
        className="mt-6 flex w-full items-center justify-center gap-2.5 border border-[#1c1a15] px-4 py-3 text-sm font-semibold transition hover:bg-[#1c1a15] hover:text-[#faf7f0] disabled:opacity-50 dark:border-[#ece7db] dark:hover:bg-[#ece7db] dark:hover:text-[#12241c]"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path
            fill="currentColor"
            d="M21.35 11.1H12v2.9h5.35c-.5 2.4-2.55 3.5-5.35 3.5a5.9 5.9 0 0 1 0-11.8c1.5 0 2.85.55 3.9 1.45l2.1-2.1A8.9 8.9 0 0 0 12 2.5a9.5 9.5 0 0 0 0 19c4.9 0 8.8-3.45 8.8-8.9 0-.5-.05-1-.45-1.5z"
          />
        </svg>
        {loading ? "Membuka Google…" : "Masuk dengan Google"}
      </button>
      <p className="mt-3 text-center text-[11px] text-[#a39c8b]">
        Satu orang satu akun — datamu terpisah dan privat.
      </p>
    </>
  );
}

export default function Masuk() {
  return (
    <main className="px-5 py-10">
      <p className="kicker text-[#b4532a]">Masuk</p>
      <h1 className="font-catatan mt-2 text-[30px] leading-[1.1]">
        Absen solat,
        <br />
        <em className="font-normal">ikut akunmu.</em>
      </h1>
      <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-[#6b655a]">
        Masuk dengan Google. Namamu terisi otomatis dari akun, dan catatan + foto tersimpan di cloud —
        bisa dibuka dari browser atau HP mana pun.
      </p>
      <Suspense>
        <TombolMasuk />
      </Suspense>
    </main>
  );
}
