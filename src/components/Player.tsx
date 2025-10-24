import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import dashjs from "dashjs"; // Suporte a MPEG-DASH
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
  const dashRef = useRef<dashjs.MediaPlayerClass | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeUI, setVolumeUI] = useState(1); // controla apenas o slider
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useReactPlayer, setUseReactPlayer] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  // Reconexão (apenas para cenários de rede/timeouts)
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;
  const stallTimerRef = useRef<number | null>(null);

  function handleVolumeChange(val: number) {
    setVolumeUI(val);
    const v = videoRef.current;
    if (v && !useReactPlayer) {
      v.volume = val;
      v.muted = val === 0;
    }
  }

  function clearStallTimer() {
    if (stallTimerRef.current) {
      window.clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  }

  function startStallTimer() {
    clearStallTimer();
    stallTimerRef.current = window.setTimeout(() => {
      scheduleReconnect("Timeout de dados: servidor IPTV não forneceu segmentos");
    }, 15000);
  }

  function scheduleReconnect(reason: string) {
    // Para streams VOD (mp4/webm/ogg), reconexão é menos útil; focamos em HLS/DASH/live
    if (retryCount >= maxRetries) {
      setLastError(`${reason} — Limite de tentativas atingido.`);
      return;
    }
    const nextRetry = retryCount + 1;
    const delay = Math.min(5000 * nextRetry, 30000);
    setLastError(`${reason} — Tentando reconectar em ${delay / 1000}s...`);
    setRetryCount(nextRetry);

    window.setTimeout(() => {
      const v = videoRef.current;
      if (v) {
        try {
          v.load();
          v.play().catch(() => {});
        } catch {}
      }
      if (hlsRef.current) {
        try {
          hlsRef.current.startLoad();
        } catch {}
      }
      if (dashRef.current) {
        try {
          // Reinicializa reprodução em DASH
          dashRef.current.play();
        } catch {}
      }
    }, delay);
  }

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    setLoading(true);
    setUseReactPlayer(false);
    setLastError(null);
    setRetryCount(0);
    clearStallTimer();

    // Limpa instâncias anteriores
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {}
      hlsRef.current = null;
    }
    if (dashRef.current) {
      try {
        dashRef.current.reset();
      } catch {}
      dashRef.current = null;
    }

    const isHls = url.toLowerCase().endsWith(".m3u8");
    const isDash = url.toLowerCase().endsWith(".mpd");
    const isNativeFile = /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

    if (isHls && (Hls.isSupported() || /Safari/i.test(navigator.userAgent))) {
      // HLS: usar hls.js quando suportado; no Safari/iOS o <video> suporta nativamente
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          liveSyncDuration: 20,
          liveMaxLatencyDuration: 60,
          maxLiveSyncPlaybackRate: 1.0,
          backBufferLength: 300,
          maxBufferLength: 60,
          maxBufferHole: 1,
          startPosition: -20,
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
                scheduleReconnect("Erro de rede: servidor IPTV não respondeu");
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setLastError("Erro de mídia/decodificação. Tentando recuperar...");
                try {
                  hls.recoverMediaError();
                } catch {
                  scheduleReconnect("Erro de mídia não recuperável");
                }
                break;
              default:
                setLastError("Erro fatal desconhecido no HLS. Alternando para fallback.");
                setUseReactPlayer(true);
                break;
            }
          }
        });
      } else {
        // Safari/iOS: HLS nativo
        v.src = url;
        v.muted = isMuted;
        v.volume = volumeUI;
        v.play().then(() => setLoading(false)).catch(() => setUseReactPlayer(true));
      }
    } else if (isDash) {
      // DASH com dash.js
      const dash = dashjs.MediaPlayer().create();
      dashRef.current = dash;
      dash.initialize(v, url, true);
      dash.updateSettings({
        streaming: {
          lowLatencyEnabled: false,
          stableBufferTime: 20,
        },
      });
      dash.on(dashjs.MediaPlayer.events.PLAYBACK_STARTED, () => setLoading(false));
      dash.on(dashjs.MediaPlayer.events.ERROR, (e: any) => {
        setLastError(`Erro DASH: ${e?.error || "desconhecido"}`);
        setUseReactPlayer(true);
      });
    } else if (isNativeFile) {
      // Formatos nativos (MP4/WebM/Ogg)
      v.src = url;
      v.muted = isMuted;
      v.volume = volumeUI;
      v.play().then(() => setLoading(false)).catch(() => setUseReactPlayer(true));
    } else {
      // Fallback universal
      setUseReactPlayer(true);
      setLoading(true);
    }

    // Eventos do <video> para diagnóstico e reconexão
    const onVideoError = () => {
      const err = v.error;
      if (!err) return;
      switch (err.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          setLastError("Reprodução abortada.");
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          scheduleReconnect("Erro de rede: servidor IPTV não respondeu");
          break;
        case MediaError.MEDIA_ERR_DECODE:
          setLastError("Erro de decodificação: formato inválido ou corrompido.");
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          setLastError("Formato não suportado pelo navegador.");
          break;
        default:
          setLastError("Erro desconhecido no player.");
      }
    };
    const onStalled = () => {
      setLastError("Fluxo de dados interrompido: servidor não está enviando pacotes.");
      startStallTimer();
    };
    const onWaiting = () => {
      startStallTimer();
    };
    const onPlaying = () => {
      clearStallTimer();
      setLastError(null);
    };
    const onCanPlay = () => {
      clearStallTimer();
      setLoading(false);
    };
    const onLoadedData = () => {
      clearStallTimer();
      setLoading(false);
    };

    v.addEventListener("error", onVideoError);
    v.addEventListener("stalled", onStalled);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("loadeddata", onLoadedData);

    return () => {
      v.removeEventListener("error", onVideoError);
      v.removeEventListener("stalled", onStalled);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("loadeddata", onLoadedData);
      clearStallTimer();
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch {}
        hlsRef.current = null;
      }
      if (dashRef.current) {
        try { dashRef.current.reset(); } catch {}
        dashRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Fullscreen
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // UI auto-hide
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

  // Fechamento limpo: pausa, limpa src e destrói HLS/DASH
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
              onPlay={() => {
                setIsPlaying(true);
                setLastError(null);
              }}
              onPause={() => setIsPlaying(false)}
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
              volume={volumeUI}
              width="100%"
              height="100%"
              controls={false}
              playsinline
              config={{
                file: {
                  // Força engines quando possível
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
              }}
            />
          )}

          {/* Loading */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="h-12 w-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Exibição de erro (diagnóstico) */}
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