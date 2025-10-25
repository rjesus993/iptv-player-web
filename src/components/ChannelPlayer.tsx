import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import shaka from "shaka-player";
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

interface TVPlayerProps {
  url: string;
  channelName: string;
  channelLogo?: string;
  onClose: () => void;
  onErrorPlayback?: () => void;
}

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
  const shakaRef = useRef<shaka.Player | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeUI, setVolumeUI] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useReactPlayer, setUseReactPlayer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUI, setShowUI] = useState(true);

  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  // 🔹 Função para resetar timer de inatividade
  function resetInactivityTimer() {
    setShowUI(true);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setShowUI(false);
    }, 3000); // 3s sem interação → esconde UI
  }

  const cleanupPlayer = useCallback(() => {
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch {}
      hlsRef.current = null;
    }
    if (shakaRef.current) {
      try { shakaRef.current.destroy(); } catch {}
      shakaRef.current = null;
    }
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.src = "";
      v.removeAttribute("src");
      v.load();
    }
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    setLoading(true);
    setUseReactPlayer(false);
    cleanupPlayer();

    const isHls = url.toLowerCase().endsWith(".m3u8");
    const isDash = url.toLowerCase().endsWith(".mpd");

    if (isHls && Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.attachMedia(v);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(url);
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        v.muted = isMuted;
        v.volume = volumeUI;
        v.play().catch(() => setUseReactPlayer(true));
        setLoading(false);
      });
      hls.on(Hls.Events.ERROR, () => {
        cleanupPlayer();
        setUseReactPlayer(true);
        setLoading(false);
      });
    } else if (isDash) {
      const player = new shaka.Player(v);
      shakaRef.current = player;
      player.load(url).then(() => {
        v.muted = isMuted;
        v.volume = volumeUI;
        v.play().catch(() => setUseReactPlayer(true));
        setLoading(false);
      }).catch(() => {
        cleanupPlayer();
        setUseReactPlayer(true);
        setLoading(false);
      });
    } else {
      setUseReactPlayer(true);
      setLoading(false);
    }

    return () => cleanupPlayer();
  }, [url, cleanupPlayer]);

  useEffect(() => {
    if (useReactPlayer) return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = isMuted;
    v.volume = volumeUI;
  }, [isMuted, volumeUI, useReactPlayer]);

  // 🔹 Ativar listeners de mouse para auto-hide
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = () => resetInactivityTimer();
    container.addEventListener("mousemove", handleMouseMove);

    resetInactivityTimer(); // inicia timer

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);

  function togglePlay() {
    setIsPlaying((prev) => {
      const next = !prev;
      if (!useReactPlayer && videoRef.current) {
        if (next) videoRef.current.play().catch(() => {});
        else videoRef.current.pause();
      }
      return next;
    });
  }

  function toggleMute() {
    setIsMuted((prev) => {
      const next = !prev;
      if (!useReactPlayer && videoRef.current) {
        videoRef.current.muted = next;
      }
      return next;
    });
  }

  function handleVolumeChange(val: number) {
    setVolumeUI(val);
    if (!useReactPlayer && videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  }

  function toggleFs() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
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
      <div className="fixed inset-0 bg-black/70" onClick={handleClose} />
      <div
        ref={containerRef}
        className="relative z-50 w-full max-w-6xl h-auto bg-black rounded-lg overflow-hidden"
      >
        <div className="relative bg-black w-full aspect-video">
          {!useReactPlayer ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isMuted}
              className="w-full h-full object-cover"
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
            />
          )}

          {/* Header com nome do canal */}
          <div
            className={`absolute top-0 left-0 right-0 flex items-center p-2 bg-gradient-to-b from-black/70 to-transparent text-white transition-opacity duration-500 ${
              showUI ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <img src={channelLogo} alt={channelName} className="h-6 mr-2" />
            <span className="font-semibold">{channelName}</span>
          </div>

          {/* Controles no rodapé */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-black/50 flex items-center p-2 gap-3 transition-opacity duration-500 ${
              showUI ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <button onClick={togglePlay} className="text-white">
              {isPlaying ? <MdPause size={24}/> : <MdPlayArrow size={24}/>}
            </button>
            <button onClick={toggleMute} className="text-white">
              {isMuted ? <MdVolumeOff size={24}/> : <MdVolumeUp size={24}/>}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volumeUI}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-24"
            />
            <button onClick={toggleFs} className="ml-auto text-white">
              {isFullscreen ? <MdFullscreenExit size={24}/> : <MdFullscreen size={24}/>}
            </button>
            <button onClick={handleClose} className="text-white">
              <MdClose size={24}/>
            </button>
          </div>

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="h-12 w-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}