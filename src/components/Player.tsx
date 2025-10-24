import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import dashjs from "dashjs";
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
  onErrorPlayback, // callback para marcar OFFLINE no grid
}: {
  url: string;
  channelName: string;
  channelLogo?: string;
  onClose: () => void;
  onErrorPlayback?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const dashRef = useRef<dashjs.MediaPlayerClass | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeUI, setVolumeUI] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useReactPlayer, setUseReactPlayer] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  function handleVolumeChange(val: number) {
    setVolumeUI(val);
    const v = videoRef.current;
    if (v && !useReactPlayer) {
      v.volume = val;
      v.muted = val === 0 || isMuted;
    }
  }

  // Inicialização do player (apenas quando a URL muda)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    setLoading(true);
    setUseReactPlayer(false);
    setLastError(null);

    // limpar instâncias anteriores
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch {}
      hlsRef.current = null;
    }
    if (dashRef.current) {
      try { dashRef.current.reset(); } catch {}
      dashRef.current = null;
    }

    const isHls = url.toLowerCase().endsWith(".m3u8");
    const isDash = url.toLowerCase().endsWith(".mpd");
    const isNativeFile = /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(v);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // aplica estado atual sem reinicializações subsequentes
        v.muted = isMuted;
        v.volume = volumeUI;
        v.play().catch(() => setUseReactPlayer(true));
      });
      hls.on(Hls.Events.LEVEL_LOADED, () => setLoading(false));
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setLastError(`Erro HLS: ${data.type}`);
          onErrorPlayback?.();
          setUseReactPlayer(true);
        }
      });
    } else if (isDash) {
      const dash = dashjs.MediaPlayer().create();
      dashRef.current = dash;
      dash.initialize(v, url, true);
      dash.on(dashjs.MediaPlayer.events.PLAYBACK_STARTED, () => {
        // aplica estado atual
        v.muted = isMuted;
        v.volume = volumeUI;
        setLoading(false);
      });
      dash.on(dashjs.MediaPlayer.events.ERROR, () => {
        setLastError("Erro DASH");
        onErrorPlayback?.();
        setUseReactPlayer(true);
      });
    } else if (isNativeFile) {
      v.src = url;
      v.muted = isMuted;
      v.volume = volumeUI;
      v.play()
        .then(() => setLoading(false))
        .catch(() => {
          setLastError("Erro ao iniciar arquivo nativo.");
          onErrorPlayback?.();
          setUseReactPlayer(true);
        });
    } else {
      // formato desconhecido → tenta ReactPlayer
      setUseReactPlayer(true);
      setLoading(true);
    }

    // listener de erro do <video>
    const onVideoError = () => {
      setLastError("Falha ao reproduzir canal.");
      onErrorPlayback?.();
    };

    v.addEventListener("error", onVideoError);

    return () => {
      v.removeEventListener("error", onVideoError);
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch {}
        hlsRef.current = null;
      }
      if (dashRef.current) {
        try { dashRef.current.reset(); } catch {}
        dashRef.current = null;
      }
    };
    // Importante: não dependa de isMuted/volumeUI aqui para evitar reinicialização
  }, [url, onErrorPlayback]);

  // Efeito separado: aplicar mute/volume sem reinicializar o player
  useEffect(() => {
    if (useReactPlayer) return; // ReactPlayer recebe via props
    const v = videoRef.current;
    if (!v) return;
    v.muted = isMuted;
    v.volume = volumeUI;
  }, [isMuted, volumeUI, useReactPlayer]);

  // fullscreen
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // esconder UI após inatividade
  useEffect(() => {
    let timer: number;
    const handleMove = () => {
      setShowUI(true);
      clearTimeout(timer);
      timer = window.setTimeout(() => setShowUI(false), 2500);
    };
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

  function handleClose() {
    const v = videoRef.current;
    if (v) {
      try { v.pause(); } catch {}
      v.src = "";
      v.removeAttribute("src");
      v.load();
    }
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch {}
      hlsRef.current = null;
    }
    if (dashRef.current) {
      try { dashRef.current.reset(); } catch {}
      dashRef.current = null;
    }
    setUseReactPlayer(false);
    setIsPlaying(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop que fecha */}
      <div className="fixed inset-0 bg-black/70" onClick={handleClose} />
      <div
        ref={containerRef}
        className="relative z-50 w-full max-w-6xl bg-black rounded-lg overflow-hidden"
      >
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
              onPlay={() => {
                setIsPlaying(true);
                setLastError(null);
              }}
              onPause={() => setIsPlaying(false)}
              onLoadedData={() => setLoading(false)}
              onCanPlay={() => setLoading(false)}
              onEnded={() => {
                // Em live, tenta retomar
                videoRef.current?.play().catch(() => {});
              }}
            />
          ) : (
            <ReactPlayer
              url={url}
              playing={isPlaying}
              muted={isMuted}
              volume={volumeUI}
              width="100%"
              height="100%"
              controls={false}
              playsinline
              config={{
                file: {
                  forceHLS: true,
                  forceDASH: true,
                  forceVideo: true,
                  attributes: { preload: "auto", playsInline: true },
                },
              }}
              onReady={() => {
                setLoading(false);
                setLastError(null);
              }}
              onStart={() => setLoading(false)}
              onEnded={() => setIsPlaying(true)}
              onError={() => {
                setLastError("Falha no fallback ReactPlayer.");
                onErrorPlayback?.();
              }}
            />
          )}

          {/* Loading */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="h-12 w-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Erros */}
          {lastError && (
            <div className="absolute bottom-16 left-0 right-0 text-center text-red-500 font-bold bg-black/70 p-2">
              {lastError}
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
              <button onClick={togglePlay} aria-label={isPlaying ? "Pausar" : "Reproduzir"}>
                {isPlaying ? <MdPause size={28} /> : <MdPlayArrow size={28} />}
              </button>
              <button onClick={toggleMute} aria-label={isMuted ? "Ativar som" : "Silenciar"}>
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
                aria-label="Volume"
              />
            </div>
            <button onClick={toggleFs} aria-label={isFullscreen ? "Sair de tela cheia" : "Tela cheia"}>
              {isFullscreen ? <MdFullscreenExit size={24} /> : <MdFullscreen size={24} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}