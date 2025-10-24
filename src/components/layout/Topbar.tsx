import { Search, LogOut } from "lucide-react";
import { useAuthStore } from "../../features/auth/store";

export default function Topbar() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6 text-white shadow">
      <div className="flex items-center gap-3">
        <Search size={18} className="text-gray-400" />
        <input
          type="text"
          placeholder="Buscar..."
          className="bg-gray-700 text-sm px-3 py-1 rounded focus:outline-none focus:ring focus:ring-blue-500"
        />
      </div>
      <button
        onClick={logout}
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
      >
        <LogOut size={16} /> Sair
      </button>
    </header>
  );
}