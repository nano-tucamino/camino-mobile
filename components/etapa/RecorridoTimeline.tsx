// 📄 components/etapa/RecorridoTimeline.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Linking,
  Image,
} from "react-native";
import type { Tables } from "@/types/database";

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Waypoint = Tables<"etapas_recorrido">;
type TipoPOI = Tables<"puntos_interes_geo">["tipo"];

interface POI {
  id: string;
  nombre: string | null;
  tipo: TipoPOI | null;
  km_referencia: number | null;
  descripcion: string | null;
  lat: number | null;
  lng: number | null;
}

interface Negocio {
  id: string;
  slug: string;
  nombre: string;
  categoria: string;
  descripcion: string | null;
  descripcion_en: string | null;
  descripcion_de: string | null;
  descripcion_fr: string | null;
  descripcion_it: string | null;
  descripcion_pt: string | null;
  descripcion_ko: string | null;
  descripcion_ja: string | null;
  lat: number | null;
  lng: number | null;
  telefono: string | null;
  whatsapp: string | null;
  web: string | null;
  foto_url: string | null;
  plan: string;
  km_referencia: number | null;
}

interface Props {
  waypoints: Waypoint[];
  pois: POI[];
  negocios: Negocio[];
  color: string;
  lang: string;
  scrollY: Animated.Value;
}

// ── Constantes ────────────────────────────────────────────────────────────────
const POI_EMOJI: Record<string, string> = {
  fuente: "💧",
  restaurante: "🍽️",
  supermercado: "🛒",
  farmacia: "💊",
  medico: "🏥",
  iglesia: "⛪",
  capilla: "🕍",
  cruceiro: "✝️",
  monumento: "🗿",
  yacimiento: "🏺",
  mirador: "🔭",
  area_descanso: "🌿",
  puente: "🌉",
  ermita: "🏛️",
  albergue_rural: "🏠",
  otro: "📍",
};

const POI_LABEL: Record<string, Record<string, string>> = {
  es: {
    fuente: "Fuentes de agua",
    restaurante: "Restaurantes",
    supermercado: "Tiendas",
    farmacia: "Farmacias",
    medico: "Médico",
    iglesia: "Iglesias",
    capilla: "Capillas",
    cruceiro: "Cruceiros",
    monumento: "Monumentos",
    yacimiento: "Yacimientos",
    mirador: "Miradores",
    area_descanso: "Áreas de descanso",
    puente: "Puentes",
    ermita: "Ermitas",
    albergue_rural: "Albergues rurales",
    otro: "Otros",
  },
  en: {
    fuente: "Water sources",
    restaurante: "Restaurants",
    supermercado: "Shops",
    farmacia: "Pharmacies",
    medico: "Medical",
    iglesia: "Churches",
    capilla: "Chapels",
    cruceiro: "Cruceiros",
    monumento: "Monuments",
    yacimiento: "Archaeological sites",
    mirador: "Viewpoints",
    area_descanso: "Rest areas",
    puente: "Bridges",
    ermita: "Hermitages",
    albergue_rural: "Rural hostels",
    otro: "Other",
  },
  de: {
    fuente: "Wasserquellen",
    restaurante: "Restaurants",
    supermercado: "Geschäfte",
    farmacia: "Apotheken",
    medico: "Arzt",
    iglesia: "Kirchen",
    capilla: "Kapellen",
    cruceiro: "Cruceiros",
    monumento: "Denkmäler",
    yacimiento: "Archäologische Stätten",
    mirador: "Aussichtspunkte",
    area_descanso: "Rastplätze",
    puente: "Brücken",
    ermita: "Einsiedeleien",
    albergue_rural: "Landherbergen",
    otro: "Sonstiges",
  },
  fr: {
    fuente: "Sources d'eau",
    restaurante: "Restaurants",
    supermercado: "Magasins",
    farmacia: "Pharmacies",
    medico: "Médecin",
    iglesia: "Églises",
    capilla: "Chapelles",
    cruceiro: "Cruceiros",
    monumento: "Monuments",
    yacimiento: "Sites archéologiques",
    mirador: "Belvédères",
    area_descanso: "Aires de repos",
    puente: "Ponts",
    ermita: "Ermitages",
    albergue_rural: "Auberges rurales",
    otro: "Autres",
  },
  it: {
    fuente: "Fonti d'acqua",
    restaurante: "Ristoranti",
    supermercado: "Negozi",
    farmacia: "Farmacie",
    medico: "Medico",
    iglesia: "Chiese",
    capilla: "Cappelle",
    cruceiro: "Cruceiros",
    monumento: "Monumenti",
    yacimiento: "Siti archeologici",
    mirador: "Belvedere",
    area_descanso: "Aree di sosta",
    puente: "Ponti",
    ermita: "Eremi",
    albergue_rural: "Ostelli rurali",
    otro: "Altro",
  },
  pt: {
    fuente: "Fontes de água",
    restaurante: "Restaurantes",
    supermercado: "Lojas",
    farmacia: "Farmácias",
    medico: "Médico",
    iglesia: "Igrejas",
    capilla: "Capelas",
    cruceiro: "Cruceiros",
    monumento: "Monumentos",
    yacimiento: "Sítios arqueológicos",
    mirador: "Miradouros",
    area_descanso: "Áreas de descanso",
    puente: "Pontes",
    ermita: "Eremitérios",
    albergue_rural: "Albergues rurais",
    otro: "Outros",
  },
  ko: {
    fuente: "수원지",
    restaurante: "레스토랑",
    supermercado: "상점",
    farmacia: "약국",
    medico: "의사",
    iglesia: "교회",
    capilla: "예배당",
    cruceiro: "크루세이로",
    monumento: "기념물",
    yacimiento: "고고학 유적지",
    mirador: "전망대",
    area_descanso: "휴게소",
    puente: "다리",
    ermita: "은수처",
    albergue_rural: "농촌 호스텔",
    otro: "기타",
  },
  ja: {
    fuente: "水源",
    restaurante: "レストラン",
    supermercado: "お店",
    farmacia: "薬局",
    medico: "医師",
    iglesia: "教会",
    capilla: "礼拝堂",
    cruceiro: "クルセイロ",
    monumento: "記念碑",
    yacimiento: "遺跡",
    mirador: "展望台",
    area_descanso: "休憩エリア",
    puente: "橋",
    ermita: "庵",
    albergue_rural: "農村ホステル",
    otro: "その他",
  },
};

