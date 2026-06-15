// 📄 app/(public)/index.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Location from "expo-location";
import {
  Footprints,
  TrendingUp,
  Clock,
  Thermometer,
  Droplets,
  Wind,
  ChevronRight,
  BedDouble,
  RefreshCw,
  MapPin,
} from "lucide-react-native";

import CanalEtapaWidget from "@/components/dashboard/CanalEtapaWidget";
import { useNavigation } from "@/contexts/NavigationContext";
import { useAuth } from "@/contexts/AuthContext";
import { Animated } from "react-native";

const { width, height } = Dimensions.get("window");
const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api`;

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Waypoint {
  orden: number;
  km_acumulado: number;
  localidad: string;
  elevacion: number;
  lat?: number;
  lng?: number;
}

interface AlbergueResumen {
  id: string;
  nombre: string;
  plazas_totales: number;
  precio_desde: number;
  tipo: string;
}

interface EtapaResumen {
  id: string;
  numero: number;
  nombre: string;
  slug: string;
  distancia_km: number;
  tiempo_estimado: string | null;
  desnivel_pos: number;
  desnivel_neg: number;
  dificultad:
    | "facil"
    | "moderada"
    | "dificil"
    | "muy_dificil"
    | "baja"
    | "media"
    | "alta";
  descripcion_corta: string | null;
  foto_url: string | null;
  inicio_nombre?: string;
  fin_nombre?: string;
  waypoints: Waypoint[];
  albergues: AlbergueResumen[];
}

interface Clima {
  temp: number;
  precip: number;
  viento: number;
  icono: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIFICULTAD_COLOR: Record<string, string> = {
  facil: "#6B8F5E",
  baja: "#6B8F5E",
  moderada: "#C49A3C",
  media: "#C49A3C",
  dificil: "#C4703C",
  alta: "#C4703C",
  muy_dificil: "#A63C3C",
};

const DIFICULTAD_LABEL: Record<string, Record<string, string>> = {
  es: {
    facil: "Fácil",
    baja: "Fácil",
    moderada: "Moderada",
    media: "Moderada",
    dificil: "Difícil",
    alta: "Difícil",
    muy_dificil: "Muy difícil",
  },
  en: {
    facil: "Easy",
    baja: "Easy",
    moderada: "Moderate",
    media: "Moderate",
    dificil: "Hard",
    alta: "Hard",
    muy_dificil: "Very hard",
  },
  de: {
    facil: "Leicht",
    baja: "Leicht",
    moderada: "Moderat",
    media: "Moderat",
    dificil: "Schwer",
    alta: "Schwer",
    muy_dificil: "Sehr schwer",
  },
  fr: {
    facil: "Facile",
    baja: "Facile",
    moderada: "Modéré",
    media: "Modéré",
    dificil: "Difficile",
    alta: "Difficile",
    muy_dificil: "Très difficile",
  },
  it: {
    facil: "Facile",
    baja: "Facile",
    moderada: "Moderato",
    media: "Moderato",
    dificil: "Difficile",
    alta: "Difficile",
    muy_dificil: "Molto difficile",
  },
  pt: {
    facil: "Fácil",
    baja: "Fácil",
    moderada: "Moderado",
    media: "Moderado",
    dificil: "Difícil",
    alta: "Difícil",
    muy_dificil: "Muito difícil",
  },
  ko: {
    facil: "쉬움",
    baja: "쉬움",
    moderada: "보통",
    media: "보통",
    dificil: "어려움",
    alta: "어려움",
    muy_dificil: "매우 어려움",
  },
  ja: {
    facil: "簡単",
    baja: "簡単",
    moderada: "普通",
    media: "普通",
    dificil: "難しい",
    alta: "難しい",
    muy_dificil: "とても難しい",
  },
};

function getDificultadLabel(dificultad: string, lang: string): string {
  const map = DIFICULTAD_LABEL[lang] ?? DIFICULTAD_LABEL["en"];
  return map[dificultad] ?? dificultad;
}

function weatherCodeToIcon(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  return "⛈️";
}

async function fetchClima(lat: number, lng: number): Promise<Clima | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,wind_speed_10m,weather_code&timezone=auto`;
    const res = await fetch(url);
    const data = await res.json();
    const c = data.current;
    return {
      temp: Math.round(c.temperature_2m),
      precip: c.precipitation,
      viento: Math.round(c.wind_speed_10m),
      icono: weatherCodeToIcon(c.weather_code),
    };
  } catch {
    return null;
  }
}

// ─── Colores ──────────────────────────────────────────────────────────────────

