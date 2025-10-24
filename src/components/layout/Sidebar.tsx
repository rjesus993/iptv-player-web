import { useState } from "react";
import { Tv, Film, Clapperboard } from "lucide-react";

export default function Sidebar({ onSelect }: { onSelect: (section: "tv" | "vod" | "series") => void }) {
  const [active, setActive] = useState<"tv" | "vod" | "series">("tv");

  const item = (key: "tv" | "vod" | "series", label: string, Icon: any) => (
    <button
      key={key}
      onClick={() => {
        setActive(key);
        onSelect(key);
      }}
      className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg transition ${
        active === key ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  return (
    <aside className="w-60 bg-gray-900 text-white flex flex-col border-r border-gray-800">
      <div className="p-4 text-2xl font-bold border-b border-gray-800">Meu IPTV</div>
      <nav className="flex-1 p-3 space-y-2">
        {item("tv", "TV", Tv)}
        {item("vod", "Filmes", Film)}
        {item("series", "Séries", Clapperboard)}
      </nav>
      <div className="p-3 text-xs text-gray-500 border-t border-gray-800">
        UI inspirada em streamingriver/ui
      </div>
    </aside>
  );
}