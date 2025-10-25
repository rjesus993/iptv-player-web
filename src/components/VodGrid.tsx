import { useAuthStore } from "../features/auth/store";
import {
  loadVod,
  loadVodCategories,
  loadVodInfo,
  Vod,
  VodInfo,
} from "../features/vod/service";
import { useEffect, useState, useRef, useCallback } from "react";
import MovieCard from "./MovieCard";
import VodPlayer from "./VodPlayer";
import { PlayIcon } from "@heroicons/react/24/solid";

const PAGE_SIZE = 20;
// Ajuste este valor para corresponder às colunas do seu grid (md, lg).
// Usaremos a configuração de colunas do layout base (lg:grid-cols-6).
const COLS = 6;

export default function VodGrid() {
  const auth = useAuthStore();

  // Dados base
  const [vods, setVods] = useState<Vod[]>([]);
  const [vodInfos, setVodInfos] = useState<Record<string, VodInfo>>({});
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado de UI
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [selectedVod, setSelectedVod] = useState<Vod | null>(null);
  const [expandedPlots, setExpandedPlots] = useState<Record<string, boolean>>({});
  const [playingVod, setPlayingVod] = useState<Vod | null>(null);

  // Filtros e paginação
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Carregar lista de VOD e categorias
  useEffect(() => {
    if (!auth || auth.type !== "xtream") return;
    setLoading(true);
    setError(null);

    Promise.all([
      loadVod({
        type: "xtream",
        host: auth.host!,
        username: auth.username!,
        password: auth.password!,
      }),
      loadVodCategories({
        type: "xtream",
        host: auth.host!,
        username: auth.username!,
        password: auth.password!,
      }),
    ])
      .then(([vodList, cats]) => {
        setVods(vodList);
        setCategories([{ id: "all", name: "Todas" }, ...cats]);
      })
      .catch(() => setError("Erro ao carregar VOD"))
      .finally(() => setLoading(false));
  }, [auth]);

  // Filtrar por categoria e busca
  const filtered = vods.filter((v) => {
    const matchCategory = category === "all" || v.category_id === category;
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Paginação (infinite scroll)
  const paginated = filtered.slice(0, page * PAGE_SIZE);

  // Pré-carregar detalhes dos VODs paginados
  useEffect(() => {
    if (!auth) return;
    const fetchDetails = async () => {
      for (const vod of paginated) {
        if (!vodInfos[vod.stream_id]) {
          try {
            const info = await loadVodInfo(auth, vod.stream_id);
            setVodInfos((prev) => ({ ...prev, [vod.stream_id]: info }));
          } catch {
            // Silencia erros individuais
          }
        }
      }
    };
    fetchDetails();
  }, [auth, paginated, vodInfos]);

  // Observador do infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && paginated.length < filtered.length) {
        setPage((prev) => prev + 1);
      }
    },
    [filtered.length, paginated.length]
  );

  useEffect(() => {
    const option = { root: null, rootMargin: "20px", threshold: 1.0 };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [handleObserver]);

  // Clique em um card: define linha expandida, VOD selecionado,
  // e marca a linha como "já animada" após a primeira abertura
  const handleExpand = (vod: Vod, rowIndex: number) => {
    setSelectedVod(vod);
    setExpandedRow(rowIndex);
    setExpandedPlots((prev) => ({ ...prev, [vod.stream_id]: false }));
    if (!expandedRows[rowIndex]) {
      setExpandedRows((prev) => ({ ...prev, [rowIndex]: true }));
    }
  };

  if (loading) return <p className="p-4">Carregando VOD...</p>;
  if (error) return <p className="p-4 text-red-400">{error}</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Filmes e Séries</h2>

      {/* Barra de busca e categorias */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar VOD..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 px-3 py-2 rounded bg-gray-800 text-white focus:outline-none focus:ring focus:ring-blue-500"
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded bg-gray-800 text-white focus:outline-none focus:ring focus:ring-blue-500"
        >
          {categories.map((cat, index) => (
            <option key={`${cat.id}-${index}`} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grid de filmes */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {paginated.map((vod, index) => {
          const rowIndex = Math.floor(index / COLS);

          return (
            <div key={`${vod.stream_id}-${index}`}>
              <MovieCard vod={vod} onClick={() => handleExpand(vod, rowIndex)} />

              {expandedRow === rowIndex && selectedVod?.stream_id === vod.stream_id && (
                <div
                  className={`bg-gray-900 text-white p-4 rounded mt-2 overflow-hidden
                    ${expandedRows[rowIndex] ? "" : "animate-slideDown"}`}
                >
                  <h3 className="text-lg font-bold">{selectedVod.name}</h3>

                  {vodInfos[selectedVod.stream_id] ? (
                    <div key={selectedVod.stream_id} className="animate-fadeIn">
                      {/* Resumo com altura fixa padrão: max-h-24 e overflow-hidden */}
                      <div
                        className={`text-sm text-gray-300 mb-2 transition-all duration-300 ${
                          expandedPlots[selectedVod.stream_id]
                            ? "max-h-none"
                            : "max-h-24 overflow-hidden"
                        }`}
                      >
                        {vodInfos[selectedVod.stream_id].info.plot ||
                          "Sem descrição disponível."}
                      </div>

                      {/* Botão mostrar mais/menos aparece quando texto potencialmente excede o limite */}
                      {vodInfos[selectedVod.stream_id].info.plot &&
                        vodInfos[selectedVod.stream_id].info.plot.length > 200 && (
                          <button
                            onClick={() =>
                              setExpandedPlots((prev) => ({
                                ...prev,
                                [selectedVod.stream_id]:
                                  !prev[selectedVod.stream_id],
                              }))
                            }
                            className="text-blue-400 text-xs hover:underline"
                          >
                            {expandedPlots[selectedVod.stream_id]
                              ? "Mostrar menos"
                              : "Mostrar mais"}
                          </button>
                        )}

                      <p className="text-xs text-gray-400 mt-2">
                        {vodInfos[selectedVod.stream_id].info.releasedate ||
                          "Data desconhecida"}{" "}
                        •{" "}
                        {vodInfos[selectedVod.stream_id].info.duration ||
                          "Duração desconhecida"}{" "}
                        • ⭐{" "}
                        {vodInfos[selectedVod.stream_id].info.rating || "N/A"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Carregando detalhes...</p>
                  )}

                  <button
                    onClick={() => setPlayingVod(selectedVod)}
                    className="mt-3 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                  >
                    <PlayIcon className="w-5 h-5 text-white" />
                    Play
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Loader para infinite scroll */}
      <div ref={loaderRef} className="h-10"></div>

      {/* Player */}
      {playingVod && selectedVod && (
        <VodPlayer
          url={`${auth.host}/movie/${auth.username}/${auth.password}/${playingVod.stream_id}.${playingVod.container_extension || "mp4"}`}
          title={playingVod.name}
          poster={playingVod.stream_icon}
          onClose={() => setPlayingVod(null)}
        />
      )}
    </div>
  );
}