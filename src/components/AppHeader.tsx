import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function AppHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between pt-6 pb-5">
      <Logo />
      <div className="flex items-center gap-2">
        {right}
        <ThemeToggle />
      </div>
    </header>
  );
}
