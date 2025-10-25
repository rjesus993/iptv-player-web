// src/features/series/service.ts

export interface Series {
  series_id: string;
  name: string;
  cover?: string;
  category_id: string;
}

export interface Episode {
  id: string;
  title: string;
  container_extension: string;
  stream_url: string;
  season: number;
  episode_num: number;
}

interface Auth {
  type: "xtream";
  host: string;
  username: string;
  password: string;
}

// 🔹 Carrega todas as séries
export async function loadSeries(auth: Auth): Promise<Series[]> {
  const res = await fetch(
    `${auth.host}/player_api.php?username=${auth.username}&password=${auth.password}&action=get_series`
  );
  if (!res.ok) throw new Error("Erro ao carregar séries");
  return res.json();
}

// 🔹 Carrega categorias de séries
export async function loadSeriesCategories(
  auth: Auth
): Promise<{ id: string; name: string }[]> {
  const res = await fetch(
    `${auth.host}/player_api.php?username=${auth.username}&password=${auth.password}&action=get_series_categories`
  );
  if (!res.ok) throw new Error("Erro ao carregar categorias de séries");
  return res.json();
}

// 🔹 Carrega detalhes de uma série (seasons + episodes)
export async function loadSeriesInfo(
  auth: Auth,
  seriesId: string
): Promise<{ seasons: any[]; episodes: Record<string, Episode[]> }> {
  const res = await fetch(
    `${auth.host}/player_api.php?username=${auth.username}&password=${auth.password}&action=get_series_info&series_id=${seriesId}`
  );
  if (!res.ok) throw new Error("Erro ao carregar detalhes da série");
  return res.json();
}