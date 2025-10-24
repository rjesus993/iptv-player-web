export default function ChannelCard({
  channel,
  onClick,
}: {
  channel: { id: string; name: string; logo?: string };
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-800 rounded-lg p-3 flex flex-col items-center hover:scale-105 hover:bg-gray-700 cursor-pointer transition"
    >
      <img
        src={channel.logo || "/fallback.png"}
        alt={channel.name}
        className="w-full h-20 object-contain"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = "/fallback.png";
        }}
      />
      <p className="mt-2 text-xs text-center text-gray-200">{channel.name}</p>
    </div>
  );
}