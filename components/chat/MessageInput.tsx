// 📄 components/chat/MessageInput.tsx
import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Mensaje, getTextoMensaje, normalizeAutor } from "@/lib/chat";
import i18n from "@/lib/i18n";

interface Props {
  onEnviar: (texto: string, replyToId?: string) => Promise<void>;
  sending: boolean;
  replyTo?: Mensaje | null;
  onCancelReply?: () => void;
}

export function MessageInput({
  onEnviar,
  sending,
  replyTo,
  onCancelReply,
}: Props) {
  const [texto, setTexto] = useState("");
  const inputRef = useRef<TextInput>(null);
  const locale = i18n.language ?? "en";

  const handleEnviar = async () => {
    const t = texto.trim();
    if (!t || sending) return;
    setTexto("");
    await onEnviar(t, replyTo?.id);
  };

  const autorReply = replyTo ? normalizeAutor(replyTo.autor) : null;

  return (
    <View style={styles.container}>
      {replyTo && (
        <View style={styles.replyPreview}>
          <View style={styles.replyBar} />
          <View style={styles.replyContent}>
            <Text style={styles.replyNombre} numberOfLines={1}>
              {autorReply?.nombre_display ?? "..."}
            </Text>
            <Text style={styles.replyTexto} numberOfLines={1}>
              {getTextoMensaje(replyTo, locale)}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} style={styles.cancelReply}>
            <Text style={styles.cancelIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.row}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={texto}
          onChangeText={setTexto}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#A09080"
          multiline
          maxLength={1000}
          onSubmitEditing={Platform.OS === "web" ? handleEnviar : undefined}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!texto.trim() || sending) && styles.sendBtnDisabled,
          ]}
          onPress={handleEnviar}
          disabled={!texto.trim() || sending}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendIcon}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: "#E8E0D0",
    backgroundColor: "#FAF7F2",
    paddingBottom: Platform.OS === "ios" ? 8 : 4,
  },
  replyPreview: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F0EAE0",
    borderBottomWidth: 1,
    borderBottomColor: "#E8E0D0",
    gap: 8,
  },
  replyBar: {
    width: 3,
    height: 36,
    backgroundColor: "#C8A96E",
    borderRadius: 2,
  },
  replyContent: { flex: 1 },
  replyNombre: { fontSize: 12, fontWeight: "700", color: "#8B6914" },
  replyTexto: { fontSize: 12, color: "#666", marginTop: 1 },
  cancelReply: { padding: 4 },
  cancelIcon: { fontSize: 14, color: "#999" },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#2C2C2C",
    borderWidth: 1,
    borderColor: "#E8E0D0",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#C8A96E",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { fontSize: 18, color: "#fff", fontWeight: "700" },
});
