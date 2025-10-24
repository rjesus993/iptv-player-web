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
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeUI, setVolumeUI] = useState(1); // controla apenas o slider
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useReactPlayer, setUseReactPlayer] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [loading, setLoading] = useState(true);

  // Aplica volume direto no elemento <video> para evitar re-render do player
  function handleVolumeChange(val: number) {
    setVolumeUI(val);
    const v = videoRef.current;
    if (v && !useReactPlayer) {
      v.volume = val;
      v.muted = val === 0;
    }
  }

  // Inicialização do player HLS + fallback
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    setLoading(true);
    setUseReactPlayer(false);

    // Destrói instância anterior de HLS se existir
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {}
      hlsRef.current = null;
    }

    if (Hls.isSupported() && url.endsWith(".m3u8")) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,   // estabilidade
        liveSyncDuration: 20,    // ~20s atrás do ao vivo
        liveMaxLatencyDuration: 60,
        maxLiveSyncPlaybackRate: 1.0,
        backBufferLength: 300,   // até 5min de histórico
        maxBufferLength: 60,     // tenta manter ~60s em buffer
        maxBufferHole: 1,
        startPosition: -20,      // começa ~20s atrás do live edge
      });
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(v);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        v.muted = isMuted;
        v.volume = volumeUI;
        v.play().catch(() => setUseReactPlayer(true));
      });

      hls.on(Hls.Events.LEVEL_LOADED, () => setLoading(false));

      hls.on(Hls.Events.ERROR, (_event, data) => {
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
      // Vídeo nativo para URLs não-HLS
      v.src = url;
      v.muted = isMuted;
      v.volume = volumeUI;
      v.play().then(() => setLoading(false)).catch(() => setUseReactPlayer(true));
    }

    // Auto-recuperação simples em caso de erro
    function onError() {
      v.load();
      v.play().catch(() => {});
    }
    v.addEventListener("error", onError);

    return () => {
      v.removeEventListener("error", onError);
    };
    // Dependendo apenas de url para não re-renderizar player ao ajustar volume
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setIsPlaying((prev) => {
      const next = !prev;
      if (!useReactPlayer) {
        const v = videoRef.current;
        if (v) {
          if (next) v.play().catch(() => {});
          else v.pause();
        }
      }
      return next;
    });
  }

  function toggleMute() {
    setIsMuted((prev) => {
      const next = !prev;
      const v = videoRef.current;
      if (v && !useReactPlayer) v.muted = next;
      return next;
    });
  }

  function toggleFs() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  // Fechamento limpo: pausa, limpa src e destrói HLS
  function handleClose() {
    const v = videoRef.current;
    if (v) {
      try {
        v.pause();
      } catch {}
      v.src = "";
      v.removeAttribute("src");
      v.load();
    }
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {}
      hlsRef.current = null;
    }
    setUseReactPlayer(false);
    setIsPlaying(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop que fecha com limpeza completa */}
      <div className="fixed inset-0 bg-black/70" onClick={handleClose} />
      <div
        ref={containerRef}
        className="relative z-50 w-full max-w-6xl bg-black rounded-lg overflow-hidden"
      >
        {/* Área do player */}
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
                // Live: tenta retomar
                videoRef.current?.play().catch(() => {});
              }}
            />
          ) : (
            <ReactPlayer
              url={url}
              playing={isPlaying}
              muted={isMuted}
              // Nota: ReactPlayer aceita volume como estado;
              // se causar tela preta no fallback, remova 'volume' daqui.
              volume={volumeUI}
              width="100%"
              height="100%"
              controls={false}
              playsinline
              config={{
                file: {
                  forceHLS: true,
                  forceVideo: true,
                  attributes: { preload: "auto", playsInline: true },
                },
              }}
              onReady={() => setLoading(false)}
              onStart={() => setLoading(false)}
              onEnded={() => setIsPlaying(true)}
            />
          )}

          {/* Loading */}
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
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/fallback.png";
                }}
              />
              <span className="text-white font-semibold">{channelName}</span>
              <span className="ml-2 rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                AO VIVO
              </span>
            </div>
            <button onClick={handleClose} className="text-white text-2xl">
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
                value={volumeUI}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-28 accent-blue-500"
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