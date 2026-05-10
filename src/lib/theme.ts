import { create } from "zustand";

type Theme = "dark" | "light";
interface ThemeStore {
  theme: Theme;
  toggle: () => void;
}

export const useTheme = create<ThemeStore>((set, get) => ({
  theme: "dark",
  toggle: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("light", next === "light");
    }
    set({ theme: next });
  },
}));
