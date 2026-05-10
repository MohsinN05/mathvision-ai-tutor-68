import { createFileRoute } from "@tanstack/react-router";
import { CompleteSignupForm } from "@/components/CompleteSignupForm";

export const Route = createFileRoute("/auth/complete-signup")({
  component: CompleteSignupPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || undefined,
    email: (search.email as string) || undefined,
  }),
});

function CompleteSignupPage() {
  return <CompleteSignupForm />;
}