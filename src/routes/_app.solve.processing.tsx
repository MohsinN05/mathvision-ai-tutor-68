import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Check, Loader2, LogOut } from "lucide-react";
import { z } from "zod";
import { AppHeader } from "@/components/AppHeader";
import { MathRender } from "@/components/MathRender";
import { solveEquation } from "@/lib/solver.functions";
import { useSolutionStore } from "@/lib/store";

const search = z.object({ q: z.string().min(1) });

export const Route = createFileRoute("/_app/solve/processing")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Solving… — MathVision" }] }),
  component: ProcessingPage,
});

const STAGES = [
  "Parsing equation",
  "Detecting type",
  "Solving symbolically",
  "Generating result",
  "Formatting",
];

function ProcessingPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const solve = useServerFn(solveEquation);
  const { setCurrent, pushHistory } = useSolutionStore();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    let alive = true;
    let stageTimer: ReturnType<typeof setInterval> | null = null;
    stageTimer = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, 700);

    (async () => {
      const result = await solve({ data: { latex: q } });
      if (!alive) return;
      const id = crypto.randomUUID();
      const record = {
        id,
        latex: q,
        equationType: result.equationType,
        solverUsed: result.solverUsed,
        result: result.resultLatex,
        steps: result.steps,
        createdAt: Date.now(),
      };
      setCurrent(record);
      pushHistory(record);
      if (stageTimer) clearInterval(stageTimer);
      setStage(STAGES.length);
      setTimeout(() => navigate({ to: "/solve/$id", params: { id } }), 350);
    })().catch((err) => {
      console.error(err);
    });

    return () => {
      alive = false;
      if (stageTimer) clearInterval(stageTimer);
    };
  }, [q, navigate, solve, setCurrent, pushHistory]);

  return (
    <>
      <AppHeader
        right={
          <button
            onClick={() => navigate({ to: "/" })}
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface/60"
            aria-label="Cancel"
          >
            <LogOut className="h-4 w-4" />
          </button>
        }
      />

      <div className="glass-card mt-2 px-6 py-7 text-center">
        <div className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">EQUATION</div>
        <div className="mt-3">
          <MathRender tex={q} display className="text-2xl" />
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {STAGES.map((label, i) => {
          const done = i < stage;
          const active = i === stage;
          return (
            <motion.li
              key={label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card flex items-center gap-3 px-4 py-3"
            >
              <span className={`grid h-7 w-7 place-items-center rounded-full ${done ? "btn-gradient" : "border border-border bg-surface"}`}>
                {done ? (
                  <Check className="h-4 w-4 text-primary-foreground" />
                ) : active ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                )}
              </span>
              <span className={`text-sm ${done || active ? "text-foreground" : "text-muted-foreground"}`}>
                {label}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </>
  );
}
