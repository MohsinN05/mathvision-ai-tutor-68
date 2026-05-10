import React from "react";
import { useAuthStore } from "@/lib/auth-store";
import { User } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";

interface InitiateSignupData {
  email: string;
  password: string;
  name?: string;
}

interface CompleteSignupData {}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  ok: boolean;
  token?: string | null;
  user?: User;
  message?: string;
  error?: string;
}

export function useAuth() {
  const { user, token, isLoading, error, setUser, setToken, setLoading, setError, logout } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  const applySession = React.useCallback(
    (session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) => {
      if (!session?.user) {
        setUser(null);
        setToken(null);
        return;
      }
      setToken(session.access_token);
      setUser({
        id: session.user.id,
        email: session.user.email || "",
        name: (session.user.user_metadata?.name as string | undefined) ?? undefined,
        emailVerified: !!session.user.email_confirmed_at,
      });
    },
    [setToken, setUser],
  );

  React.useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      applySession(data.session);
      setIsCheckingAuth(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
      setIsCheckingAuth(false);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const initiateSignup = async (
    data: InitiateSignupData,
    options?: { onSuccess?: (data: AuthResponse) => void; onError?: (error: unknown) => void },
  ) => {
    try {
      setLoading(true);
      setError(null);
      const redirectTo = `${window.location.origin}/auth/login`;
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: data.name ? { name: data.name } : undefined,
          emailRedirectTo: redirectTo,
        },
      });
      if (signUpError) throw signUpError;
      applySession(authData.session ?? null);
      const response: AuthResponse = {
        ok: true,
        message: "Check your email for the verification link before logging in.",
      };
      options?.onSuccess?.(response);
    } catch (err: any) {
      const message = err?.message || "Signup failed";
      setError(message);
      options?.onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (
    data: LoginData,
    options?: { onSuccess?: (data: AuthResponse) => void; onError?: (error: unknown) => void },
  ) => {
    try {
      setLoading(true);
      setError(null);
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (signInError) throw signInError;
      applySession(authData.session ?? null);
      options?.onSuccess?.({ ok: true, token: authData.session?.access_token ?? null });
    } catch (err: any) {
      const message = err?.message || "Login failed";
      setError(message);
      options?.onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    setLoading(true);
    setError(null);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setLoading(false);
      setError(signOutError.message);
      return;
    }
    logout();
    setLoading(false);
  };

  return {
    user,
    token,
    isLoading: isLoading || isCheckingAuth,
    error,
    isAuthenticated: !!user,
    initiateSignup,
    completeSignup: (_data: CompleteSignupData) => {
      setError("Complete signup route is not used with Supabase. Please verify by email and sign in.");
    },
    login,
    logout: logoutUser,
    isInitiateSignupLoading: isLoading,
    isCompleteSignupLoading: false,
    isLoginLoading: isLoading,
    isLogoutLoading: isLoading,
    clearError: () => setError(null),
  };
}