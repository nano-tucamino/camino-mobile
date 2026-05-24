// 📄 components/chat/CanalChat.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/hooks/useChat";
import { router } from "expo-router";
import { MessageBubble } from "./MessageBubble";
import { Mensaje } from "@/lib/chat";
import { Keyboard, KeyboardEvent } from "react-native";

const { height: SH } = Dimensions.get("window");
const DRAWER_HEIGHT = SH * 0.85;
const GOLD = "#C8A96E";

interface Props {
  conversacionId: string | null;
  etapaNombre?: string;
  color?: string;
  modo?: "fab" | "inline";
  tieneRecientes?: boolean;
  onOpen?: () => void;
}

export default function CanalChat({
  conversacionId,
  etapaNombre,
  color = GOLD,
  modo = "inline",
  tieneRecientes = false,
  onOpen,
}: Props) {
  const { user } = useAuth();
  const { mensajes, loading, sending, error, enviar, cargarMas, hayMas } =
    useChat({ conversacionId });

  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState("");
  const [replyTo, setReplyTo] = useState<Mensaje | null>(null);
  const slideAnim = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const keyboardHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e: KeyboardEvent) => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height - 30,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (mensajes.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    }
  }, [mensajes.length]);

  const openDrawer = () => {
    setOpen(true);
    if (onOpen) onOpen();
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: DRAWER_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setOpen(false));
  };

  const handleEnviar = async () => {
    const t = texto.trim();
    if (!t || sending) return;
    setTexto("");
    setReplyTo(null);
    await enviar(t, replyTo?.id);
  };

  const ChatContent = (
    <Animated.View
      style={{
        flex: 1,
        transform: [{ translateY: Animated.multiply(keyboardHeight, -0.15) }],
      }}
    >
      {error && (
        <View style={s.errorBanner}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}

      {loading && mensajes.length === 0 ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={color} />
        </View>
      ) : !conversacionId ? (
        <View style={s.centered}>
          <Text style={s.emptyText}>Canal no disponible</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={mensajes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              mensaje={item}
              esMio={item.autor_id === user?.id}
              onReply={setReplyTo}
            />
          )}
          ListHeaderComponent={
            hayMas ? (
              <TouchableOpacity style={s.cargarMas} onPress={cargarMas}>
                <Text style={s.cargarMasTexto}>Cargar mensajes anteriores</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <View style={s.emptyChat}>
              <Text style={s.emptyChatIcon}>🌿</Text>
              <Text style={s.emptyChatTexto}>
                Sé el primero en escribir.{"\n"}Todos leerán en su idioma.
              </Text>
            </View>
          }
          contentContainerStyle={[
            s.lista,
            mensajes.length === 0 && s.listaVacia,
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />
      )}

      {/* Reply preview */}
      {replyTo && (
        <View style={s.replyPreview}>
          <View style={[s.replyBar, { backgroundColor: color }]} />
          <Text style={s.replyTexto} numberOfLines={1}>
            {replyTo.contenido}
          </Text>
          <TouchableOpacity onPress={() => setReplyTo(null)}>
            <Text style={s.cancelIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input */}
      <Animated.View style={{ paddingBottom: keyboardHeight }}>
        {user ? (
          <View style={s.inputRow}>
            <TextInput
              ref={inputRef}
              style={s.input}
              value={texto}
              onChangeText={setTexto}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#A09080"
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                s.sendBtn,
                {
                  backgroundColor: color,
                  opacity: !texto.trim() || sending ? 0.4 : 1,
                },
              ]}
              onPress={handleEnviar}
              disabled={!texto.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.sendIcon}>↑</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[s.loginCTA, { borderColor: color }]}
            onPress={() => router.push("/(auth)/login" as any)}
          >
            <Text style={[s.loginText, { color }]}>
              Inicia sesión para participar
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Animated.View>
  );

  // ── Modo inline ──────────────────────────────────────────────
  if (modo === "inline") {
    return <View style={{ flex: 1 }}>{ChatContent}</View>;
  }

  // ── Modo FAB + drawer ────────────────────────────────────────
  return (
    <>
      <TouchableOpacity
        onPress={openDrawer}
        style={[s.fab, { backgroundColor: color }]}
        activeOpacity={0.85}
      >
        <Text style={s.fabIcon}>💬</Text>
        {tieneRecientes && <View style={s.fabBadge} />}
      </TouchableOpacity>

      {open && (
        <>
          <TouchableOpacity
            style={s.backdrop}
            onPress={closeDrawer}
            activeOpacity={1}
          />
          <Animated.View
            style={[s.drawer, { transform: [{ translateY: slideAnim }] }]}
          >
            <View style={s.handle} />
            <View style={s.drawerHeader}>
              <View style={[s.headerDot, { backgroundColor: color }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.drawerTitulo}>Canal de la etapa</Text>
                {etapaNombre && <Text style={s.drawerSub}>{etapaNombre}</Text>}
              </View>
              <TouchableOpacity onPress={closeDrawer} style={s.closeBtn}>
                <Text style={s.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>{ChatContent}</View>
          </Animated.View>
        </>
      )}
    </>
  );
}

const s = StyleSheet.create({
  // Chat
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
  lista: { paddingVertical: 12, paddingHorizontal: 12 },
  listaVacia: { flex: 1, justifyContent: "center" },
  cargarMas: { alignItems: "center", paddingVertical: 12 },
  cargarMasTexto: { fontSize: 13, color: GOLD, fontWeight: "600" },
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

  // Reply
  replyPreview: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F0EAE0",
    borderTopWidth: 1,
    borderTopColor: "#E8E0D0",
    gap: 8,
  },
  replyBar: { width: 3, height: 32, borderRadius: 2 },
  replyTexto: { flex: 1, fontSize: 12, color: "#666" },
  cancelIcon: { fontSize: 14, color: "#999", padding: 4 },

  // Input
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: Platform.OS === "android" ? 12 : 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#E8E0D0",
    backgroundColor: "#FAF7F2",
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
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: { fontSize: 18, color: "#fff", fontWeight: "700" },
  loginCTA: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 12,
    marginVertical: 8,
  },
  loginText: { fontSize: 14, fontWeight: "600" },

  // FAB
  fab: {
    position: "absolute",
    bottom: 120,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: { fontSize: 22 },
  fabBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#dc2626",
  },

  // Drawer
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 98,
  },
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: DRAWER_HEIGHT,
    backgroundColor: "#FAF7F2",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 99,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D4C5A9",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBE0",
  },
  headerDot: { width: 3, height: 20, borderRadius: 2 },
  drawerTitulo: { fontSize: 16, fontWeight: "700", color: "#2C1F0E" },
  drawerSub: { fontSize: 12, color: "#8B7355" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0EBE0",
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: { fontSize: 14, color: "#8B7355" },
});
