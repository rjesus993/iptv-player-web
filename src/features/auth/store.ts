import { create } from "zustand";

type AuthType = "xtream" | "m3u";

interface AuthState {
  type: AuthType | null;
  host: string;
  username: string;
  password: string;
  m3uFile: File | null;
  isLoggedIn: boolean;
  login: (data: Partial<AuthState>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  type: null,
  host: "",
  username: "",
  password: "",
  m3uFile: null,
  isLoggedIn: false,
  login: (data) =>
    set((state) => ({
      ...state,
      ...data,
      isLoggedIn: true,
    })),
  logout: () =>
    set({
      type: null,
      host: "",
      username: "",
      password: "",
      m3uFile: null,
      isLoggedIn: false,
    }),
}));