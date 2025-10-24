export interface XtreamChannel {
  num: string;
  name: string;
  stream_id: number;
  stream_icon: string;
  category_id: string;
  stream_type: string;
  url: string;
}

export interface XtreamResponse {
  user_info: {
    username: string;
    password: string;
    status: string;
  };
  server_info: {
    url: string;
    port: string;
  };
  available_channels?: XtreamChannel[];
}

export async function fetchXtreamChannels(
  host: string,
  username: string,
  password: string
): Promise<XtreamChannel[]> {
  const apiUrl = `${host.replace(/\/$/, "")}/player_api.php?username=${username}&password=${password}`;

  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error("Erro ao conectar ao servidor Xtream");
  }

  const data = await res.json();

  // Alguns servidores retornam em `available_channels`, outros em `live`
  const channels = data.available_channels || data.live || [];

  // Normaliza para um formato consistente
  return channels.map((c: any) => ({
    num: c.num,
    name: c.name,
    stream_id: c.stream_id,
    stream_icon: c.stream_icon,
    category_id: c.category_id,
    stream_type: c.stream_type,
    url: `${host.replace(/\/$/, "")}/live/${username}/${password}/${c.stream_id}.ts`,
  }));
}