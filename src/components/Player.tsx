import { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

interface PlayerProps {
  url: string;
  onClose: () => void;
}

export default function Player({ url, onClose }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (videoRef.current) {
      playerRef.current = videojs(videoRef.current, {
        autoplay: true,
        controls: true,
        responsive: true,
        fluid: true,
        sources: [
          {
            src: url,
            type: "application/x-mpegURL", // HLS
          },
        ],
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [url]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
      <button
        onClick={onClose}
        className="mb-4 px-4 py-2 bg-red-600 rounded text-white"
      >
        Fechar
      </button>
      <div className="w-full max-w-4xl">
        <video ref={videoRef} className="video-js vjs-big-play-centered" />
      </div>
    </div>
  );
}