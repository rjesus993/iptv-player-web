export default function ChannelCard({ channel, onClick }: { channel: any; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-800 rounded-lg p-3 flex flex-col items-center hover:bg-gray-700 cursor-pointer transition"
    >
      {channel.logo ? (
        <img src={channel.logo} alt={channel.name} className="w-full h-20 object-contain" />
      ) : (
        <div className="w-full h-20 flex items-center justify-center text-gray-400 text-sm">
          Sem logo
        </div>
      )}
      <p className="mt-2 text-xs text-center text-gray-200">{channel.name}</p>
    </div>
  );
}