import { Xtream } from "@iptv/xtream-api";
import { parse } from "@iptv/playlist";

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

/**
 * Função unificada para carregar canais
 */
export async function loadChannels(source: ChannelSource): Promise<Channel[]> {
  if (source.type === "xtream") {
    const xtream = new Xtream({
      url: source.host,
      username: source.username,
      password: source.password,
      preferredFormat: "m3u8",
    });

    const streams = await xtream.getLiveStreams();

    return streams.map((s) => ({
      id: String(s.stream_id),
      name: s.name,
      logo: s.stream_icon,
      group: s.category_name,
      url: s.url, // já vem pronto
    }));
  }

  if (source.type === "m3u") {
    const text = await source.file.text();
    const playlist = parse(text);

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