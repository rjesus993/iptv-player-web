import React from "react";
import { Vod } from "../features/vod/service";

type Props = {
  vod: Vod;
  onClick?: () => void;
  searchKey?: string;
  categoryKey?: string;
  fallbackPoster?: string;
};

export default function MovieCard({
  vod,
  onClick,
  searchKey = "",
  categoryKey = "",
  fallbackPoster = "/fallback-poster.png",
}: Props) {
  const posterSrc = vod.stream_icon || fallbackPoster;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left"
      aria-label={`Abrir detalhes de ${vod.name}`}
    >
      <div className="relative">
        <img
  key={`${vod.stream_id}-${searchKey}-${categoryKey}`}
  src={posterSrc}
  alt={vod.name}
  onError={(e) => {
    const target = e.currentTarget as HTMLImageElement;
    if (!target.src.endsWith(fallbackPoster)) {
      target.src = fallbackPoster;
    }
  }}
  className="w-full h-auto object-cover rounded transition-transform group-hover:scale-[1.02]"
  loading="lazy"
  referrerPolicy="no-referrer"
  decoding="async"
        />
        <div className="pointer-events-none absolute inset-0 rounded bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="mt-2">
        <p className="text-sm font-semibold text-white line-clamp-2">{vod.name}</p>
      </div>
    </button>
  );
}