const CATEGORIA_LABEL: Record<string, Record<string, string>> = {
  es: {
    hosteleria: "Bar / Cafetería",
    alimentacion: "Alimentación",
    servicios: "Servicios",
    outdoor: "Outdoor",
    transporte: "Transporte",
    bienestar: "Bienestar",
    experiencias: "Experiencias",
    otros: "Otros",
  },
  en: {
    hosteleria: "Bar / Café",
    alimentacion: "Food & Drink",
    servicios: "Services",
    outdoor: "Outdoor",
    transporte: "Transport",
    bienestar: "Wellness",
    experiencias: "Experiences",
    otros: "Other",
  },
  de: {
    hosteleria: "Bar / Café",
    alimentacion: "Lebensmittel",
    servicios: "Dienstleistungen",
    outdoor: "Outdoor",
    transporte: "Transport",
    bienestar: "Wellness",
    experiencias: "Erlebnisse",
    otros: "Sonstiges",
  },
  fr: {
    hosteleria: "Bar / Café",
    alimentacion: "Alimentation",
    servicios: "Services",
    outdoor: "Outdoor",
    transporte: "Transport",
    bienestar: "Bien-être",
    experiencias: "Expériences",
    otros: "Autres",
  },
  it: {
    hosteleria: "Bar / Caffè",
    alimentacion: "Alimentazione",
    servicios: "Servizi",
    outdoor: "Outdoor",
    transporte: "Trasporto",
    bienestar: "Benessere",
    experiencias: "Esperienze",
    otros: "Altri",
  },
  pt: {
    hosteleria: "Bar / Café",
    alimentacion: "Alimentação",
    servicios: "Serviços",
    outdoor: "Outdoor",
    transporte: "Transporte",
    bienestar: "Bem-estar",
    experiencias: "Experiências",
    otros: "Outros",
  },
  ko: {
    hosteleria: "바 / 카페",
    alimentacion: "식품",
    servicios: "서비스",
    outdoor: "아웃도어",
    transporte: "교통",
    bienestar: "웰니스",
    experiencias: "체험",
    otros: "기타",
  },
  ja: {
    hosteleria: "バー / カフェ",
    alimentacion: "食品",
    servicios: "サービス",
    outdoor: "アウトドア",
    transporte: "交通",
    bienestar: "ウェルネス",
    experiencias: "体験",
    otros: "その他",
  },
};

