import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, CheckCircle, Mail } from "lucide-react";

const signupSchema = z.object({
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").optional(),
});

type SignupForm = z.infer<typeof signupSchema>;

export function SignupForm() {
  const { initiateSignup, isInitiateSignupLoading, error, clearError } = useAuth();
  const [emailSent, setEmailSent] = useState(false);
  const [emailValue, setEmailValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const sendVerification = (data: SignupForm) => {
    setEmailValue(data.email);
    clearError();
    initiateSignup(
      { email: data.email, password: data.password, name: data.name },
      {
        onSuccess: (response) => {
          if (response?.ok) setEmailSent(true);
        },
      },
    );
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailValue(e.target.value);
    if (emailSent) {
      setEmailSent(false); // Reset if user changes email
    }
  };

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Check your email</CardTitle>
            <CardDescription className="text-center">
              We've sent a verification link to <strong>{emailValue}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Click the verification link in your email to complete your account setup.
              </AlertDescription>
            </Alert>

            <div className="text-center text-sm">
              Didn't receive the email?{" "}
              <button
                onClick={() => {
                  setEmailSent(false);
                  clearError();
                }}
                className="text-primary underline-offset-4 hover:underline"
              >
                Try again
              </button>
            </div>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link
                to="/auth/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create account</CardTitle>
          <CardDescription>
            Enter your details to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={handleSubmit((data) => {
              sendVerification(data);
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...register("email")}
                onChange={(e) => {
                  register("email").onChange(e);
                  handleEmailChange(e);
                }}
                onBlur={register("email").onBlur}
                disabled={isInitiateSignupLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                {...register("password")}
                disabled={isInitiateSignupLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                {...register("name")}
                disabled={isInitiateSignupLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {isInitiateSignupLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating your account...
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isInitiateSignupLoading || emailSent}
            >
              {isInitiateSignupLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            By continuing, you'll receive a verification email to activate your account.
          </div>

          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link
              to="/auth/login"
              className="text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}