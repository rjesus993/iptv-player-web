import { useState } from "react";
import { useAuthStore } from "../features/auth/store";

export default function LoginForm() {
  const login = useAuthStore((s) => s.login);
  const [mode, setMode] = useState<"xtream" | "m3u">("xtream");

  const [host, setHost] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [m3uFile, setM3uFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "xtream") {
      if (!host || !username || !password) {
        alert("Preencha todos os campos!");
        return;
      }

      const apiUrl = `${host.replace(/\/$/, "")}/player_api.php?username=${username}&password=${password}`;
      console.log("Xtream API URL:", apiUrl);

      login({
        type: "xtream",
        host,
        username,
        password,
      });
    } else {
      if (!m3uFile) {
        alert("Selecione um arquivo M3U!");
        return;
      }
      login({ type: "m3u", m3uFile });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded shadow-md w-96 space-y-4"
      >
        <h1 className="text-xl font-bold text-center">IPTV Login</h1>

        <div className="flex justify-center space-x-4">
          <button
            type="button"
            onClick={() => setMode("xtream")}
            className={`px-3 py-1 rounded ${
              mode === "xtream" ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            Xtream
          </button>
          <button
            type="button"
            onClick={() => setMode("m3u")}
            className={`px-3 py-1 rounded ${
              mode === "m3u" ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            M3U
          </button>
        </div>

        {mode === "xtream" ? (
          <>
            <input
              type="text"
              placeholder="Host (http://exemplo.com:8080)"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              className="w-full p-2 rounded bg-gray-700"
            />
            <input
              type="text"
              placeholder="Usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 rounded bg-gray-700"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded bg-gray-700"
            />
          </>
        ) : (
          <input
            type="file"
            accept=".m3u,.m3u8"
            onChange={(e) => setM3uFile(e.target.files?.[0] || null)}
            className="w-full p-2 rounded bg-gray-700"
          />
        )}

        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 p-2 rounded"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}