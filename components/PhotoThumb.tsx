"use client";

import { useEffect, useMemo, useState } from "react";
import { IcoKamera } from "./icons";

export default function PhotoThumb({
  blob,
  alt,
  onClick,
}: {
  blob: Blob;
  alt: string;
  onClick?: () => void;
}) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  const [imgOk, setImgOk] = useState(true);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  if (!imgOk)
    return (
      <span className="flex h-12 w-12 items-center justify-center border border-[#e3d9c4] text-[#a39c8b]">
        <IcoKamera className="h-5 w-5" />
      </span>
    );
  return (
    <button
      onClick={onClick}
      className="h-12 w-12 shrink-0 overflow-hidden border border-[#1c1a15]/20 transition hover:border-[#1c1a15] dark:border-[#3a443b]"
      aria-label={alt}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} className="h-full w-full object-cover" onError={() => setImgOk(false)} />
    </button>
  );
}
