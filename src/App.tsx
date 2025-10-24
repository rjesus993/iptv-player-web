import { useAuthStore } from "./features/auth/store";
import LoginForm from "./components/LoginForm";
import ChannelGrid from "./components/ChannelGrid";

function App() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {isLoggedIn ? <ChannelGrid /> : <LoginForm />}
    </div>
  );
}

export default App;   // <-- ESSENCIAL