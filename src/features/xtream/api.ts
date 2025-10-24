export async function fetchXtreamChannels(
  host: string,
  username: string,
  password: string
) {
  const apiUrl = `${host.replace(/\/$/, "")}/player_api.php?username=${username}&password=${password}&action=get_live_streams`;

  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error("Erro ao conectar ao servidor Xtream");
  }

  const data = await res.json();
  console.log("Resposta Xtream (canais):", data);

  return data.map((c: any) => ({
    num: c.num,
    name: c.name,
    stream_id: c.stream_id,
    stream_icon: c.stream_icon,
    category_id: c.category_id,
    stream_type: c.stream_type,
    url: `${host.replace(/\/$/, "")}/live/${username}/${password}/${c.stream_id}.ts`,
  }));
}