import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import dashjs from "dashjs";
import ReactPlayer from "react-player";
// import FocusTrap from "focus-trap-react"; // Descomente se quiser adicionar depois
import {
  MdPlayArrow,
  MdPause,
  MdVolumeUp,
  MdVolumeOff,
  MdFullscreen,
  MdFullscreenExit,
  MdClose,
  MdReplay,
} from "react-icons/md";

interface TVPlayerProps {
  url: string;
  channelName: string;
  channelLogo?: string;
  onClose: () => void;
  onErrorPlayback?: () => void;
}

// Hook custom para controles
const usePlayerControls = (
  videoRef: React.RefObject<HTMLVideoElement>,
  isPlaying: boolean,
  setIsPlaying: (playing: boolean) => void,
  isMuted: boolean,
  setIsMuted: (muted: boolean) => void,
  volumeUI: number,
  setVolumeUI: (volume: number) => void,
  useReactPlayer: boolean
) => {
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (!useReactPlayer && videoRef.current) {
        if (next) {
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.pause();
        }
      }
      return next;
    });
  }, [setIsPlaying, useReactPlayer, videoRef]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (!useReactPlayer && videoRef.current) {
        videoRef.current.muted = next;
      }
      return next;
    });
  }, [setIsMuted, useReactPlayer, videoRef]);

  const handleVolumeChange = useCallback(
    (val: number) => {
      console.log("Volume mudando para:", val); // Debug: remova após testar
      setVolumeUI(val);
      if (!useReactPlayer && videoRef.current) {
        videoRef.current.volume = val;
        videoRef.current.muted = val === 0;
      }
    },
    [setVolumeUI, useReactPlayer, videoRef]
  );

  return { togglePlay, toggleMute, handleVolumeChange };
};

