import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Catatan Solat — Absen Foto Keluarga",
  description: "Catatan solat 5 waktu dengan foto kamera langsung + timestamp. Data tersimpan di perangkat.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full text-[#1c1a15] antialiased dark:bg-[#101511] dark:text-[#ece7db]">
        <div className="mx-auto min-h-screen w-full max-w-md bg-[#faf7f0] pb-28 shadow-[0_0_0_1px_#e3d9c4,0_20px_60px_-30px_rgba(28,26,21,0.4)] dark:bg-[#101511] dark:shadow-none">
          {/* penanda atas: tipis, seperti kepala buku catatan */}
          <div className="flex items-center justify-between border-b border-[#e3d9c4] px-5 pt-4 pb-3 dark:border-[#263027]">
            <p className="kicker text-[#6b655a] dark:text-[#9a937f]">Buku Absen · Keluarga</p>
            <span className="flex items-center gap-1.5" aria-hidden>
              <i className="block h-1.5 w-1.5 rounded-full bg-[#1d3b2e] dark:bg-[#8fb69f]" />
              <i className="block h-px w-10 bg-[#e3d9c4] dark:bg-[#263027]" />
              <i className="block h-1.5 w-1.5 rotate-45 border border-[#1d3b2e] dark:border-[#8fb69f]" />
            </span>
          </div>
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
