import { useAuthStore } from "../features/auth/store";
import { loadChannels, loadChannelCategories, Channel } from "../features/channels/service";
import { useEffect, useState } from "react";
import Player from "./Player";
import ChannelCard from "./ChannelCard";

export default function ChannelGrid() {
  const auth = useAuthStore();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filtered, setFiltered] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    if (!auth || auth.type !== "xtream") return;
    setLoading(true);
    setError(null);

    Promise.all([
      loadChannels({
        type: "xtream",
        host: auth.host!,
        username: auth.username!,
        password: auth.password!,
      }),
      loadChannelCategories({
        type: "xtream",
        host: auth.host!,
        username: auth.username!,
        password: auth.password!,
      }),
    ])
      .then(([chs, cats]) => {
        setChannels(chs);
        setFiltered(chs);
        setCategories([{ id: "all", name: "Todas" }, ...cats]);
      })
      .catch(() => setError("Erro ao carregar canais/categorias"))
      .finally(() => setLoading(false));
  }, [auth]);

  useEffect(() => {
    let list = channels;

    if (category !== "all") {
      list = list.filter((c) => c.category_id === category);
    }

    if (search.trim() !== "") {
      list = list.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFiltered(list);
  }, [search, category, channels]);

  if (loading) return <p className="p-4">Carregando canais...</p>;
  if (error) return <p className="p-4 text-red-400">{error}</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Canais</h2>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar canal..."
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
        {filtered.map((ch) => (
          <ChannelCard
            key={ch.id}
            channel={ch}
            onClick={() => setCurrentChannel(ch)}
          />
        ))}
      </div>

      {currentChannel && (
        <Player
          url={currentChannel.url}
          channelName={currentChannel.name}
          channelLogo={currentChannel.logo}
          onClose={() => setCurrentChannel(null)}
        />
      )}
    </div>
  );
}