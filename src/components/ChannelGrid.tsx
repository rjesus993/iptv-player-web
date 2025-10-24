import { useAuthStore } from "../features/auth/store";
import { fetchXtreamChannels } from "../features/xtream/api";
import { useEffect, useState } from "react";

export default function ChannelGrid() {
  const { host, username, password, type } = useAuthStore();
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (type === "xtream" && host && username && password) {
      setLoading(true);
      fetchXtreamChannels(host, username, password)
        .then((chs) => {
          setChannels(chs);
          if (chs.length === 0) {
            setError("Nenhum canal encontrado.");
          }
        })
        .catch((err) => {
          console.error("Erro ao carregar canais:", err);
          setError("Erro ao carregar canais. Verifique host/usuário/senha.");
        })
        .finally(() => setLoading(false));
    }
  }, [host, username, password, type]);

  if (loading) return <p className="p-4">Carregando canais...</p>;
  if (error) return <p className="p-4 text-red-400">{error}</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
      {channels.map((ch) => (
        <div
          key={ch.stream_id}
          className="bg-gray-800 p-2 rounded hover:bg-gray-700 cursor-pointer"
        >
          {ch.stream_icon && (
            <img
              src={ch.stream_icon}
              alt={ch.name}
              className="w-full h-24 object-contain"
            />
          )}
          <p className="text-white text-sm mt-2">{ch.name}</p>
        </div>
      ))}
    </div>
  );
}