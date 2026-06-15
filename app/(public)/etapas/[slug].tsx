// 📄 app/(public)/etapas/[slug].tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useTranslation } from "react-i18next";
import Svg, {
  Path,
  Circle,
  Line,
  Rect,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import { apiGet } from "@/lib/api";
import type { Tables, Enums } from "@/types/database";
import RecorridoTimeline from "@/components/etapa/RecorridoTimeline";
import ExperienciasPanel from "@/components/etapa/ExperienciasPanel";
import EtapaCheckButton from "@/components/etapa/EtapaCheckButton";
import CanalChat from "@/components/chat/CanalChat";
import { useNavigation } from "@/contexts/NavigationContext";
import { Linking } from "react-native";

import { getCanalEtapa } from "@/lib/chat";

function encodePolyline(coords: [number, number][], precision = 5): string {
  const factor = Math.pow(10, precision);
  let output = "";
  let prevLat = 0,
    prevLng = 0;
  for (const [lng, lat] of coords) {
    const lat5 = Math.round(lat * factor);
    const lng5 = Math.round(lng * factor);
    output += encodeSignedNumber(lat5 - prevLat);
    output += encodeSignedNumber(lng5 - prevLng);
    prevLat = lat5;
    prevLng = lng5;
  }
  return output;
}

function encodeSignedNumber(num: number): string {
  let sgnNum = num << 1;
  if (num < 0) sgnNum = ~sgnNum;
  let result = "";
  while (sgnNum >= 0x20) {
    result += String.fromCharCode((0x20 | (sgnNum & 0x1f)) + 63);
    sgnNum >>= 5;
  }
  result += String.fromCharCode(sgnNum + 63);
  return result;
}

const { width: SW } = Dimensions.get("window");

type Albergue = Tables<"albergues">;
type Waypoint = Tables<"etapas_recorrido">;
type Mensaje = Tables<"mensajes"> & { perfil?: { nombre_display: string } };

interface EtapaFoto {
  url: string;
  alt: string | null;
}
interface NavEtapa {
  slug: string | null;
  numero: number;
  inicio_nombre: string;
  fin_nombre: string;
  nombre_variante?: string | null;
}
interface Consejo {
  categoria: string;
  [key: string]: any;
}

function colorEtapa(n: number): string {
  if (n <= 5) return "#2D6A4F";
  if (n <= 9) return "#B5451B";
  if (n <= 13) return "#6B4F9E";
  if (n <= 16) return "#B8860B";
  if (n <= 26) return "#1B6CA8";
  if (n <= 31) return "#4A7C59";
  return "#8B6914";
}

function getL(obj: any, field: string, lang: string): string {
  if (!obj) return "";
  const l = lang.split("-")[0];
  return obj[`${field}_${l}`] || obj[`${field}_es`] || obj[field] || "";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

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
const TIPO_ALB_COLOR: Record<string, string> = {
  municipal: "#2A9D8F",
  parroquial: "#457B9D",
  asociacion: "#6A4C93",
  privado: "#C8622A",
};
const OCUP_COLOR: Record<string, string> = {
  libre: "#16a34a",
  casi_lleno: "#ca8a04",
  completo: "#dc2626",
};
const CAT_ICON: Record<string, string> = {
  condicion_via: "⚠️",
  servicio: "🛍️",
  alojamiento: "🏠",
  seguridad: "🔒",
  recomendacion: "💡",
  punto_agua: "💧",
};

const TABS = ["mapa", "info", "albergues", "canal"] as const;
type TabId = (typeof TABS)[number];

export default function EtapaScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("mapa");
  const [mensajesVistos, setMensajesVistos] = useState(0);
  const [canalId, setCanalId] = useState<string | null>(null);
  const [canalAbierto, setCanalAbierto] = useState(false);

  const { onScroll: notifyScroll } = useNavigation();
  const scrollRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<Record<TabId, View | null>>({
    mapa: null,
    info: null,
    albergues: null,
    canal: null,
  });
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [220, 300],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const fetchData = useCallback(async () => {
    try {
      const [info, recorrido, albergues, canal] = await Promise.all([
        apiGet<any>(`/api/etapas/${slug}/info`),
        apiGet<any>(`/api/etapas/${slug}/recorrido`),
        apiGet<any>(`/api/etapas/${slug}/albergues`),
        apiGet<any>(`/api/canal-etapa/slug/${slug}/recientes`),
      ]);
      setData({
        ...info,
        ...recorrido,
        ...albergues,
        mensajes: canal.mensajes ?? [],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (data?.etapa?.id) {
      getCanalEtapa(data.etapa.id)
        .then(({ id }) => setCanalId(id))
        .catch(() => {});
    }
  }, [data?.etapa?.id]);

  const scrollToTab = (tab: TabId) => {
    setActiveTab(tab);
    const node = sectionRefs.current[tab];
    if (node && scrollRef.current) {
      node.measureLayout(
        scrollRef.current as any,
        (_x: number, y: number) => {
          scrollRef.current?.scrollTo({
            y: Math.max(y - 44, 0),
            animated: true,
          });
        },
        () => {},
      );
    }
  };

  if (loading)
    return (
      <View style={g.center}>
        <ActivityIndicator size="large" color="#BA7517" />
        <Text style={g.loadingText}>Cargando etapa...</Text>
      </View>
    );
  if (!data?.etapa)
    return (
      <View style={g.center}>
        <Text style={g.loadingText}>Etapa no encontrada</Text>
      </View>
    );

  const {
    etapa,
    fotos = [] as EtapaFoto[],
    valoraciones = { total: 0, media: 0 },
    navegacion = {} as {
      anterior?: NavEtapa;
      siguiente?: NavEtapa;
      variantes_siguiente?: NavEtapa[];
      variantes_anterior?: NavEtapa[];
    },

    waypoints = [] as Waypoint[],
    consejos = [] as Consejo[],
    albergues = [] as Albergue[],
    mensajes = [] as Mensaje[],
    pois = [] as any[],
    negocios = [] as any[],
  } = data;

  const color = colorEtapa(etapa.numero);
  const nombre = getL(etapa, "nombre", lang) || etapa.nombre;
  const descripcion = getL(etapa, "descripcion", lang);
  const heroUrl =
    (fotos as EtapaFoto[])[0]?.url ??
    "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80";
  const localidades = [
    ...new Set(
      (albergues as Albergue[])
        .map((a) => a.localidad)
        .filter((l): l is string => !!l),
    ),
  ];
  const consejosByCat = (consejos as Consejo[]).reduce(
    (acc: Record<string, Consejo[]>, c) => {
      const cat = c.categoria ?? "recomendacion";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(c);
      return acc;
    },
    {},
  );

  return (
    <View style={g.root}>
      {/* Header sticky */}
      <Animated.View style={[g.stickyHeader, { opacity: headerOpacity }]}>
        <TouchableOpacity onPress={() => router.back()} style={g.backBtn}>
          <Text style={g.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={[g.stickyTitle, { color }]} numberOfLines={1}>
          {nombre}
        </Text>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          scrollY.setValue(e.nativeEvent.contentOffset.y);
          notifyScroll();
        }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
            tintColor="#BA7517"
          />
        }
      >
        {/* HERO */}
        <HeroGaleria
          fotos={
            (fotos as EtapaFoto[]).length
              ? (fotos as EtapaFoto[])
              : [{ url: heroUrl, alt: nombre }]
          }
          nombre={nombre}
          numero={etapa.numero}
          color={color}
          inicio={etapa.inicio_nombre}
          fin={etapa.fin_nombre}
          distancia={Number(etapa.distancia_km)}
          desnivel={etapa.desnivel_pos ?? 0}
          dificultad={etapa.dificultad}
          lang={lang}
          onBack={() => router.back()}
        />

        {/* TABS */}
        <View style={g.tabsBar}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => scrollToTab(tab)}
              style={g.tabBtn}
            >
              <Text
                style={[
                  g.tabText,
                  activeTab === tab && { color, fontWeight: "700" },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {activeTab === tab && (
                <View style={[g.tabLine, { backgroundColor: color }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Navegación */}
        <NavEtapas
          anterior={navegacion.anterior}
          siguiente={navegacion.siguiente}
          variantesSiguiente={navegacion.variantes_siguiente ?? []}
          variantesAnterior={navegacion.variantes_anterior ?? []}
          numero={etapa.numero}
          color={color}
        />

        {/* Descripción */}
        {!!descripcion && (
          <View style={g.section}>
            <Text style={g.descripcion}>{descripcion}</Text>
          </View>
        )}

        {/* ── MAPA ── */}
        <View
          ref={(r) => {
            sectionRefs.current.mapa = r;
          }}
        >
          <ColapsableSection color={color} title="Mapa de la etapa" defaultOpen>
            <MapaMiniatura
              waypoints={waypoints as Waypoint[]}
              color={color}
              slug={etapa.slug}
            />
          </ColapsableSection>

          {waypoints.some((w: Waypoint) => w.elevacion != null) && (
            <ColapsableSection
              color={color}
              title="Perfil de elevación"
              defaultOpen
            >
              <PerfilElevacionRN
                waypoints={waypoints as Waypoint[]}
                color={color}
              />
            </ColapsableSection>
          )}

          <ColapsableSection color={color} title="Tiempo en ruta" defaultOpen>
            <MeteoWidget lugarNombre={etapa.inicio_nombre} color={color} />
          </ColapsableSection>
        </View>

        {/* ── INFO ── */}
        <View
          ref={(r) => {
            sectionRefs.current.info = r;
          }}
        >
          {(waypoints as Waypoint[]).length > 0 && (
            <ColapsableSection
              color={color}
              title="Recorrido"
              extra={`${(waypoints as Waypoint[]).length} pts`}
              defaultOpen
            >
              <RecorridoTimeline
                waypoints={waypoints}
                pois={pois}
                negocios={negocios}
                color={color}
                lang={lang}
                scrollY={scrollY}
                albergues={albergues as Albergue[]}
              />
            </ColapsableSection>
          )}

          {/* ── ALBERGUES ── */}
          <View
            ref={(r) => {
              sectionRefs.current.albergues = r;
            }}
          >
            <ColapsableSection
              color={color}
              title="Albergues"
              extra={`${localidades.length} pob · ${(albergues as Albergue[]).length}`}
            >
              <AlberguesPorLocalidad
                albergues={albergues as Albergue[]}
                localidades={localidades}
                color={color}
                lang={lang}
              />
            </ColapsableSection>
          </View>

          {/* ── CANAL ── */}
          <View
            ref={(r) => {
              sectionRefs.current.canal = r;
            }}
          >
            <TouchableOpacity
              style={cs.wrapper}
              activeOpacity={0.7}
              onPress={() => {
                setMensajesVistos(mensajes.length);
                setCanalAbierto(true);
              }}
            >
              <View style={cs.header}>
                <View style={[cs.bar, { backgroundColor: color }]} />
                <Text style={cs.title}>Canal de la etapa</Text>
                {mensajes.length > 0 && (
                  <Text style={cs.extra}>{mensajes.length} mensajes</Text>
                )}
                <Text style={cs.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* CONSEJOS */}
          {(consejos as Consejo[]).length > 0 && (
            <ColapsableSection
              color={color}
              title="Consejos"
              extra={`${(consejos as Consejo[]).length}`}
            >
              {Object.entries(consejosByCat).map(([cat, items]) => (
                <View key={cat} style={{ marginBottom: 12 }}>
                  <View style={g.catRow}>
                    <Text style={g.catIcon}>{CAT_ICON[cat] ?? "💡"}</Text>
                    <Text style={g.catLabel}>
                      {cat.replace("_", " ").toUpperCase()}
                    </Text>
                  </View>
                  {(items as Consejo[]).map((c, i) => {
                    const titulo = getL(c, "titulo", lang);
                    const contenido = getL(c, "contenido", lang);
                    return (
                      <View
                        key={i}
                        style={[g.consejoCard, { borderLeftColor: color }]}
                      >
                        {!!titulo && (
                          <Text style={g.consejoTitulo}>{titulo}</Text>
                        )}
                        {!!contenido && (
                          <Text style={g.consejoContenido}>
                            {contenido.slice(0, 300)}
                            {contenido.length > 300 ? "…" : ""}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </ColapsableSection>
          )}

          {/* EXPERIENCIAS */}
          <ExperienciasPanel entityId={etapa.id} color={color} lang={lang} />
        </View>

        <EtapaCheckButton
          etapaId={etapa.id}
          initialCompletada={false}
          color={color}
          lang={lang}
        />

        <NavEtapas
          anterior={navegacion.anterior}
          siguiente={navegacion.siguiente}
          variantesSiguiente={navegacion.variantes_siguiente ?? []}
          variantesAnterior={navegacion.variantes_anterior ?? []}
          numero={etapa.numero}
          color={color}
        />
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      <CanalChat
        conversacionId={canalId}
        etapaNombre={nombre}
        color={color}
        modo="fab"
        tieneRecientes={(mensajes as Mensaje[]).length > 0}
        onOpen={() => setMensajesVistos(mensajes.length)}
        open={canalAbierto}
        onClose={() => setCanalAbierto(false)}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// HERO GALERÍA — sin cambios
// ═══════════════════════════════════════════════════════════════
function HeroGaleria({
  fotos,
  nombre,
  numero,
  color,
  inicio,
  fin,
  distancia,
  desnivel,
  dificultad,
  lang,
  onBack,
}: {
  fotos: EtapaFoto[];
  nombre: string;
  numero: number;
  color: string;
  inicio: string;
  fin: string;
  distancia: number;
  desnivel: number;
  dificultad?: string | null;
  lang: string;
  onBack: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const horas = Math.floor(distancia / 4);
  const mins = Math.round((distancia / 4 - horas) * 60);
  const tiempo = `${horas}h${mins > 0 ? ` ${mins}min` : ""}`;
  const DIFLAB: Record<string, Record<string, string>> = {
    es: {
      baja: "Fácil",
      media: "Moderada",
      alta: "Difícil",
      muy_alta: "Muy difícil",
    },
    en: {
      baja: "Easy",
      media: "Moderate",
      alta: "Hard",
      muy_alta: "Very hard",
    },
  };
  const difLabel = dificultad ? (DIFLAB[lang] ?? DIFLAB.es)[dificultad] : null;

  return (
    <View style={{ position: "relative" }}>
      <View style={{ height: 300 }}>
        <Image
          source={{ uri: fotos[idx]?.url }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <View style={h.overlay} />
        <TouchableOpacity onPress={onBack} style={h.backBtn}>
          <Text style={h.backText}>‹</Text>
        </TouchableOpacity>
        <View style={[h.badge, { backgroundColor: color }]}>
          <Text style={h.badgeText}>{numero}</Text>
        </View>
        {fotos.length > 1 && (
          <>
            <View style={h.counter}>
              <Text style={h.counterText}>
                📷 {idx + 1}/{fotos.length}
              </Text>
            </View>
            <TouchableOpacity
              style={[h.arrow, { left: 12 }]}
              onPress={() =>
                setIdx((i) => (i - 1 + fotos.length) % fotos.length)
              }
            >
              <Text style={h.arrowText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[h.arrow, { right: 12 }]}
              onPress={() => setIdx((i) => (i + 1) % fotos.length)}
            >
              <Text style={h.arrowText}>›</Text>
            </TouchableOpacity>
          </>
        )}
        <View style={h.info}>
          <Text style={h.ruta}>
            {inicio} → {fin}
          </Text>
          <Text style={h.nombre}>{nombre}</Text>
          <View style={h.chips}>
            {[
              { icon: "🥾", val: `${distancia} km` },
              { icon: "↑", val: `${desnivel}m` },
              { icon: "⏱", val: tiempo },
              ...(difLabel ? [{ icon: "⚡", val: difLabel }] : []),
            ].map((c, i) => (
              <View key={i} style={h.chip}>
                <Text style={h.chipIcon}>{c.icon}</Text>
                <Text style={h.chipText}>{c.val}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      {fotos.length > 1 && (
        <View style={h.thumbs}>
          {fotos.slice(0, 6).map((f, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setIdx(i)}
              style={[
                h.thumb,
                i === idx && { borderTopWidth: 2, borderTopColor: color },
              ]}
            >
              <Image
                source={{ uri: f.url }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const h = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  backBtn: {
    position: "absolute",
    top: 52,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: "white", fontSize: 26, lineHeight: 30 },
  badge: {
    position: "absolute",
    top: 52,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "white", fontSize: 15, fontWeight: "800" },
  counter: {
    position: "absolute",
    top: 54,
    right: 60,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  counterText: { color: "white", fontSize: 11 },
  arrow: {
    position: "absolute",
    top: 130,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: { color: "white", fontSize: 24, lineHeight: 28 },
  info: { position: "absolute", bottom: 16, left: 16, right: 16 },
  ruta: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 3 },
  nombre: {
    fontSize: 21,
    fontWeight: "800",
    color: "white",
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipIcon: { fontSize: 11 },
  chipText: { fontSize: 12, fontWeight: "600", color: "white" },
  thumbs: { height: 52, flexDirection: "row", backgroundColor: "#111" },
  thumb: { flex: 1, overflow: "hidden", position: "relative" },
});

// ═══════════════════════════════════════════════════════════════
// COLAPSABLE SECTION — sin cambios
// ═══════════════════════════════════════════════════════════════
function ColapsableSection({
  color,
  title,
  extra,
  defaultOpen = false,
  children,
  preview,
  onOpen,
}: {
  color: string;
  title: string;
  extra?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  preview?: React.ReactNode;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const rot = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const toggle = () => {
    if (!open && onOpen) onOpen();
    Animated.timing(rot, {
      toValue: open ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setOpen((v) => !v);
  };

  const rotate = rot.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  return (
    <View style={cs.wrapper}>
      <TouchableOpacity onPress={toggle} style={cs.header} activeOpacity={0.7}>
        <View style={[cs.bar, { backgroundColor: color }]} />
        <Text style={cs.title}>{title}</Text>
        {extra && !open && <Text style={cs.extra}>{extra}</Text>}
        <Animated.Text style={[cs.chevron, { transform: [{ rotate }] }]}>
          ›
        </Animated.Text>
      </TouchableOpacity>
      {!open && preview && (
        <TouchableOpacity
          onPress={toggle}
          activeOpacity={0.7}
          style={{ paddingHorizontal: 20, paddingBottom: 16 }}
        >
          {preview}
        </TouchableOpacity>
      )}
      {open && <View style={cs.body}>{children}</View>}
    </View>
  );
}

const cs = StyleSheet.create({
  wrapper: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBE0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 20,
    paddingBottom: 16,
  },
  bar: { width: 3, height: 18, borderRadius: 2 },
  title: { flex: 1, fontSize: 16, fontWeight: "700", color: "#2C1F0E" },
  extra: { fontSize: 12, color: "#8B7355" },
  chevron: { fontSize: 22, color: "#C4A882", lineHeight: 26 },
  body: { paddingHorizontal: 20, paddingBottom: 20 },
});

// ═══════════════════════════════════════════════════════════════
// PERFIL ELEVACIÓN — sin cambios
// ═══════════════════════════════════════════════════════════════
function PerfilElevacionRN({
  waypoints,
  color,
}: {
  waypoints: Waypoint[];
  color: string;
}) {
  const animVal = useRef(new Animated.Value(0)).current;
  const [prog, setProg] = useState(0);

  useEffect(() => {
    const anim = Animated.timing(animVal, {
      toValue: 1,
      duration: 15000,
      delay: 300,
      useNativeDriver: false,
    });
    anim.start();
    const id = animVal.addListener(({ value }) => setProg(value));
    return () => {
      anim.stop();
      animVal.removeListener(id);
    };
  }, []);

  const puntos = waypoints
    .filter((w) => w.elevacion != null && w.km_acumulado != null)
    .map((w) => ({
      km: parseFloat(String(w.km_acumulado)),
      ele: w.elevacion!,
      loc: w.localidad,
    }))
    .sort((a, b) => a.km - b.km);

  if (puntos.length < 2) return null;

  const W = SW - 40,
    H = 120;
  const PAD = { top: 16, right: 12, bottom: 28, left: 40 };
  const iW = W - PAD.left - PAD.right,
    iH = H - PAD.top - PAD.bottom;
  const minKm = puntos[0].km,
    maxKm = puntos[puntos.length - 1].km;
  const elevs = puntos.map((p) => p.ele);
  const minE = Math.min(...elevs),
    maxE = Math.max(...elevs);
  const rango = maxE - minE || 1;
  const eMin = minE - rango * 0.08,
    eMax = maxE + rango * 0.12,
    eRango = eMax - eMin;

  const toX = (km: number) => PAD.left + ((km - minKm) / (maxKm - minKm)) * iW;
  const toY = (e: number) => PAD.top + (1 - (e - eMin) / eRango) * iH;

  const visible = puntos.slice(
    0,
    Math.max(2, Math.round(prog * puntos.length)),
  );
  const linePath = visible
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${toX(p.km).toFixed(1)} ${toY(p.ele).toFixed(1)}`,
    )
    .join(" ");
  const last = visible[visible.length - 1];
  const areaPath =
    visible.length > 1
      ? linePath +
        ` L ${toX(last.km).toFixed(1)} ${(PAD.top + iH).toFixed(1)} L ${toX(visible[0].km).toFixed(1)} ${(PAD.top + iH).toFixed(1)} Z`
      : "";

  let desPos = 0,
    desNeg = 0;
  for (let i = 1; i < puntos.length; i++) {
    const d = puntos[i].ele - puntos[i - 1].ele;
    if (d > 0) desPos += d;
    else desNeg += Math.abs(d);
  }

  return (
    <View>
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 12 }}>
        {[
          {
            label: "Cota máx",
            val: `${Math.round(maxE)}m`,
            icon: "▲",
            c: color,
          },
          {
            label: "Cota mín",
            val: `${Math.round(minE)}m`,
            icon: "▼",
            c: "#8B7355",
          },
          {
            label: "Sube",
            val: `+${Math.round(desPos)}m`,
            icon: "↑",
            c: "#16a34a",
          },
          {
            label: "Baja",
            val: `−${Math.round(desNeg)}m`,
            icon: "↓",
            c: "#dc2626",
          },
        ].map((stat, i) => (
          <View key={i} style={pe.pill}>
            <Text style={[pe.pillIcon, { color: stat.c }]}>{stat.icon}</Text>
            <Text style={pe.pillVal}>{stat.val}</Text>
            <Text style={pe.pillLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id="elevgrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
        {[0, 0.33, 0.66, 1].map((frac, i) => {
          const ele = Math.round(eMin + eRango * frac);
          const y = toY(ele);
          return (
            <React.Fragment key={i}>
              <Line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + iW}
                y2={y}
                stroke="#F0EBE0"
                strokeWidth="1"
              />
              <SvgText
                x={PAD.left - 4}
                y={y + 4}
                textAnchor="end"
                fontSize="9"
                fill="#B8A88A"
              >
                {ele}
              </SvgText>
            </React.Fragment>
          );
        })}
        {visible.length > 1 && <Path d={areaPath} fill="url(#elevgrad)" />}
        {visible.length > 1 && (
          <Path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {visible.map((p, i) => (
          <Circle
            key={i}
            cx={toX(p.km)}
            cy={toY(p.ele)}
            r="3"
            fill="white"
            stroke={color}
            strokeWidth="1.5"
          />
        ))}
        <Line
          x1={PAD.left}
          y1={PAD.top + iH}
          x2={PAD.left + iW}
          y2={PAD.top + iH}
          stroke="#E8E0D0"
          strokeWidth="1"
        />
        <SvgText
          x={PAD.left}
          y={H - 6}
          textAnchor="start"
          fontSize="8"
          fill="#8B7355"
        >
          {puntos[0].loc.split(" ")[0]}
        </SvgText>
        <SvgText
          x={PAD.left + iW}
          y={H - 6}
          textAnchor="end"
          fontSize="8"
          fill="#8B7355"
        >
          {puntos[puntos.length - 1].loc.split(" ")[0]}
        </SvgText>
      </Svg>
    </View>
  );
}

const pe = StyleSheet.create({
  pill: {
    flex: 1,
    alignItems: "center",
    padding: 6,
    backgroundColor: "#FDF8F0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F0E8D4",
  },
  pillIcon: { fontSize: 11 },
  pillVal: { fontSize: 11, fontWeight: "700", color: "#2C1F0E" },
  pillLabel: { fontSize: 9, color: "#8B7355", textAlign: "center" },
});

// ═══════════════════════════════════════════════════════════════
// METEO WIDGET —
// ═══════════════════════════════════════════════════════════════
function MeteoWidget({
  lugarNombre,
  color,
}: {
  lugarNombre: string;
  color: string;
}) {
  const [daily, setDaily] = useState<any>(null);
  const [elevation, setElev] = useState(0);
  const [selectedDay, setSel] = useState(0);
  const [detalle, setDetalle] = useState(false);
  const [error, setError] = useState(false);

  const WMO: Record<number, string> = {
    0: "☀️",
    1: "🌤️",
    2: "⛅",
    3: "☁️",
    45: "🌫️",
    51: "🌦️",
    53: "🌦️",
    55: "🌧️",
    61: "🌧️",
    63: "🌧️",
    65: "🌧️",
    71: "❄️",
    73: "❄️",
    75: "❄️",
    80: "🌦️",
    81: "🌧️",
    82: "⛈️",
    95: "⛈️",
  };
  const emoji = (code: number) =>
    WMO[code] ?? WMO[Math.floor(code / 10) * 10] ?? "🌡️";
  const tColor = (t: number) =>
    t <= 0
      ? "#85B7EB"
      : t <= 10
        ? "#5DCAA5"
        : t <= 20
          ? "#639922"
          : t <= 28
            ? "#EF9F27"
            : "#E24B4A";
  const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  useEffect(() => {
    (async () => {
      try {
        const geo = await (
          await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(lugarNombre)}&count=5&language=es&format=json`,
          )
        ).json();
        if (!geo.results?.length) throw new Error();
        const resultado =
          geo.results.find((r: any) => r.country_code === "ES") ??
          geo.results[0];
        const { latitude: lat, longitude: lng, elevation: elev } = resultado;
        setElev(Math.round(elev));
        const today = new Date(),
          end = new Date(today);
        end.setDate(end.getDate() + 7);
        const fmt = (d: Date) => d.toISOString().split("T")[0];
        const w = await (
          await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,precipitation_probability_max&timezone=auto&start_date=${fmt(today)}&end_date=${fmt(end)}&wind_speed_unit=kmh`,
          )
        ).json();
        setDaily(w.daily);
      } catch {
        setError(true);
      }
    })();
  }, [lugarNombre]);

  if (error)
    return (
      <Text
        style={{
          fontSize: 13,
          color: "#8B7355",
          textAlign: "center",
          paddingVertical: 12,
        }}
      >
        No se pudo cargar el tiempo
      </Text>
    );
  if (!daily)
    return (
      <ActivityIndicator
        size="small"
        color="#BA7517"
        style={{ paddingVertical: 16 }}
      />
    );

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 12 }}
      >
        {daily.time.map((dateStr: string, i: number) => {
          const d = new Date(dateStr + "T12:00:00");
          const active = i === selectedDay;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => {
                setSel(i);
                setDetalle(true);
              }}
              style={[m.dayBtn, active && { backgroundColor: "#2C1F0E" }]}
            >
              <Text style={[m.dayName, active && { color: "#C4A882" }]}>
                {i === 0 ? "Hoy" : DIAS[d.getDay()]}
              </Text>
              <Text style={[m.dayNum, active && { color: "white" }]}>
                {d.getDate()}
              </Text>
              <Text style={{ fontSize: 15 }}>
                {emoji(daily.weathercode[i])}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {detalle && (
        <View style={m.card}>
          <View style={m.cardTop}>
            <Text style={{ fontSize: 36 }}>
              {emoji(daily.weathercode[selectedDay])}
            </Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={m.cardDate}>
                {selectedDay === 0
                  ? "Hoy"
                  : new Date(
                      daily.time[selectedDay] + "T12:00:00",
                    ).toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
              </Text>
              {elevation > 0 && (
                <Text style={m.cardElev}>
                  {lugarNombre} · {elevation}m
                </Text>
              )}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={[
                  m.tmax,
                  {
                    color: tColor(
                      Math.round(daily.temperature_2m_max[selectedDay]),
                    ),
                  },
                ]}
              >
                {Math.round(daily.temperature_2m_max[selectedDay])}°
              </Text>
              <Text style={m.tmin}>
                {Math.round(daily.temperature_2m_min[selectedDay])}° mín
              </Text>
            </View>
          </View>
          <View style={m.row}>
            <Text style={m.rowIcon}>💧</Text>
            <Text style={m.rowLabel}>Precipitación</Text>
            <Text style={m.rowVal}>
              {Math.round(daily.precipitation_sum[selectedDay] * 10) / 10} mm ·{" "}
              {daily.precipitation_probability_max[selectedDay]}%
            </Text>
          </View>
          <View style={[m.row, { borderBottomWidth: 0 }]}>
            <Text style={m.rowIcon}>💨</Text>
            <Text style={m.rowLabel}>Viento</Text>
            <Text style={m.rowVal}>
              {Math.round(daily.windspeed_10m_max[selectedDay])} km/h
            </Text>
          </View>
        </View>
      )}
      <Text style={m.fuente}>Open-Meteo.com</Text>
    </View>
  );
}

//==================================================================
// MAPA MINIATURA
//==================================================================
function MapaMiniatura({
  waypoints,
  color,
  slug,
}: {
  waypoints: Waypoint[];
  color: string;
  slug: string;
}) {
  const coords = (waypoints as any[])
    .filter((w) => w.lat != null && w.lng != null)
    .sort(
      (a, b) =>
        (parseFloat(String(a.km_acumulado)) || 0) -
        (parseFloat(String(b.km_acumulado)) || 0),
    )
    .map((w) => [Number(w.lng), Number(w.lat)] as [number, number]);

  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

  if (coords.length < 2 || !token) {
    return (
      <TouchableOpacity
        style={[g.mapaBtn, { borderColor: color }]}
        onPress={() => router.push(`/(public)/mapa?etapa=${slug}` as any)}
        activeOpacity={0.85}
      >
        <Text style={[g.mapaBtnIcon, { color }]}>🗺️</Text>
        <Text style={[g.mapaBtnText, { color }]}>Ver etapa en el mapa</Text>
      </TouchableOpacity>
    );
  }

  const encoded = encodeURIComponent(encodePolyline(coords));
  const colorHex = color.replace("#", "");
  const url =
    `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/` +
    `path-4+${colorHex}-0.9(${encoded})/auto/640x320@2x` +
    `?padding=30&access_token=${token}`;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(public)/mapa?etapa=${slug}` as any)}
      activeOpacity={0.85}
      style={mm.wrapper}
    >
      <Image source={{ uri: url }} style={mm.image} resizeMode="cover" />
      <View style={mm.overlay} pointerEvents="none">
        <View style={[mm.badge, { backgroundColor: color }]}>
          <Text style={mm.badgeIcon}>🗺️</Text>
          <Text style={mm.badgeText}>Ver etapa en el mapa</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const mm = StyleSheet.create({
  wrapper: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F5F0E8",
  },
  image: { width: "100%", height: "100%" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  badgeIcon: { fontSize: 14 },
  badgeText: { fontSize: 13, fontWeight: "700", color: "white" },
});

const m = StyleSheet.create({
  dayBtn: {
    minWidth: 54,
    padding: 8,
    borderRadius: 20,
    marginRight: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8E0D0",
    backgroundColor: "white",
  },
  dayName: {
    fontSize: 10,
    fontWeight: "600",
    color: "#8B7355",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dayNum: { fontSize: 16, fontWeight: "600", color: "#2C1F0E" },
  card: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E8E0D0",
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBE0",
  },
  cardDate: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2C1F0E",
    textTransform: "capitalize",
  },
  cardElev: { fontSize: 11, color: "#B4A890", marginTop: 2 },
  tmax: { fontSize: 24, fontWeight: "700" },
  tmin: { fontSize: 12, color: "#8B7355" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  rowIcon: { fontSize: 16, marginRight: 10 },
  rowLabel: { flex: 1, fontSize: 13, color: "#8B7355" },
  rowVal: { fontSize: 13, fontWeight: "700", color: "#2C1F0E" },
  fuente: { fontSize: 10, color: "#B4A890", textAlign: "right", marginTop: 4 },
});

// ═══════════════════════════════════════════════════════════════
// ALBERGUES POR LOCALIDAD — sin cambios
// ═══════════════════════════════════════════════════════════════
const OCUP_COLOR_ETQ: Record<string, string> = {
  libre: "#16a34a",
  casi_lleno: "#ca8a04",
  completo: "#dc2626",
};

function AlbergueCardDestacada({
  albergue,
  color,
  lang,
}: {
  albergue: any;
  color: string;
  lang: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const foto = albergue.foto_url ?? albergue.fotos_urls?.[0] ?? null;
  const descKey = `descripcion_${lang}`;
  const descripcion = albergue[descKey] || albergue.descripcion || "";
  const precio =
    albergue.precio_cama ??
    (albergue.precio_desde ? `${albergue.precio_desde}€` : null);
  const dotColor = OCUP_COLOR_ETQ[albergue.ocupacion ?? "libre"];

  return (
    <View style={abl.cardWrapper}>
      <TouchableOpacity
        onPress={() => setAbierto((v) => !v)}
        activeOpacity={0.7}
        style={[abl.cardChip, { borderColor: color }]}
      >
        <View style={abl.miniatura}>
          {foto ? (
            <Image source={{ uri: foto }} style={abl.miniaturaImg} />
          ) : (
            <Text style={abl.miniaturaEmoji}>🏠</Text>
          )}
        </View>
        <View style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 6 }}>
          <Text style={abl.cardChipNombre} numberOfLines={1}>
            {albergue.nombre}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              marginTop: 2,
            }}
          >
            <View style={[abl.ocupDot, { backgroundColor: dotColor }]} />
            {precio && <Text style={abl.cardChipPrecio}>{precio}</Text>}
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingRight: 8,
          }}
        >
          <View style={[abl.badgePlus, { backgroundColor: color }]}>
            <Text style={abl.badgePlusText}>Plus</Text>
          </View>
          <Text
            style={[
              ab.chev,
              abierto && ({ transform: [{ rotate: "90deg" }] } as any),
            ]}
          >
            ›
          </Text>
        </View>
      </TouchableOpacity>
      {abierto && (
        <View style={[abl.cardExpanded, { borderColor: color }]}>
          {foto && (
            <View style={{ position: "relative", height: 140 }}>
              <Image
                source={{ uri: foto }}
                style={abl.cardFoto}
                resizeMode="cover"
              />
              <View style={[abl.fotoBadge, { backgroundColor: color }]}>
                <Text style={abl.fotoBadgeText}>Albergue Plus</Text>
              </View>
            </View>
          )}
          <View style={{ padding: 12 }}>
            <Text style={abl.cardNombre}>{albergue.nombre}</Text>
            {precio && (
              <Text style={[abl.cardPrecioLabel, { color }]}>
                {precio} por cama
              </Text>
            )}
            {!!descripcion && (
              <Text style={abl.cardDesc} numberOfLines={5}>
                {descripcion}
              </Text>
            )}
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginTop: 12,
                flexWrap: "wrap",
              }}
            >
              {!!albergue.telefono && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${albergue.telefono}`)}
                  style={abl.btnLlamar}
                >
                  <Text style={abl.btnLlamarText}>📞 Llamar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() =>
                  router.push(`/(public)/albergues/${albergue.slug}` as any)
                }
                style={[abl.btnFicha, { backgroundColor: color }]}
              >
                <Text style={abl.btnFichaText}>Ver ficha completa →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function AlberguesPorLocalidad({
  albergues,
  localidades,
  color,
  lang,
}: {
  albergues: any[];
  localidades: string[];
  color: string;
  lang: string;
}) {
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set());
  const toggle = (l: string) =>
    setAbiertas((prev) => {
      const next = new Set(prev);
      next.has(l) ? next.delete(l) : next.add(l);
      return next;
    });

  return (
    <View style={{ gap: 10 }}>
      {localidades.map((localidad) => {
        const lista = albergues.filter((a) => a.localidad === localidad);
        const destacados = lista.filter(
          (a) => a.plan === "plus" || a.plan === "premium",
        );
        const resto = lista.filter(
          (a) => a.plan !== "plus" && a.plan !== "premium",
        );
        const abierta = abiertas.has(localidad);

        return (
          <View key={localidad} style={ab.group}>
            <TouchableOpacity
              onPress={() => toggle(localidad)}
              style={ab.locHeader}
              activeOpacity={0.7}
            >
              <Text style={ab.locPin}>📍</Text>
              <Text style={ab.locNom}>{localidad}</Text>
              <View style={ab.badge}>
                <Text style={ab.badgeText}>{lista.length}</Text>
              </View>
              <Text
                style={[
                  ab.chev,
                  abierta && ({ transform: [{ rotate: "90deg" }] } as any),
                ]}
              >
                ›
              </Text>
            </TouchableOpacity>
            {abierta && (
              <View>
                {destacados.length > 0 && (
                  <View
                    style={{
                      padding: 10,
                      gap: 8,
                      borderBottomWidth: resto.length > 0 ? 1 : 0,
                      borderBottomColor: "#F0EBE0",
                    }}
                  >
                    {destacados.map((a) => (
                      <AlbergueCardDestacada
                        key={a.id}
                        albergue={a}
                        color={color}
                        lang={lang}
                      />
                    ))}
                  </View>
                )}
                {resto.map((a, i) => {
                  const tipoColor =
                    TIPO_ALB_COLOR[a.tipo ?? "privado"] ?? "#C8622A";
                  const dotColor = OCUP_COLOR[a.ocupacion ?? "libre"];
                  return (
                    <TouchableOpacity
                      key={a.id}
                      style={[
                        ab.row,
                        i < resto.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: "#F0EBE0",
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={() =>
                        a.slug &&
                        router.push(`/(public)/albergues/${a.slug}` as any)
                      }
                    >
                      <View style={[ab.dot, { backgroundColor: dotColor }]} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={ab.nombre} numberOfLines={1}>
                          {a.nombre}
                        </Text>
                        {a.ubicacion ? (
                          <Text style={ab.ubic} numberOfLines={1}>
                            {getL(a, "ubicacion", lang)}
                          </Text>
                        ) : null}
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        {a.precio_cama && (
                          <Text style={[ab.precio, { color: tipoColor }]}>
                            {a.precio_cama}
                          </Text>
                        )}
                        {a.precio_habitacion && (
                          <Text style={ab.precioHab}>
                            hab. {a.precio_habitacion}
                          </Text>
                        )}
                      </View>
                      <Text style={ab.arrow}>›</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const abl = StyleSheet.create({
  cardWrapper: { marginBottom: 4 },
  cardChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  miniatura: {
    width: 52,
    height: 52,
    backgroundColor: "#F5F0E8",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  miniaturaImg: { width: 52, height: 52 },
  miniaturaEmoji: { fontSize: 22 },
  cardChipNombre: { fontSize: 13, fontWeight: "700", color: "#2C1F0E" },
  cardChipPrecio: { fontSize: 12, color: "#8B7355", fontWeight: "600" },
  ocupDot: { width: 7, height: 7, borderRadius: 4 },
  badgePlus: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  badgePlusText: { fontSize: 9, fontWeight: "700", color: "white" },
  cardExpanded: {
    marginTop: 4,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardFoto: { width: "100%", height: 140 },
  fotoBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  fotoBadgeText: { fontSize: 10, fontWeight: "700", color: "white" },
  cardNombre: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2C1F0E",
    marginBottom: 2,
  },
  cardPrecioLabel: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  cardDesc: { fontSize: 13, color: "#5C4A32", lineHeight: 19 },
  btnLlamar: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "#F5F0E8",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8DDD0",
  },
  btnLlamarText: { fontSize: 12, color: "#2C1F0E" },
  btnFicha: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  btnFichaText: { fontSize: 12, fontWeight: "600", color: "white" },
});

const ab = StyleSheet.create({
  group: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E8E0D0",
  },
  locHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "white",
  },
  locPin: { fontSize: 12 },
  locNom: { flex: 1, fontSize: 13, fontWeight: "700", color: "#2C1F0E" },
  badge: {
    backgroundColor: "#F0EBE0",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: "600", color: "#8B7355" },
  chev: { fontSize: 18, color: "#C4A882" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: "white",
  },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  nombre: { fontSize: 13, fontWeight: "600", color: "#2C1F0E" },
  ubic: { fontSize: 11, color: "#8B7355", marginTop: 2 },
  precio: { fontSize: 13, fontWeight: "700" },
  precioHab: { fontSize: 11, color: "#8B7355", marginTop: 2 },
  arrow: { fontSize: 16, color: "#C4A882" },
});

// ═══════════════════════════════════════════════════════════════
// NAVEGACIÓN ETAPAS — sin cambios
// ═══════════════════════════════════════════════════════════════
function NavEtapas({
  anterior,
  siguiente,
  numero,
  color,
  variantesSiguiente = [],
  variantesAnterior = [],
}: {
  anterior?: NavEtapa;
  siguiente?: NavEtapa;
  numero: number;
  color: string;
  variantesSiguiente?: NavEtapa[];
  variantesAnterior?: NavEtapa[];
}) {
  return (
    <View style={nv.container}>
      <View style={nv.row}>
        {/* IZQUIERDA */}
        {anterior ? (
          <TouchableOpacity
            style={nv.btn}
            onPress={() =>
              router.push(`/(public)/etapas/${anterior.slug}` as any)
            }
          >
            <Text style={nv.arrow}>‹</Text>
            <View>
              <Text style={nv.label}>Etapa {anterior.numero}</Text>
              <Text style={nv.nombre} numberOfLines={1}>
                {anterior.inicio_nombre} →
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {/* BADGE */}
        <View style={[nv.badge, { backgroundColor: color }]}>
          <Text style={nv.badgeText}>
            {numero > 34 ? `F${numero - 100}` : numero}
          </Text>
        </View>

        {/* DERECHA */}
        {siguiente ? (
          <TouchableOpacity
            style={[nv.btn, { justifyContent: "flex-end" }]}
            onPress={() =>
              router.push(`/(public)/etapas/${siguiente.slug}` as any)
            }
          >
            <View style={{ alignItems: "flex-end" }}>
              <Text style={nv.label}>Etapa {siguiente.numero}</Text>
              <Text style={nv.nombre} numberOfLines={1}>
                → {siguiente.fin_nombre}
              </Text>
            </View>
            <Text style={nv.arrow}>›</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}
      </View>

      {/* VARIANTES SIGUIENTE */}
      {variantesSiguiente.length > 0 && (
        <View style={nv.variantesRow}>
          {variantesSiguiente.map((v) => (
            <TouchableOpacity
              key={v.slug}
              style={nv.varianteBtn}
              onPress={() => router.push(`/(public)/etapas/${v.slug}` as any)}
            >
              <Text style={nv.varianteIcon}>↳</Text>
              <View style={{ flex: 1 }}>
                <Text style={nv.varianteLabel}>
                  {v.nombre_variante ?? "Variante"}
                </Text>
                <Text style={nv.varianteNombre} numberOfLines={1}>
                  {v.inicio_nombre} → {v.fin_nombre}
                </Text>
              </View>
              <Text style={nv.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* VARIANTES ANTERIOR */}
      {variantesAnterior.length > 0 && (
        <View style={nv.variantesRow}>
          {variantesAnterior.map((v) => (
            <TouchableOpacity
              key={v.slug}
              style={nv.varianteBtn}
              onPress={() => router.push(`/(public)/etapas/${v.slug}` as any)}
            >
              <Text style={nv.arrow}>‹</Text>
              <View style={{ flex: 1 }}>
                <Text style={nv.varianteLabel}>
                  {v.nombre_variante ?? "Variante"}
                </Text>
                <Text style={nv.varianteNombre} numberOfLines={1}>
                  {v.inicio_nombre} → {v.fin_nombre}
                </Text>
              </View>
              <Text style={nv.varianteIcon}>↲</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const nv = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBE0",
  },
  btn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  arrow: { fontSize: 26, color: "#8B7355" },
  label: {
    fontSize: 10,
    color: "#8B7355",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  nombre: { fontSize: 12, fontWeight: "600", color: "#2C1F0E", maxWidth: 120 },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  badgeText: { color: "white", fontSize: 14, fontWeight: "700" },

  container: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBE0",
  },
  variantesRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 6 },
  varianteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#F5F0E8",
    borderRadius: 8,
  },
  varianteIcon: { fontSize: 14, color: "#7C3AED" },
  varianteLabel: {
    fontSize: 9,
    color: "#7C3AED",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  varianteNombre: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2C1F0E",
    maxWidth: 160,
  },
});

// ═══════════════════════════════════════════════════════════════
// ESTILOS GLOBALES — sin cambios
// ═══════════════════════════════════════════════════════════════
const g = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAF7F2" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF7F2",
  },
  loadingText: { marginTop: 12, fontSize: 14, color: "#8B7355" },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: 56,
    backgroundColor: "#FAF7F2",
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBE0",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  backBtn: { marginRight: 12, padding: 4 },
  backIcon: { fontSize: 28, color: "#2C1F0E", lineHeight: 32 },
  stickyTitle: { flex: 1, fontSize: 16, fontWeight: "700" },
  tabsBar: {
    flexDirection: "row",
    backgroundColor: "#FAF7F2",
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBE0",
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    position: "relative",
  },
  tabText: { fontSize: 13, color: "#8B7355", fontWeight: "500" },
  tabLine: {
    position: "absolute",
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 1,
  },
  section: {
    backgroundColor: "white",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBE0",
  },
  descripcion: { fontSize: 14, color: "#5C4A32", lineHeight: 22 },
  mapaPlaceholder: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#D4C5A9",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F0E8",
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  catIcon: { fontSize: 14 },
  catLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8B7355",
    letterSpacing: 0.8,
  },
  consejoCard: {
    marginBottom: 8,
    padding: 12,
    backgroundColor: "#FDF8F0",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F0E8D4",
    borderLeftWidth: 3,
  },
  consejoTitulo: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2C1F0E",
    marginBottom: 4,
  },
  consejoContenido: { fontSize: 13, color: "#5C4A32", lineHeight: 19 },
  valorRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  valorText: { fontSize: 13, color: "#8B7355", marginLeft: 6 },
  sinValor: { fontSize: 13, color: "#8B7355" },
  mapaBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 12,
    backgroundColor: "#F5F0E8",
    width: "100%",
  },
  mapaBtnIcon: { fontSize: 40 },
  mapaBtnText: { fontSize: 16, fontWeight: "700" },
  mapaBtnSub: { fontSize: 12, color: "#8B7355" },
});
