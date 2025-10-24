import { useLogos } from "../hooks/useLogos";
import LogoImage from "./LogoImage";

export default function ChannelCard({
  channel,
  onClick,
}: {
  channel: { id: string; name: string; logo?: string };
  onClick: () => void;
}) {
  const { getLogoUrl } = useLogos();

  // Resolve logo uma única vez por render
  const resolvedLogo =
    channel.logo && channel.logo.trim() !== ""
      ? channel.logo
      : getLogoUrl(channel.name);

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 rounded-lg p-3 flex flex-col items-center hover:scale-105 hover:bg-gray-700 cursor-pointer transition"
    >
      <LogoImage
        src={resolvedLogo}
        alt={channel.name}
        className="w-full h-20 object-contain"
      />
      <p className="mt-2 text-xs text-center text-gray-200">{channel.name}</p>
    </div>
  );
}