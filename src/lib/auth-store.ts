import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  name?: string;
  emailVerified: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      logout: () => {
        set({ user: null, token: null, error: null });
        // Clear the cookie by making a logout request
        fetch("/auth/logout", {
          method: "POST",
          credentials: "include",
        }).catch(() => {
          // Ignore errors - the local state is cleared
        });
      },
    }),
    {
      name: "mathvision-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);