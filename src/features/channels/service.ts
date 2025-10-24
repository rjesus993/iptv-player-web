import { parseM3U } from "@iptv/playlist";

export interface Channel {
  id: string;
  name: string;
  logo?: string;
  category_id?: string;
  category_name?: string;
  url: string;
}

interface XtreamConfig {
  type: "xtream";
  host: string;
  username: string;
  password: string;
}

interface M3UConfig {
  type: "m3u";
  file: File;
}

export type ChannelSource = XtreamConfig | M3UConfig;

/* 🔹 Carregar canais ao vivo */
export async function loadChannels(source: ChannelSource): Promise<Channel[]> {
  if (source.type === "xtream") {
    const base = source.host.replace(/\/$/, "");
    const url = `${base}/player_api.php?username=${encodeURIComponent(
      source.username
    )}&password=${encodeURIComponent(source.password)}&action=get_live_streams`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Erro ao carregar canais");
    const data = await res.json();
    const list = Array.isArray(data) ? data : data?.live_streams || [];

    return list.map((s: any) => ({
      id: String(s.stream_id),
      name: s.name,
      logo: s.stream_icon,
      category_id: s.category_id,
      category_name: s.category_name,
      url: `${base}/live/${source.username}/${source.password}/${s.stream_id}.m3u8`,
    }));
  }

  if (source.type === "m3u") {
    const text = await source.file.text();
    const playlist = parseM3U(text);

    return playlist.items.map((item, idx) => ({
      id: String(idx),
      name: item.name,
      logo: item.tvg?.logo,
      category_id: item.group?.title,
      category_name: item.group?.title,
      url: item.url,
    }));
  }

  return [];
}

/* 🔹 Carregar categorias de canais */
export async function loadChannelCategories(source: XtreamConfig) {
  const base = source.host.replace(/\/$/, "");
  const url = `${base}/player_api.php?username=${encodeURIComponent(
    source.username
  )}&password=${encodeURIComponent(source.password)}&action=get_live_categories`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao carregar categorias");
  const data = await res.json();

  return data.map((c: any) => ({
    id: c.category_id,
    name: c.category_name,
  }));
}

/* 🔹 Carregar filmes (VOD) */
export async function loadVod(source: XtreamConfig) {
  const base = source.host.replace(/\/$/, "");
  const url = `${base}/player_api.php?username=${encodeURIComponent(
    source.username
  )}&password=${encodeURIComponent(source.password)}&action=get_vod_streams`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao carregar filmes");
  const data = await res.json();
  const list = Array.isArray(data) ? data : data?.vod_streams || [];

  return list.map((v: any) => ({
    id: String(v.stream_id),
    name: v.name,
    logo: v.stream_icon || v.cover,
    category_id: v.category_id,
    category_name: v.category_name,
    url: `${base}/movie/${source.username}/${source.password}/${v.stream_id}.m3u8`,
  }));
}

/* 🔹 Carregar séries */
export async function loadSeries(source: XtreamConfig) {
  const base = source.host.replace(/\/$/, "");
  const url = `${base}/player_api.php?username=${encodeURIComponent(
    source.username
  )}&password=${encodeURIComponent(source.password)}&action=get_series`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao carregar séries");
  const data = await res.json();
  const list = Array.isArray(data) ? data : data?.series || [];

  return list.map((s: any) => ({
    id: String(s.series_id),
    name: s.name,
    logo: s.cover,
    category_id: s.category_id,
    category_name: s.category_name,
    plot: s.plot,
  }));
}

/* 🔹 Carregar categorias de séries */
export async function loadSeriesCategories(source: XtreamConfig) {
  const base = source.host.replace(/\/$/, "");
  const url = `${base}/player_api.php?username=${encodeURIComponent(
    source.username
  )}&password=${encodeURIComponent(source.password)}&action=get_series_categories`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao carregar categorias de séries");
  const data = await res.json();

  return data.map((c: any) => ({
    id: c.category_id,
    name: c.category_name,
  }));
}