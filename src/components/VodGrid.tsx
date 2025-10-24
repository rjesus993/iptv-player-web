import { useAuthStore } from "../features/auth/store";
import { loadVod } from "../features/channels/service";
import { useEffect, useState } from "react";

export default function VodGrid({ onBack }: { onBack: () => void }) {
  const auth = useAuthStore();
  const [vods, setVods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth.type === "xtream") {
      setLoading(true);
      loadVod({
        type: "xtream",
        host: auth.host!,
        username: auth.username!,
        password: auth.password!,
      }).then(setVods).finally(() => setLoading(false));
    }
  }, [auth]);

  if (loading) return <p className="p-4">Carregando filmes...</p>;

  return (
    <div className="p-4 bg-gray-900 min-h-screen text-white">
      <button onClick={onBack} className="mb-4 bg-gray-700 px-3 py-1 rounded">← Voltar</button>
      <h2 className="text-xl font-bold mb-4">Filmes</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {vods.map((v) => (
          <div key={v.id} className="bg-gray-800 p-2 rounded">
            {v.logo && <img src={v.logo} alt={v.name} className="w-full h-32 object-cover" />}
            <p className="mt-2 text-sm">{v.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}