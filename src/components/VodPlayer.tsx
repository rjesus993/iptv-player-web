import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface VodPlayerProps {
  url: string;
  title?: string;
  poster?: string;
  onClose?: () => void;
}

const VodPlayer: React.FC<VodPlayerProps> = ({ url, title, poster, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showControls, setShowControls] = useState(true);
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);
  const [closing, setClosing] = useState(false);

  // Inicializa HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    if (Hls.isSupported() && url.endsWith(".m3u8")) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("Erro no HLS:", data);
      });

      return () => hls.destroy();
    } else {
      video.src = url;
    }
  }, [url]);

  // Salvar e restaurar progresso
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const storageKey = `vod-progress-${url}`;
    const savedTime = localStorage.getItem(storageKey);
    if (savedTime) {
      video.currentTime = parseFloat(savedTime);
    }

    const handleTimeUpdate = () => {
      localStorage.setItem(storageKey, video.currentTime.toString());
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [url]);

  // Auto-hide controles
  useEffect(() => {
    const resetTimer = () => {
      setShowControls(true);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      hideTimeout.current = setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);

    resetTimer();

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  // Fechar com fadeOut
  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // tempo da animação
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 
        ${closing ? "animate-fadeOut" : "animate-fadeIn"}`}
    >
      {/* Header com título e botão fechar */}
      {showControls && (
        <div className="w-full flex justify-between items-center px-4 py-2 text-white">
          <h3 className="text-lg font-semibold">{title}</h3>
          {onClose && (
            <button
              onClick={handleClose}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
            >
              Fechar
            </button>
          )}
        </div>
      )}

      {/* Player */}
      <video
        ref={videoRef}
        controls={showControls}
        autoPlay
        poster={poster}
        style={{ width: "90%", maxHeight: "80vh", backgroundColor: "black" }}
      />
    </div>
  );
};

export default VodPlayer;