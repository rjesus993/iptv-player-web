export async function loadChannels(source: XtreamConfig) {
  const url = `${source.host.replace(/\/$/, "")}/player_api.php?username=${source.username}&password=${source.password}&action=get_live_streams`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao carregar canais");
  const data = await res.json();

  return data.map((c: any) => ({
    id: String(c.stream_id),
    name: c.name,
    logo: c.stream_icon,
    group: c.category_id,
    url: `${source.host.replace(/\/$/, "")}/live/${source.username}/${source.password}/${c.stream_id}.m3u8`,
  }));
}

export async function loadVod(source: XtreamConfig) {
  const url = `${source.host.replace(/\/$/, "")}/player_api.php?username=${source.username}&password=${source.password}&action=get_vod_streams`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao carregar filmes");
  const data = await res.json();

  return data.map((v: any) => ({
    id: String(v.stream_id),
    name: v.name,
    logo: v.stream_icon,
    url: `${source.host.replace(/\/$/, "")}/movie/${source.username}/${source.password}/${v.stream_id}.m3u8`,
  }));
}

export async function loadSeries(source: XtreamConfig) {
  const url = `${source.host.replace(/\/$/, "")}/player_api.php?username=${source.username}&password=${source.password}&action=get_series`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao carregar séries");
  const data = await res.json();

  return data.map((s: any) => ({
    id: String(s.series_id),
    name: s.name,
    logo: s.cover,
    plot: s.plot,
  }));
}