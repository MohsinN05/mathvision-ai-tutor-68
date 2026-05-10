import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, CheckCircle } from "lucide-react";

const completeSignupSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").optional(),
});

type CompleteSignupForm = z.infer<typeof completeSignupSchema>;

export function CompleteSignupForm() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth/complete-signup" }) as { token?: string; email?: string };
  const { completeSignup, isCompleteSignupLoading, error, clearError } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteSignupForm>({
    resolver: zodResolver(completeSignupSchema),
  });

  const { token, email } = search;

  useEffect(() => {
    if (!token || !email) {
      navigate({ to: "/auth/signup" });
    }
  }, [token, email, navigate]);

  const onSubmit = (data: CompleteSignupForm) => {
    if (!token || !email) return;

    clearError();
    completeSignup({
      email,
      password: data.password,
      name: data.name,
      token,
    }, {
      onSuccess: () => {
        setShowSuccess(true);
        setTimeout(() => navigate({ to: "/" }), 1500);
      },
    });
  };

  if (!token || !email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">Invalid verification link. Redirecting...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Account created!</CardTitle>
            <CardDescription className="text-center">
              Welcome to MathVision! Redirecting to your dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Complete your account</CardTitle>
          <CardDescription>
            Set up your password to finish creating your MathVision account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              Email: <strong>{email}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isCompleteSignupLoading}>
              {isCompleteSignupLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete account
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}