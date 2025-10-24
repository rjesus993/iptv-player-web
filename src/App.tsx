import { useAuthStore } from "./features/auth/store";
import LoginForm from "./components/LoginForm";
import Menu from "./components/Menu";

function App() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {isLoggedIn ? <Menu /> : <LoginForm />}
    </div>
  );
}

export default App;