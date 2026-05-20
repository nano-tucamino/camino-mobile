// 📄 app/_layout.tsx
import "../lib/i18n";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../hooks/useAuth";
import { NavigationProvider } from "@/contexts/NavigationContext";

export default function RootLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === "(auth)";
    const segs = segments as string[];
    const inProtectedRoute =
      inAuthGroup && segs[1] !== "login" && segs[1] !== "confirmar";

    if (!session && inProtectedRoute) {
      router.replace("/(auth)/login");
    }
  }, [session, loading, segments]);

  return (
    <NavigationProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </NavigationProvider>
  );
}