const TIPOS_PATRIMONIO = new Set([
  "iglesia",
  "capilla",
  "ermita",
  "cruceiro",
  "monumento",
  "yacimiento",
  "puente",
  "mirador",
]);
const TIPOS_SERVICIO = new Set([
  "restaurante",
  "supermercado",
  "farmacia",
  "medico",
  "area_descanso",
]);
const NOMBRES_GENERICOS = [
  "fuente de agua",
  "área de descanso",
  "area de descanso",
  "fuente",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getL(obj: any, field: string, lang: string): string {
  if (!obj) return "";
  const l = lang.split("-")[0];
  return obj[`${field}_${l}`] || obj[`${field}_es`] || obj[field] || "";
}

function poiLabel(tipo: string, lang: string): string {
  const l = lang.split("-")[0];
  return POI_LABEL[l]?.[tipo] ?? POI_LABEL.es[tipo] ?? tipo;
}

function catLabel(categoria: string, lang: string): string {
  const l = lang.split("-")[0];
  return (
    CATEGORIA_LABEL[l]?.[categoria] ??
    CATEGORIA_LABEL.es[categoria] ??
    categoria
  );
}

function filtrarPOIs(pois: POI[], waypoints: Waypoint[]): POI[] {
  const kmWaypoints = waypoints.map((w) => parseFloat(String(w.km_acumulado)));
  const esZonaUrbana = (km: number) =>
    kmWaypoints.some((wkm) => Math.abs(wkm - km) <= 1.0);
  const sinGenericos = pois.filter(
    (p) => !NOMBRES_GENERICOS.includes(p.nombre?.toLowerCase().trim() ?? ""),
  );
  const resultado: POI[] = [];
  const contadorPorZona: Record<string, Record<string, number>> = {};

  for (const p of sinGenericos) {
    const km = parseFloat(String(p.km_referencia));
    const tipo = p.tipo as string;

    if (TIPOS_PATRIMONIO.has(tipo)) {
      const yaHay = resultado.some(
        (r) =>
          r.tipo === tipo &&
          Math.abs(parseFloat(String(r.km_referencia)) - km) < 0.5,
      );
      if (!yaHay) resultado.push(p);
      continue;
    }

    if (TIPOS_SERVICIO.has(tipo) && esZonaUrbana(km)) {
      const zona = String(Math.round(km));
      if (!contadorPorZona[zona]) contadorPorZona[zona] = {};
      const count = contadorPorZona[zona][tipo] ?? 0;
      if (count < 2) {
        contadorPorZona[zona][tipo] = count + 1;
        resultado.push(p);
      }
      continue;
    }

    resultado.push(p);
  }

  return resultado.slice(0, 35);
}

function poisEnTramo(pois: POI[], kmDesde: number, kmHasta: number): POI[] {
  return pois.filter((p) => {
    const km = parseFloat(String(p.km_referencia));
    return km >= kmDesde && km < kmHasta;
  });
}

function negociosEnTramo(
  negocios: Negocio[],
  kmDesde: number,
  kmHasta: number,
): Negocio[] {
  return negocios.filter((n) => {
    const km = parseFloat(String(n.km_referencia));
    return km >= kmDesde && km < kmHasta;
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// TIPO CHIP
// ═════════════════════════════════════════════════════════════════════════════
function TipoChip({
  tipo,
  items,
  color,
  lang,
}: {
  tipo: string;
  items: POI[];
  color: string;
  lang: string;
}) {
  const [open, setOpen] = useState(false);
  const esPatrimonio = TIPOS_PATRIMONIO.has(tipo);

  return (
    <View style={{ marginBottom: 6 }}>
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        style={[tc.chip, esPatrimonio && tc.chipPatrimonio]}
        activeOpacity={0.7}
      >
        <Text style={tc.emoji}>{POI_EMOJI[tipo] ?? "📍"}</Text>
        <Text style={tc.label}>{poiLabel(tipo, lang)}</Text>
        <View
          style={[
            tc.count,
            { backgroundColor: esPatrimonio ? color : "#B4A890" },
          ]}
        >
          <Text style={tc.countText}>{items.length}</Text>
        </View>
        <Text
          style={[
            tc.chevron,
            open && ({ transform: [{ rotate: "90deg" }] } as any),
          ]}
        >
          ›
        </Text>
      </TouchableOpacity>

      {open && (
        <View style={tc.list}>
          {items
            .sort((a, b) => (a.km_referencia ?? 999) - (b.km_referencia ?? 999))
            .map((poi, i) => (
              <View
                key={poi.id}
                style={[tc.poiRow, esPatrimonio && tc.poiRowPatrimonio]}
              >
                {poi.km_referencia != null && (
                  <View style={[tc.kmBadge, { backgroundColor: `${color}18` }]}>
                    <Text style={[tc.kmText, { color }]}>
                      km {poi.km_referencia}
                    </Text>
                  </View>
                )}
                <Text style={tc.poiNombre} numberOfLines={2}>
                  {poi.nombre}
                </Text>
              </View>
            ))}
        </View>
      )}
    </View>
  );
}

const tc = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E8E0D0",
    alignSelf: "flex-start",
  },
  chipPatrimonio: { backgroundColor: "#FDF8F0", borderColor: "#F0E8D4" },
  emoji: { fontSize: 13 },
  label: { fontSize: 12, color: "#2C1F0E", fontWeight: "500" },
  count: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 2,
  },
  countText: { fontSize: 10, color: "white", fontWeight: "700" },
  chevron: { fontSize: 14, color: "#B4A890", marginLeft: 2 },
  list: { marginTop: 4, marginLeft: 8 },
  poiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    marginBottom: 3,
    borderWidth: 1,
    borderColor: "#F0EBE0",
  },
  poiRowPatrimonio: { backgroundColor: "#FDF8F0" },
  kmBadge: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexShrink: 0,
  },
  kmText: { fontSize: 10, fontWeight: "700" },
  poiNombre: { flex: 1, fontSize: 12, color: "#2C1F0E", lineHeight: 17 },
});

