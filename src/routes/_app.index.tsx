import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { MathRender } from "@/components/MathRender";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "MathVision — AI Symbolic Math Solver" },
      { name: "description", content: "Solve equations symbolically with step-by-step explanations. Algebra, calculus, trig and more." },
      { property: "og:title", content: "MathVision — AI Symbolic Math Solver" },
      { property: "og:description", content: "Notebook-style step-by-step math solutions powered by symbolic AI." },
    ],
  }),
  component: SolverHome,
});

const EXAMPLES = [
  { label: "QUADRATIC", tex: "x^2 - 5x + 6 = 0" },
  { label: "INTEGRAL", tex: "\\int x^2\\, dx" },
  { label: "TRIG IDENTITY", tex: "\\sin^2(x) + \\cos^2(x)" },
  { label: "DERIVATIVE", tex: "\\frac{d}{dx}(x^3 + 2x)" },
];

function SolverHome() {
  const navigate = useNavigate();
  const [latex, setLatex] = useState("");

  const submit = (value: string) => {
    const v = value.trim();
    if (!v) return;
    navigate({
      to: "/solve/processing",
      search: { q: v },
    });
  };

  return (
    <>
      <AppHeader />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-2"
      >
        <h1 className="font-display text-3xl font-bold leading-tight">
          What shall we <span className="gradient-text">solve</span> today?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Type LaTeX or snap an equation.</p>
      </motion.div>

      <div className="glass-card mt-6 p-4">
        <textarea
          value={latex}
          onChange={(e) => setLatex(e.target.value)}
          placeholder="\int x^2\, dx"
          rows={4}
          className="w-full resize-none bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(latex);
          }}
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            aria-label="Upload equation image"
            className="grid h-12 w-12 place-items-center rounded-full border border-border bg-surface/60 text-muted-foreground transition hover:bg-surface"
            onClick={() => alert("Handwriting OCR coming soon.")}
          >
            <Camera className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => submit(latex)}
            className="btn-gradient flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-6 font-semibold"
          >
            <Sparkles className="h-4 w-4" />
            <span>Solve</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">EXAMPLES</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => submit(ex.tex)}
              className="glass-card flex flex-col items-center gap-1 px-4 py-3 text-left transition hover:-translate-y-0.5"
            >
              <span className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">
                {ex.label}
              </span>
              <MathRender tex={ex.tex} className="text-sm" />
            </button>
          ))}
        </div>
      </section>

      <section className="glass-card mt-8 flex flex-col items-center gap-3 p-5 text-center">
        <p className="text-sm text-muted-foreground">Sign in to save your work.</p>
        <button className="btn-gradient rounded-full px-6 py-2 text-sm font-semibold">
          Sign in
        </button>
      </section>
    </>
  );
}
