// 📄 app/(public)/negocios/[slug].tsx  (camino-mobile)
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Modal,
  FlatList,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { apiGet } from "@/lib/api";

const { width: SW } = Dimensions.get("window");

// ── Tipos ──────────────────────────────────────────────────────────────────
type Foto = {
  id: string;
  url: string;
  alt?: string | null;
  es_hero: boolean | null;
  orden: number | null;
};
type Horario = { dia_semana: number; apertura: string; cierre: string };
type EtapaVinc = {
  km_referencia: number | null;
  etapas: { id: string; nombre: string; slug: string } | null;
};

// ── Constantes ─────────────────────────────────────────────────────────────
const DIAS_COMPLETOS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const CATEGORIA_EMOJI: Record<string, string> = {
  hosteleria: "☕",
  alimentacion: "🥗",
  servicios: "🔧",
  outdoor: "🏕️",
  transporte: "🚌",
  bienestar: "💆",
  experiencias: "🎭",
  otros: "📍",
};
const CATEGORIA_LABEL: Record<string, string> = {
  hosteleria: "Hostelería",
  alimentacion: "Alimentación",
  servicios: "Servicios",
  outdoor: "Outdoor",
  transporte: "Transporte",
  bienestar: "Bienestar",
  experiencias: "Experiencias",
  otros: "Otros",
};

// Grupos de servicios con icono y etiqueta
const SERVICIOS_INFO: Record<
  string,
  { icon: string; label: string; grupo: string }
> = {
  // Comer y beber
  menu_del_dia: { icon: "🍽️", label: "Menú del día", grupo: "comer" },
  desayunos: { icon: "🥐", label: "Desayunos", grupo: "comer" },
  bocadillos: { icon: "🥖", label: "Bocadillos", grupo: "comer" },
  terraza: { icon: "☀️", label: "Terraza", grupo: "comer" },
  takeaway: { icon: "🥡", label: "Para llevar", grupo: "comer" },
  vegano: { icon: "🌱", label: "Opción vegana", grupo: "comer" },
  sin_gluten: { icon: "🌾", label: "Sin gluten", grupo: "comer" },
  carta_en_ingles: { icon: "🇬🇧", label: "Carta en inglés", grupo: "comer" },
  // Cuerpo y salud
  masajes: { icon: "💆", label: "Masajes", grupo: "salud" },
  podologia: { icon: "🦶", label: "Podología", grupo: "salud" },
  fisioterapia: { icon: "🏥", label: "Fisioterapia", grupo: "salud" },
  botiquin: { icon: "🩹", label: "Botiquín", grupo: "salud" },
  lavanderia: { icon: "👕", label: "Lavandería", grupo: "salud" },
  ducha: { icon: "🚿", label: "Duchas", grupo: "salud" },
  // Practicidades
  wifi: { icon: "📶", label: "WiFi", grupo: "practico" },
  carga_movil: { icon: "🔋", label: "Carga móvil", grupo: "practico" },
  parking: { icon: "🅿️", label: "Parking", grupo: "practico" },
  bici_parking: { icon: "🚲", label: "Parking bici", grupo: "practico" },
  consigna: { icon: "🎒", label: "Consigna", grupo: "practico" },
  reservas: { icon: "📅", label: "Reservas", grupo: "practico" },
  abierto_domingos: {
    icon: "📆",
    label: "Abierto domingos",
    grupo: "practico",
  },
  // Cultura y ocio
  visita_guiada: { icon: "🗺️", label: "Visita guiada", grupo: "cultura" },
  museo: { icon: "🏛️", label: "Museo", grupo: "cultura" },
  tienda_souvenirs: { icon: "🛍️", label: "Souvenirs", grupo: "cultura" },
  sello_credencial: { icon: "⭐", label: "Sello credencial", grupo: "cultura" },
  conciertos: { icon: "🎵", label: "Conciertos", grupo: "cultura" },
  // Idiomas
  ingles: { icon: "🇬🇧", label: "English", grupo: "idiomas" },
  aleman: { icon: "🇩🇪", label: "Deutsch", grupo: "idiomas" },
  frances: { icon: "🇫🇷", label: "Français", grupo: "idiomas" },
  portugues: { icon: "🇵🇹", label: "Português", grupo: "idiomas" },
  coreano: { icon: "🇰🇷", label: "한국어", grupo: "idiomas" },
};

