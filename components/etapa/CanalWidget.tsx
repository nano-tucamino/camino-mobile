// 📄 components/etapa/CanalWidget.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import type { Tables } from "@/types/database";

type Mensaje = Tables<"mensajes"> & { perfil?: { nombre_display: string } };

interface Props {
  etapaId: string;
  etapaNombre: string;
  mensajes: Mensaje[];
  color: string;
  lang: string;
  onNuevoMensaje?: (texto: string) => Promise<void>;
}

const { height: SH } = Dimensions.get("window");
const DRAWER_HEIGHT = SH * 0.7;

const FLAG: Record<string, string> = {
  es: "🇪🇸",
  en: "🇬🇧",
  de: "🇩🇪",
  fr: "🇫🇷",
  it: "🇮🇹",
  pt: "🇵🇹",
  ko: "🇰🇷",
  ja: "🇯🇵",
};

const LABELS: Record<string, Record<string, string>> = {
  es: {
    titulo: "Canal de la etapa",
    sub: "Mensajes en tiempo real de peregrinos",
    placeholder: "Escribe un mensaje...",
    vacio: "Todavía no hay mensajes",
    login: "Inicia sesión para participar",
    enviar: "Enviar",
  },
  en: {
    titulo: "Stage channel",
    sub: "Real-time messages from pilgrims",
    placeholder: "Write a message...",
    vacio: "No messages yet",
    login: "Log in to participate",
    enviar: "Send",
  },
  de: {
    titulo: "Etappen-Kanal",
    sub: "Echtzeit-Nachrichten von Pilgern",
    placeholder: "Nachricht schreiben...",
    vacio: "Noch keine Nachrichten",
    login: "Anmelden zum Teilnehmen",
    enviar: "Senden",
  },
  fr: {
    titulo: "Canal de l'étape",
    sub: "Messages en temps réel des pèlerins",
    placeholder: "Écrire un message...",
    vacio: "Pas encore de messages",
    login: "Connectez-vous pour participer",
    enviar: "Envoyer",
  },
  it: {
    titulo: "Canale della tappa",
    sub: "Messaggi in tempo reale dei pellegrini",
    placeholder: "Scrivi un messaggio...",
    vacio: "Ancora nessun messaggio",
    login: "Accedi per partecipare",
    enviar: "Invia",
  },
  pt: {
    titulo: "Canal da etapa",
    sub: "Mensagens em tempo real dos peregrinos",
    placeholder: "Escreve uma mensagem...",
    vacio: "Ainda não há mensagens",
    login: "Inicia sessão para participar",
    enviar: "Enviar",
  },
  ko: {
    titulo: "구간 채널",
    sub: "순례자들의 실시간 메시지",
    placeholder: "메시지 작성...",
    vacio: "아직 메시지가 없습니다",
    login: "참여하려면 로그인하세요",
    enviar: "보내기",
  },
  ja: {
    titulo: "ステージチャンネル",
    sub: "巡礼者からのリアルタイムメッセージ",
    placeholder: "メッセージを書く...",
    vacio: "まだメッセージはありません",
    login: "参加するにはログイン",
    enviar: "送信",
  },
};

