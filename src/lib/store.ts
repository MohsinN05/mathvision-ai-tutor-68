import { create } from "zustand";

export interface SolutionStep {
  stepNumber: number;
  symbolic: string; // LaTeX
  explanation: string;
  why?: string;
}

export interface SolutionRecord {
  id: string;
  latex: string;
  equationType: string;
  solverUsed: "sympy" | "wolfram" | "fallback";
  result: string; // LaTeX
  steps: SolutionStep[];
  createdAt: number;
  saved?: boolean;
}

interface SolutionStore {
  current: SolutionRecord | null;
  history: SolutionRecord[];
  setCurrent: (s: SolutionRecord | null) => void;
  pushHistory: (s: SolutionRecord) => void;
  toggleSaved: (id: string) => void;
  clearHistory: () => void;
}

const KEY = "mathvision.history.v1";
const load = (): SolutionRecord[] => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};
const save = (h: SolutionRecord[]) => {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(h.slice(0, 50)));
};

export const useSolutionStore = create<SolutionStore>((set, get) => ({
  current: null,
  history: load(),
  setCurrent: (s) => set({ current: s }),
  pushHistory: (s) => {
    const next = [s, ...get().history.filter((h) => h.id !== s.id)];
    save(next);
    set({ history: next });
  },
  toggleSaved: (id) => {
    const next = get().history.map((h) => (h.id === id ? { ...h, saved: !h.saved } : h));
    save(next);
    set({ history: next });
  },
  clearHistory: () => {
    save([]);
    set({ history: [] });
  },
}));
