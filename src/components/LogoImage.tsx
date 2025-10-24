import { useRef } from "react";

export default function LogoImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const failedOnceRef = useRef(false);
  const fallback = "/fallback.png";

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!failedOnceRef.current) {
      failedOnceRef.current = true;
      img.src = fallback;
    }
  };

  return (
    <img
      src={src || fallback}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
      decoding="async"
    />
  );
}