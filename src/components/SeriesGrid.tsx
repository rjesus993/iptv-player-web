import { useAuthStore } from "../features/auth/store";
import { loadSeries, loadSeriesCategories } from "../features/channels/service";
import { useEffect, useState } from "react";
import MovieCard from "./MovieCard";

export default function SeriesGrid() {
  const auth = useAuthStore();
  const [series, setSeries] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    if (auth.type !== "xtream") {
      setError("Séries disponíveis apenas via Xtream.");
      return;
    }
    setLoading(true);
    setError(null);

    Promise.all([
      loadSeries({
        type: "xtream",
        host: auth.host!,
        username: auth.username!,
        password: auth.password!,
      }),
      loadSeriesCategories({
        type: "xtream",
        host: auth.host!,
        username: auth.username!,
        password: auth.password!,
      }),
    ])
      .then(([items, cats]) => {
        setSeries(items);
        setFiltered(items);
        setCategories([{ id: "all", name: "Todas" }, ...cats]);
      })
      .catch((err) => {
        console.error(err);
        setError("Erro ao carregar séries.");
      })
      .finally(() => setLoading(false));
  }, [auth]);

  useEffect(() => {
    let list = series;

    if (category !== "all") {
      list = list.filter((s) => s.category_id === category);
    }

    if (search.trim() !== "") {
      list = list.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFiltered(list);
  }, [search, category, series]);

  if (loading) return <p className="p-4">Carregando séries...</p>;
  if (error) return <p className="p-4 text-red-400">{error}</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Séries</h2>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar série..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 rounded bg-gray-800 text-white focus:outline-none focus:ring focus:ring-blue-500"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 text-white focus:outline-none focus:ring focus:ring-blue-500"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.map((s) => (
          <MovieCard
            key={s.id}
            item={s}
            onClick={() => {
              // futuro: abrir temporadas/episódios
              console.log("Selecionada série:", s.name);
            }}
          />
        ))}
      </div>
    </div>
  );
}