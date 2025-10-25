// src/features/vod/service.ts

export interface Vod {
  stream_id: string;
  name: string;
  stream_icon?: string;
  category_id: string;
  container_extension?: string;
}

export interface VodInfo {
  info: {
    name: string;
    plot?: string;
    releasedate?: string;
    rating?: string;
    duration?: string;
    cover?: string;
  };
}

interface Auth {
  type: "xtream";
  host: string;
  username: string;
  password: string;
}

export async function loadVod(auth: Auth): Promise<Vod[]> {
  const res = await fetch(
    `${auth.host}/player_api.php?username=${auth.username}&password=${auth.password}&action=get_vod_streams`
  );
  if (!res.ok) throw new Error("Erro ao carregar VOD");
  return res.json();
}

export async function loadVodCategories(auth: Auth): Promise<{ id: string; name: string }[]> {
  const res = await fetch(
    `${auth.host}/player_api.php?username=${auth.username}&password=${auth.password}&action=get_vod_categories`
  );
  if (!res.ok) throw new Error("Erro ao carregar categorias de VOD");
  return res.json();
}

// 🔹 Novo: detalhes de um filme
export async function loadVodInfo(auth: Auth, vodId: string): Promise<VodInfo> {
  const res = await fetch(
    `${auth.host}/player_api.php?username=${auth.username}&password=${auth.password}&action=get_vod_info&vod_id=${vodId}`
  );
  if (!res.ok) throw new Error("Erro ao carregar detalhes do VOD");
  return res.json();
}