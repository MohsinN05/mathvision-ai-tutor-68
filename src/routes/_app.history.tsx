import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { MathRender } from "@/components/MathRender";
import { useSolutionStore } from "@/lib/store";

export const Route = createFileRoute("/_app/history")({
  head: () => ({ meta: [{ title: "History — MathVision" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const history = useSolutionStore((s) => s.history);

  return (
    <>
      <AppHeader />
      <h1 className="mt-2 font-display text-2xl font-bold">History</h1>
      <p className="text-sm text-muted-foreground">Your recent solutions, saved on this device.</p>

      {history.length === 0 ? (
        <div className="glass-card mt-6 p-8 text-center">
          <p className="text-sm text-muted-foreground">Nothing here yet.</p>
          <Link to="/" className="btn-gradient mt-4 inline-flex rounded-full px-5 py-2 text-sm font-semibold">
            Solve something
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {history.map((h) => (
            <li key={h.id}>
              <Link
                to="/solve/$id"
                params={{ id: h.id }}
                className="glass-card flex items-center gap-4 p-4 transition hover:-translate-y-0.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {h.equationType}
                    </span>
                    {h.saved && <Bookmark className="h-3 w-3 text-primary" />}
                  </div>
                  <div className="mt-1 truncate"><MathRender tex={h.latex} className="text-base" /></div>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {new Date(h.createdAt).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
