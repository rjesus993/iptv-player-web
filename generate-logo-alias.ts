import * as fs from "fs";
import * as path from "path";

const HOST = "http://15abc.xyz";
const USERNAME = "rjesus993@gmail.com";
const PASSWORD = "eu10fiz15";

function normalize(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(fhd|uhd|hd|sd|4k|h265|h264)\b/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)[0];
}

function parseExtinf(line: string) {
  const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
  const namePart = line.split(",")[1]?.trim() || "";
  return {
    name: namePart,
    tvgLogo: logoMatch?.[1] || null,
  };
}

async function main() {
  const url = `${HOST}/get.php?username=${USERNAME}&password=${PASSWORD}&type=m3u_plus&output=ts`;
  console.log("📥 Baixando lista M3U...");
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao baixar lista M3U");
  const m3u = await res.text();

  const entries = m3u
    .split("\n")
    .filter((line) => line.startsWith("#EXTINF"))
    .map((line) => parseExtinf(line))
    .filter((e) => e.name);

  const alias: Record<string, string> = {};
  for (const e of entries) {
    const key = normalize(e.name);
    alias[key] = e.tvgLogo || "/logos/fallback.png";
  }

  const out = `// Gerado automaticamente a partir do M3U
export const LOGO_ALIAS: Record<string, string> = ${JSON.stringify(alias, null, 2)};
`;
  fs.writeFileSync(path.join("src/hooks/LOGO_ALIAS.ts"), out);

  console.log("✅ LOGO_ALIAS.ts gerado com", entries.length, "canais.");
}

main().catch(console.error);