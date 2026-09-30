import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type Session,
  type User,
  type Provider,
} from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type AppRole = "user" | "admin";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole;
  is_organizer?: boolean;
  onboarded?: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;

  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<{ error: string | null; needsVerification: boolean }>;
  signInWithOAuth: (provider: Provider) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  resendVerification: (email: string) => Promise<{ error: string | null }>;
  refreshSession: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, is_organizer, onboarded")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    // eslint-disable-next-line no-console
    console.warn("[auth] profile fetch failed", error.message);
    return null;
  }
  return data as Profile | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // initial session + listener
  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user) {
        setProfile(await fetchProfile(data.session.user.id));
      }
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, s) => {
      setSession(s);
      if (s?.user) {
        setProfile(await fetchProfile(s.user.id));
      } else {
        setProfile(null);
      }
    });
    unsub = () => sub.subscription.unsubscribe();
    return () => unsub?.();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isAdmin: profile?.role === "admin",
      loading,

      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return { error: error?.message ?? null };
      },

      async signUp(email, password, fullName) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName ?? "" },
            emailRedirectTo: `${window.location.origin}/auth/confirmed`,
          },
        });
        // If session is null after signup, email confirmation is required.
        const needsVerification = !!data.user && !data.session;
        return { error: error?.message ?? null, needsVerification };
      },

      async signInWithMagicLink(email) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirmed`,
          },
        });
        return { error: error?.message ?? null };
      },

      async signInWithOAuth(provider) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo: `${window.location.origin}/auth/confirmed` },
        });
        return { error: error?.message ?? null };
      },

      async signOut() {
        await supabase.auth.signOut();
      },

      async resendVerification(email) {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirmed`,
          },
        });
        return { error: error?.message ?? null };
      },

      async refreshSession() {
        await supabase.auth.refreshSession();
      },

      async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        return { error: error?.message ?? null };
      },

      async updatePassword(newPassword) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        return { error: error?.message ?? null };
      },
    }),
    [session, profile, loading],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
