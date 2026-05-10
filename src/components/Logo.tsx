import { Sparkles } from "lucide-react";

export function Logo({ subtitle = "SYMBOLIC ENGINE" }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="icon-circle">
        <Sparkles className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
      </span>
      <div className="leading-tight">
        <div className="font-display text-lg font-bold tracking-tight">MathVision</div>
        <div className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  );
}
