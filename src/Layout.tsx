import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ChannelGrid from "../ChannelGrid";
import VodGrid from "../VodGrid";
import SeriesGrid from "../SeriesGrid";

export default function Layout() {
  const [section, setSection] = useState<"tv" | "vod" | "series">("tv");

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar onSelect={setSection} />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4">
          {section === "tv" && <ChannelGrid />}
          {section === "vod" && <VodGrid />}
          {section === "series" && <SeriesGrid />}
        </main>
      </div>
    </div>
  );
}