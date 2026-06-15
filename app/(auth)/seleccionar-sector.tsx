import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { apiPut } from "@/lib/api";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://camino-api.onrender.com";

const SECTORES = [
  { key: "navarra", label: "Navarra" },
  { key: "la_rioja", label: "La Rioja" },
  { key: "burgos", label: "Burgos" },
  { key: "palencia", label: "Palencia" },
  { key: "leon", label: "León" },
  { key: "lugo", label: "Lugo" },
  { key: "a_coruna", label: "A Coruña" },
  { key: "fisterra", label: "Fisterra & Muxía" },
] as const;
export default function SeleccionarSectorScreen() {
  const { refreshPerfil } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const elegir = async (sector: string) => {
    setLoading(sector);
    try {
      const res = await fetch(`${API_URL}/api/etapas/sector/${sector}/resumen`);
      const data = await res.json();
      if (data?.etapa?.slug) {
        await apiPut(`/api/peregrino/perfil`, {
          etapa_actual_slug: data.etapa.slug,
        });
        await refreshPerfil();
        router.replace("/(public)" as any);
      }
    } catch {
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>¿Por dónde empiezas tu Camino?</Text>
      <Text style={styles.subtitulo}>
        Elige la zona donde te encuentras o vas a comenzar
      </Text>
      {SECTORES.map((s) => (
        <TouchableOpacity
          key={s.key}
          style={styles.btn}
          onPress={() => elegir(s.key)}
          disabled={!!loading}
        >
          {loading === s.key ? (
            <ActivityIndicator color="#C8A96E" />
          ) : (
            <Text style={styles.btnText}>{s.label}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#FAF7F2",
  },
  titulo: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2C1F0E",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 13,
    color: "#8B7355",
    textAlign: "center",
    marginBottom: 16,
  },
  btn: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E8E0D0",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnText: { fontSize: 15, fontWeight: "600", color: "#2C1F0E" },
});
