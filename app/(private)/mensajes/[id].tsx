// 📄 app/(private)/mensajes/[id].tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";

import CanalChat from "@/components/chat/CanalChat";
import { supabase } from "@/lib/supabase";
import { useUnread } from "@/contexts/UnreadContext";

interface ConvInfo {
  tipo: string;
  nombre: string | null;
  etapa_id: string | null;
  albergue_id: string | null;
}

async function marcarLeido(conversacionId: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return;

  await supabase
    .from("conversacion_participantes")
    .update({ ultimo_leido_at: new Date().toISOString() })
    .eq("conversacion_id", conversacionId)
    .eq("perfil_id", userId);
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [info, setInfo] = useState<ConvInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { refresh } = useUnread();

  useFocusEffect(
    React.useCallback(() => {
      if (id) marcarLeido(id);
      return () => {
        refresh();
      };
    }, [id, refresh]),
  );
  useEffect(() => {
    if (!id) return;

    supabase
      .from("conversaciones")
      .select("tipo, nombre, etapa_id, albergue_id")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setInfo(data as ConvInfo);
        setLoading(false);
      });

    marcarLeido(id);
  }, [id]);

  const titulo = (() => {
    if (!info) return "";
    if (info.nombre) return info.nombre;
    if (info.tipo === "canal_etapa") return "Canal de etapa";
    if (info.tipo === "albergue") return "Canal del albergue";
    return "Conversación";
  })();

  const subtitulo = (() => {
    if (!info) return "";
    if (info.tipo === "canal_etapa") return "Peregrinos en esta etapa";
    if (info.tipo === "directo") return "Mensaje directo";
    if (info.tipo === "albergue") return "Canal público del albergue";
    return "";
  })();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTextos}>
          <Text style={styles.titulo} numberOfLines={1}>
            {titulo}
          </Text>
          {subtitulo ? (
            <Text style={styles.subtitulo} numberOfLines={1}>
              {subtitulo}
            </Text>
          ) : null}
        </View>
        {/* Indicador traducción */}
        <View style={styles.traduccionBadge}>
          <Text style={styles.traduccionText}>🌐 auto</Text>
        </View>
      </View>

      <CanalChat conversacionId={id ?? null} modo="inline" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF7F2" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E0D0",
    backgroundColor: "#FAF7F2",
    gap: 12,
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 22, color: "#C8A96E", fontWeight: "600" },

  headerTextos: { flex: 1 },
  titulo: { fontSize: 16, fontWeight: "700", color: "#2C2C2C" },
  subtitulo: { fontSize: 12, color: "#A09080", marginTop: 1 },

  traduccionBadge: {
    backgroundColor: "#F0EAE0",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E8DFC8",
  },
  traduccionText: { fontSize: 11, color: "#8B6914" },
});