const GRUPOS: Record<string, { label: string; icon: string }> = {
  comer: { label: "Comer y beber", icon: "🍽️" },
  salud: { label: "Cuerpo y salud", icon: "💆" },
  practico: { label: "Practicidades", icon: "📶" },
  cultura: { label: "Cultura y ocio", icon: "🎭" },
  idiomas: { label: "Idiomas", icon: "🗣️" },
};

// ── Helpers ────────────────────────────────────────────────────────────────
function getDesc(negocio: any, lang: string): string {
  const l = lang.split("-")[0];
  const map: Record<string, string> = {
    en: "descripcion_en",
    de: "descripcion_de",
    fr: "descripcion_fr",
    it: "descripcion_it",
    pt: "descripcion_pt",
    ko: "descripcion_ko",
  };
  return negocio[map[l]] || negocio.descripcion || "";
}

function getHorarioHoy(horarios: Horario[]): Horario | null {
  return horarios.find((h) => h.dia_semana === new Date().getDay()) ?? null;
}

// ═══════════════════════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export default function NegocioScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fotoActiva, setFotoActiva] = useState(0);
  const [galeriaVisible, setGaleriaVisible] = useState(false);
  const [horariosAbiertos, setHorariosAbiertos] = useState(false);

  useEffect(() => {
    apiGet<any>(`/api/negocios/${slug}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading)
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#C8622A" />
      </View>
    );

  if (!data?.negocio)
    return (
      <View style={s.center}>
        <Text style={s.errorText}>Negocio no encontrado</Text>
      </View>
    );

  const { negocio, fotos = [], horarios = [], etapas = [] } = data;
  const fotosOrdenadas: Foto[] = [...fotos].sort((a: Foto, b: Foto) =>
    a.es_hero ? -1 : b.es_hero ? 1 : (a.orden ?? 0) - (b.orden ?? 0),
  );
  const esDestacado = negocio.plan === "destacado";
  const emoji = CATEGORIA_EMOJI[negocio.categoria] ?? "📍";
  const catLabel = CATEGORIA_LABEL[negocio.categoria] ?? negocio.categoria;
  const descripcion = getDesc(negocio, lang);
  const horarioHoy = getHorarioHoy(horarios);

  // Agrupar servicios
  const serviciosActivos: string[] = negocio.servicios ?? [];
  const serviciosPorGrupo = serviciosActivos.reduce<Record<string, string[]>>(
    (acc, s) => {
      const info = SERVICIOS_INFO[s];
      if (!info) return acc;
      if (!acc[info.grupo]) acc[info.grupo] = [];
      acc[info.grupo].push(s);
      return acc;
    },
    {},
  );

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── HERO GALERÍA ── */}
        <View style={s.heroContainer}>
          {fotosOrdenadas.length > 0 ? (
            <TouchableOpacity
              onPress={() => setGaleriaVisible(true)}
              activeOpacity={0.95}
            >
              <Image
                source={{ uri: fotosOrdenadas[fotoActiva]?.url }}
                style={s.heroImg}
                resizeMode="cover"
              />
              {/* Overlay oscuro */}
              <View style={s.heroOverlay} />
            </TouchableOpacity>
          ) : (
            <View style={[s.heroImg, s.heroPlaceholder]}>
              <Text style={{ fontSize: 64 }}>{emoji}</Text>
            </View>
          )}

          {/* Botón volver */}
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backText}>‹</Text>
          </TouchableOpacity>

          {/* Badge plan */}
          {esDestacado && (
            <View style={s.badgeDestacado}>
              <Text style={s.badgeDestacadoText}>★ Destacado</Text>
            </View>
          )}

          {/* Miniaturas */}
          {fotosOrdenadas.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.thumbsBar}
            >
              {fotosOrdenadas.map((f, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setFotoActiva(i)}
                  style={[s.thumb, i === fotoActiva && s.thumbActive]}
                >
                  <Image
                    source={{ uri: f.url }}
                    style={s.thumbImg}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={s.content}>
          {/* ── NOMBRE Y CATEGORÍA ── */}
          <View style={s.header}>
            <View style={s.catRow}>
              <Text style={s.catEmoji}>{emoji}</Text>
              <Text style={s.catLabel}>{catLabel}</Text>
              {negocio.verificado && (
                <View style={s.badgeVerif}>
                  <Text style={s.badgeVerifText}>✓ Verificado</Text>
                </View>
              )}
            </View>
            <Text style={s.nombre}>{negocio.nombre}</Text>
            {negocio.direccion && (
              <Text style={s.direccion}>📍 {negocio.direccion}</Text>
            )}
          </View>

          {/* ── HORARIO ── */}
          {horarios.length > 0 && (
            <View style={s.card}>
              <View style={s.horarioRow}>
                <Text style={s.horarioIcon}>🕐</Text>
                <View style={{ flex: 1 }}>
                  {horarioHoy ? (
                    <Text style={s.horarioHoy}>
                      <Text style={s.abierto}>Abierto hoy</Text>
                      {` · ${horarioHoy.apertura} – ${horarioHoy.cierre}`}
                    </Text>
                  ) : (
                    <Text style={s.cerrado}>Cerrado hoy</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => setHorariosAbiertos((v) => !v)}
                >
                  <Text style={s.horarioToggle}>
                    {horariosAbiertos ? "Ocultar ▲" : "Ver todos ▼"}
                  </Text>
                </TouchableOpacity>
              </View>
              {horariosAbiertos && (
                <View style={s.horariosLista}>
                  {DIAS_COMPLETOS.map((dia, i) => {
                    const h = horarios.find((x: Horario) => x.dia_semana === i);
                    const esHoy = new Date().getDay() === i;
                    return (
                      <View key={i} style={s.horarioDia}>
                        <Text
                          style={[s.horarioDiaNombre, esHoy && s.horarioDiaHoy]}
                        >
                          {dia}
                        </Text>
                        <Text
                          style={[s.horarioDiaHora, esHoy && s.horarioDiaHoy]}
                        >
                          {h ? `${h.apertura} – ${h.cierre}` : "Cerrado"}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* ── DESCRIPCIÓN ── */}
          {!!descripcion && (
            <View style={s.card}>
              <Text style={s.descripcion}>{descripcion}</Text>
            </View>
          )}

          {/* ── SERVICIOS ── */}
          {serviciosActivos.length > 0 && (
            <View style={s.card}>
              <Text style={s.secTitle}>Servicios</Text>
              {Object.entries(serviciosPorGrupo).map(([grupo, items]) => {
                const grupoInfo = GRUPOS[grupo];
                if (!grupoInfo) return null;
                return (
                  <View key={grupo} style={s.grupoContainer}>
                    <View style={s.grupoHeader}>
                      <Text style={s.grupoIcon}>{grupoInfo.icon}</Text>
                      <Text style={s.grupoLabel}>{grupoInfo.label}</Text>
                    </View>
                    <View style={s.serviciosPills}>
                      {items.map((srv) => {
                        const info = SERVICIOS_INFO[srv];
                        if (!info) return null;
                        return (
                          <View key={srv} style={s.servicioPill}>
                            <Text style={s.servicioPillIcon}>{info.icon}</Text>
                            <Text style={s.servicioPillLabel}>
                              {info.label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── CONTACTO ── */}
          {(negocio.telefono ||
            negocio.whatsapp ||
            negocio.web ||
            negocio.email) && (
            <View style={s.card}>
              <Text style={s.secTitle}>Contacto</Text>
              <View style={s.contactoGrid}>
                {negocio.telefono && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`tel:${negocio.telefono}`)}
                    style={s.contactoBtn}
                  >
                    <Text style={s.contactoBtnIcon}>📞</Text>
                    <Text style={s.contactoBtnLabel}>Llamar</Text>
                  </TouchableOpacity>
                )}
                {negocio.whatsapp && (
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(
                        `https://wa.me/${negocio.whatsapp.replace(/\D/g, "")}`,
                      )
                    }
                    style={[s.contactoBtn, s.contactoBtnWA]}
                  >
                    <Text style={s.contactoBtnIcon}>💬</Text>
                    <Text style={[s.contactoBtnLabel, { color: "#25D366" }]}>
                      WhatsApp
                    </Text>
                  </TouchableOpacity>
                )}
                {negocio.web && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(negocio.web)}
                    style={s.contactoBtn}
                  >
                    <Text style={s.contactoBtnIcon}>🌐</Text>
                    <Text style={s.contactoBtnLabel} numberOfLines={1}>
                      {negocio.web.replace(/^https?:\/\//, "")}
                    </Text>
                  </TouchableOpacity>
                )}
                {negocio.email && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`mailto:${negocio.email}`)}
                    style={s.contactoBtn}
                  >
                    <Text style={s.contactoBtnIcon}>✉️</Text>
                    <Text style={s.contactoBtnLabel}>Email</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ── ETAPAS VINCULADAS ── */}
          {etapas.length > 0 && (
            <View style={s.card}>
              <Text style={s.secTitle}>En el Camino</Text>
              {etapas.map(
                (e: EtapaVinc, i: number) =>
                  e.etapas && (
                    <TouchableOpacity
                      key={i}
                      onPress={() =>
                        router.push(`/(public)/etapas/${e.etapas!.slug}` as any)
                      }
                      style={s.etapaRow}
                    >
                      <Text style={s.etapaPin}>📍</Text>
                      <Text style={s.etapaNombre} numberOfLines={1}>
                        {e.etapas.nombre}
                      </Text>
                      {e.km_referencia && (
                        <Text style={s.etapaKm}>km {e.km_referencia}</Text>
                      )}
                      <Text style={s.etapaArrow}>›</Text>
                    </TouchableOpacity>
                  ),
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* ── MODAL GALERÍA FULLSCREEN ── */}
      <Modal visible={galeriaVisible} animationType="fade" statusBarTranslucent>
        <View style={sg.root}>
          <TouchableOpacity
            onPress={() => setGaleriaVisible(false)}
            style={sg.closeBtn}
          >
            <Text style={sg.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={sg.counter}>
            {fotoActiva + 1} / {fotosOrdenadas.length}
          </Text>

          <FlatList
            data={fotosOrdenadas}
            horizontal
            pagingEnabled
            initialScrollIndex={fotoActiva}
            getItemLayout={(_, i) => ({ length: SW, offset: SW * i, index: i })}
            onMomentumScrollEnd={(e) =>
              setFotoActiva(Math.round(e.nativeEvent.contentOffset.x / SW))
            }
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <View
                style={{
                  width: SW,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  source={{ uri: item.url }}
                  style={sg.foto}
                  resizeMode="contain"
                />
              </View>
            )}
          />

          {/* Dots */}
          {fotosOrdenadas.length > 1 && (
            <View style={sg.dots}>
              {fotosOrdenadas.map((_, i) => (
                <View
                  key={i}
                  style={[sg.dot, i === fotoActiva && sg.dotActive]}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F0E8" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F0E8",
  },
  errorText: { fontSize: 14, color: "#8B7355" },

  // Hero
  heroContainer: { backgroundColor: "#2C1F0E" },
  heroImg: { width: "100%", height: 280 },
  heroPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3D2B12",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
    height: 280,
  },
  backBtn: {
    position: "absolute",
    top: 52,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: "white", fontSize: 26, lineHeight: 30 },
  badgeDestacado: {
    position: "absolute",
    top: 52,
    right: 16,
    backgroundColor: "#C8622A",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeDestacadoText: { fontSize: 11, fontWeight: "700", color: "white" },
  thumbsBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#1A1008",
  },
  thumb: {
    width: 52,
    height: 38,
    borderRadius: 6,
    marginRight: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "transparent",
  },
  thumbActive: { borderColor: "#C8622A" },
  thumbImg: { width: "100%", height: "100%" },

  // Content
  content: { padding: 16 },
  header: { marginBottom: 12 },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  catEmoji: { fontSize: 14 },
  catLabel: {
    fontSize: 12,
    color: "#8B7355",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  badgeVerif: {
    backgroundColor: "rgba(70,130,180,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeVerifText: { fontSize: 11, color: "#4682B4", fontWeight: "600" },
  nombre: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2C1F0E",
    lineHeight: 28,
    marginBottom: 4,
  },
  direccion: { fontSize: 13, color: "#8B7355" },

  // Card
  card: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8DDD0",
  },
  secTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B5B47",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  // Horario
  horarioRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  horarioIcon: { fontSize: 16 },
  horarioHoy: { fontSize: 14, color: "#2C1F0E" },
  abierto: { color: "#228B22", fontWeight: "700" },
  cerrado: { fontSize: 14, color: "#C0392B", fontWeight: "700" },
  horarioToggle: { fontSize: 12, color: "#8B7355" },
  horariosLista: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0EBE0",
    paddingTop: 10,
    gap: 6,
  },
  horarioDia: { flexDirection: "row", justifyContent: "space-between" },
  horarioDiaNombre: { fontSize: 13, color: "#8B7355" },
  horarioDiaHora: { fontSize: 13, color: "#8B7355" },
  horarioDiaHoy: { color: "#2C1F0E", fontWeight: "700" },

  // Descripción
  descripcion: { fontSize: 14, color: "#4A3728", lineHeight: 22 },

  // Servicios
  grupoContainer: { marginBottom: 12 },
  grupoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  grupoIcon: { fontSize: 14 },
  grupoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B5B47",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  serviciosPills: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  servicioPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#F5F0E8",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8DDD0",
  },
  servicioPillIcon: { fontSize: 13 },
  servicioPillLabel: { fontSize: 12, color: "#2C1F0E", fontWeight: "500" },

  // Contacto
  contactoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  contactoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F5F0E8",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E8DDD0",
  },
  contactoBtnWA: {
    borderColor: "#25D366",
    backgroundColor: "rgba(37,211,102,0.06)",
  },
  contactoBtnIcon: { fontSize: 16 },
  contactoBtnLabel: { fontSize: 13, color: "#2C1F0E", fontWeight: "500" },

  // Etapas
  etapaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F0E8",
  },
  etapaPin: { fontSize: 14 },
  etapaNombre: { flex: 1, fontSize: 13, color: "#2C1F0E", fontWeight: "500" },
  etapaKm: { fontSize: 12, color: "#8B7355" },
  etapaArrow: { fontSize: 16, color: "#C4A882" },
});

// Galería fullscreen
const sg = StyleSheet.create({
  root: { flex: 1, backgroundColor: "black", justifyContent: "center" },
  closeBtn: {
    position: "absolute",
    top: 52,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: "white", fontSize: 16, fontWeight: "700" },
  counter: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    zIndex: 10,
  },
  foto: { width: SW, height: SW * 1.2 },
  dots: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotActive: { backgroundColor: "white", width: 18 },
});

