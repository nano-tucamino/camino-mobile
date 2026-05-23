// 📄 components/chat/ChatRoom.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  FlatList,
  Text,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useChat } from "@/hooks/useChat";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { Mensaje } from "@/lib/chat";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  conversacionId: string | null;
  titulo?: string;
  subtitulo?: string;
  loadingConversacion?: boolean;
}

export function ChatRoom({
  conversacionId,
  titulo,
  subtitulo,
  loadingConversacion,
}: Props) {
  const { user } = useAuth();

  const {
    mensajes,
    loading,
    sending,
    error,
    enviar,
    cargarMas,
    hayMas,
    getTexto,
  } = useChat({ conversacionId });

  const [replyTo, setReplyTo] = useState<Mensaje | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Scroll al último mensaje cuando llegan nuevos
  useEffect(() => {
    if (mensajes.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    }
  }, [mensajes.length]);

  const handleEnviar = async (texto: string, replyToId?: string) => {
    await enviar(texto, replyToId);
    setReplyTo(null);
  };

  if (loadingConversacion || (loading && mensajes.length === 0)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C8A96E" />
      </View>
    );
  }

  if (!conversacionId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Canal no disponible</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Mensaje }) => (
    <MessageBubble
      mensaje={item}
      esMio={item.autor_id === user?.id}
      onReply={setReplyTo}
    />
  );

  const renderHeader = () =>
    hayMas ? (
      <TouchableOpacity style={styles.cargarMas} onPress={cargarMas}>
        <Text style={styles.cargarMasTexto}>Cargar mensajes anteriores</Text>
      </TouchableOpacity>
    ) : null;

  const renderEmpty = () => (
    <View style={styles.emptyChat}>
      <Text style={styles.emptyChatIcon}>🌿</Text>
      <Text style={styles.emptyChatTexto}>
        Sé el primero en escribir.{"\n"}Todos leerán en su idioma.
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={mensajes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.lista,
          mensajes.length === 0 && styles.listaVacia,
        ]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      {user ? (
        <MessageInput
          onEnviar={handleEnviar}
          sending={sending}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      ) : (
        <View style={styles.loginPrompt}>
          <Text style={styles.loginText}>
            Inicia sesión para participar en la conversación
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF7F2" },

  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#999", fontSize: 14 },

  errorBanner: {
    backgroundColor: "#FFE8E8",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FFCCCC",
  },
  errorText: { color: "#CC3333", fontSize: 13, textAlign: "center" },

  lista: { paddingVertical: 12 },
  listaVacia: { flex: 1, justifyContent: "center" },

  cargarMas: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cargarMasTexto: {
    fontSize: 13,
    color: "#C8A96E",
    fontWeight: "600",
  },

  emptyChat: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyChatIcon: { fontSize: 36, marginBottom: 12 },
  emptyChatTexto: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 21,
  },

  loginPrompt: {
    borderTopWidth: 1,
    borderTopColor: "#E8E0D0",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#FAF7F2",
    alignItems: "center",
  },
  loginText: { fontSize: 13, color: "#999", textAlign: "center" },
});
