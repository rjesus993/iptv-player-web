import { useAuthStore } from "../features/auth/store";
import { loadSeries } from "../features/channels/service";
import { useEffect, useState } from "react";
import MovieCard from "./MovieCard";

export default function SeriesGrid() {
  const auth = useAuthStore();
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.type !== "xtream") {
      setError("Séries disponíveis apenas via Xtream.");
      return;
    }
    setLoading(true);
    setError(null);
    loadSeries({
      type: "xtream",
      host: auth.host!,
      username: auth.username!,
      password: auth.password!,
    })
      .then((items) => {
        setSeries(items);
        if (items.length === 0) setError("Nenhuma série encontrada.");
      })
      .catch((err) => {
        console.error(err);
        setError("Erro ao carregar séries.");
      })
      .finally(() => setLoading(false));
  }, [auth]);

  if (loading) return <p className="p-4">Carregando séries...</p>;
  if (error) return <p className="p-4 text-red-400">{error}</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Séries</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {series.map((s) => (
          <MovieCard key={s.id} item={s} onClick={() => { /* futura seleção de temporadas/episódios */ }} />
        ))}
      </div>
    </div>
  );
}