function tl(lang: string, key: string): string {
  const l = lang.split("-")[0];
  return LABELS[l]?.[key] ?? LABELS.es[key] ?? key;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function CanalWidget({
  etapaId,
  etapaNombre,
  mensajes,
  color,
  lang,
  onNuevoMensaje,
}: Props) {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState("");
  const [sending, setSending] = useState(false);
  const slideAnim = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
  const scrollRef = useRef<ScrollView>(null);

  // userId null hasta auth
  const userId: string | null = null;

  const openDrawer = () => {
    setOpen(true);
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

  useEffect(() => {
    if (open)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
  }, [open, mensajes.length]);

  const handleEnviar = async () => {
    if (!texto.trim() || !onNuevoMensaje) return;
    setSending(true);
    try {
      await onNuevoMensaje(texto.trim());
      setTexto("");
      scrollRef.current?.scrollToEnd({ animated: true });
    } finally {
      setSending(false);
    }
  };

  const l = lang.split("-")[0];

  return (
    <>
      {/* ── Botón flotante ── */}
      <TouchableOpacity
        onPress={openDrawer}
        style={[s.fab, { backgroundColor: color }]}
        activeOpacity={0.85}
      >
        <Text style={s.fabIcon}>💬</Text>
        {mensajes.length > 0 && (
          <View style={s.fabBadge}>
            <Text style={s.fabBadgeText}>
              {mensajes.length > 99 ? "99+" : mensajes.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* ── Drawer ── */}
      {open && (
        <>
          {/* Backdrop */}
          <TouchableOpacity
            style={s.backdrop}
            onPress={closeDrawer}
            activeOpacity={1}
          />

          <Animated.View
            style={[s.drawer, { transform: [{ translateY: slideAnim }] }]}
          >
            {/* Handle */}
            <View style={s.handle} />

            {/* Header */}
            <View style={s.drawerHeader}>
              <View style={[s.headerDot, { backgroundColor: color }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.drawerTitulo}>{tl(lang, "titulo")}</Text>
                <Text style={s.drawerSub}>{etapaNombre}</Text>
              </View>
              <TouchableOpacity onPress={closeDrawer} style={s.closeBtn}>
                <Text style={s.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.drawerDesc}>{tl(lang, "sub")}</Text>

            {/* Mensajes */}
            <ScrollView
              ref={scrollRef}
              style={s.mensajesList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              {mensajes.length === 0 ? (
                <View style={s.vacioCont}>
                  <Text style={s.vacioIcon}>💬</Text>
                  <Text style={s.vacioText}>{tl(lang, "vacio")}</Text>
                </View>
              ) : (
                mensajes.map((msg) => {
                  const flag = FLAG[msg.idioma_origen] ?? "🌍";
                  const texto = (msg.traducciones as any)?.[l] || msg.contenido;
                  return (
                    <View key={msg.id} style={s.msgCard}>
                      <View style={s.msgHeader}>
                        <View style={s.msgAvatar}>
                          <Text style={{ fontSize: 11 }}>{flag}</Text>
                        </View>
                        <Text style={s.msgAutor}>
                          {msg.perfil?.nombre_display ?? "Peregrino"}
                        </Text>
                        <Text style={s.msgTiempo}>
                          {timeAgo(msg.created_at)}
                        </Text>
                      </View>
                      <Text style={s.msgTexto}>{texto}</Text>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Input o CTA login */}
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              {userId ? (
                <View style={[s.inputRow, { borderColor: color }]}>
                  <TextInput
                    style={s.input}
                    value={texto}
                    onChangeText={setTexto}
                    placeholder={tl(lang, "placeholder")}
                    placeholderTextColor="#B4A890"
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity
                    onPress={handleEnviar}
                    disabled={sending || !texto.trim()}
                    style={[
                      s.sendBtn,
                      {
                        backgroundColor: color,
                        opacity: sending || !texto.trim() ? 0.5 : 1,
                      },
                    ]}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={s.sendIcon}>↑</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={[s.loginCTA, { borderColor: color }]}>
                  <Text style={[s.loginText, { color }]}>
                    {tl(lang, "login")}
                  </Text>
                </TouchableOpacity>
              )}
            </KeyboardAvoidingView>
          </Animated.View>
        </>
      )}
    </>
  );
}

const s = StyleSheet.create({
  // FAB
  fab: {
    position: "absolute",
    bottom: 100,
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
    top: -4,
    right: -4,
    backgroundColor: "#dc2626",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  fabBadgeText: { fontSize: 10, color: "white", fontWeight: "700" },

  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 98,
  },

  // Drawer
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
    paddingHorizontal: 20,
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
    marginBottom: 16,
  },

  // Header drawer
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
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
  drawerDesc: { fontSize: 12, color: "#8B7355", marginBottom: 14 },

  // Mensajes
  mensajesList: { flex: 1, marginBottom: 12 },
  vacioCont: { alignItems: "center", paddingVertical: 32 },
  vacioIcon: { fontSize: 32, marginBottom: 8 },
  vacioText: { fontSize: 13, color: "#8B7355" },
  msgCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F0EBE0",
  },
  msgHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  msgAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F0EBE0",
    alignItems: "center",
    justifyContent: "center",
  },
  msgAutor: { flex: 1, fontSize: 12, fontWeight: "600", color: "#2C1F0E" },
  msgTiempo: { fontSize: 11, color: "#8B7355" },
  msgTexto: { fontSize: 13, color: "#5C4A32", lineHeight: 19 },

  // Input
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 8,
    backgroundColor: "white",
  },
  input: { flex: 1, fontSize: 14, color: "#2C1F0E", maxHeight: 80 },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: { color: "white", fontSize: 18, fontWeight: "700" },
  loginCTA: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: "white",
  },
  loginText: { fontSize: 14, fontWeight: "600" },
});
