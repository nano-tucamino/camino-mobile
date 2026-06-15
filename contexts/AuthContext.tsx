// 📄 contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../lib/supabase";
import i18n from "../lib/i18n";
import { apiGet } from "../lib/api";

interface Perfil {
  id: string;
  nombre_display: string | null;
  idioma_preferido: string | null;
  etapa_actual_slug: string | null;
  [key: string]: any;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  perfil: Perfil | null;
  loading: boolean;
  token: string | null;
  refreshPerfil: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (
    email: string,
    password: string,
    nombre: string,
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPerfil = useCallback(async () => {
    try {
      const res = await apiGet<{ perfil: Perfil }>(`/api/peregrino/perfil`);
      setPerfil(res?.perfil ?? null);
      const idioma = res?.perfil?.idioma_preferido;
      if (idioma) i18n.changeLanguage(idioma);
    } catch {
      setPerfil(null);
    }
  }, []);

  const refreshPerfil = useCallback(async () => {
    await fetchPerfil();
  }, [fetchPerfil]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchPerfil();
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return; // ya gestionado por getSession()

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPerfil();
      } else {
        setPerfil(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchPerfil]);
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
        scopes: "email profile",
      },
    });

    if (error || !data?.url) return { error };

    await WebBrowser.openBrowserAsync(data.url, {
      showInRecents: false,
      dismissButtonStyle: "close",
    });

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
  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        perfil,
        loading,
        token: session?.access_token ?? null,
        refreshPerfil,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
