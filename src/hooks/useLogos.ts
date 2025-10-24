import { useEffect, useRef, useState } from "react";

interface ChannelData {
  id: string;
  name: string;
  logo?: string;
}

function normalizeName(raw: string) {
  const lower = raw.toLowerCase().trim();

  // remove sufixos comuns que atrapalham (hd, fhd, sd, 4k, uhd, h265, h264 etc.)
  const cleaned = lower
    .replace(/\b(fhd|uhd|hd|sd|4k|h265|h264)\b/g, "")
    .replace(/\b(full ?hd|high ?definition)\b/g, "")
    .replace(/\b(channel|canal)\b/g, "")
    .replace(/\b(br|brasil|brazil)\b/g, "")
    .replace(/[\(\)\[\]\{\}\|]+/g, " ")
    .replace(/[^a-z0-9\s\-]/g, "") // remove símbolos
    .replace(/\s{2,}/g, " ")       // compacta espaços
    .trim();

  // remove acentos (normalização unicode)
  return cleaned.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function useLogos() {
  const [loading, setLoading] = useState(true);
  const logoMapRef = useRef<Map<string, string>>(new Map()); // nome normalizado -> logo URL

  useEffect(() => {
    async function load() {
      try {
        const cached = localStorage.getItem("iptv-org-logos");
        if (cached) {
          const data: ChannelData[] = JSON.parse(cached);
          const map = new Map<string, string>();
          for (const c of data) {
            if (!c.name || !c.logo) continue;
            map.set(normalizeName(c.name), c.logo);
          }
          logoMapRef.current = map;
          setLoading(false);
          return;
        }

        const res = await fetch("https://iptv-org.github.io/api/channels.json");
        const data: ChannelData[] = await res.json();

        localStorage.setItem("iptv-org-logos", JSON.stringify(data));

        const map = new Map<string, string>();
        for (const c of data) {
          if (!c.name || !c.logo) continue;
          map.set(normalizeName(c.name), c.logo);
        }
        logoMapRef.current = map;
      } catch (err) {
        console.error("Erro ao carregar logos do iptv-org", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function getLogoUrl(channelName: string) {
    if (!channelName) return "/fallback.png";
    const key = normalizeName(channelName);
    const url = logoMapRef.current.get(key);
    return url || "/fallback.png";
  }

  return { getLogoUrl, loading, normalizeName };
}