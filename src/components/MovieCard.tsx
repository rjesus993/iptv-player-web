import React from "react";
import { Vod } from "../features/vod/service";

interface MovieCardProps {
  vod: Vod;
  onClick: () => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ vod, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-gray-800 rounded overflow-hidden shadow hover:scale-105 transition-transform duration-200"
    >
      {vod.stream_icon ? (
        <img
          src={vod.stream_icon}
          alt={vod.name}
          loading="lazy" // 🔑 lazy loading nativo do navegador
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gray-700 flex items-center justify-center text-gray-400">
          Sem imagem
        </div>
      )}
      <div className="p-2">
        <h4 className="text-sm font-semibold text-white truncate">{vod.name}</h4>
      </div>
    </div>
  );
};

export default MovieCard;