import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { location } = useRouterState();
  // Hide bottom nav during processing for focus
  const hideNav = location.pathname.startsWith("/solve/processing");
  return (
    <div className="mx-auto min-h-screen w-full max-w-[640px] px-5 pb-32">
      <Outlet />
      {!hideNav && <BottomNav />}
    </div>
  );
}
