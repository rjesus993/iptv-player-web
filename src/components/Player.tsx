import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import ReactPlayer from "react-player";
import {
  MdPlayArrow,
  MdPause,
  MdVolumeUp,
  MdVolumeOff,
  MdFullscreen,
  MdFullscreenExit,
  MdClose,
} from "react-icons/md";

export default function TVPlayer({
  url,
  channelName,
  channelLogo,
  onClose,
}: {
  url: string;
  channelName: string;
  channelLogo?: string;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useReactPlayer, setUseReactPlayer] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [loading, setLoading] = useState(true);

  // Inicializa vídeo com suporte a HLS e fallback
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (Hls.isSupported() && url.endsWith(".m3u8")) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,        // desliga LL-HLS para estabilidade
        liveSyncDuration: 10,         // alvo: ~10s atrás do ao vivo
        liveMaxLatencyDuration: 30,   // pode atrasar até 30s
        maxLiveSyncPlaybackRate: 1.0, // não acelera para alcançar o ao vivo
        backBufferLength: 120,        // mantém até 2min de buffer
      });
      hls.loadSource(url);
      hls.attachMedia(v);

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setUseReactPlayer(true);
              break;
          }
        }
      });
    } else {
      v.src = url;
      v.play().catch(() => setUseReactPlayer(true));
    }

    v.muted = isMuted;
    v.volume = volume;

    // Reinicializa em caso de erro
    v.addEventListener("error", () => {
      v.load();
      v.play().catch(() => {});
    });
  }, [url]);

  // Detecta mudanças de fullscreen
  useEffect(() => {
    function handleFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Timer de inatividade estilo YouTube
  useEffect(() => {
    let timer: number;
    function handleMove() {
      setShowUI(true);
      clearTimeout(timer);
      timer = window.setTimeout(() => setShowUI(false), 2500);
    }
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("mousemove", handleMove);
    handleMove();
    return () => {
      container.removeEventListener("mousemove", handleMove);
      clearTimeout(timer);
    };
  }, []);

  function togglePlay() {
    setIsPlaying(!isPlaying);
    if (!useReactPlayer) {
      const v = videoRef.current;
      if (!v) return;
      if (v.paused) {
        v.play().then(() => setIsPlaying(true));
      } else {
        v.pause();
        setIsPlaying(false);
      }
    }
  }

  function toggleMute() {
    setIsMuted(!isMuted);
    if (!useReactPlayer) {
      const v = videoRef.current;
      if (!v) return;
      v.muted = !v.muted;
    }
  }

  function changeVolume(val: number) {
    setVolume(val);
    setIsMuted(val === 0);
    if (!useReactPlayer) {
      const v = videoRef.current;
      if (!v) return;
      v.volume = val;
    }
  }

  function toggleFs() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Fundo escuro */}
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div
        ref={containerRef}
        className="relative z-50 w-full max-w-6xl bg-black rounded-lg overflow-hidden"
      >
        {/* Player */}
        <div className="relative bg-black">
          {!useReactPlayer ? (
            <video
              ref={videoRef}
              controls={false}
              autoPlay
              playsInline
              preload="auto"
              muted={isMuted}
              className="w-full h-full"
              onLoadedData={() => setLoading(false)}
              onCanPlay={() => setLoading(false)}
              onEnded={() => {
                // reinicia se for live
                videoRef.current?.play().catch(() => {});
              }}
            />
          ) : (
            <ReactPlayer
              url={url}
              playing={isPlaying}
              muted={isMuted}
              volume={volume}
              width="100%"
              height="100%"
              controls={false}
              playsinline
              config={{
                file: {
                  forceHLS: true,
                  forceVideo: true,
                  attributes: {
                    preload: "auto",
                    playsInline: true,
                  },
                },
              }}
              onReady={() => setLoading(false)}
              onStart={() => setLoading(false)}
              onEnded={() => {
                // reinicia se interpretar como VOD
                setIsPlaying(true);
              }}
            />
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="h-12 w-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Overlay superior */}
          <div
            className={`absolute top-0 left-0 right-0 flex items-center justify-between p-3 bg-gradient-to-b from-black/40 to-transparent transition-opacity duration-500 ${
              showUI ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex items-center gap-3">
              <img
                src={channelLogo || "/fallback.png"}
                alt={channelName}
                className="w-8 h-8 object-contain"
              />
              <span className="text-white font-semibold">{channelName}</span>
              <span className="ml-2 rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                AO VIVO
              </span>
            </div>
            <button onClick={onClose} className="text-white text-2xl">
              <MdClose />
            </button>
          </div>

          {/* Overlay inferior */}
          <div
            className={`absolute bottom-0 left-0 right-0 flex items-center justify-between p-3 bg-gradient-to-t from-black/40 to-transparent text-white transition-opacity duration-500 ${
              showUI ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex items-center gap-3">
              <button onClick={togglePlay}>
                {isPlaying ? <MdPause size={28} /> : <MdPlayArrow size={28} />}
              </button>
              <button onClick={toggleMute}>
                {isMuted ? <MdVolumeOff size={24} /> : <MdVolumeUp size={24} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => changeVolume(Number(e.target.value))}
                className="w-24 accent-blue-500"
              />
            </div>
            <button onClick={toggleFs}>
              {isFullscreen ? (
                <MdFullscreenExit size={24} />
              ) : (
                <MdFullscreen size={24} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}