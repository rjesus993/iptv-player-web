import { useState } from "react";
import ChannelGrid from "./ChannelGrid";
import VodGrid from "./VodGrid";
import SeriesGrid from "./SeriesGrid";

export default function Menu() {
  const [section, setSection] = useState<"menu" | "tv" | "vod" | "series">("menu");

  if (section === "tv") return <ChannelGrid onBack={() => setSection("menu")} />;
  if (section === "vod") return <VodGrid onBack={() => setSection("menu")} />;
  if (section === "series") return <SeriesGrid onBack={() => setSection("menu")} />;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white space-y-4">
      <h1 className="text-2xl font-bold">Escolha uma opção</h1>
      <button onClick={() => setSection("tv")} className="bg-blue-600 px-4 py-2 rounded">📺 TV</button>
      <button onClick={() => setSection("vod")} className="bg-green-600 px-4 py-2 rounded">🎬 Filmes</button>
      <button onClick={() => setSection("series")} className="bg-purple-600 px-4 py-2 rounded">📂 Séries</button>
    </div>
  );
}