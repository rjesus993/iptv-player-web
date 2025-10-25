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

const PAGE_SIZE = 40;
const PRELOAD_TIMEOUT_MS = 800;
const SEARCH_PRELOAD_TIMEOUT_MS = 600;

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

export default function VodGrid() {
  const auth = useAuthStore();

  const [vods, setVods] = useState<Vod[]>([]);
  const [vodInfos, setVodInfos] = useState<Record<string, VodInfo>>({});
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [selectedVod, setSelectedVod] = useState<Vod | null>(null);
  const [expandedPlots, setExpandedPlots] = useState<Record<string, boolean>>({});
  const [showMoreAvailable, setShowMoreAvailable] = useState<Record<string, boolean>>({});
  const [playingVod, setPlayingVod] = useState<Vod | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(PAGE_SIZE);
  const [preloading, setPreloading] = useState(false);
  const [searchPreloading, setSearchPreloading] = useState(false);

  const topLoaderRef = useRef<HTMLDivElement | null>(null);
  const bottomLoaderRef = useRef<HTMLDivElement | null>(null);

  const [cols, setCols] = useState(6);
  useEffect(() => {
    const updateCols = () => {
      const w = window.innerWidth;
      if (w < 768) setCols(2);
      else if (w < 1024) setCols(4);
      else setCols(6);
    };
    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, []);

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

  useEffect(() => {
    setExpandedRow(null);
    setSelectedVod(null);
    setExpandedPlots({});
    setShowMoreAvailable({});
    setStartIndex(0);
    setEndIndex(PAGE_SIZE);
  }, [search, category]);

  const filtered = vods.filter((v) => {
    const matchCategory = category === "all" || v.category_id === category;
    const matchSearch = normalizeText(v.name).includes(normalizeText(search));
    return matchCategory && matchSearch;
  });

  const visibleList = filtered.slice(startIndex, endIndex);

  const preloadVodInfo = async (items: Vod[]) => {
    if (!auth) return;
    const tasks = items.map(async (vod) => {
      if (!vodInfos[vod.stream_id]) {
        try {
          const info = await loadVodInfo(auth, vod.stream_id);
          setVodInfos((prev) => ({ ...prev, [vod.stream_id]: info }));
        } catch {}
      }
    });
    await Promise.allSettled(tasks);
  };

  const preloadImages = async (items: Vod[]) => {
    const tasks = items
      .filter((v) => !!v.stream_icon)
      .map(
        (v) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.loading = "eager";
            img.decoding = "async";
            img.src = v.stream_icon!;
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      );
    await Promise.allSettled(tasks);
  };

  const preloadRange = useCallback(
    async (newStart: number, newEnd: number) => {
      if (preloading) return;
      setPreloading(true);
      const slice = filtered.slice(newStart, newEnd);
      const delay = new Promise((r) => setTimeout(r, PRELOAD_TIMEOUT_MS));
      await Promise.all([preloadVodInfo(slice), preloadImages(slice), delay]);
      setStartIndex(newStart);
      setEndIndex(newEnd);
      setPreloading(false);
    },
    [filtered, preloading]
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setSearchPreloading(true);
      const initialSlice = filtered.slice(0, PAGE_SIZE);
      const delay = new Promise((r) => setTimeout(r, SEARCH_PRELOAD_TIMEOUT_MS));
      await Promise.all([preloadVodInfo(initialSlice), preloadImages(initialSlice), delay]);
      if (!cancelled) setSearchPreloading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [search, category, vods.length]);

  useEffect(() => {
    if (!auth) return;
    const fetchDetails = async () => {
      const missing = visibleList.filter((v) => !vodInfos[v.stream_id]);
      if (missing.length > 0) {
        await preloadVodInfo(missing);
      }
    };
    fetchDetails();
  }, [auth, visibleList, vodInfos]);

  const handleBottomObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && endIndex < filtered.length) {
        const newEnd = Math.min(endIndex + PAGE_SIZE, filtered.length);
        preloadRange(startIndex, newEnd);
      }
    },
    [endIndex, filtered.length, preloadRange, startIndex]
  );

  const handleTopObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && startIndex > 0) {
        const newStart = Math.max(0, startIndex - PAGE_SIZE);
        preloadRange(newStart, endIndex);
      }
    },
    [startIndex, preloadRange, endIndex]
  );

  useEffect(() => {
    const option = { root: null, rootMargin: "20px", threshold: 1.0 };
    const bottomObserver = new IntersectionObserver(handleBottomObserver, option);
    const topObserver = new IntersectionObserver(handleTopObserver, option);
    if (bottomLoaderRef.current) bottomObserver.observe(bottomLoaderRef.current);
    if (topLoaderRef.current) topObserver.observe(topLoaderRef.current);
    return () => {
      if (bottomLoaderRef.current) bottomObserver.unobserve(bottomLoaderRef.current);
      if (topLoaderRef.current) topObserver.unobserve(topLoaderRef.current);
    };
  }, [handleBottomObserver, handleTopObserver]);

  const handleExpand = (vod: Vod, rowIndex: number) => {
    setSelectedVod(vod);
    setExpandedRow(rowIndex);
    setExpandedPlots((prev) => ({ ...prev, [vod.stream_id]: false }));
    if (!expandedRows[rowIndex]) {
      setExpandedRows((prev) => ({ ...prev, [rowIndex]: true }));
    }
  };

  const plotRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
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
  }, [selectedVod, vodInfos]);

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

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar VOD..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 rounded bg-gray-800 text-white focus:outline-none focus:ring focus:ring-blue-500"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 text-white focus:outline-none focus:ring focus:ring-blue-500"
        >
          {categories.map((cat, index) => (
            <option key={`${cat.id}-${index}`} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div ref={topLoaderRef} className="h-6 flex items-center justify-center">
        {preloading && <span className="text-xs text-gray-400">Carregando...</span>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {visibleList.map((vod, index) => {
          const rowIndex = Math.floor(index / cols);
          const isLastInRow = (index + 1) % cols === 0;
          const isLastItem = index === visibleList.length - 1;
          const infoLoaded = !!vodInfos[vod.stream_id];

          return (
            <Fragment key={`${vod.stream_id}-${startIndex + index}`}>
              <div
                className={`relative rounded overflow-hidden transition-all ${
                  selectedVod?.stream_id === vod.stream_id
                    ? "ring-4 ring-blue-500 shadow-lg shadow-blue-500/40 animate-pulse"
                    : ""
                }`}
              >
                <MovieCard
                  vod={vod}
                  searchKey={search}
                  categoryKey={category}
                  fallbackPoster={
                    vodInfos[vod.stream_id]?.info.cover || "/fallback-poster.png"
                  }
                  onClick={() => handleExpand(vod, rowIndex)}
                />
                {searchPreloading && !infoLoaded && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {(isLastInRow || isLastItem) &&
                expandedRow === rowIndex &&
                selectedVod && (
                  <div className="col-span-full bg-gray-900 text-white p-4 rounded mt-2 overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-4">
                      <img
                        key={`${selectedVod.stream_id}-${search}-${category}`}
                        src={
                          selectedVod.stream_icon ||
                          vodInfos[selectedVod.stream_id]?.info.cover ||
                          "/fallback-poster.png"
                        }
                        alt={selectedVod.name}
                        loading="eager"
                        className="w-full md:w-40 lg:w-48 h-auto rounded object-cover"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.src =
                            vodInfos[selectedVod.stream_id]?.info.cover ||
                            "/fallback-poster.png";
                        }}
                        referrerPolicy="no-referrer"
                        decoding="async"
                      />

                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{selectedVod.name}</h3>

                        {vodInfos[selectedVod.stream_id] ? (
                          <div className="animate-fadeIn">
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
                    </div>
                  </div>
                )}
            </Fragment>
          );
        })}
      </div>

      <div ref={bottomLoaderRef} className="h-8 flex items-center justify-center">
        {(preloading || searchPreloading) && (
          <span className="text-xs text-gray-400">Carregando...</span>
        )}
      </div>

      {playingVod && selectedVod && auth && (
        <VodPlayer
          url={`${auth.host}/movie/${auth.username}/${auth.password}/${playingVod.stream_id}.${playingVod.container_extension || "mp4"}`}
          title={playingVod.name}
          poster={vodInfos[selectedVod.stream_id]?.info.cover || selectedVod.stream_icon}
          onClose={() => setPlayingVod(null)}
        />
      )}
    </div>
  );
}