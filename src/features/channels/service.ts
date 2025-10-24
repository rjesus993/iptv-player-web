import { Xtream } from "@iptv/xtream-api";
import { parseM3U } from "@iptv/playlist";

export interface Channel {
  id: string;
  name: string;
  logo?: string;
  group?: string;
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

export async function loadChannels(source: ChannelSource): Promise<Channel[]> {
  if (source.type === "xtream") {
    const xtream = new Xtream({
      url: source.host.replace(/\/$/, ""),
      username: source.username,
      password: source.password,
    });

    // Aqui usamos a ação "get_live_streams"
    const streams = await xtream.request("get_live_streams");

    return streams.map((s: any) => ({
      id: String(s.stream_id),
      name: s.name,
      logo: s.stream_icon,
      group: s.category_name,
      url: `${source.host.replace(/\/$/, "")}/live/${source.username}/${source.password}/${s.stream_id}.m3u8`,
    }));
  }

  if (source.type === "m3u") {
    const text = await source.file.text();
    const playlist = parseM3U(text);

    return playlist.items.map((item, idx) => ({
      id: String(idx),
      name: item.name,
      logo: item.tvg?.logo,
      group: item.group?.title,
      url: item.url,
    }));
  }

  return [];
}

export async function loadVod(source: XtreamConfig) {
  const xtream = new Xtream({
    url: source.host.replace(/\/$/, ""),
    username: source.username,
    password: source.password,
  });

  // Ação correta: "get_vod_streams"
  const vods = await xtream.request("get_vod_streams");

  return vods.map((v: any) => ({
    id: String(v.stream_id),
    name: v.name,
    logo: v.stream_icon,
    url: `${source.host.replace(/\/$/, "")}/movie/${source.username}/${source.password}/${v.stream_id}.m3u8`,
  }));
}

export async function loadSeries(source: XtreamConfig) {
  const xtream = new Xtream({
    url: source.host.replace(/\/$/, ""),
    username: source.username,
    password: source.password,
  });

  // Ação correta: "get_series"
  const series = await xtream.request("get_series");

  return series.map((s: any) => ({
    id: String(s.series_id),
    name: s.name,
    logo: s.cover,
    plot: s.plot,
  }));
}