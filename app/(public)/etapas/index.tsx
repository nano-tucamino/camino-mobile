// 📄 C:\Users\ferna\Documents\tucamino\camino-mobile\app\(public)\etapas\index.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Svg, {
  Circle,
  Text as SvgText,
  Image as SvgImage,
} from "react-native-svg";
import {
  Footprints,
  TrendingUp,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Circle as CircleIcon,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation } from "@/contexts/NavigationContext";

const API_BASE = "https://camino-api.onrender.com/api";
const LOGO_URL =
  "https://res.cloudinary.com/dazuwnm1k/image/upload/v1776719543/logo-1_u5yiqq.png";

const CREMA = "#F5F0E8";
const GOLD = "#C49A3C";
const TINTA = "#2C2416";
const TINTA_SOFT = "#6B5B3E";
const PIEDRA = "#E8E0D0";
const BLANCO = "#FFFFFF";
const VERDE = "#6B8F5E";

interface Etapa {
  id: string;
  numero: number;
  nombre: string;
  nombre_en: string;
  nombre_de: string;
  nombre_fr: string;
  nombre_it: string;
  nombre_pt: string;
  nombre_ko: string;
  distancia_km: number;
  desnivel_pos: number;
  inicio_nombre: string;
  fin_nombre: string;
  sector: string;
  dificultad: string;
  slug: string;
  es_variante: boolean;
}

const DIFICULTAD_COLOR: Record<string, string> = {
  baja: "#6B8F5E",
  media: "#C49A3C",
  alta: "#C4703C",
  muy_alta: "#A63C3C",
};

const COMPLETADA_LABEL: Record<string, string> = {
  es: "COMPLETADA",
  en: "COMPLETED",
  de: "ABGESCHLOSSEN",
  fr: "COMPLÉTÉE",
  it: "COMPLETATA",
  pt: "CONCLUÍDA",
  ko: "완료",
  ja: "完了",
};

const SECTOR_LABEL: Record<string, string> = {
  frances: "Camino Francés",
  navarra: "Navarra",
  rioja: "La Rioja",
  castilla: "Castilla y León",
  galicia: "Galicia",
  bierzo: "El Bierzo",
};

function getNombre(etapa: Etapa, lang: string): string {
  const map: Record<string, string> = {
    en: etapa.nombre_en,
    de: etapa.nombre_de,
    fr: etapa.nombre_fr,
    it: etapa.nombre_it,
    pt: etapa.nombre_pt,
    ko: etapa.nombre_ko,
  };
  return map[lang] || etapa.nombre;
}

function SelloCamino({ lang }: { lang: string }) {
  const texto = COMPLETADA_LABEL[lang] ?? "COMPLETED";
  const r = 38;
  const chars = texto.split("");
  const totalAngle = 200;
  const anglePerChar = totalAngle / (chars.length + 1);
  const startAngle = -90 - totalAngle / 2;

  return (
    <Svg width={52} height={52} viewBox="0 0 110 110">
      <Circle
        cx="55"
        cy="55"
        r="52"
        stroke={GOLD}
        strokeWidth="2.5"
        fill="rgba(245,240,232,0.92)"
      />
      <Circle
        cx="55"
        cy="55"
        r="46"
        stroke={GOLD}
        strokeWidth="1"
        fill="none"
        strokeDasharray="3 4"
      />
      <SvgImage
        x="22"
        y="22"
        width="66"
        height="66"
        href={LOGO_URL}
        preserveAspectRatio="xMidYMid meet"
      />
      {chars.map((char, i) => {
        const angle = startAngle + 180 + (i + 1) * anglePerChar;
        const rad = (angle * Math.PI) / 180;
        const x = 55 + r * Math.cos(rad);
        const y = 55 + r * Math.sin(rad);
        return (
          <SvgText
            key={i}
            x={x}
            y={y}
            fontSize="9"
            fontWeight="800"
            fill={GOLD}
            textAnchor="middle"
            transform={`rotate(${angle + 90}, ${x}, ${y})`}
          >
            {char}
          </SvgText>
        );
      })}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <Circle
            key={angle}
            cx={55 + 49 * Math.cos(rad)}
            cy={55 + 49 * Math.sin(rad)}
            r="1.8"
            fill={GOLD}
          />
        );
      })}
    </Svg>
  );
}

