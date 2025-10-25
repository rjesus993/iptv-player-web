import { useLogo } from "../hooks/useLogo";

interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string | null; // tvg-logo do M3U
}

export default function ChannelCard({
  channel,
  onClick,
}: { channel: Channel; onClick: () => void }) {
  const { logoSrc } = useLogo(channel.name, channel.logo || null);

  return (
    <div
      onClick={onClick}
      className="bg-gray-900 rounded-lg p-3 flex flex-col items-center cursor-pointer hover:bg-gray-800 transition"
    >
      <img
        src={logoSrc}
        alt={channel.name}
        className="w-12 h-12 object-contain mb-2"
      />
      <span className="text-sm text-white text-center">{channel.name}</span>
    </div>
  );
}