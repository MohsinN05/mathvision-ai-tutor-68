import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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

  const steps = record?.steps ?? [];
  const step = steps[i];
  const total = steps.length;

  const stepList = useMemo(
    () =>
      steps.map((s) => ({
        title: s.explanation.split(".")[0],
        number: s.stepNumber,
      })),
    [steps],
  );

  if (!record || total === 0) {
    return (
      <>
        <AppHeader />
        <div className="glass-card mt-6 p-6 text-center text-sm text-muted-foreground">
          No explanation available. <Link to="/" className="text-primary underline">Go home</Link>
        </div>
      </>
    );
  }

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

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <div>
          <div className="glass-card p-6">
            <div className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">
              STEP {step.stepNumber} OF {total}
            </div>
            <div className="mt-3 text-sm text-muted-foreground">Solving <strong>{record.equationType}</strong> equations step-by-step.</div>
            <div className="mt-6 overflow-x-auto">
              <MathRender tex={step.symbolic} display className="text-xl" />
            </div>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{step.explanation}</p>
            {step.why ? (
              <div className="mt-4 rounded-3xl border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Why this matters</div>
                <p className="mt-2 text-sm text-foreground">{step.why}</p>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
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
        </div>

        <div className="glass-card p-5">
          <div className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">STEP-BY-STEP IMPLEMENTATION</div>
          <div className="mt-4 space-y-3">
            {stepList.map((item) => (
              <button
                key={item.number}
                onClick={() => setI(item.number - 1)}
                className={`w-full rounded-3xl border p-4 text-left transition ${item.number - 1 === i ? "border-primary bg-primary/10" : "border-border bg-surface hover:border-primary/80"}`}
              >
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Step {item.number}</div>
                <div className="mt-1 text-sm text-foreground">{item.title}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
