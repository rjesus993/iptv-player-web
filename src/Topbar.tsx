import { useAuthStore } from "../../features/auth/store";

export default function Topbar() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4 text-white">
      <h1 className="font-bold">Meu IPTV</h1>
      <button
        onClick={logout}
        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
      >
        Sair
      </button>
    </header>
  );
}