// 📄 app/auth/callback.tsx
import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Procesando...");

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url || !url.includes("caminomobile://")) {
        router.replace("/");
        return;
      }

      setStatus("URL recibida ✓");

      // Implicit flow: token en el fragment (#access_token=...)
      // Expo Linking pone el fragment en queryParams también
      const parsed = Linking.parse(url);
      const params = (parsed.queryParams as Record<string, string>) ?? {};

      // Intentar extraer del fragment manualmente si no está en queryParams
      let accessToken = params.access_token;
      let refreshToken = params.refresh_token;

      if (!accessToken && url.includes("#")) {
        const fragment = url.split("#")[1];
        const fragmentParams = Object.fromEntries(
          fragment.split("&").map((p) => p.split("=").map(decodeURIComponent)),
        );
        accessToken = fragmentParams.access_token;
        refreshToken = fragmentParams.refresh_token;
      }

      if (accessToken) {
        setStatus("Estableciendo sesión...");
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? "",
        });
        if (error) {
          setStatus(`Error: ${error.message}`);
          setTimeout(() => router.replace("/(auth)/login"), 3000);
        } else {
          setStatus("Sesión iniciada ✓");
          router.replace("/(auth)/perfil/" as any);
        }
        return;
      }

      // PKCE flow: code
      if (params.code) {
        setStatus("Verificando código...");
        const { error } = await supabase.auth.exchangeCodeForSession(
          params.code,
        );
        if (error) {
          setStatus(`Error: ${error.message}`);
          setTimeout(() => router.replace("/(auth)/login"), 3000);
        } else {
          setStatus("Sesión iniciada ✓");
          router.replace("/(auth)/perfil/" as any);
        }
        return;
      }

      setStatus("Sin token en URL");
      setTimeout(() => router.replace("/"), 2000);
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
        padding: 32,
      }}
    >
      <ActivityIndicator size="large" color="#C4843A" />
      <Text style={{ fontSize: 14, color: "#6B6560", textAlign: "center" }}>
        {status}
      </Text>
    </View>
  );
}

