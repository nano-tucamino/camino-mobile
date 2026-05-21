// 📄 app/auth/callback.tsx
import { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      // Solo procesar si es una URL de callback real
      if (!url || !url.includes("caminomobile://auth/callback")) {
        router.replace("/");
        return;
      }

      const parsed = Linking.parse(url);
      const params = (parsed.queryParams as Record<string, string>) ?? {};

      if (params.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(
          params.code,
        );
        router.replace(error ? "/(auth)/login" : ("/(auth)/perfil/" as any));
        return;
      }

      if (params.access_token) {
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token ?? "",
        });
        router.replace("/(auth)/perfil/" as any);
        return;
      }

      router.replace("/");
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FAF7F2",
        gap: 16,
      }}
    >
      <ActivityIndicator size="large" color="#C4843A" />
      <Text style={{ fontSize: 13, color: "#6B6560" }}>
        Iniciando sesión...
      </Text>
    </View>
  );
}
