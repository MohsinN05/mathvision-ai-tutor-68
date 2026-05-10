import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";

export function AppHeader({ right }: { right?: React.ReactNode }) {
  const { user, isAuthenticated, logout, isLogoutLoading } = useAuth();

  return (
    <header className="flex items-center justify-between pt-6 pb-5">
      <Logo />
      <div className="flex items-center gap-2">
        {right}
        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user.name && <p className="font-medium">{user.name}</p>}
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
              <DropdownMenuItem
                onClick={() => logout()}
                disabled={isLogoutLoading}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth/signup">Sign up</Link>
            </Button>
          </div>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
