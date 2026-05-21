// 📄 hooks/useAuth.ts
import { useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const redirectUrl = makeRedirectUri({
      scheme: "caminomobile",
      path: "auth/callback",
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });

    if (error || !data?.url) return { error };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (result.type === "success" && result.url) {
      // El callback.tsx se encarga de procesar la URL
      // onAuthStateChange actualizará la sesión automáticamente
    }

    return { error: null };
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    nombre: string,
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre_display: nombre } },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    session,
    user,
    loading,
    token: session?.access_token ?? null,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
}
