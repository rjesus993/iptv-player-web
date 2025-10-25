import { useAuthStore } from "../features/auth/store";
import {
  loadVod,
  loadVodCategories,
  loadVodInfo,
  Vod,
  VodInfo,
} from "../features/vod/service";
import { useEffect, useState, useRef, useCallback, Fragment } from "react";
import MovieCard from "./MovieCard";
import VodPlayer from "./VodPlayer";
import { PlayIcon } from "@heroicons/react/24/solid";

const PAGE_SIZE = 20;

export default function VodGrid() {
  const auth = useAuthStore();

  // Dados
  const [vods, setVods] = useState<Vod[]>([]);
  const [vodInfos, setVodInfos] = useState<Record<string, VodInfo>>({});
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [selectedVod, setSelectedVod] = useState<Vod | null>(null);
  const [expandedPlots, setExpandedPlots] = useState<Record<string, boolean>>({});
  const [showMoreAvailable, setShowMoreAvailable] = useState<Record<string, boolean>>({});
  const [playingVod, setPlayingVod] = useState<Vod | null>(null);

  // Filtros e paginação
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Colunas dinâmicas por breakpoint (2 / 4 / 6)
  const [cols, setCols] = useState(6);
  useEffect(() => {
    const updateCols = () => {
      const w = window.innerWidth;
      if (w < 768) setCols(2); // sm
      else if (w < 1024) setCols(4); // md
      else setCols(6); // lg
    };
    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, []);

  // Fechar painel expandido ao mudar busca ou categoria
  useEffect(() => {
    setExpandedRow(null);
    setSelectedVod(null);
  }, [search, category]);

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

  // Filtrar
  const filtered = vods.filter((v) => {
    const matchCategory = category === "all" || v.category_id === category;
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Paginação
  const paginated = filtered.slice(0, page * PAGE_SIZE);

  // Pré-carregar detalhes dos visíveis
  useEffect(() => {
    if (!auth) return;
    const fetchDetails = async () => {
      for (const vod of paginated) {
        if (!vodInfos[vod.stream_id]) {
          try {
            const info = await loadVodInfo(auth, vod.stream_id);
            setVodInfos((prev) => ({ ...prev, [vod.stream_id]: info }));
          } catch {
            // ignora erros individuais
          }
        }
      }
    };
    fetchDetails();
  }, [auth, paginated, vodInfos]);

  // Infinite scroll
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

  // Expandir card
  const handleExpand = (vod: Vod, rowIndex: number) => {
    setSelectedVod(vod);
    setExpandedRow(rowIndex);
    setExpandedPlots((prev) => ({ ...prev, [vod.stream_id]: false }));
    if (!expandedRows[rowIndex]) {
      setExpandedRows((prev) => ({ ...prev, [rowIndex]: true }));
    }
  };

  // Refs para medir altura do resumo
  const plotRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Medir quando troca o VOD selecionado ou chegam infos
  useEffect(() => {
    if (selectedVod) {
      const el = plotRefs.current[selectedVod.stream_id];
      if (el) {
        const needsShowMore = el.scrollHeight > el.clientHeight;
        setShowMoreAvailable((prev) => ({
          ...prev,
          [selectedVod.stream_id]: needsShowMore,
        }));
      } else {
        setShowMoreAvailable((prev) => ({
          ...prev,
          [selectedVod.stream_id]: false,
        }));
      }
    }
  }, [selectedVod, vodInfos]);

  // Re-medida ao redimensionar (pode alterar quebras de linha)
  useEffect(() => {
    const onResize = () => {
      if (selectedVod) {
        const el = plotRefs.current[selectedVod.stream_id];
        if (el) {
          const needsShowMore = el.scrollHeight > el.clientHeight;
          setShowMoreAvailable((prev) => ({
            ...prev,
            [selectedVod.stream_id]: needsShowMore,
          }));
        }
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [selectedVod]);

  // Alternar mostrar mais/menos e re-medir depois da transição
  const togglePlot = (id: string) => {
    setExpandedPlots((prev) => ({ ...prev, [id]: !prev[id] }));
    requestAnimationFrame(() => {
      const el = plotRefs.current[id];
      if (el) {
        const needsShowMore = el.scrollHeight > el.clientHeight;
        setShowMoreAvailable((prev) => ({ ...prev, [id]: needsShowMore }));
      }
    });
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

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {paginated.map((vod, index) => {
          const rowIndex = Math.floor(index / cols);
          const isLastInRow = (index + 1) % cols === 0;
          const isLastItem = index === paginated.length - 1;

          return (
            <Fragment key={`${vod.stream_id}-${index}`}>
              {/* Card com glow animado no selecionado */}
              <div
                className={`relative rounded overflow-hidden transition-all ${
                  selectedVod?.stream_id === vod.stream_id
                    ? "ring-4 ring-blue-500 shadow-lg shadow-blue-500/40 animate-pulse"
                    : ""
                }`}
              >
                <MovieCard vod={vod} onClick={() => handleExpand(vod, rowIndex)} />
              </div>

              {/* Painel expandido ocupa a linha inteira; inclui correção da última linha */}
              {(isLastInRow || isLastItem) &&
                expandedRow === rowIndex &&
                selectedVod && (
                  <div
                    className={`col-span-full bg-gray-900 text-white p-4 rounded mt-2 overflow-hidden ${
                      expandedRows[rowIndex] ? "" : "animate-slideDown"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Poster opcional à esquerda */}
                      {selectedVod.stream_icon && (
                        <img
                          src={selectedVod.stream_icon}
                          alt={selectedVod.name}
                          className="w-full md:w-40 lg:w-48 h-auto rounded object-cover"
                        />
                      )}

                      {/* Conteúdo */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{selectedVod.name}</h3>

                        {vodInfos[selectedVod.stream_id] ? (
                          <div key={selectedVod.stream_id} className="animate-fadeIn">
                            {/* Resumo com altura fixa padrão: max-h-24 + overflow-hidden */}
                            <div
                              ref={(el) => (plotRefs.current[selectedVod.stream_id] = el)}
                              className={`text-sm text-gray-300 mb-2 transition-all duration-300 ${
                                expandedPlots[selectedVod.stream_id]
                                  ? "max-h-none"
                                  : "max-h-24 overflow-hidden"
                              }`}
                            >
                              {vodInfos[selectedVod.stream_id].info.plot ||
                                "Sem descrição disponível."}
                            </div>

                            {/* Mostrar mais baseado na altura real */}
                            {showMoreAvailable[selectedVod.stream_id] && (
                              <button
                                onClick={() => togglePlot(selectedVod.stream_id)}
                                className="text-blue-400 text-xs hover:underline"
                              >
                                {expandedPlots[selectedVod.stream_id]
                                  ? "Mostrar menos"
                                  : "Mostrar mais"}
                              </button>
                            )}

                            {/* Metadados */}
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

                        {/* Botão Play */}
                        <button
                          onClick={() => setPlayingVod(selectedVod)}
                          className="mt-3 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                        >
                          <PlayIcon className="w-5 h-5 text-white" />
                          Play
                        </button>
                      </div>
                    </div>
                  </div>
                )}
            </Fragment>
          );
        })}
      </div>

      {/* Loader para infinite scroll */}
      <div ref={loaderRef} className="h-10"></div>

      {/* Player */}
      {playingVod && selectedVod && auth && (
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