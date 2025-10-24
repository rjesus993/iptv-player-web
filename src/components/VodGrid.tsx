import { useAuthStore } from "../features/auth/store";
import { loadVod } from "../features/channels/service";
import { useEffect, useState } from "react";
import MovieCard from "./MovieCard";
import Player from "./Player";

export default function VodGrid() {
  const auth = useAuthStore();
  const [vods, setVods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.type !== "xtream") {
      setError("Filmes disponíveis apenas via Xtream.");
      return;
    }
    setLoading(true);
    setError(null);
    loadVod({
      type: "xtream",
      host: auth.host!,
      username: auth.username!,
      password: auth.password!,
    })
      .then((items) => {
        setVods(items);
        if (items.length === 0) setError("Nenhum filme encontrado.");
      })
      .catch((err) => {
        console.error(err);
        setError("Erro ao carregar filmes.");
      })
      .finally(() => setLoading(false));
  }, [auth]);

  if (loading) return <p className="p-4">Carregando filmes...</p>;
  if (error) return <p className="p-4 text-red-400">{error}</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Filmes</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {vods.map((v) => (
          <MovieCard key={v.id} item={v} onClick={() => setCurrentUrl(v.url)} />
        ))}
      </div>

      {currentUrl && <Player url={currentUrl} onClose={() => setCurrentUrl(null)} />}
    </div>
  );
}