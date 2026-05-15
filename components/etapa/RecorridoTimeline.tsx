// 📄 components/etapa/RecorridoTimeline.tsx  (camino-mobile)
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Linking,
  StyleSheet,
  Animated,
  Dimensions,
  LayoutChangeEvent,
} from "react-native";
import { useRouter } from "expo-router";

// ── Tipos ──────────────────────────────────────────────────────────────────

type Waypoint = {
  orden: number;
  km_acumulado: number;
  localidad: string;
  elevacion?: number;
  descripcion_tramo?: string | null;
  descripcion_tramo_en?: string | null;
  descripcion_tramo_de?: string | null;
  descripcion_tramo_fr?: string | null;
  descripcion_tramo_it?: string | null;
  descripcion_tramo_pt?: string | null;
  descripcion_tramo_ko?: string | null;
  descripcion_tramo_ja?: string | null;
};

type POI = {
  id: string;
  nombre: string;
  tipo: string;
  km_referencia: number;
};

type Negocio = {
  id: string;
  slug: string;
  nombre: string;
  categoria: string;
  plan: string;
  km_referencia: number | null;
  foto_url?: string | null;
  telefono?: string | null;
  web?: string | null;
  descripcion?: string | null;
  descripcion_en?: string | null;
  descripcion_de?: string | null;
  descripcion_fr?: string | null;
  descripcion_it?: string | null;
  descripcion_pt?: string | null;
  descripcion_ko?: string | null;
  descripcion_ja?: string | null;
};

type Albergue = {
  id: string;
  slug: string | null;
  nombre: string;
  localidad: string | null;
  tipo: string | null;
  ocupacion: string | null;
  precio_cama: string | null;
  precio_habitacion: string | null;
  precio_desde: number | null;
  foto_url: string | null;
  fotos_urls?: string[] | null;
  plan: string | null;
  telefono: string | null;
  web: string | null;
  descripcion: string | null;
  descripcion_en?: string | null;
  descripcion_de?: string | null;
  descripcion_fr?: string | null;
  descripcion_it?: string | null;
  descripcion_pt?: string | null;
  descripcion_ko?: string | null;
  ubicacion?: string | null;
  ubicacion_en?: string | null;
};

// ── Constantes ─────────────────────────────────────────────────────────────

const TIPO_EMOJI: Record<string, string> = {
  fuente: "💧",
  restaurante: "🍽️",
  supermercado: "🛒",
  farmacia: "💊",
  medico: "🏥",
  area_descanso: "🌿",
  mirador: "🔭",
  refugio: "⛺",
  iglesia: "⛪",
  capilla: "🕍",
  ermita: "🏛️",
  cruceiro: "✝️",
  monumento: "🗿",
  yacimiento: "🏺",
  puente: "🌉",
  albergue_rural: "🏠",
  otro: "📍",
};

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

const OCUP_COLOR: Record<string, string> = {
  libre: "#16a34a",
  casi_lleno: "#ca8a04",
  completo: "#dc2626",
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
  "refugio",
]);

const SCREEN_HEIGHT = Dimensions.get("window").height;

// ── AlbergueChip ───────────────────────────────────────────────────────────