function EtapaCard({
  etapa,
  lang,
  completada,
  logueado,
  onPress,
  onToggleCompletada,
}: {
  etapa: Etapa;
  lang: string;
  completada: boolean;
  logueado: boolean;
  onPress: () => void;
  onToggleCompletada: () => void;
}) {
  const { t } = useTranslation();
  const nombre = getNombre(etapa, lang);
  const dificultadColor = DIFICULTAD_COLOR[etapa.dificultad] ?? GOLD;
  const dificultadLabel = t(`etapas.dificultad.${etapa.dificultad}`);

  return (
    <TouchableOpacity
      style={[styles.card, completada && styles.cardCompletada]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardInner}>
        <View
          style={[
            styles.numeroContainer,
            completada && styles.numeroContainerCompletada,
          ]}
        >
          <Text
            style={[
              styles.numeroText,
              completada && styles.numeroTextCompletada,
            ]}
          >
            {etapa.es_variante
              ? "↳"
              : etapa.numero > 34
                ? `F${etapa.numero - 100}`
                : String(etapa.numero).padStart(2, "0")}
          </Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.nombreText} numberOfLines={2}>
            {nombre}
          </Text>
          <View style={styles.cardFooter}>
            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Footprints size={12} color={TINTA_SOFT} strokeWidth={1.5} />
                <Text style={styles.statChipText}>{etapa.distancia_km} km</Text>
              </View>
              <View style={styles.statChip}>
                <TrendingUp size={12} color={TINTA_SOFT} strokeWidth={1.5} />
                <Text style={styles.statChipText}>+{etapa.desnivel_pos}m</Text>
              </View>
            </View>
            <View
              style={[
                styles.dificultadChip,
                { backgroundColor: dificultadColor + "22" },
              ]}
            >
              <View
                style={[
                  styles.dificultadDot,
                  { backgroundColor: dificultadColor },
                ]}
              />
              <Text style={[styles.dificultadText, { color: dificultadColor }]}>
                {dificultadLabel}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.cardRight}>
          {logueado && !etapa.es_variante ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                onToggleCompletada();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.checkBtn}
            >
              {completada ? (
                <CheckCircle2 size={24} color={VERDE} strokeWidth={2} />
              ) : (
                <CircleIcon size={24} color={PIEDRA} strokeWidth={2} />
              )}
            </TouchableOpacity>
          ) : (
            <ChevronRight size={16} color={PIEDRA} strokeWidth={2} />
          )}
        </View>
      </View>
      {completada && (
        <View style={styles.selloContainer} pointerEvents="none">
          <View style={styles.selloWrapper}>
            <SelloCamino lang={lang} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function SectorSeparator({ sector }: { sector: string }) {
  return (
    <View style={styles.sectorContainer}>
      <View style={styles.sectorLine} />
      <Text style={styles.sectorText}>{SECTOR_LABEL[sector] ?? sector}</Text>
      <View style={styles.sectorLine} />
    </View>
  );
}

type ListItem =
  | { type: "sector"; sector: string; key: string }
  | { type: "etapa"; etapa: Etapa; key: string };

export default function EtapasScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] ?? "es";
  const { session } = useAuth();
  const logueado = !!session;
  const { onScroll: notifyScroll } = useNavigation();

  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [totalKm, setTotalKm] = useState(0);
  const [completadas, setCompletadas] = useState<Set<string>>(new Set());

  const cargar = useCallback(async () => {
    try {
      setError(false);
      const etapasPromise = fetch(`${API_BASE}/etapas`).then((r) => r.json());
      const completadasPromise =
        logueado && session
          ? fetch(`${API_BASE}/peregrino/perfil/etapas`, {
              headers: { Authorization: `Bearer ${session.access_token}` },
            }).then((r) => r.json())
          : Promise.resolve(null);

      const [etapasData, completadasData] = await Promise.all([
        etapasPromise,
        completadasPromise,
      ]);
      const etapas: Etapa[] = etapasData.etapas ?? [];
      const km = etapas
        .filter((e) => !e.es_variante)
        .reduce((sum, e) => sum + Number(e.distancia_km), 0);
      setTotalKm(Math.round(km));

      if (completadasData?.etapasCompletadas) {
        setCompletadas(
          new Set<string>(
            completadasData.etapasCompletadas.map((e: any) => e.etapa_id),
          ),
        );
      }

      const lista: ListItem[] = [];
      let sectorActual = "";
      for (const etapa of etapas) {
        if (!etapa.es_variante && etapa.sector !== sectorActual) {
          sectorActual = etapa.sector;
          lista.push({
            type: "sector",
            sector: etapa.sector,
            key: `sector-${etapa.sector}`,
          });
        }
        lista.push({ type: "etapa", etapa, key: etapa.id });
      }
      setItems(lista);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logueado, session]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const toggleCompletada = async (etapa: Etapa) => {
    if (!session) return;
    const yaCompletada = completadas.has(etapa.id);
    setCompletadas((prev) => {
      const next = new Set(prev);
      yaCompletada ? next.delete(etapa.id) : next.add(etapa.id);
      return next;
    });
    try {
      const res = await fetch(
        `${API_BASE}/peregrino/perfil/etapas/${etapa.id}`,
        {
          method: yaCompletada ? "DELETE" : "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      );
      if (!res.ok) throw new Error("Error");
    } catch {
      setCompletadas((prev) => {
        const next = new Set(prev);
        yaCompletada ? next.add(etapa.id) : next.delete(etapa.id);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.errorText}>{t("etapas.error_carga")}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={cargar}>
          <RefreshCw size={16} color={BLANCO} />
          <Text style={styles.retryText}>{t("etapas.dificultad.baja")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={TINTA} />
      <FlatList
        data={items}
        onScroll={() => notifyScroll()}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              cargar();
            }}
            tintColor={GOLD}
            colors={[GOLD]}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerHero}>
            <Text style={styles.headerTitle}>{t("etapas.titulo")}</Text>
            <Text style={styles.headerSubtitle}>{t("etapas.subtitulo")}</Text>
            {logueado && completadas.size > 0 && (
              <View style={styles.progresoRow}>
                <View style={styles.progresoBar}>
                  <View
                    style={[
                      styles.progresoFill,
                      { width: `${(completadas.size / 34) * 100}%` as any },
                    ]}
                  />
                </View>
                <Text style={styles.progresoText}>{completadas.size}/34</Text>
              </View>
            )}
            <View style={styles.headerStats}>
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>34</Text>
                <Text style={styles.headerStatLabel}>
                  {t("etapas.stat_etapas")}
                </Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>{totalKm}</Text>
                <Text style={styles.headerStatLabel}>
                  {t("etapas.stat_km")}
                </Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>~30d</Text>
                <Text style={styles.headerStatLabel}>
                  {t("etapas.stat_estimado")}
                </Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === "sector")
            return <SectorSeparator sector={item.sector} />;
          return (
            <EtapaCard
              etapa={item.etapa}
              lang={lang}
              completada={completadas.has(item.etapa.id)}
              logueado={logueado}
              onPress={() => router.push(`/etapas/${item.etapa.slug}` as any)}
              onToggleCompletada={() => toggleCompletada(item.etapa)}
            />
          );
        }}
        ListFooterComponent={<View style={{ height: 110 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREMA },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: CREMA,
    gap: 16,
  },
  errorText: { fontSize: 15, color: TINTA_SOFT },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: GOLD,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: { color: BLANCO, fontSize: 14, fontWeight: "600" },
  headerHero: {
    backgroundColor: TINTA,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    gap: 4,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: BLANCO,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: GOLD,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  progresoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  progresoBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progresoFill: { height: "100%", backgroundColor: GOLD, borderRadius: 2 },
  progresoText: { fontSize: 12, color: GOLD, fontWeight: "700" },
  headerStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  headerStat: { flex: 1, alignItems: "center", gap: 2 },
  headerStatValue: { fontSize: 20, fontWeight: "700", color: BLANCO },
  headerStatLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  listContent: { paddingBottom: 20 },
  sectorContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  sectorLine: { flex: 1, height: 1, backgroundColor: PIEDRA },
  sectorText: {
    fontSize: 11,
    fontWeight: "700",
    color: TINTA_SOFT,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  card: {
    backgroundColor: BLANCO,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PIEDRA,
    overflow: "hidden",
  },
  cardCompletada: {
    borderColor: "#6B8F5E",
    backgroundColor: "#F2F7F0",
    borderWidth: 1.5,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  numeroContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: CREMA,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: PIEDRA,
    flexShrink: 0,
  },
  numeroContainerCompletada: {
    backgroundColor: "#6B8F5E22",
    borderColor: "#6B8F5E60",
  },
  numeroText: {
    fontSize: 13,
    fontWeight: "800",
    color: TINTA,
    letterSpacing: -0.5,
  },
  numeroTextCompletada: { color: "#6B8F5E" },
  cardContent: { flex: 1, gap: 6 },
  nombreText: {
    fontSize: 15,
    fontWeight: "700",
    color: TINTA,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statsRow: { flexDirection: "row", gap: 10 },
  statChip: { flexDirection: "row", alignItems: "center", gap: 3 },
  statChipText: { fontSize: 12, color: TINTA_SOFT, fontWeight: "500" },
  dificultadChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dificultadDot: { width: 6, height: 6, borderRadius: 3 },
  dificultadText: { fontSize: 11, fontWeight: "600" },
  cardRight: { flexShrink: 0 },
  checkBtn: { padding: 2 },
  selloContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  // Sello más pequeño:
  selloWrapper: { opacity: 0.75, transform: [{ rotate: "-18deg" }] },
});
