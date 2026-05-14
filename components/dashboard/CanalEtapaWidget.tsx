// 📄 app/components/dashboard/CanalEtapaWidget.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MessageCircle, ChevronRight, Users } from "lucide-react-native";

const API_BASE = "https://camino-api.onrender.com/api";

// ─── Colores ──────────────────────────────────────────────────────────────────
const CREMA = "#F5F0E8";
const GOLD = "#C49A3C";
const TINTA = "#2C2416";
const TINTA_SOFT = "#6B5B3E";
const PIEDRA = "#E8E0D0";
const BLANCO = "#FFFFFF";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Autor {
  id: string;
  nombre_display: string;
  avatar_url: string | null;
  idioma_nativo: string;
  nacionalidad: string | null;
}

interface Mensaje {
  id: string;
  contenido: string;
  idioma_origen: string;
  traducciones: Record<string, string>;
  created_at: string;
  autor: Autor;
}

interface CanalEtapaWidgetProps {
  slug: string;
  lang?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function getTexto(msg: Mensaje, lang: string): string {
  return (
    msg.traducciones?.[lang] ??
    msg.traducciones?.[msg.idioma_origen] ??
    msg.contenido
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `hace ${days}d`;
  if (hours > 0) return `hace ${hours}h`;
  if (mins > 0) return `hace ${mins}min`;
  return "ahora";
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CanalEtapaWidget({
  slug,
  lang = "es",
}: CanalEtapaWidgetProps) {
  const router = useRouter();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_BASE}/canal-etapa/slug/${slug}/recientes?limit=3`)
      .then((r) => r.json())
      .then((data) => {
        setMensajes(data.mensajes ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={GOLD} />
      </View>
    );
  }

  if (mensajes.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MessageCircle size={16} color={GOLD} strokeWidth={1.5} />
          <Text style={styles.titulo}>Canal de la etapa</Text>
        </View>
        <View style={styles.headerRight}>
          {total > 0 && (
            <View style={styles.totalBadge}>
              <Users size={11} color={TINTA_SOFT} strokeWidth={1.5} />
              <Text style={styles.totalText}>{total}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Mensajes */}
      <View style={styles.mensajesContainer}>
        {mensajes.map((msg, i) => {
          const texto = getTexto(msg, lang);
          const bandera = BANDERAS[msg.idioma_origen] ?? "🌍";
          const isLast = i === mensajes.length - 1;

          return (
            <View
              key={msg.id}
              style={[styles.mensajeRow, !isLast && styles.mensajeRowBorder]}
            >
              {/* Avatar / bandera */}
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarEmoji}>{bandera}</Text>
                </View>
              </View>
              {/* Contenido */}
              <View style={styles.mensajeContent}>
                <View style={styles.mensajeMeta}>
                  <Text style={styles.autorNombre} numberOfLines={1}>
                    {msg.autor?.nombre_display ?? "Peregrino"}
                  </Text>
                  <Text style={styles.tiempo}>{timeAgo(msg.created_at)}</Text>
                </View>
                <Text style={styles.mensajeTexto} numberOfLines={3}>
                  {texto}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.ctaRow}
        onPress={() => router.push(`/etapas/${slug}/chat` as any)}
        activeOpacity={0.7}
      >
        <Text style={styles.ctaText}>Unirse al canal</Text>
        <ChevronRight size={15} color={GOLD} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  container: {
    backgroundColor: BLANCO,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PIEDRA,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PIEDRA,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  titulo: {
    fontSize: 14,
    fontWeight: "700",
    color: TINTA,
    letterSpacing: -0.2,
  },
  totalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: CREMA,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  totalText: {
    fontSize: 11,
    color: TINTA_SOFT,
    fontWeight: "600",
  },
  mensajesContainer: {
    paddingHorizontal: 14,
  },
  mensajeRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 12,
  },
  mensajeRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: PIEDRA,
  },
  avatarContainer: {
    paddingTop: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CREMA,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: PIEDRA,
  },
  avatarEmoji: {
    fontSize: 17,
  },
  mensajeContent: {
    flex: 1,
    gap: 3,
  },
  mensajeMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  autorNombre: {
    fontSize: 12,
    fontWeight: "700",
    color: TINTA,
    flex: 1,
  },
  tiempo: {
    fontSize: 11,
    color: TINTA_SOFT,
  },
  mensajeTexto: {
    fontSize: 13,
    color: TINTA_SOFT,
    lineHeight: 19,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: PIEDRA,
    backgroundColor: "#FDFAF5",
  },
  ctaText: {
    fontSize: 13,
    fontWeight: "700",
    color: GOLD,
  },
});
