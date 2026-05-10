import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronLeft } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { MathRender } from "@/components/MathRender";
import { useSolutionStore } from "@/lib/store";

export const Route = createFileRoute("/_app/solve/$id/explain")({
  head: () => ({ meta: [{ title: "Explanation — MathVision" }] }),
  component: ExplainPage,
});

function ExplainPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const record = useSolutionStore((s) => s.history.find((h) => h.id === id) || s.current);
  const [i, setI] = useState(0);

  if (!record || record.steps.length === 0) {
    return (
      <>
        <AppHeader />
        <div className="glass-card mt-6 p-6 text-center text-sm text-muted-foreground">
          No explanation available. <Link to="/" className="text-primary underline">Go home</Link>
        </div>
      </>
    );
  }

  const step = record.steps[i];
  const total = record.steps.length;

  return (
    <>
      <AppHeader
        right={
          <button
            onClick={() => navigate({ to: "/solve/$id", params: { id } })}
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface/60"
            aria-label="Back"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        }
      />

      <div className="mt-2 flex items-center gap-2">
        {record.steps.map((_, idx) => (
          <div
            key={idx}
            className={`h-1 flex-1 rounded-full ${idx <= i ? "bg-primary" : "bg-border"}`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="glass-card mt-5 p-6"
        >
          <div className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">
            STEP {step.stepNumber} OF {total}
          </div>
          <div className="mt-4 overflow-x-auto">
            <MathRender tex={step.symbolic} display className="text-xl" />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{step.explanation}</p>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex gap-3">
        <button
          disabled={i === 0}
          onClick={() => setI(i - 1)}
          className="glass-card flex h-12 flex-1 items-center justify-center gap-2 rounded-full font-semibold disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" /> Previous
        </button>
        {i < total - 1 ? (
          <button
            onClick={() => setI(i + 1)}
            className="btn-gradient flex h-12 flex-1 items-center justify-center gap-2 rounded-full font-semibold"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => navigate({ to: "/solve/$id/full", params: { id } })}
            className="btn-gradient flex h-12 flex-1 items-center justify-center gap-2 rounded-full font-semibold"
          >
            Full solution <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </>
  );
}
