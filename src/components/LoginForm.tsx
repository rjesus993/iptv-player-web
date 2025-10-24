import { useState, useEffect } from "react";
import { useAuthStore } from "../features/auth/store";

export default function LoginForm() {
  const login = useAuthStore((s) => s.login);

  const [host, setHost] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Carrega credenciais salvas ao montar
  useEffect(() => {
    const savedHost = localStorage.getItem("iptv_host");
    const savedUser = localStorage.getItem("iptv_user");
    const savedPass = localStorage.getItem("iptv_pass");
    if (savedHost) setHost(savedHost);
    if (savedUser) setUsername(savedUser);
    if (savedPass) setPassword(savedPass);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!host || !username || !password) {
      alert("Preencha todos os campos!");
      return;
    }

    // Salva credenciais no localStorage
    localStorage.setItem("iptv_host", host);
    localStorage.setItem("iptv_user", username);
    localStorage.setItem("iptv_pass", password);

    login({
      type: "xtream",
      host,
      username,
      password,
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded shadow-md w-96 space-y-4"
      >
        <h1 className="text-xl font-bold text-center">IPTV Login</h1>

        {/* Campos de login */}
        <input
          type="text"
          placeholder="Host (http://seuservidor:80)"
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