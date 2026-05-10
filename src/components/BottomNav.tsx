import { Link, useLocation } from "@tanstack/react-router";
import { Home, History } from "lucide-react";

const items = [
  { to: "/", label: "Solve", icon: Home },
  { to: "/history", label: "History", icon: History },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-4 z-30 mx-auto w-[min(92%,540px)]">
      <div className="glass-card flex items-center justify-around p-2">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to === "/" && pathname.startsWith("/solve"));
          return (
            <Link
              key={to}
              to={to}
              className="flex-1"
            >
              <div
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-4 py-2 transition ${
                  active ? "btn-gradient text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
