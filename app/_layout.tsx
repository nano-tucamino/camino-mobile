// 📄 app/_layout.tsx
import "../lib/i18n";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { supabase } from "../lib/supabase";

function extractTokensFromUrl(url: string) {
  let accessToken: string | undefined;
  let refreshToken: string | undefined;
  let code: string | undefined;

  if (url.includes("#")) {
    const params = Object.fromEntries(
      url
        .split("#")[1]
        .split("&")
        .map((p) => {
          const [k, v] = p.split("=");
          return [k, v ? decodeURIComponent(v) : ""];
        }),
    );
    accessToken = params.access_token;
    refreshToken = params.refresh_token;
  }

  if (url.includes("?")) {
    const params = Object.fromEntries(
      url
        .split("?")[1]
        .split("#")[0]
        .split("&")
        .map((p) => {
          const [k, v] = p.split("=");
          return [k, v ? decodeURIComponent(v) : ""];
        }),
    );
    if (!accessToken) accessToken = params.access_token;
    if (!refreshToken) refreshToken = params.refresh_token;
    code = params.code;
  }

  return { accessToken, refreshToken, code };
}

// Componente interno que ya tiene acceso al AuthContext
function AppNavigator() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const segs = useSegments() as string[];

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url || !url.startsWith("caminomobile://")) return;
      const { accessToken, refreshToken, code } = extractTokensFromUrl(url);

      if (accessToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? "",
        });
        if (!error) router.replace("/(auth)/perfil/" as any);
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) router.replace("/(auth)/perfil/" as any);
        return;
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

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

// Root: AuthProvider envuelve todo
export default function RootLayout() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