function AlbergueChip({
  albergue,
  lang,
  color,
}: {
  albergue: Albergue;
  lang: string;
  color: string;
}) {
  const foto = albergue.foto_url ?? albergue.fotos_urls?.[0] ?? null;
  const [abierto, setAbierto] = useState(false);
  const router = useRouter();

  const descKey = `descripcion_${lang}` as keyof Albergue;
  const descripcion =
    (albergue[descKey] as string) || albergue.descripcion || "";
  const dotColor = OCUP_COLOR[albergue.ocupacion ?? "libre"] ?? "#16a34a";
  const precio =
    albergue.precio_cama ??
    (albergue.precio_desde ? `${albergue.precio_desde}€` : null);

  return (
    <View style={styles.negocioWrapper}>
      <TouchableOpacity
        onPress={() => setAbierto((v) => !v)}
        activeOpacity={0.7}
        style={[
          styles.negocioChip,
          styles.negocioChipDestacado,
          { borderColor: color },
        ]}
      >
        {/* Miniatura */}
        <View style={styles.negocioMiniatura}>
          {foto ? (
            <Image source={{ uri: foto }} style={styles.negocioMiniaturaImg} />
          ) : (
            <Text style={styles.negocioMiniaturaEmoji}>🏠</Text>
          )}
        </View>

        {/* Info */}
        <View style={styles.negocioChipInfo}>
          <Text style={styles.negocioChipNombre} numberOfLines={1}>
            {albergue.nombre}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              marginTop: 1,
            }}
          >
            <View style={[styles.ocupDot, { backgroundColor: dotColor }]} />
            {precio && <Text style={styles.negocioChipCat}>{precio}</Text>}
          </View>
        </View>

        {/* Derecha */}
        <View style={styles.negocioChipRight}>
          <View style={[styles.badgeDestacado, { backgroundColor: color }]}>
            <Text style={styles.badgeDestacadoText}>Plus</Text>
          </View>
          <Text style={[styles.chevron, abierto && styles.chevronOpen]}>›</Text>
        </View>
      </TouchableOpacity>

      {abierto && (
        <View style={[styles.negocioCard, { borderColor: color }]}>
          {foto && (
            <View style={styles.negocioFotoContainer}>
              <Image source={{ uri: foto }} style={styles.negocioFoto} />
              <View
                style={[styles.negocioFotoBadge, { backgroundColor: color }]}
              >
                <Text style={styles.negocioFotoBadgeText}>Albergue Plus</Text>
              </View>
            </View>
          )}
          <View style={styles.negocioCardBody}>
            <Text style={styles.negocioCardNombre}>{albergue.nombre}</Text>
            {precio && (
              <Text style={[styles.negocioCardCat, { color }]}>
                {precio} por cama
              </Text>
            )}
            {!!descripcion && (
              <Text style={styles.negocioCardDesc} numberOfLines={4}>
                {descripcion}
              </Text>
            )}
            <View style={styles.negocioCardActions}>
              {!!albergue.telefono && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${albergue.telefono}`)}
                  style={styles.btnLlamar}
                >
                  <Text style={styles.btnLlamarText}>📞 Llamar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() =>
                  router.push(`/(public)/albergues/${albergue.slug}` as any)
                }
                style={[styles.btnFicha, { backgroundColor: color }]}
              >
                <Text style={styles.btnFichaText}>Ver ficha →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ── NegocioChip ────────────────────────────────────────────────────────────

function NegocioChip({
  negocio,
  lang,
  color,
}: {
  negocio: Negocio;
  lang: string;
  color: string;
}) {
  const [abierto, setAbierto] = useState<boolean>(false);
  const router = useRouter();
  const esDestacado = negocio.plan === "destacado";
  const emoji = CATEGORIA_EMOJI[negocio.categoria] ?? "📍";
  const catLabel = CATEGORIA_LABEL[negocio.categoria] ?? negocio.categoria;
  const descKey = `descripcion_${lang}` as keyof Negocio;
  const descripcion = (negocio[descKey] as string) || negocio.descripcion || "";

  return (
    <View style={styles.negocioWrapper}>
      <TouchableOpacity
        onPress={() => setAbierto((v) => !v)}
        activeOpacity={0.7}
        style={[
          styles.negocioChip,
          { borderColor: esDestacado ? "#C8622A" : "#E8DDD0" },
          esDestacado && styles.negocioChipDestacado,
        ]}
      >
        <View style={styles.negocioMiniatura}>
          {negocio.foto_url ? (
            <Image
              source={{ uri: negocio.foto_url }}
              style={styles.negocioMiniaturaImg}
            />
          ) : (
            <Text style={styles.negocioMiniaturaEmoji}>{emoji}</Text>
          )}
        </View>
        <View style={styles.negocioChipInfo}>
          <Text style={styles.negocioChipNombre} numberOfLines={1}>
            {negocio.nombre}
          </Text>
          <Text style={styles.negocioChipCat}>
            {emoji} {catLabel}
          </Text>
        </View>
        <View style={styles.negocioChipRight}>
          {esDestacado && (
            <View style={styles.badgeDestacado}>
              <Text style={styles.badgeDestacadoText}>★</Text>
            </View>
          )}
          <Text style={[styles.chevron, abierto && styles.chevronOpen]}>›</Text>
        </View>
      </TouchableOpacity>

      {abierto && (
        <View
          style={[
            styles.negocioCard,
            { borderColor: esDestacado ? "#C8622A" : "#E8DDD0" },
          ]}
        >
          {negocio.foto_url && (
            <View style={styles.negocioFotoContainer}>
              <Image
                source={{ uri: negocio.foto_url }}
                style={styles.negocioFoto}
              />
              {esDestacado && (
                <View style={styles.negocioFotoBadge}>
                  <Text style={styles.negocioFotoBadgeText}>★ Destacado</Text>
                </View>
              )}
            </View>
          )}
          <View style={styles.negocioCardBody}>
            <Text style={styles.negocioCardNombre}>{negocio.nombre}</Text>
            <Text style={styles.negocioCardCat}>
              {emoji} {catLabel}
            </Text>
            {!!descripcion && (
              <Text style={styles.negocioCardDesc}>{descripcion}</Text>
            )}
            <View style={styles.negocioCardActions}>
              {!!negocio.telefono && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${negocio.telefono}`)}
                  style={styles.btnLlamar}
                >
                  <Text style={styles.btnLlamarText}>📞 Llamar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() =>
                  router.push(`/(public)/negocios/${negocio.slug}` as any)
                }
                style={[styles.btnFicha, { backgroundColor: color }]}
              >
                <Text style={styles.btnFichaText}>Ver ficha →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ── POIChip ────────────────────────────────────────────────────────────────

