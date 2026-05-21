// 📄 app/(auth)/callback.tsx
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = async (url: string) => {
      if (!url) return;

      // Extraer el fragment (#) o query (?) de la URL
      const parsed = Linking.parse(url);
      const params = (parsed.queryParams as Record<string, string>) ?? {};

      // PKCE flow: viene un "code"
      if (params.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(
          params.code,
        );
        if (!error) {
          router.replace("/(auth)/perfil/" as any);
          return;
        }
      }

      // Implicit flow: viene access_token en el fragment
      if (params.access_token) {
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token ?? "",
        });
        router.replace("/(auth)/perfil/" as any);
        return;
      }

      // Si no hay nada útil, volver al login
      router.replace("/(auth)/login");
    };

    // URL inicial (app abierta desde deep link)
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    // URL mientras la app estaba abierta
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
      }}
    >
      <ActivityIndicator size="large" color="#C4843A" />
    </View>
  );
}
