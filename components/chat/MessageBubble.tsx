// 📄 components/chat/MessageBubble.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Mensaje, getTextoMensaje, normalizeAutor } from "@/lib/chat";
import i18n from "@/lib/i18n";

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
  mensaje: Mensaje;
  esMio: boolean;
  onReply?: (mensaje: Mensaje) => void;
  onAvatarPress?: (autorId: string) => void; // ← nuevo
}

export function MessageBubble({
  mensaje,
  esMio,
  onReply,
  onAvatarPress,
}: Props) {
  const locale = i18n.language ?? "en";
  const [mostrarOriginal, setMostrarOriginal] = useState(false);
  const autor = normalizeAutor(mensaje.autor);

  const textoMostrado = mostrarOriginal
    ? mensaje.contenido
    : getTextoMensaje(mensaje, locale);

  const estaTraducido =
    !mostrarOriginal &&
    mensaje.traducciones &&
    mensaje.idioma_origen !== locale &&
    !!mensaje.traducciones[locale];

  const bandera = BANDERAS[mensaje.idioma_origen] ?? "🌐";
  const hora = new Date(mensaje.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View
      style={[styles.wrapper, esMio ? styles.wrapperMio : styles.wrapperOtro]}
    >
      {!esMio && (
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => onAvatarPress?.(mensaje.autor_id)}
          disabled={!onAvatarPress}
          activeOpacity={0.7}
        >
          {autor?.avatar_url ? (
            <Image source={{ uri: autor.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetra}>
                {(autor?.nombre_display ?? "?")[0].toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      <View
        style={[styles.burbuja, esMio ? styles.burbujaMin : styles.burbujaOtro]}
      >
        {!esMio && autor?.nombre_display && (
          <Text style={styles.nombre}>{autor.nombre_display}</Text>
        )}

        <Text
          style={[styles.texto, esMio ? styles.textoMio : styles.textoOtro]}
        >
          {textoMostrado}
        </Text>

        <View style={styles.footer}>
          {estaTraducido && (
            <TouchableOpacity
              onPress={() => setMostrarOriginal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.traducidoTag}>
                {bandera} traducido · ver original
              </Text>
            </TouchableOpacity>
          )}
          {mostrarOriginal && mensaje.idioma_origen !== locale && (
            <TouchableOpacity
              onPress={() => setMostrarOriginal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.traducidoTag}>ver traducción</Text>
            </TouchableOpacity>
          )}
          <View style={styles.footerRight}>
            {onReply && (
              <TouchableOpacity
                onPress={() => onReply(mensaje)}
                style={styles.replyBtn}
              >
                <Text style={styles.replyIcon}>↩</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.hora}>{hora}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    marginVertical: 3,
    paddingHorizontal: 12,
    alignItems: "flex-end",
  },
  wrapperMio: { justifyContent: "flex-end" },
  wrapperOtro: { justifyContent: "flex-start" },
  avatarContainer: { marginRight: 8, marginBottom: 2 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#C8A96E",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetra: { color: "#fff", fontSize: 13, fontWeight: "700" },
  burbuja: {
    maxWidth: "78%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  burbujaMin: { backgroundColor: "#C8A96E", borderBottomRightRadius: 4 },
  burbujaOtro: {
    backgroundColor: "#F5F0E8",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E8E0D0",
  },
  nombre: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8B6914",
    marginBottom: 3,
  },
  texto: { fontSize: 15, lineHeight: 21 },
  textoMio: { color: "#fff" },
  textoOtro: { color: "#2C2C2C" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  traducidoTag: { fontSize: 11, color: "#8B6914", opacity: 0.8 },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: "auto",
  },
  replyBtn: { paddingHorizontal: 4 },
  replyIcon: { fontSize: 14, color: "#8B6914", opacity: 0.7 },
  hora: { fontSize: 11, color: "#8B6914", opacity: 0.6 },
});
