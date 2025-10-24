import { useAuthStore } from "../features/auth/store";
import { loadSeries } from "../features/channels/service";
import { useEffect, useState } from "react";

export default function SeriesGrid({ onBack }: { onBack: () => void }) {
  const auth = useAuthStore();
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth.type === "xtream") {
      setLoading(true);
      loadSeries({
        type: "xtream",
        host: auth.host!,
        username: auth.username!,
        password: auth.password!,
      }).then(setSeries).finally(() => setLoading(false));
    }
  }, [auth]);

  if (loading) return <p className="p-4">Carregando séries...</p>;

  return (
    <div className="p-4 bg-gray-900 min-h-screen text-white">
      <button onClick={onBack} className="mb-4 bg-gray-700 px-3 py-1 rounded">← Voltar</button>
      <h2 className="text-xl font-bold mb-4">Séries</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {series.map((s) => (
          <div key={s.id} className="bg-gray-800 p-2 rounded">
            {s.logo && <img src={s.logo} alt={s.name} className="w-full h-32 object-cover" />}
            <p className="mt-2 text-sm">{s.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}