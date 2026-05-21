// 📄 app/_layout.tsx
import "../lib/i18n";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { useAuth } from "../hooks/useAuth";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const segs = useSegments() as string[];

  // Procesar deep links de OAuth
  useEffect(() => {
    const handleUrl = async (url: string) => {
      if (!url || !url.startsWith("caminomobile://")) return;

      const parsed = Linking.parse(url);
      const params = (parsed.queryParams ?? {}) as Record<string, string>;

      if (params.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(
          params.code,
        );
        if (!error) {
          router.replace("/(auth)/perfil/" as any);
        } else {
          router.replace("/(auth)/login");
        }
      } else if (params.access_token) {
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token ?? "",
        });
        router.replace("/(auth)/perfil/" as any);
      } else {
        router.replace("/(auth)/login");
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  // Guard de auth
  useEffect(() => {
    if (loading) return;
    const inAuth = segs[0] === "(auth)";
    const isProtected =
      inAuth &&
      segs[1] !== "login" &&
      segs[1] !== "confirmar" &&
      segs[1] !== "callback";

    if (!session && isProtected) {
      router.replace("/(auth)/login");
    }

    // NUEVO: si hay sesión y estamos en login, ir al perfil
    if (session && inAuth && segs[1] === "login") {
      router.replace("/(auth)/perfil/" as any);
    }
  }, [session, loading, segs]);

  return (
    <NavigationProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </NavigationProvider>
  );
}
