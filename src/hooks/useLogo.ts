import { useEffect, useState } from "react";

export function useLogo(channelName?: string, channelLogoUrl?: string | null) {
  const [logoSrc, setLogoSrc] = useState("/logos/fallback.png");

  useEffect(() => {
    if (channelLogoUrl && /^https?:\/\//i.test(channelLogoUrl)) {
      const img = new Image();
      img.src = channelLogoUrl;

      img.onload = () => setLogoSrc(channelLogoUrl);
      img.onerror = () => setLogoSrc("/logos/fallback.png");
    } else {
      setLogoSrc("/logos/fallback.png");
    }
  }, [channelLogoUrl, channelName]);

  return { logoSrc };
}