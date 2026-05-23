// 📄 components/chat/ConversationItem.tsx
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { ConversacionConPreview } from "@/hooks/useConversaciones";

const BANDERAS: Record<string, string> = {
  es: "🇪🇸",
  en: "🇬🇧",
  de: "🇩🇪",
  fr: "🇫🇷",
  it: "🇮🇹",
  pt: "🇵🇹",
  ko: "🇰🇷",
  ja: "🇯🇵",
};

interface Props {
  conv: ConversacionConPreview;
  onPress: () => void;
}

export function ConversationItem({ conv, onPress }: Props) {
  const hora = conv.ultimoMensaje
    ? new Date(conv.ultimoMensaje.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const titulo = (() => {
    if (conv.tipo === "directo" && conv.otroParticipante) {
      return conv.otroParticipante.nombre_display ?? "Peregrino";
    }
    if (conv.tipo === "canal_etapa") return conv.nombre ?? "Canal de etapa";
    if (conv.tipo === "albergue") return conv.nombre ?? "Albergue";
    return "Conversación";
  })();

  const icono = (() => {
    if (conv.tipo === "canal_etapa") return "🏔️";
    if (conv.tipo === "albergue") return "🏠";
    return null;
  })();

  const avatarUri =
    conv.tipo === "directo"
      ? (conv.otroParticipante?.avatar_url ?? null)
      : null;

  const idiomaOrigen = conv.ultimoMensaje?.idioma_origen;
  const bandera = idiomaOrigen ? (BANDERAS[idiomaOrigen] ?? "") : "";

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Avatar / Icono */}
      <View style={styles.avatarContainer}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>
              {icono ?? titulo[0]?.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Contenido */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.titulo} numberOfLines={1}>
            {titulo}
          </Text>
          <Text style={styles.hora}>{hora}</Text>
        </View>
        <View style={styles.previewRow}>
          {bandera ? <Text style={styles.bandera}>{bandera}</Text> : null}
          <Text style={styles.preview} numberOfLines={1}>
            {conv.ultimoTexto || "Sin mensajes aún"}
          </Text>
          {conv.noLeidos > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{conv.noLeidos}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FAF7F2",
    borderBottomWidth: 1,
    borderBottomColor: "#F0EAE0",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {},
  avatar: { width: 48, height: 48, borderRadius: 24 },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8DFC8",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 22 },

  content: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  titulo: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2C2C2C",
    flex: 1,
    marginRight: 8,
  },
  hora: { fontSize: 12, color: "#A09080" },

  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bandera: { fontSize: 13 },
  preview: { fontSize: 13, color: "#888", flex: 1 },
  badge: {
    backgroundColor: "#C8A96E",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 11, color: "#fff", fontWeight: "700" },
});
