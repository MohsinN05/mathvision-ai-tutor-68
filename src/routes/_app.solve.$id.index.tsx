import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Sparkles, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { MathRender } from "@/components/MathRender";
import { useSolutionStore } from "@/lib/store";

export const Route = createFileRoute("/_app/solve/$id/")({
  head: () => ({ meta: [{ title: "Solution - MathVision" }] }),
  component: ResultPage,
});

function ResultPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const record = useSolutionStore((s) => s.history.find((h) => h.id === id) || s.current);

  if (!record) {
    return (
      <>
        <AppHeader />
        <div className="glass-card mt-6 p-6 text-center text-sm text-muted-foreground">
          Solution not found.{" "}
          <Link to="/" className="text-primary underline">
            Go home
          </Link>
        </div>
      </>
    );
  }

  const isFallback = record.solverUsed === "fallback";

  return (
    <>
      <AppHeader />

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-2 space-y-4">
        <div className="glass-card p-5">
          <div className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">EQUATION</div>
          <div className="mt-3">
            <MathRender tex={record.latex} display className="text-xl" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
            <span className="pill px-3 py-1 uppercase tracking-[0.18em] text-muted-foreground">
              {record.equationType}
            </span>
            <span className="pill px-3 py-1 uppercase tracking-[0.18em] text-muted-foreground">
              solver: {record.solverUsed}
            </span>
          </div>
        </div>

        {isFallback ? (
          <div className="glass-card flex items-start gap-3 p-5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-accent" />
            <div className="text-sm text-muted-foreground">
              Solver currently unavailable. Configure <code className="text-foreground">WOLFRAM_APP_ID</code> in
              project secrets or set <code className="text-foreground">VITE_API_BASE_URL</code> to a running backend.
            </div>
          </div>
        ) : (
          <div className="glass-card p-5">
            <div className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">RESULT</div>
            <div className="mt-3 overflow-x-auto">
              <MathRender tex={record.result} display className="text-2xl" />
            </div>
          </div>
        )}

        {record.steps.length > 0 && (
          <div className="glass-card p-5">
            <div className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">NOTEBOOK</div>
            <div className="mt-3 text-sm text-muted-foreground">
              The full step-by-step notebook is available when you click <strong>Full Solution</strong>.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => navigate({ to: "/solve/$id/explain", params: { id: record.id } })}
            className="btn-gradient flex h-12 items-center justify-center gap-2 rounded-full font-semibold"
          >
            <BookOpen className="h-4 w-4" /> View Explanations
          </button>
          <button
            onClick={() => navigate({ to: "/solve/$id/full", params: { id: record.id } })}
            className="glass-card flex h-12 items-center justify-center gap-2 rounded-full font-semibold"
          >
            <Sparkles className="h-4 w-4" /> Full Solution <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </>
  );
}
