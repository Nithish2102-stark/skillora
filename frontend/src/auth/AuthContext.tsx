import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (name: string, email: string, password: string) => Promise<{ needsVerification: boolean; error: string | null }>;
  resendVerification: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function messageFromError(error: { message?: string } | null) {
  if (!error) return null;
  if (error.message?.toLowerCase().includes("invalid login")) return "Email or password is incorrect.";
  if (error.message?.toLowerCase().includes("already registered")) return "An account with this email already exists.";
  return error.message ?? "Something went wrong. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    session,
    loading,
    configured: isSupabaseConfigured,
    signIn: async (email, password) => {
      if (!supabase) return { error: "Supabase is not configured. Add the frontend environment variables to enable authentication." };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: messageFromError(error) };
    },
    signUp: async (name, email, password) => {
      if (!supabase) return { needsVerification: false, error: "Supabase is not configured. Add the frontend environment variables to enable authentication." };
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
      if (!error && data.user && data.session) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: name,
          email,
        }, { onConflict: "id" });
        if (profileError) return { needsVerification: false, error: messageFromError(profileError) };
      }
      return { needsVerification: Boolean(!error && !data.session), error: messageFromError(error) };
    },
    resendVerification: async (email) => {
      if (!supabase) return { error: "Supabase is not configured. Add the frontend environment variables to enable authentication." };
      const { error } = await supabase.auth.resend({ type: "signup", email });
      return { error: messageFromError(error) };
    },
    signOut: async () => {
      if (!supabase) return { error: null };
      const { error } = await supabase.auth.signOut();
      return { error: messageFromError(error) };
    },
    resetPassword: async (email) => {
      if (!supabase) return { error: "Supabase is not configured. Add the frontend environment variables to enable authentication." };
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      return { error: messageFromError(error) };
    },
  }), [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

