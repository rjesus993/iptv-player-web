import { create } from "zustand";

export type AuthType = "xtream" | "m3u";

interface AuthState {
  type?: AuthType;
  host?: string;
  username?: string;
  password?: string;
  m3uFile?: File;
  isLoggedIn: boolean;
  login: (data: Partial<AuthState>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  login: (data) => set({ ...data, isLoggedIn: true }),
  logout: () =>
    set({
      type: undefined,
      host: undefined,
      username: undefined,
      password: undefined,
      m3uFile: undefined,
      isLoggedIn: false,
    }),
}));