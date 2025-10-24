export default function MovieCard({ item, onClick }: { item: any; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="relative rounded-lg overflow-hidden shadow-lg hover:scale-105 transition cursor-pointer"
    >
      {item.logo ? (
        <img src={item.logo} alt={item.name} className="w-full h-64 object-cover" />
      ) : (
        <div className="w-full h-64 flex items-center justify-center bg-gray-700 text-gray-400">
          Sem capa
        </div>
      )}
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-sm font-medium">
        {item.name}
      </div>
    </div>
  );
}