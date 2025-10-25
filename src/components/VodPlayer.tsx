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
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    : `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function VodPlayer({ url, title, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlaysRef = useRef<HTMLDivElement | null>(null); // wrapper dos overlays

  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsKey, setControlsKey] = useState(0); // força remontagem dos overlays

  // Detectar fullscreen e remontar overlays
  useEffect(() => {
    const handler = () => {
      const full = !!document.fullscreenElement;
      setIsFullscreen(full);
      setShowControls(true);

      // força reflow/repaint dos overlays
      setControlsKey(k => k + 1);
      const overlays = overlaysRef.current;
      if (overlays) {
        overlays.style.display = "none";
        requestAnimationFrame(() => {
          overlays.style.display = "";
        });
      }
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Auto-hide dos controles
  useEffect(() => {
    let timeout: number;

    const resetTimer = () => {
      setShowControls(true);
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => setShowControls(false), 2000);
    };

    const container = containerRef.current;
    if (!container) return;

    resetTimer();

    container.addEventListener("mousemove", resetTimer);
    container.addEventListener("click", resetTimer);
    window.addEventListener("keydown", resetTimer);

    return () => {
      container.removeEventListener("mousemove", resetTimer);
      container.removeEventListener("click", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.clearTimeout(timeout);
    };
  }, [isFullscreen, controlsKey]);

  // Atualizar progresso/duração e reagir a playing/canplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const update = () => {
      setProgress(video.currentTime);
      setDuration(video.duration || 0);
    };
    const onWaiting = () => setLoading(true);
    const repaintOverlays = () => {
      setLoading(false);
      setShowControls(true);
      // força remontagem e repaint (corrige “invisível atrás do vídeo”)
      setControlsKey(k => k + 1);
      const overlays = overlaysRef.current;
      if (overlays) {
        overlays.style.display = "none";
        requestAnimationFrame(() => {
          overlays.style.display = "";
        });
      }
    };

    video.addEventListener("timeupdate", update);
    video.addEventListener("loadedmetadata", update);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", repaintOverlays);
    video.addEventListener("canplay", repaintOverlays);

    update();

    return () => {
      video.removeEventListener("timeupdate", update);
      video.removeEventListener("loadedmetadata", update);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", repaintOverlays);
      video.removeEventListener("canplay", repaintOverlays);
    };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    const v = videoRef.current;
    if (v) {
      v.volume = newVolume;
      v.muted = newVolume === 0;
      setMuted(v.muted);
    }
  };

  const changeProgress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    const v = videoRef.current;
    if (v) v.currentTime = newTime;
    setProgress(newTime);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
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
          className="w-full h-full object-contain bg-black relative z-0 pointer-events-none"
        >
          <source src={url} type="video/mp4" />
          Seu navegador não suporta a reprodução de vídeo.
        </video>

        {/* Spinner com z alto */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-[9999]">
            <div className="flex items-end gap-2">
              {[0, 0.1, 0.2, 0.3, 0.4].map((delay, i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-white animate-bounce"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Wrapper dos overlays com key para remontar */}
        <div key={controlsKey} ref={overlaysRef} className="absolute inset-0 z-[2147483647] pointer-events-none">
          {/* Top bar */}
          <div
            className={`absolute top-0 left-0 right-0 pointer-events-auto flex justify-between items-center px-4 py-2 bg-black/60 transition-opacity duration-200 ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
          >
            <span className="text-white font-semibold truncate">{title}</span>
            <button onClick={onClose} className="text-white hover:text-red-500">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Controles */}
          <div
            className={`absolute bottom-0 left-0 right-0 pointer-events-auto flex flex-col gap-2 px-4 pb-3 transition-opacity duration-200 ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
          >
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

              <button onClick={toggleFullscreen} className="text-white ml-auto">
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
    </div>
  );
}