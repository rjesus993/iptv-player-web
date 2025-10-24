import { useAuthStore } from "../features/auth/store";
import { loadChannels, Channel } from "../features/channels/service";
import { useEffect, useState } from "react";
import Player from "./Player";
import ChannelCard from "./ChannelCard";

export default function ChannelGrid() {
  const auth = useAuthStore();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!auth || !auth.type) return;

    setLoading(true);
    setError(null);

    if (auth.type === "xtream") {
      loadChannels({
        type: "xtream",
        host: auth.host!,
        username: auth.username!,
        password: auth.password!,
      })
        .then((chs) => {
          setChannels(chs);
          if (chs.length === 0) setError("Nenhum canal encontrado.");
        })
        .catch((err) => {
          console.error(err);
          setError("Erro ao carregar canais. Verifique as credenciais ou o arquivo M3U.");
        })
        .finally(() => setLoading(false));
    } else if (auth.type === "m3u" && auth.m3uFile) {
      loadChannels({ type: "m3u", file: auth.m3uFile })
        .then((chs) => {
          setChannels(chs);
          if (chs.length === 0) setError("Nenhum canal encontrado.");
        })
        .catch((err) => {
          console.error(err);
          setError("Erro ao carregar canais. Verifique o arquivo M3U.");
        })
        .finally(() => setLoading(false));
    }
  }, [auth]);

  if (loading) return <p className="p-4">Carregando canais...</p>;
  if (error) return <p className="p-4 text-red-400">{error}</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Canais</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {channels.map((ch) => (
          <ChannelCard key={ch.id} channel={ch} onClick={() => setCurrentUrl(ch.url)} />
        ))}
      </div>

      {currentUrl && <Player url={currentUrl} onClose={() => setCurrentUrl(null)} />}
    </div>
  );
}