export default function TVPlayer({
  url,
  channelName,
  channelLogo = "/fallback.png",
  onClose,
  onErrorPlayback,
}: TVPlayerProps) {
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
  const [retryCount, setRetryCount] = useState(0);

  // Debug log: Player montando (remova após testar)
  useEffect(() => {
    console.log("Player montando com URL:", url);
    return () => console.log("Player desmontando");
  }, [url]);

  // Persistência de volume
  useEffect(() => {
    const savedVolume = localStorage.getItem("playerVolume");
    if (savedVolume) {
      const vol = parseFloat(savedVolume);
      setVolumeUI(vol);
      setIsMuted(vol === 0);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("playerVolume", volumeUI.toString());
  }, [volumeUI]);

  // Validação de URL
  useEffect(() => {
    if (!/^https?:\/\//.test(url)) {
      setLastError("URL inválida ou insegura.");
      onErrorPlayback?.();
      return;
    }
  }, [url, onErrorPlayback]);

  // Controles unificados
  const { togglePlay, toggleMute, handleVolumeChange } = usePlayerControls(
    videoRef,
    isPlaying,
    setIsPlaying,
    isMuted,
    setIsMuted,
    volumeUI,
    setVolumeUI,
    useReactPlayer
  );

  // Cleanup
  const cleanupPlayer = useCallback(() => {
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
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.src = "";
      v.removeAttribute("src");
      v.load();
    }
  }, []);

  // Retry
  const handleRetry = useCallback(() => {
    setRetryCount(0);
    setLastError(null);
    setLoading(true);
    setUseReactPlayer(false);
    cleanupPlayer();
  }, [cleanupPlayer]);

  // Inicialização do player (CORREÇÃO: Removidas isMuted e volumeUI das deps para evitar reload no volume)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    console.log("Inicializando player para:", url); // Debug
    setLoading(true);
    setUseReactPlayer(false);
    setLastError(null);
    setRetryCount(0);

    cleanupPlayer();

    const isHls = url.toLowerCase().endsWith(".m3u8");
    const isDash = url.toLowerCase().endsWith(".mpd");
    const isNativeFile = /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(v);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Aplica volume/mute inicial aqui
        v.muted = isMuted;
        v.volume = volumeUI;
        v.play().catch(() => setUseReactPlayer(true));
      });
      hls.on(Hls.Events.LEVEL_LOADED, () => setLoading(false));
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (
            data.type === Hls.ErrorTypes.NETWORK_ERROR &&
            retryCount < 3
          ) {
            setRetryCount((prev) => prev + 1);
            hls.startLoad();
          } else {
            setLastError(`Erro HLS: ${data.type}. Tentativas: ${retryCount + 1}`);
            onErrorPlayback?.();
            setUseReactPlayer(true);
          }
        }
      });
    } else if (isDash) {
      const dash = dashjs.MediaPlayer().create();
      dashRef.current = dash;
      dash.initialize(v, url, true);
      dash.on(dashjs.MediaPlayer.events.PLAYBACK_STARTED, () => {
        // Aplica volume/mute inicial aqui
        v.muted = isMuted;
        v.volume = volumeUI;
        setLoading(false);
      });
      dash.on(dashjs.MediaPlayer.events.ERROR, (data) => {
        if (data.error === "manifestError" && retryCount < 3) {
          setRetryCount((prev) => prev + 1);
          dash.attachSource(url);
        } else {
          setLastError(`Erro DASH: ${data.error}. Tentativas: ${retryCount + 1}`);
          onErrorPlayback?.();
          setUseReactPlayer(true);
        }
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
      setUseReactPlayer(true);
      setLoading(true);
    }

    const onVideoError = () => {
      setLastError("Falha ao reproduzir canal.");
      onErrorPlayback?.();
    };

    v.addEventListener("error", onVideoError);

    return () => {
      v.removeEventListener("error", onVideoError);
      cleanupPlayer();
    };
  }, [url, onErrorPlayback, cleanupPlayer]); // CORREÇÃO: Removidas isMuted e volumeUI das deps

  // Effect separado para aplicar mudanças de volume/mute SEM reinicializar (mantido)
  useEffect(() => {
    if (useReactPlayer) return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = isMuted;
    v.volume = volumeUI;
  }, [isMuted, volumeUI, useReactPlayer]);

  // Fullscreen
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Auto-hide UI
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleMove = () => {
      setShowUI(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShowUI(false), 2500);
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

  // Keyboard shortcuts
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== container) return;
      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          toggleFs();
          break;
        case "escape":
          handleClose();
          break;
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    container.addEventListener("touchstart", togglePlay, { passive: true });

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      container.removeEventListener("touchstart", togglePlay);
    };
  }, [togglePlay, toggleMute, toggleFs]);

  function toggleFs() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  function handleClose() {
    cleanupPlayer();
    setUseReactPlayer(false);
    setIsPlaying(false);
    setLoading(true);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70" onClick={handleClose} aria-label="Fechar player" />
      
      {/* Container */}
      <div
        ref={containerRef}
        className="relative z-50 w-full max-w-6xl h-auto bg-black rounded-lg overflow-hidden"
        tabIndex={-1}
        role="dialog"
        aria-label={`Player do canal ${channelName}`}
      >
        <div className="relative bg-black w-full aspect-video">
          {!useReactPlayer ? (
            <video
              ref={videoRef}
              controls={false}
              autoPlay
              playsInline
              preload="auto"
              muted={isMuted}
              className="w-full h-full object-cover"
              style={{ objectFit: 'cover' }}
              onPlay={() => {
                setIsPlaying(true);
                setLastError(null);
              }}
              onPause={() => setIsPlaying(false)}
              onLoadedData={() => setLoading(false)}
              onCanPlay={() => setLoading(false)}
              onEnded={() => {
                videoRef.current?.play().catch(() => {});
              }}
              role="video"
              aria-label={`Reproduzindo ${channelName}`}
              tabIndex={0}
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
              style={{ objectFit: 'cover' }}
            />
          )}

          {/* Loading */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="h-12 w-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Erros com Retry */}
          {lastError && (
            <div className="absolute bottom-16 left-0 right-0 text-center text-red-500 font-bold bg-black/70 p-2 flex items-center justify-center gap-2">
              <span>{lastError}</span>
              <button
                onClick={handleRetry}
                className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-white text-sm"
                aria-label="Tentar novamente"
              >
                <MdReplay size={16} />
              </button>
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
                src={channelLogo}
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
            <button
              onClick={handleClose}
              className="text-white text-2xl hover:opacity-70"
              aria-label="Fechar player"
            >
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
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? "Pausar" : "Reproduzir"}
                className="hover:opacity-70"
              >
                {isPlaying ? <MdPause size={28} /> : <MdPlayArrow size={28} />}
              </button>
              <button
                onClick={toggleMute}
                aria-label={isMuted ? "Ativar som" : "Silenciar"}
                className="hover:opacity-70"
              >
                {isMuted ? <MdVolumeOff size={24} /> : <MdVolumeUp size={24} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volumeUI}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-28 accent-blue-500 md:w-32"
                aria-label="Volume"
              />
            </div>
            <button
              onClick={toggleFs}
              aria-label={isFullscreen ? "Sair de tela cheia" : "Tela cheia"}
              className="hover:opacity-70"
            >
              {isFullscreen ? <MdFullscreenExit size={24} /> : <MdFullscreen size={24} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}