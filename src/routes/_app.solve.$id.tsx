import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/solve/$id")({
  component: SolveLayout,
});

function SolveLayout() {
  return (
    <Outlet />
  );
}
