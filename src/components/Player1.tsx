import { useEffect, useRef } from "react";
import Hls from "hls.js";
import { Maximize2, X } from "lucide-react";

interface PlayerProps {
  url: string;
  onClose: () => void;
  channelName?: string;
  channelLogo?: string;
}

export default function Player({ url, onClose, channelName, channelLogo }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(videoRef.current);
      } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari
        videoRef.current.src = url;
      }
    }
  }, [url]);

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex flex-col items-center justify-center z-50">
      {/* Topbar do player */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-gray-900 text-white">
        <div className="flex items-center gap-3">
          {channelLogo ? (
            <img
              src={channelLogo}
              alt={channelName}
              className="w-8 h-8 object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/fallback.png";
              }}
            />
          ) : (
            <img src="/fallback.png" alt="Canal" className="w-8 h-8 object-contain" />
          )}
          <span className="font-semibold">{channelName || "Canal ao vivo"}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleFullscreen}
            className="p-2 rounded hover:bg-gray-700"
            title="Tela cheia"
          >
            <Maximize2 size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded bg-red-600 hover:bg-red-700"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Vídeo */}
      <div className="w-full max-w-5xl flex-1 flex items-center justify-center">
        <video
          ref={videoRef}
          className="w-full h-[70vh] bg-black rounded shadow-lg"
          controls
          autoPlay
          playsInline
        />
      </div>
    </div>
  );
}