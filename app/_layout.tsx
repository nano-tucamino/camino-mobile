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

    const inAuthGroup =
      segments[0] === "(peregrine)" || segments[0] === "(hospitalero)";

    if (!session && inAuthGroup) {
      router.replace("/");
    } else if (session && !inAuthGroup) {
      router.replace("/(peregrine)/dashboard");
    }
  }, [session, loading]);

  return (
    <>
      <NavigationProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="auto" />
      </NavigationProvider>
    </>
  );
}