function POIChip({
  tipo,
  items,
  color,
  label,
}: {
  tipo: string;
  items: POI[];
  color: string;
  label: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const esPatrimonio = TIPOS_PATRIMONIO.has(tipo);
  const emoji = TIPO_EMOJI[tipo] ?? "📍";

  return (
    <View style={{ marginBottom: 6 }}>
      <TouchableOpacity
        onPress={() => setAbierto((v) => !v)}
        style={[
          styles.poiChip,
          {
            borderColor: esPatrimonio ? "#F0E8D4" : "#E8E0D0",
            backgroundColor: esPatrimonio ? "#FDF8F0" : "white",
          },
        ]}
      >
        <Text style={styles.poiEmoji}>{emoji}</Text>
        <Text style={styles.poiLabel}>{label}</Text>
        <View
          style={[
            styles.poiCount,
            { backgroundColor: esPatrimonio ? color : "#B4A890" },
          ]}
        >
          <Text style={styles.poiCountText}>{items.length}</Text>
        </View>
        <Text style={[styles.chevron, abierto && styles.chevronOpen]}>›</Text>
      </TouchableOpacity>
      {abierto && (
        <View style={{ marginTop: 4, marginLeft: 8 }}>
          {items.map((poi, i) => (
            <View
              key={i}
              style={[
                styles.poiItem,
                { backgroundColor: esPatrimonio ? "#FDF8F0" : "#FAFAFA" },
              ]}
            >
              <Text style={styles.poiItemNombre}>{poi.nombre}</Text>
              {poi.km_referencia != null && (
                <Text style={styles.poiItemKm}>km {poi.km_referencia}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ── RecorridoTimeline ──────────────────────────────────────────────────────

interface Props {
  waypoints: Waypoint[];
  pois: POI[];
  negocios: Negocio[];
  albergues: Albergue[];
  color: string;
  lang: string;
  scrollY: Animated.Value;
}

export default function RecorridoTimeline({
  waypoints,
  pois,
  negocios,
  albergues,
  color,
  lang,
  scrollY,
}: Props) {
  const containerRef = useRef<View>(null);
  const containerYRef = useRef(0);
  const containerHeightRef = useRef(1);
  const [progress, setProgress] = useState(0);
  const scrollYValueRef = useRef(0);
  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      const screenMid = SCREEN_HEIGHT * 0.5;

      const containerTop = containerYRef.current - value;
      const raw = (screenMid - containerTop) / containerHeightRef.current;
      setProgress(Math.min(1, Math.max(0, raw)));
      scrollYValueRef.current = value;
    });
    return () => scrollY.removeListener(listener);
  }, [scrollY]);
  // Albergues destacados (plus o premium)
  const alberguesDestacados = albergues.filter(
    (a) => a.plan === "plus" || a.plan === "premium",
  );

  const onLayout = (e: LayoutChangeEvent) => {
    containerHeightRef.current = e.nativeEvent.layout.height || 1;
    containerRef.current?.measure((_x, _y, _w, _h, _px, py) => {
      if (py != null) {
        // py es relativo a ventana, sumamos el scroll actual para obtener posición absoluta
        containerYRef.current = py + scrollYValueRef.current;
      }
    });
  };

  function poisEnTramo(kmDesde: number, kmHasta: number) {
    return pois.filter(
      (p) => p.km_referencia >= kmDesde && p.km_referencia < kmHasta,
    );
  }

  function negociosEnTramo(kmDesde: number, kmHasta: number) {
    return negocios.filter((n) => {
      const km = n.km_referencia ?? 0;
      return km >= kmDesde && km < kmHasta;
    });
  }

  // Albergues destacados por localidad del waypoint
  function alberguesEnWaypoint(localidad: string) {
    return alberguesDestacados.filter(
      (a) => a.localidad?.toLowerCase() === localidad.toLowerCase(),
    );
  }

  function getDesc(wp: Waypoint): string {
    const map: Record<string, keyof Waypoint> = {
      en: "descripcion_tramo_en",
      de: "descripcion_tramo_de",
      fr: "descripcion_tramo_fr",
      it: "descripcion_tramo_it",
      pt: "descripcion_tramo_pt",
      ko: "descripcion_tramo_ko",
      ja: "descripcion_tramo_ja",
    };
    return (wp[map[lang]] as string) || wp.descripcion_tramo || "";
  }

  const tipoLabels: Record<string, string> = {
    fuente: "Fuente",
    restaurante: "Restaurantes",
    supermercado: "Supermercados",
    farmacia: "Farmacias",
    medico: "Médico",
    area_descanso: "Descanso",
    mirador: "Miradores",
    refugio: "Refugios",
    iglesia: "Iglesias",
    capilla: "Capillas",
    ermita: "Ermitas",
    cruceiro: "Cruceiros",
    monumento: "Monumentos",
    yacimiento: "Yacimientos",
    puente: "Puentes",
    albergue_rural: "Albergues rurales",
    otro: "Otros",
  };

  return (
    <View ref={containerRef} onLayout={onLayout} style={styles.container}>
      <View style={[styles.lineaBase, { borderColor: "#E8E0D0" }]} />
      <View style={styles.lineaProgressWrap}>
        <View
          style={[
            styles.lineaProgress,
            { height: `${progress * 100}%` as any, borderColor: color },
          ]}
        />
      </View>

      {waypoints.map((wp, i) => {
        const isFirst = i === 0;
        const isLast = i === waypoints.length - 1;
        const siguiente = waypoints[i + 1];
        const diffEle =
          wp.elevacion && siguiente?.elevacion
            ? Math.round(siguiente.elevacion - wp.elevacion)
            : null;
        const kmActual = wp.km_acumulado;
        const kmSiguiente = siguiente?.km_acumulado ?? kmActual + 999;
        const poisTramo = poisEnTramo(kmActual, kmSiguiente);
        const negociosTramo = negociosEnTramo(kmActual, kmSiguiente);
        const alberguesWp = alberguesEnWaypoint(wp.localidad);

        const porTipo = poisTramo.reduce<Record<string, POI[]>>((acc, p) => {
          if (!acc[p.tipo]) acc[p.tipo] = [];
          acc[p.tipo].push(p);
          return acc;
        }, {});

        const tiposOrdenados = Object.keys(porTipo).sort(
          (a, b) =>
            (TIPOS_PATRIMONIO.has(a) ? 0 : 1) -
            (TIPOS_PATRIMONIO.has(b) ? 0 : 1),
        );

        const dotProgress = i / Math.max(waypoints.length - 1, 1);
        const dotActivado = progress >= dotProgress;
        const desc = getDesc(wp);

        return (
          <View key={i} style={styles.waypointRow}>
            <View
              style={[
                styles.dot,
                {
                  borderColor: dotActivado ? color : "#E8E0D0",
                  backgroundColor: dotActivado ? color : "white",
                },
              ]}
            >
              {(isFirst || isLast) && (
                <View
                  style={[
                    styles.dotInner,
                    { backgroundColor: dotActivado ? "white" : "#B4A890" },
                  ]}
                />
              )}
            </View>

            <View
              style={[
                styles.waypointContent,
                !isLast && styles.waypointContentPadding,
              ]}
            >
              <View style={styles.waypointHeader}>
                <Text style={styles.localidad}>{wp.localidad}</Text>
                <View style={[styles.kmBadge, { backgroundColor: color }]}>
                  <Text style={styles.kmText}>km {wp.km_acumulado}</Text>
                </View>
                {wp.elevacion && (
                  <Text style={styles.elevacion}>
                    {Math.round(wp.elevacion)}m
                  </Text>
                )}
                {diffEle !== null && Math.abs(diffEle) >= 10 && (
                  <View
                    style={[
                      styles.difBadge,
                      {
                        backgroundColor:
                          diffEle > 0
                            ? "rgba(220,38,38,0.08)"
                            : "rgba(22,163,74,0.08)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.difText,
                        { color: diffEle > 0 ? "#dc2626" : "#16a34a" },
                      ]}
                    >
                      {diffEle > 0 ? "↑" : "↓"} {diffEle > 0 ? "+" : ""}
                      {diffEle}m
                    </Text>
                  </View>
                )}
              </View>

              {!!desc && <Text style={styles.desc}>{desc}</Text>}

              {/* Albergues destacados en este waypoint */}
              {alberguesWp.length > 0 && (
                <View style={{ marginBottom: 8 }}>
                  {alberguesWp.map((a) => (
                    <AlbergueChip
                      key={a.id}
                      albergue={a}
                      lang={lang}
                      color={color}
                    />
                  ))}
                </View>
              )}

              {tiposOrdenados.length > 0 && (
                <View style={{ marginBottom: 8 }}>
                  {tiposOrdenados.map((tipo) => (
                    <POIChip
                      key={tipo}
                      tipo={tipo}
                      items={porTipo[tipo]}
                      color={color}
                      label={tipoLabels[tipo] ?? tipo}
                    />
                  ))}
                </View>
              )}

              {negociosTramo.length > 0 && (
                <View style={{ marginBottom: 4 }}>
                  {negociosTramo.map((n) => (
                    <NegocioChip
                      key={n.id}
                      negocio={n}
                      lang={lang}
                      color={color}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { position: "relative" },
  lineaBase: {
    position: "absolute",
    left: 10,
    top: 12,
    bottom: 12,
    width: 0,
    borderLeftWidth: 3,
    borderStyle: "dashed",
  },
  lineaProgressWrap: {
    position: "absolute",
    left: 10,
    top: 12,
    bottom: 12,
    width: 3,
    overflow: "hidden",
  },
  lineaProgress: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 0,
    borderLeftWidth: 3,
    borderStyle: "dashed",
  },
  waypointRow: { flexDirection: "row", gap: 16, position: "relative" },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    flexShrink: 0,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dotInner: { width: 8, height: 8, borderRadius: 4 },
  waypointContent: { flex: 1, paddingTop: 2 },
  waypointContentPadding: { paddingBottom: 20 },
  waypointHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 4,
  },
  localidad: { fontSize: 14, fontWeight: "700", color: "#2C1F0E" },
  kmBadge: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 999 },
  kmText: { fontSize: 11, fontWeight: "600", color: "white" },
  elevacion: { fontSize: 11, color: "#8B7355" },
  difBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
  },
  difText: { fontSize: 11, fontWeight: "700" },
  desc: { fontSize: 13, color: "#8B7355", lineHeight: 19, marginBottom: 8 },
  ocupDot: { width: 7, height: 7, borderRadius: 4 },

  poiChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  poiEmoji: { fontSize: 13 },
  poiLabel: { fontSize: 12, color: "#2C1F0E", fontWeight: "500" },
  poiCount: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999 },
  poiCountText: { fontSize: 10, fontWeight: "700", color: "white" },
  poiItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    marginBottom: 3,
    borderWidth: 1,
    borderColor: "#F0EBE0",
  },
  poiItemNombre: { fontSize: 12, color: "#2C1F0E", flex: 1 },
  poiItemKm: { fontSize: 10, color: "#B4A890", marginLeft: 8 },

  negocioWrapper: { marginBottom: 8 },
  negocioChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "white",
    alignSelf: "flex-start",
    maxWidth: 300,
  },
  negocioChipDestacado: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  negocioMiniatura: {
    width: 44,
    height: 44,
    backgroundColor: "#F5F0E8",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  negocioMiniaturaImg: { width: 44, height: 44 },
  negocioMiniaturaEmoji: { fontSize: 18 },
  negocioChipInfo: { flex: 1, paddingHorizontal: 10, paddingVertical: 6 },
  negocioChipNombre: { fontSize: 12, fontWeight: "600", color: "#2C1F0E" },
  negocioChipCat: { fontSize: 10, color: "#8B7355", marginTop: 1 },
  negocioChipRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingRight: 8,
  },
  badgeDestacado: {
    backgroundColor: "#C8622A",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
  },
  badgeDestacadoText: { fontSize: 9, fontWeight: "700", color: "white" },

  negocioCard: {
    marginTop: 4,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  negocioFotoContainer: { position: "relative", height: 130 },
  negocioFoto: { width: "100%", height: 130, resizeMode: "cover" },
  negocioFotoBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#C8622A",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  negocioFotoBadgeText: { fontSize: 10, fontWeight: "700", color: "white" },
  negocioCardBody: { padding: 12 },
  negocioCardNombre: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2C1F0E",
    marginBottom: 2,
  },
  negocioCardCat: { fontSize: 11, color: "#8B7355", marginBottom: 8 },
  negocioCardDesc: {
    fontSize: 12,
    color: "#5C4A32",
    lineHeight: 18,
    marginBottom: 12,
  },
  negocioCardActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  btnLlamar: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F5F0E8",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8DDD0",
  },
  btnLlamarText: { fontSize: 12, color: "#2C1F0E" },
  btnFicha: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  btnFichaText: { fontSize: 12, fontWeight: "600", color: "white" },
  chevron: { fontSize: 18, color: "#B4A890", marginLeft: 2 },
  chevronOpen: { transform: [{ rotate: "90deg" }] },
});
