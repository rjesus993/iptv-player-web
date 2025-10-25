import React, { useRef, useState, useEffect } from "react";
import {
  XMarkIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/solid";

type Props = {
  url: string;
  title: string;
  onClose: () => void;
};

const formatTime = (time: number) => {
  if (isNaN(time)) return "00:00";
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`
    : `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function VodPlayer({ url, title, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Detectar fullscreen
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Auto-hide
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 2000);
    };
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("mousemove", resetTimer);
    resetTimer();
    return () => {
      container.removeEventListener("mousemove", resetTimer);
      clearTimeout(timeout);
    };
  }, [isFullscreen]);

  // Atualizar progresso
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const update = () => {
      setProgress(video.currentTime);
      setDuration(video.duration || 0);
    };
    video.addEventListener("timeupdate", update);
    video.addEventListener("loadedmetadata", update);
    return () => {
      video.removeEventListener("timeupdate", update);
      video.removeEventListener("loadedmetadata", update);
    };
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
      setMuted(videoRef.current.muted);
    }
  };

  const changeProgress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    setProgress(newTime);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div
        ref={containerRef}
        className="relative bg-black rounded shadow-lg w-[960px] h-[540px]"
      >
        <video
          ref={videoRef}
          autoPlay
          preload="auto"
          onCanPlay={() => setLoading(false)}
          onWaiting={() => setLoading(true)}
          onPlaying={() => setLoading(false)}
          className="w-full h-full object-contain bg-black"
        >
          <source src={url} type="video/mp4" />
          Seu navegador não suporta a reprodução de vídeo.
        </video>

        {/* Spinner estilo Dot Wave só com Tailwind */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="flex items-end gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0s" }}></span>
              <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0.1s" }}></span>
              <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0.2s" }}></span>
              <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0.3s" }}></span>
              <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0.4s" }}></span>
            </div>
          </div>
        )}

        {/* Top bar */}
        <div
          className={`absolute top-0 left-0 right-0 flex justify-between items-center px-4 py-2 bg-black/60 transition-opacity duration-500 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="text-white font-semibold">{title}</span>
          <button onClick={onClose} className="text-white hover:text-red-500">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Controles */}
        <div
          className={`absolute bottom-0 left-0 right-0 flex flex-col gap-2 px-4 pb-3 transition-opacity duration-500 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Barra de progresso */}
          <div className="flex items-center text-white text-sm">
            <span>{formatTime(progress)}</span>
            <input
              type="range"
              min="0"
              max={duration}
              step="0.1"
              value={progress}
              onChange={changeProgress}
              className="flex-1 mx-2 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <span>{formatTime(duration)}</span>
          </div>

          {/* Botões */}
          <div className="flex items-center gap-4 bg-black/60 py-2 px-4 rounded">
            <button onClick={togglePlay} className="text-white">
              {playing ? (
                <PauseIcon className="w-6 h-6" />
              ) : (
                <PlayIcon className="w-6 h-6" />
              )}
            </button>

            <button onClick={toggleMute} className="text-white">
              {muted ? (
                <SpeakerXMarkIcon className="w-6 h-6" />
              ) : (
                <SpeakerWaveIcon className="w-6 h-6" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={changeVolume}
              className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600"
            />

            <button onClick={toggleFullscreen} className="text-white">
              {isFullscreen ? (
                <ArrowsPointingInIcon className="w-6 h-6" />
              ) : (
                <ArrowsPointingOutIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}