// ═════════════════════════════════════════════════════════════════════════════
// NEGOCIO CARD
// ═════════════════════════════════════════════════════════════════════════════
function NegocioCard({
  negocio,
  color,
  lang,
}: {
  negocio: Negocio;
  color: string;
  lang: string;
}) {
  const esDestacado = negocio.plan === "destacado";
  const desc = getL(negocio, "descripcion", lang);
  const categoria = catLabel(negocio.categoria, lang);

  const handleTel = () =>
    negocio.telefono && Linking.openURL(`tel:${negocio.telefono}`);
  const handleWA = () =>
    negocio.whatsapp &&
    Linking.openURL(`https://wa.me/${negocio.whatsapp.replace(/\D/g, "")}`);
  const handleWeb = () =>
    negocio.web &&
    Linking.openURL(
      negocio.web.startsWith("http") ? negocio.web : `https://${negocio.web}`,
    );

  if (esDestacado) {
    return (
      <View style={[nc.destacado, { borderColor: color }]}>
        <View style={[nc.planBadge, { backgroundColor: color }]}>
          <Text style={nc.planText}>✦ Destacado</Text>
        </View>
        {negocio.foto_url && (
          <Image
            source={{ uri: negocio.foto_url }}
            style={nc.foto}
            resizeMode="cover"
          />
        )}
        <View style={nc.body}>
          <View style={nc.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={nc.nombre}>{negocio.nombre}</Text>
              <View style={[nc.catBadge, { borderColor: color }]}>
                <Text style={[nc.catText, { color }]}>{categoria}</Text>
              </View>
            </View>
            {negocio.km_referencia != null && (
              <View style={[nc.kmBadge, { backgroundColor: color }]}>
                <Text style={nc.kmText}>km {negocio.km_referencia}</Text>
              </View>
            )}
          </View>
          {!!desc && (
            <Text style={nc.desc} numberOfLines={3}>
              {desc}
            </Text>
          )}
          <View style={nc.ctaRow}>
            {negocio.telefono && (
              <TouchableOpacity
                onPress={handleTel}
                style={[nc.ctaBtn, { borderColor: color }]}
              >
                <Text>📞</Text>
                <Text style={[nc.ctaText, { color }]}>Llamar</Text>
              </TouchableOpacity>
            )}
            {negocio.whatsapp && (
              <TouchableOpacity
                onPress={handleWA}
                style={[nc.ctaBtn, { borderColor: "#25D366" }]}
              >
                <Text>💬</Text>
                <Text style={[nc.ctaText, { color: "#25D366" }]}>WhatsApp</Text>
              </TouchableOpacity>
            )}
            {negocio.web && (
              <TouchableOpacity
                onPress={handleWeb}
                style={[nc.ctaBtn, { borderColor: "#8B7355" }]}
              >
                <Text>🌐</Text>
                <Text style={[nc.ctaText, { color: "#8B7355" }]}>Web</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={nc.basico}>
      <View style={{ flex: 1 }}>
        <Text style={nc.basicoNombre}>{negocio.nombre}</Text>
        <Text style={nc.basicoCat}>{categoria}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {negocio.km_referencia != null && (
          <Text style={nc.basicoKm}>km {negocio.km_referencia}</Text>
        )}
        {negocio.telefono && (
          <TouchableOpacity onPress={handleTel} style={nc.basicoTel}>
            <Text style={{ fontSize: 14 }}>📞</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const nc = StyleSheet.create({
  destacado: {
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 10,
    backgroundColor: "white",
  },
  planBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  planText: { fontSize: 10, color: "white", fontWeight: "700" },
  foto: { width: "100%", height: 140 },
  body: { padding: 14 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  nombre: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2C1F0E",
    marginBottom: 4,
  },
  catBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  catText: { fontSize: 10, fontWeight: "700" },
  kmBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  kmText: { fontSize: 11, color: "white", fontWeight: "700" },
  desc: { fontSize: 13, color: "#5C4A32", lineHeight: 19, marginBottom: 12 },
  ctaRow: { flexDirection: "row", gap: 8 },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  ctaText: { fontSize: 12, fontWeight: "600" },
  basico: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDF8F0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F0E8D4",
  },
  basicoNombre: { fontSize: 13, fontWeight: "600", color: "#2C1F0E" },
  basicoCat: { fontSize: 11, color: "#8B7355", marginTop: 2 },
  basicoKm: { fontSize: 11, color: "#8B7355" },
  basicoTel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E8E0D0",
    alignItems: "center",
    justifyContent: "center",
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════
export default function RecorridoTimeline({
  waypoints,
  pois,
  negocios,
  color,
  lang,
  scrollY,
}: Props) {
  const [containerTop, setCTop] = useState(0);
  const [containerH, setCH] = useState(1);
  // const [progress, setProgress] = useState(0);

  const bounceUp = useRef(new Animated.Value(0)).current;
  const bounceDown = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (val: Animated.Value, dir: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: dir * -3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
    anim(bounceUp, 1).start();
    anim(bounceDown, -1).start();
  }, []);

  const containerRef = useRef<View>(null);
  const [progress, setProgress] = useState(0);

  const updateProgress = useCallback(() => {
    containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
      const screenMid = Dimensions.get("window").height * 0.5;
      const raw = (screenMid - pageY) / height;
      setProgress(Math.min(1, Math.max(0, raw)));
    });
  }, []);

  useEffect(() => {
    const id = scrollY.addListener(() => updateProgress());
    setTimeout(updateProgress, 100);
    return () => scrollY.removeListener(id);
  }, [updateProgress]);
  const poisFiltrados = filtrarPOIs(pois, waypoints);

  return (
    <View ref={containerRef} style={{ position: "relative", paddingLeft: 28 }}>
      {/* Línea base gris */}
      <View style={tl.lineBase} />
      {/* Línea progreso */}
      <View
        style={[
          tl.lineProgress,
          {
            height: `${Math.round(progress * 100)}%` as any,
            borderLeftColor: color,
          },
        ]}
      />

      {waypoints.map((wp, i) => {
        const isFirst = i === 0;
        const isLast = i === waypoints.length - 1;
        const siguiente = waypoints[i + 1];
        const dotProgress = i / Math.max(waypoints.length - 1, 1);
        const activado = progress >= dotProgress - 0.05;
        const desc = getL(wp as any, "descripcion_tramo", lang);
        const diffEle =
          wp.elevacion && siguiente?.elevacion
            ? Math.round(Number(siguiente.elevacion) - Number(wp.elevacion))
            : null;

        const kmActual = parseFloat(String(wp.km_acumulado));
        const kmSiguiente = siguiente
          ? parseFloat(String(siguiente.km_acumulado))
          : kmActual + 999;

        const poisTramo = poisEnTramo(poisFiltrados, kmActual, kmSiguiente);
        const negociosTramo = negociosEnTramo(negocios, kmActual, kmSiguiente);

        const porTipo = poisTramo.reduce<Record<string, POI[]>>((acc, p) => {
          const tipo = p.tipo ?? "otro";
          if (!acc[tipo]) acc[tipo] = [];
          acc[tipo].push(p);
          return acc;
        }, {});

        const tiposOrdenados = Object.keys(porTipo).sort(
          (a, b) =>
            (TIPOS_PATRIMONIO.has(a) ? 0 : 1) -
            (TIPOS_PATRIMONIO.has(b) ? 0 : 1),
        );

        return (
          <View key={i} style={tl.row}>
            {/* Dot */}
            <View
              style={[
                tl.dot,
                {
                  backgroundColor: activado ? color : "white",
                  borderColor: activado ? color : "#E8E0D0",
                  left: -29,
                },
              ]}
            >
              {(isFirst || isLast) && (
                <View
                  style={[
                    tl.dotInner,
                    { backgroundColor: activado ? "white" : "#B4A890" },
                  ]}
                />
              )}
            </View>

            {/* Contenido */}
            <View style={tl.content}>
              <View style={tl.wpHeader}>
                <Text
                  style={[
                    tl.wpNombre,
                    { color: isFirst || isLast ? color : "#2C1F0E" },
                  ]}
                >
                  {wp.localidad}
                </Text>
                <View style={[tl.kmBadge, { backgroundColor: color }]}>
                  <Text style={tl.kmText}>km {wp.km_acumulado}</Text>
                </View>
                {wp.elevacion != null && (
                  <Text style={tl.elev}>
                    {Math.round(Number(wp.elevacion))}m
                  </Text>
                )}
                {diffEle !== null && Math.abs(diffEle) >= 10 && (
                  <Animated.View
                    style={[
                      tl.diffBadge,
                      {
                        backgroundColor:
                          diffEle > 0
                            ? "rgba(220,38,38,0.08)"
                            : "rgba(22,163,74,0.08)",
                      },
                      {
                        transform: [
                          { translateY: diffEle > 0 ? bounceUp : bounceDown },
                        ],
                      },
                    ]}
                  >
                    <Text
                      style={[
                        tl.diffText,
                        { color: diffEle > 0 ? "#dc2626" : "#16a34a" },
                      ]}
                    >
                      {diffEle > 0 ? "↑ +" : "↓ "}
                      {diffEle}m
                    </Text>
                  </Animated.View>
                )}
              </View>

              {!!desc && <Text style={tl.desc}>{desc}</Text>}

              {/* Negocios — antes que POIs, más prominentes */}
              {negociosTramo.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  {negociosTramo.map((neg) => (
                    <NegocioCard
                      key={neg.id}
                      negocio={neg}
                      color={color}
                      lang={lang}
                    />
                  ))}
                </View>
              )}

              {/* POIs agrupados */}
              {tiposOrdenados.length > 0 && (
                <View style={tl.poisRow}>
                  {tiposOrdenados.map((tipo) => (
                    <TipoChip
                      key={tipo}
                      tipo={tipo}
                      items={porTipo[tipo]}
                      color={color}
                      lang={lang}
                    />
                  ))}
                </View>
              )}

              <View style={{ height: isLast ? 0 : 24 }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const tl = StyleSheet.create({
  lineBase: {
    position: "absolute",
    left: 10,
    top: 12,
    bottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#E8E0D0",
    borderStyle: "dashed",
  },
  lineProgress: {
    position: "absolute",
    left: 10,
    top: 12,
    borderLeftWidth: 4,
    borderStyle: "dashed",
  },
  row: { flexDirection: "row", gap: 16, zIndex: 2 },
  dot: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dotInner: { width: 8, height: 8, borderRadius: 4 },
  content: { flex: 1, marginLeft: 4, paddingTop: 2 },
  wpHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 4,
  },
  wpNombre: { fontSize: 15, fontWeight: "700" },
  kmBadge: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  kmText: { fontSize: 11, color: "white", fontWeight: "600" },
  elev: { fontSize: 11, color: "#8B7355" },
  diffBadge: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  diffText: { fontSize: 11, fontWeight: "700" },
  desc: { fontSize: 13, color: "#8B7355", lineHeight: 19, marginBottom: 10 },
  poisRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
});
