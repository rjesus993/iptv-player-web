import { useAuthStore } from "../features/auth/store";
import { loadChannels, Channel } from "../features/channels/service";
import { useEffect, useState } from "react";
import Player from "./Player";

export default function ChannelGrid() {
  const auth = useAuthStore();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.type) return;

    setLoading(true);
    setError(null);

    const source =
      auth.type === "xtream"
        ? {
            type: "xtream" as const,
            host: auth.host!,
            username: auth.username!,
            password: auth.password!,
          }
        : {
            type: "m3u" as const,
            file: auth.m3uFile!,
          };

    loadChannels(source)
      .then(setChannels)
      .catch((err) => {
        console.error(err);
        setError("Erro ao carregar canais");
      })
      .finally(() => setLoading(false));
  }, [auth]);

  if (loading) return <p className="p-4">Carregando canais...</p>;
  if (error) return <p className="p-4 text-red-400">{error}</p>;

  return (
    <div className="p-4 bg-gray-900 min-h-screen">
      <h2 className="text-xl font-bold text-white mb-4">Canais</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {channels.map((ch) => (
          <div
            key={ch.id}
            onClick={() => setCurrentUrl(ch.url)}
            className="bg-gray-800 p-2 rounded hover:bg-gray-700 cursor-pointer flex flex-col items-center"
          >
            {ch.logo ? (
              <img
                src={ch.logo}
                alt={ch.name}
                className="w-full h-24 object-contain"
              />
            ) : (
              <div className="w-full h-24 flex items-center justify-center text-gray-400 text-sm">
                Sem logo
              </div>
            )}
            <p className="text-white text-sm mt-2 text-center">{ch.name}</p>
          </div>
        ))}
      </div>

      {currentUrl && (
        <Player url={currentUrl} onClose={() => setCurrentUrl(null)} />
      )}
    </div>
  );
}