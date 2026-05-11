import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bookmark, ChevronLeft, Download, Share2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { MathRender } from "@/components/MathRender";
import { useSolutionStore } from "@/lib/store";

export const Route = createFileRoute("/_app/solve/$id/full")({
  head: () => ({ meta: [{ title: "Full Solution — MathVision" }] }),
  component: FullPage,
});

function FullPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const record = useSolutionStore((s) => s.history.find((h) => h.id === id) || s.current);
  const toggleSaved = useSolutionStore((s) => s.toggleSaved);

  if (!record) {
    return (
      <>
        <AppHeader />
        <div className="glass-card mt-6 p-6 text-center text-sm text-muted-foreground">
          Solution not found. <Link to="/" className="text-primary underline">Go home</Link>
        </div>
      </>
    );
  }

  const handleDownload = () => {
    const lines = [
      `# MathVision — Full Solution`,
      ``,
      `**Equation:** $${record.latex}$`,
      `**Type:** ${record.equationType}`,
      `**Solver:** ${record.solverUsed}`,
      `**Steps:** ${record.steps.length}`,
      ``,
      `## Result`,
      `$$${record.result}$$`,
      ``,
      `## Step-by-step Explanation`,
      ...record.steps.flatMap((s) => [``, `### Step ${s.stepNumber}`, `$$${s.symbolic}$$`, `${s.explanation}`]),
    ].join("\n");
    const blob = new Blob([lines], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mathvision-${record.id.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const text = `MathVision solved: ${record.latex} → ${record.result}`;
    if (navigator.share) {
      try { await navigator.share({ title: "MathVision", text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard");
    }
  };

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

      <h1 className="mt-2 font-display text-2xl font-bold">Full solution</h1>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="glass-card rounded-3xl p-5">
          <div className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">EQUATION</div>
          <div className="mt-3 text-sm text-foreground">{record.latex}</div>
        </div>
        <div className="glass-card rounded-3xl p-5">
          <div className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">RESULT</div>
          <div className="mt-3 text-sm text-foreground">{record.result}</div>
        </div>
        <div className="glass-card rounded-3xl p-5">
          <div className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">DETAILS</div>
          <div className="mt-3 space-y-2 text-sm text-foreground">
            <div><strong>Type:</strong> {record.equationType}</div>
            <div><strong>Solver:</strong> {record.solverUsed}</div>
            <div><strong>Steps:</strong> {record.steps.length}</div>
          </div>
        </div>
      </div>

      <div className="glass-card mt-4 p-5">
        <div className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">YOUR FULL WORKFLOW</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-border bg-surface p-4 text-sm">
            <div className="font-semibold text-foreground">Equation</div>
            <p className="mt-2 text-muted-foreground">Formulated as LaTeX input, ready for symbolic solve.</p>
          </div>
          <div className="rounded-3xl border border-border bg-surface p-4 text-sm">
            <div className="font-semibold text-foreground">Solve</div>
            <p className="mt-2 text-muted-foreground">Compute the result and extract the symbolic steps.</p>
          </div>
          <div className="rounded-3xl border border-border bg-surface p-4 text-sm">
            <div className="font-semibold text-foreground">Explain</div>
            <p className="mt-2 text-muted-foreground">Translate each step into a clear tutor-friendly explanation.</p>
          </div>
        </div>
      </div>

      <ol className="mt-6 space-y-3">
        {record.steps.map((s) => (
          <li key={s.stepNumber} className="glass-card p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                {s.stepNumber}
              </span>
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Step</span>
            </div>
            <div className="mt-3 overflow-x-auto rounded-3xl border border-border bg-surface p-4">
              <MathRender tex={s.symbolic} display className="text-base" />
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 text-center text-xs text-muted-foreground">
        Need reasoning behind each step?{" "}
        <Link to="/solve/$id/explain" params={{ id: record.id }} className="text-primary underline">
          Open the explanation view
        </Link>
        .
      </div>

      {/* hidden placeholder to keep map structure stable */}
      {false ? <span /> : null}
          </li>
        ))}
      </ol>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button onClick={handleDownload} className="glass-card flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold">
          <Download className="h-4 w-4" /> Download
        </button>
        <button onClick={handleShare} className="glass-card flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold">
          <Share2 className="h-4 w-4" /> Share
        </button>
        <button onClick={() => toggleSaved(record.id)} className="btn-gradient flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold">
          <Bookmark className="h-4 w-4" /> {record.saved ? "Saved" : "Save"}
        </button>
      </div>
    </>
  );
}
