import fs from "fs";
import fetch from "node-fetch";

// URL oficial do dataset iptv-org
const CHANNELS_URL = "https://iptv-org.github.io/api/channels.json";

// Função para normalizar nomes
function normalizeName(raw) {
  return raw
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/\b(fhd|uhd|hd|sd|4k|h265|h264|canal|channel|brasil|brazil)\b/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

async function main() {
  console.log("🔄 Baixando dataset do iptv-org...");
  const res = await fetch(CHANNELS_URL);
  const allChannels = await res.json();

  // Exemplo: sua lista de canais (pode vir do Xtream ou M3U)
  const myChannels = ["Telecine Action HD", "ESPN Brasil", "Globo SP"];

  // Cria pasta se não existir
  if (!fs.existsSync("public/logos")) {
    fs.mkdirSync("public/logos", { recursive: true });
  }

  for (const name of myChannels) {
    const norm = normalizeName(name);

    // Match exato ou parcial
    let match = allChannels.find(
      (c) => normalizeName(c.name) === norm
    );
    if (!match) {
      match = allChannels.find((c) =>
        normalizeName(c.name).includes(norm) || norm.includes(normalizeName(c.name))
      );
    }

    if (match && match.logo) {
      try {
        const logoRes = await fetch(match.logo);
        if (!logoRes.ok) throw new Error("Logo não disponível");
        const buffer = await logoRes.arrayBuffer();
        fs.writeFileSync(`public/logos/${norm}.png`, Buffer.from(buffer));
        console.log("✅ Logo salvo:", norm);
      } catch (err) {
        console.log("⚠️ Falha ao baixar logo de", name, "-", err.message);
      }
    } else {
      console.log("❌ Nenhum logo encontrado para", name);
    }
  }
}

main();