const CREMA = "#F5F0E8";
const GOLD = "#C49A3C";
const TINTA = "#2C2416";
const TINTA_SOFT = "#6B5B3E";
const PIEDRA = "#E8E0D0";
const BLANCO = "#FFFFFF";
const VERDE = "#2D5016";
const FALLBACK_HERO =
  "https://res.cloudinary.com/dazuwnm1k/image/upload/v1774432766/catedrales-santiago_yntkre.webp";

// ─── Componente principal ─────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const { session, perfil } = useAuth();
  const lang = i18n.language?.split("-")[0] ?? "es";

  const [etapa, setEtapa] = useState<EtapaResumen | null>(null);
  const [clima, setClima] = useState<Clima | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [enCamino, setEnCamino] = useState(false);
  const [distanciaMetros, setDistanciaMetros] = useState<number | null>(null);
  const { onScroll: notifyScroll } = useNavigation();

  const cargar = useCallback(async () => {
    try {
      setError(false);
      let data: any = null;

      if (session) {
        // Intentar obtener ubicación y etapa cercana
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          if (status === "granted") {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            const res = await fetch(
              `${API_BASE}/etapas/cercana?lat=${loc.coords.latitude}&lng=${loc.coords.longitude}`,
            );
            const cercana = await res.json();
            if (cercana.en_camino && cercana.etapa) {
              data = { etapa: cercana.etapa };
              setEnCamino(true);
              setDistanciaMetros(cercana.distancia_metros);
            }
          }
        } catch {
          // Si falla la ubicación, caer a aleatoria
        }
      }

      // Fallback: etapa aleatoria
      if (!data) {
        if (session && perfil?.etapa_actual_slug) {
          const res = await fetch(
            `${API_BASE}/etapas/${perfil.etapa_actual_slug}/resumen`,
          );
          data = await res.json();
          setEnCamino(false);
          setDistanciaMetros(null);
        } else if (session && !perfil?.etapa_actual_slug) {
          router.replace("/(auth)/seleccionar-sector" as any);
          return;
        } else {
          const res = await fetch(`${API_BASE}/etapas/aleatoria`);
          data = await res.json();
          setEnCamino(false);
          setDistanciaMetros(null);
        }
      }

      if (!data.etapa) throw new Error("Sin etapa");
      setEtapa(data.etapa);

      const wp = data.etapa.waypoints?.find(
        (w: Waypoint) => w.lat != null && w.lng != null,
      );
      if (wp?.lat && wp?.lng) {
        const c = await fetchClima(wp.lat, wp.lng);
        setClima(c);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session, perfil]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const onRefresh = () => {
    setRefreshing(true);
    setEtapa(null);
    setClima(null);
    cargar();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  if (error || !etapa) {
    return (
      <View style={styles.centered}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.errorText}>No se pudo cargar la etapa</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={cargar}>
          <RefreshCw size={16} color={BLANCO} />
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const heroUrl = etapa.foto_url ?? FALLBACK_HERO;
  const dificultadColor = DIFICULTAD_COLOR[etapa.dificultad] ?? GOLD;
  const dificultadLabel = getDificultadLabel(etapa.dificultad, lang);
  const tiempoLabel = etapa.tiempo_estimado
    ? etapa.tiempo_estimado.replace(":", "h ") + "min"
    : null;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <Animated.ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={() => notifyScroll()}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={GOLD}
            colors={[GOLD]}
          />
        }
      >
        {/* ── Hero ────────────────────────────────────────────────────── */}
        <ImageBackground
          source={{ uri: heroUrl }}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroOverlay} />

          {/* Badge — En camino o Etapa del día */}
          <View
            style={[
              styles.heroBadge,
              enCamino && { backgroundColor: "rgba(45,80,22,0.92)" },
            ]}
          >
            {enCamino ? (
              <View style={styles.heroBadgeRow}>
                <MapPin size={10} color={BLANCO} />
                <Text style={styles.heroBadgeText}>
                  {distanciaMetros && distanciaMetros < 1000
                    ? `A ${distanciaMetros}m del camino`
                    : distanciaMetros
                      ? `A ${Math.round(distanciaMetros / 1000)}km del camino`
                      : "EN RUTA"}
                </Text>
              </View>
            ) : (
              <Text style={styles.heroBadgeText}>ETAPA DEL DÍA</Text>
            )}
          </View>

          <Text style={styles.heroNumeroFantasma}>
            {String(etapa.numero).padStart(2, "0")}
          </Text>

          <View style={styles.heroBottom}>
            <Text style={styles.heroNombre}>{etapa.nombre}</Text>
            {etapa.inicio_nombre && etapa.fin_nombre && (
              <Text style={styles.heroRuta}>
                {etapa.inicio_nombre} → {etapa.fin_nombre}
              </Text>
            )}
            <View style={styles.heroDificultadRow}>
              <View
                style={[
                  styles.heroDificultadDot,
                  { backgroundColor: dificultadColor },
                ]}
              />
              <Text style={styles.heroDificultadText}>{dificultadLabel}</Text>
            </View>
          </View>
        </ImageBackground>

        {/* ── Stats ───────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Footprints size={20} color={GOLD} strokeWidth={1.5} />
              <Text style={styles.statValue}>{etapa.distancia_km} km</Text>
              <Text style={styles.statLabel}>Distancia</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <TrendingUp size={20} color={GOLD} strokeWidth={1.5} />
              <Text style={styles.statValue}>+{etapa.desnivel_pos}m</Text>
              <Text style={styles.statLabel}>Desnivel</Text>
            </View>
            {tiempoLabel && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Clock size={20} color={GOLD} strokeWidth={1.5} />
                  <Text style={styles.statValue}>{tiempoLabel}</Text>
                  <Text style={styles.statLabel}>Tiempo</Text>
                </View>
              </>
            )}
          </View>

          {etapa.descripcion_corta ? (
            <Text style={styles.descripcion}>{etapa.descripcion_corta}</Text>
          ) : null}

          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => router.push(`/etapas/${etapa.slug}` as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaBtnText}>Ver etapa completa</Text>
              <ChevronRight size={18} color={BLANCO} strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Botón ver en mapa */}
            <TouchableOpacity
              style={styles.ctaBtnMapa}
              onPress={() =>
                router.push(`/(public)/mapa?etapa=${etapa.slug}` as any)
              }
              activeOpacity={0.85}
            >
              <MapPin size={18} color={VERDE} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Clima ───────────────────────────────────────────────────── */}
        {clima && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tiempo en ruta</Text>
            <View style={styles.climaCard}>
              <Text style={styles.climaIcono}>{clima.icono}</Text>
              <View style={styles.climaStats}>
                <View style={styles.climaStat}>
                  <Thermometer size={15} color={TINTA_SOFT} strokeWidth={1.5} />
                  <Text style={styles.climaValue}>{clima.temp}°C</Text>
                </View>
                <View style={styles.climaStat}>
                  <Droplets size={15} color={TINTA_SOFT} strokeWidth={1.5} />
                  <Text style={styles.climaValue}>{clima.precip} mm</Text>
                </View>
                <View style={styles.climaStat}>
                  <Wind size={15} color={TINTA_SOFT} strokeWidth={1.5} />
                  <Text style={styles.climaValue}>{clima.viento} km/h</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <CanalEtapaWidget slug={etapa.slug} lang={lang} />
        </View>

        {/* ── Albergues ───────────────────────────────────────────────── */}
        {etapa.albergues.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Albergues</Text>
              <TouchableOpacity
                onPress={() => router.push("/albergues" as any)}
              >
                <Text style={styles.sectionLink}>Ver todos →</Text>
              </TouchableOpacity>
            </View>
            {etapa.albergues.map((alb) => (
              <View key={alb.id} style={styles.albergueRow}>
                <View style={styles.albergueIconBox}>
                  <BedDouble size={16} color={GOLD} strokeWidth={1.5} />
                </View>
                <View style={styles.albergueInfo}>
                  <Text style={styles.albergueNombre} numberOfLines={1}>
                    {alb.nombre}
                  </Text>
                  <Text style={styles.albergueMeta}>
                    {alb.plazas_totales ? `${alb.plazas_totales} plazas` : ""}
                    {alb.precio_desde ? ` · desde ${alb.precio_desde}€` : ""}
                  </Text>
                </View>
                <View style={styles.albergueTipoChip}>
                  <Text style={styles.albergueTipoText}>{alb.tipo}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Recorrido ───────────────────────────────────────────────── */}
        {etapa.waypoints.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recorrido</Text>
            <View style={styles.recorridoCard}>
              {etapa.waypoints.map((wp, i) => {
                const isFirst = i === 0;
                const isLast = i === etapa.waypoints.length - 1;
                return (
                  <View key={wp.orden} style={styles.recorridoItem}>
                    <View style={styles.recorridoTimeline}>
                      <View
                        style={[
                          styles.recorridoDot,
                          isFirst && styles.recorridoDotFirst,
                          isLast && styles.recorridoDotLast,
                        ]}
                      />
                      {!isLast && <View style={styles.recorridoLine} />}
                    </View>
                    <View
                      style={[
                        styles.recorridoContent,
                        !isLast && styles.recorridoContentPad,
                      ]}
                    >
                      <View style={styles.recorridoRow}>
                        <Text
                          style={[
                            styles.recorridoLocalidad,
                            (isFirst || isLast) &&
                              styles.recorridoLocalidadDestacada,
                          ]}
                        >
                          {wp.localidad}
                        </Text>
                        <Text style={styles.recorridoKm}>
                          km {wp.km_acumulado}
                        </Text>
                      </View>
                      <Text style={styles.recorridoElevacion}>
                        {wp.elevacion} m
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 110 }} />
      </Animated.ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREMA },
  scroll: { flex: 1 },
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
  hero: {
    width,
    height: height * 0.52,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  heroImage: { resizeMode: "cover" },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 14, 6, 0.42)",
  },
  heroBadge: {
    marginTop: 60,
    marginLeft: 20,
    alignSelf: "flex-start",
    backgroundColor: "rgba(196, 154, 60, 0.92)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
  },
  heroBadgeRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  heroBadgeText: {
    color: BLANCO,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  heroNumeroFantasma: {
    position: "absolute",
    right: 16,
    top: 48,
    fontSize: 96,
    fontWeight: "900",
    color: "rgba(255,255,255,0.10)",
    lineHeight: 96,
  },
  heroBottom: { paddingHorizontal: 20, paddingBottom: 28, gap: 6 },
  heroNombre: {
    fontSize: 26,
    fontWeight: "700",
    color: BLANCO,
    letterSpacing: -0.4,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heroRuta: { fontSize: 13, color: "rgba(255,255,255,0.75)" },
  heroDificultadRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  heroDificultadDot: { width: 8, height: 8, borderRadius: 4 },
  heroDificultadText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    fontWeight: "500",
  },
  card: {
    backgroundColor: BLANCO,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statDivider: { width: 1, height: 38, backgroundColor: PIEDRA },
  statValue: { fontSize: 16, fontWeight: "700", color: TINTA, marginTop: 2 },
  statLabel: {
    fontSize: 10,
    color: TINTA_SOFT,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  descripcion: { fontSize: 14, color: TINTA_SOFT, lineHeight: 21 },
  ctaRow: { flexDirection: "row", gap: 10 },
  ctaBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GOLD,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 6,
  },
  ctaBtnText: {
    color: BLANCO,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  ctaBtnMapa: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F0E8",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#D4C5A9",
  },
  section: { marginHorizontal: 16, marginTop: 20, gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: TINTA,
    letterSpacing: -0.2,
  },
  sectionLink: { fontSize: 13, color: GOLD, fontWeight: "600" },
  climaCard: {
    backgroundColor: BLANCO,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    borderWidth: 1,
    borderColor: PIEDRA,
  },
  climaIcono: { fontSize: 40 },
  climaStats: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
  climaStat: { alignItems: "center", gap: 4 },
  climaValue: { fontSize: 13, fontWeight: "600", color: TINTA },
  albergueRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BLANCO,
    borderRadius: 10,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: PIEDRA,
  },
  albergueIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#FBF7EF",
    justifyContent: "center",
    alignItems: "center",
  },
  albergueInfo: { flex: 1, gap: 3 },
  albergueNombre: { fontSize: 14, fontWeight: "600", color: TINTA },
  albergueMeta: { fontSize: 12, color: TINTA_SOFT },
  albergueTipoChip: {
    backgroundColor: PIEDRA,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  albergueTipoText: {
    fontSize: 11,
    color: TINTA_SOFT,
    textTransform: "capitalize",
  },
  recorridoCard: {
    backgroundColor: BLANCO,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: PIEDRA,
  },
  recorridoItem: { flexDirection: "row", gap: 12 },
  recorridoTimeline: { width: 14, alignItems: "center", paddingTop: 6 },
  recorridoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BLANCO,
    borderWidth: 2,
    borderColor: PIEDRA,
  },
  recorridoDotFirst: { borderColor: GOLD, backgroundColor: GOLD },
  recorridoDotLast: { borderColor: TINTA, backgroundColor: TINTA },
  recorridoLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: PIEDRA,
    marginVertical: 2,
    minHeight: 24,
  },
  recorridoContent: { flex: 1, paddingTop: 2, gap: 2 },
  recorridoContentPad: { paddingBottom: 16 },
  recorridoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recorridoLocalidad: { fontSize: 13, fontWeight: "500", color: TINTA_SOFT },
  recorridoLocalidadDestacada: {
    fontWeight: "700",
    color: TINTA,
    fontSize: 14,
  },
  recorridoKm: { fontSize: 12, color: GOLD, fontWeight: "600" },
  recorridoElevacion: { fontSize: 11, color: TINTA_SOFT },
});
