// 📄 app/(public)/mapa.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  ScrollView,
  Modal,
} from "react-native";
import Mapbox, {
  MapView,
  Camera,
  ShapeSource,
  LineLayer,
  CircleLayer,
  UserLocation,
  UserLocationRenderMode,
} from "@rnmapbox/maps";
import * as Location from "expo-location";
import { useLocalSearchParams, router } from "expo-router";
import { useTranslation } from "react-i18next";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://camino-api.onrender.com";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "");

const CAMINO_BOUNDS = {
  center: [-3.5, 42.6] as [number, number],
  zoom: 6,
};

type EtapaFeature = {
  type: "Feature";
  properties: {
    numero: number;
    slug: string;
    color: string;
  };
  geometry: { type: "LineString"; coordinates: number[][] };
};

type EtapaInfo = {
  nombre: string;
  inicio_nombre?: string;
  fin_nombre?: string;
  distancia_km?: number;
  desnivel_pos?: number;
  desnivel_neg?: number;
  es_variante?: boolean;
};

type RecorridoGeoJSON = {
  type: "FeatureCollection";
  features: EtapaFeature[];
};

const GRUPOS_FILTROS = [
  {
    key: "infraestructura",
    label: "Infraestructura",
    emoji: "🏗️",
    tipos: ["restaurante", "supermercado", "farmacia", "medico"],
  },
  {
    key: "descanso",
    label: "Descanso",
    emoji: "💧",
    tipos: ["fuente", "area_descanso", "mirador"],
  },
  {
    key: "patrimonio",
    label: "Patrimonio",
    emoji: "⛪",
    tipos: ["iglesia", "capilla", "cruceiro", "monumento", "yacimiento"],
  },
] as const;

type GrupoKey = "infraestructura" | "descanso" | "patrimonio";

type FiltrosActivos = {
  albergues: boolean;
  negocios: boolean;
  infraestructura: boolean;
  descanso: boolean;
  patrimonio: boolean;
};

const TIPO_EMOJI: Record<string, string> = {
  restaurante: "🍽️",
  supermercado: "🛒",
  farmacia: "💊",
  medico: "🏥",
  fuente: "💧",
  area_descanso: "🌿",
  mirador: "🔭",
  iglesia: "⛪",
  capilla: "⛪",
  cruceiro: "✝️",
  monumento: "🏛️",
  yacimiento: "🏺",
};

export default function MapaScreen() {
  const { t } = useTranslation();
  const cameraRef = useRef<Camera>(null);
  const panelAnim = useRef(new Animated.Value(0)).current;
  const { etapa: etapaSlug } = useLocalSearchParams<{ etapa?: string }>();

  const [recorrido, setRecorrido] = useState<RecorridoGeoJSON | null>(null);
  const [marcadores, setMarcadores] =
    useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [etapaSeleccionada, setEtapaSeleccionada] =
    useState<EtapaFeature | null>(null);
  const [etapaInfo, setEtapaInfo] = useState<EtapaInfo | null>(null);
  const [gpsActivo, setGpsActivo] = useState(false);
  const [permisoGPS, setPermisoGPS] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [etapasConMarcadores, setEtapasConMarcadores] = useState<Set<string>>(
    new Set(),
  );

  const [filtros, setFiltros] = useState<FiltrosActivos>({
    albergues: true,
    negocios: false,
    infraestructura: false,
    descanso: false,
    patrimonio: false,
  });

  const [filtrosPendientes, setFiltrosPendientes] =
    useState<FiltrosActivos>(filtros);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermisoGPS(status === "granted");
    })();
  }, []);

  useEffect(() => {
    const cargarRecorrido = async () => {
      try {
        const res = await fetch(`${API_URL}/data/camino-etapas.geojson`);
        if (!res.ok) throw new Error("Error cargando recorrido");
        const data: RecorridoGeoJSON = await res.json();
        setRecorrido(data);

        if (etapaSlug && data.features) {
          const feature = data.features.find(
            (f) => f.properties.slug === etapaSlug,
          );
          if (feature) mostrarPanel(feature);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    cargarRecorrido();
  }, []);

  const tiposActivos = useCallback((): string[] => {
    const tipos: string[] = [];
    GRUPOS_FILTROS.forEach((grupo) => {
      if (filtros[grupo.key as GrupoKey]) {
        tipos.push(...grupo.tipos);
      }
    });
    return tipos;
  }, [filtros]);

  useEffect(() => {
    if (!etapaSeleccionada) return;
    const cargarMarcadores = async () => {
      try {
        const slug = etapaSeleccionada.properties.slug;
        const res = await fetch(`${API_URL}/api/mapa/etapa/${slug}`);
        if (!res.ok) return;
        const data = await res.json();

        const tipos = tiposActivos();
        const features = [
          ...(filtros.albergues ? (data.albergues?.features ?? []) : []),
          ...(filtros.negocios ? (data.negocios?.features ?? []) : []),
          ...(data.pois?.features ?? []).filter((f: any) =>
            tipos.includes(f.properties?.tipo),
          ),
        ];

        setMarcadores({ type: "FeatureCollection", features });
      } catch {
        // silencioso
      }
    };
    cargarMarcadores();
  }, [etapaSeleccionada, filtros]);

  const mostrarPanel = useCallback(
    async (etapa: EtapaFeature) => {
      setEtapaSeleccionada(etapa);
      setEtapaInfo(null);

      Animated.spring(panelAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();

      const coords = etapa.geometry.coordinates;
      const mid = coords[Math.floor(coords.length / 2)];
      cameraRef.current?.setCamera({
        centerCoordinate: [mid[0], mid[1]],
        zoomLevel: 9,
        animationDuration: 800,
      });

      try {
        const res = await fetch(
          `${API_URL}/api/etapas/${etapa.properties.slug}/info`,
        );
        if (res.ok) {
          const data = await res.json();
          setEtapaInfo(data.etapa);
        }
      } catch {
        // silencioso
      }
    },
    [panelAnim],
  );

  const cargarMarcadoresPorZoom = useCallback(
    async (zoom: number, bounds: { ne: number[]; sw: number[] }) => {
      if (zoom < 9 || !recorrido) return;

      const etapasVisibles = recorrido.features.filter((f) => {
        const coords = f.geometry.coordinates;
        const mid = coords[Math.floor(coords.length / 2)];
        return (
          mid[0] >= bounds.sw[0] &&
          mid[0] <= bounds.ne[0] &&
          mid[1] >= bounds.sw[1] &&
          mid[1] <= bounds.ne[1]
        );
      });

      const tipos = tiposActivos();

      for (const etapa of etapasVisibles) {
        const slug = etapa.properties.slug;
        if (etapasConMarcadores.has(slug)) continue;

        try {
          const res = await fetch(`${API_URL}/api/mapa/etapa/${slug}`);
          if (!res.ok) continue;
          const data = await res.json();

          const nuevos = [
            ...(filtros.albergues ? (data.albergues?.features ?? []) : []),
            ...(filtros.negocios ? (data.negocios?.features ?? []) : []),
            ...(data.pois?.features ?? []).filter((f: any) =>
              tipos.includes(f.properties?.tipo),
            ),
          ];

          setMarcadores((prev) => ({
            type: "FeatureCollection",
            features: [
              ...(prev?.features ?? []).filter(
                (f) =>
                  !nuevos.find((n) => n.properties?.id === f.properties?.id),
              ),
              ...nuevos,
            ],
          }));

          setEtapasConMarcadores((prev) => new Set([...prev, slug]));
        } catch {
          // silencioso
        }
      }
    },
    [recorrido, filtros, etapasConMarcadores, tiposActivos],
  );

  const cerrarPanel = useCallback(() => {
    Animated.spring(panelAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start(() => {
      setEtapaSeleccionada(null);
      setEtapaInfo(null);
    });
  }, [panelAnim]);

  const aplicarFiltros = () => {
    setFiltros(filtrosPendientes);
    setEtapasConMarcadores(new Set());
    setMarcadores(null);
    setMostrarFiltros(false);
  };

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const centrarEnPosicion = async () => {
    let tienePermiso = permisoGPS;
    if (!tienePermiso) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      setPermisoGPS(true);
      tienePermiso = true;
    }
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setGpsActivo(true);
      cameraRef.current?.setCamera({
        centerCoordinate: [loc.coords.longitude, loc.coords.latitude],
        zoomLevel: 13,
        animationMode: "flyTo",
        animationDuration: 1000,
      });
    } catch {
      setGpsActivo(true);
    }
  };

  const volverAlCamino = () => {
    setGpsActivo(false);
    cerrarPanel();
    cameraRef.current?.setCamera({
      centerCoordinate: CAMINO_BOUNDS.center,
      zoomLevel: CAMINO_BOUNDS.zoom,
      animationDuration: 800,
    });
  };

  const geojsonCompleto: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: (recorrido?.features ?? []) as unknown as GeoJSON.Feature[],
  };

  const marcadoresAlbergues: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: (marcadores?.features ?? []).filter(
      (f) => f.properties?._layer === "albergue",
    ),
  };

  const marcadoresPois: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: (marcadores?.features ?? []).filter(
      (f) => f.properties?._layer === "poi",
    ),
  };

  const marcadoresNegocios: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: (marcadores?.features ?? []).filter(
      (f) => f.properties?._layer === "negocio",
    ),
  };

  const numFiltrosActivos = Object.values(filtros).filter(Boolean).length;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C8A96E" />
        <Text style={styles.loadingText}>Cargando el Camino...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No se pudo cargar el mapa</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => setError(false)}
        >
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/outdoors-v12"
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled
        compassPosition={{ top: 100, right: 16 }}
        onPress={cerrarPanel}
        onRegionDidChange={async (feature) => {
          const zoom = feature.properties.zoomLevel;
          const bounds = feature.properties.visibleBounds;
          if (!bounds) return;
          await cargarMarcadoresPorZoom(zoom, {
            ne: bounds[0] as number[],
            sw: bounds[1] as number[],
          });
        }}
      >
        <Camera
          ref={cameraRef}
          centerCoordinate={CAMINO_BOUNDS.center}
          zoomLevel={CAMINO_BOUNDS.zoom}
          animationMode="flyTo"
          animationDuration={1200}
        />

        {gpsActivo && permisoGPS && (
          <UserLocation visible renderMode={UserLocationRenderMode.Normal} />
        )}

        {(recorrido?.features.length ?? 0) > 0 && (
          <ShapeSource
            id="camino-completo"
            shape={geojsonCompleto}
            onPress={(e) => {
              const feature = e.features?.[0] as unknown as EtapaFeature;
              if (feature?.properties?.slug) mostrarPanel(feature);
            }}
          >
            <LineLayer
              id="camino-borde"
              style={{
                lineColor: "#8B6914",
                lineWidth: 6,
                lineOpacity: 0.4,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            <LineLayer
              id="camino-linea"
              style={{
                lineColor: "#F5C842",
                lineWidth: 4,
                lineOpacity: 1,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </ShapeSource>
        )}

        {etapaSeleccionada && (
          <ShapeSource
            id="etapa-highlight"
            shape={{
              type: "FeatureCollection",
              features: [etapaSeleccionada as unknown as GeoJSON.Feature],
            }}
          >
            <LineLayer
              id="etapa-highlight-linea"
              style={{
                lineColor: "#FF6B35",
                lineWidth: 5,
                lineOpacity: 1,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </ShapeSource>
        )}

        {filtros.albergues && marcadoresAlbergues.features.length > 0 && (
          <ShapeSource
            id="albergues-markers"
            shape={marcadoresAlbergues}
            onPress={(e) => {
              const props = e.features?.[0]?.properties;
              if (props?.slug)
                router.push(`/(public)/albergues/${props.slug}` as any);
            }}
          >
            <CircleLayer
              id="albergues-circle"
              minZoomLevel={9}
              style={{
                circleRadius: 7,
                circleColor: "#2D5016",
                circleStrokeWidth: 2,
                circleStrokeColor: "#fff",
                circleOpacity: 0.9,
              }}
            />
          </ShapeSource>
        )}

        {marcadoresPois.features.length > 0 && (
          <ShapeSource id="pois-markers" shape={marcadoresPois}>
            <CircleLayer
              id="pois-circle"
              minZoomLevel={11}
              style={{
                circleRadius: 5,
                circleColor: "#C8A96E",
                circleStrokeWidth: 1.5,
                circleStrokeColor: "#fff",
                circleOpacity: 0.85,
              }}
            />
          </ShapeSource>
        )}

        {filtros.negocios && marcadoresNegocios.features.length > 0 && (
          <ShapeSource
            id="negocios-markers"
            shape={marcadoresNegocios}
            onPress={(e) => {
              const props = e.features?.[0]?.properties;
              if (props?.slug)
                router.push(`/(public)/negocios/${props.slug}` as any);
            }}
          >
            <CircleLayer
              id="negocios-circle"
              minZoomLevel={10}
              style={{
                circleRadius: 8,
                circleColor: "#C8622A",
                circleStrokeWidth: 2,
                circleStrokeColor: "#fff",
                circleOpacity: 0.95,
              }}
            />
          </ShapeSource>
        )}
      </MapView>

      {/* Botones flotantes GPS */}
      <View style={styles.botonesFlotantes}>
        <TouchableOpacity
          style={[styles.botonFlotante, gpsActivo && styles.botonActivo]}
          onPress={gpsActivo ? volverAlCamino : centrarEnPosicion}
        >
          <Text style={styles.botonIcono}>{gpsActivo ? "⊙" : "◎"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botonFlotante} onPress={volverAlCamino}>
          <Text style={styles.botonIcono}>⊞</Text>
        </TouchableOpacity>
      </View>

      {/* Botón filtros */}
      <TouchableOpacity
        style={styles.botonFiltros}
        onPress={() => {
          setFiltrosPendientes(filtros);
          setMostrarFiltros(true);
        }}
      >
        <Text style={styles.botonFiltrosIcono}>⚙️</Text>
        <Text style={styles.botonFiltrosTexto}>Filtros</Text>
        {numFiltrosActivos > 0 && (
          <View style={styles.filtroBadge}>
            <Text style={styles.filtroBadgeTexto}>{numFiltrosActivos}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Panel etapa */}
      {etapaSeleccionada && (
        <Animated.View
          style={[
            styles.panel,
            { transform: [{ translateY: panelTranslateY }] },
          ]}
        >
          <View style={styles.panelHandle} />
          <View style={styles.panelHeader}>
            <View style={styles.panelEtapaBadge}>
              <Text style={styles.panelEtapaNum}>
                Etapa {etapaSeleccionada.properties.numero}
              </Text>
              {etapaInfo?.es_variante && (
                <View style={styles.varianteBadge}>
                  <Text style={styles.varianteText}>Variante</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={cerrarPanel} style={styles.cerrarBtn}>
              <Text style={styles.cerrarText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.panelNombre}>
            {etapaInfo?.nombre ??
              `Etapa ${etapaSeleccionada.properties.numero}`}
          </Text>

          {(etapaInfo?.inicio_nombre || etapaInfo?.fin_nombre) && (
            <Text style={styles.panelRuta}>
              {etapaInfo.inicio_nombre} → {etapaInfo.fin_nombre}
            </Text>
          )}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValor}>
                {etapaInfo?.distancia_km ? `${etapaInfo.distancia_km} km` : "—"}
              </Text>
              <Text style={styles.statLabel}>Distancia</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValor}>
                {etapaInfo?.desnivel_pos ? `+${etapaInfo.desnivel_pos} m` : "—"}
              </Text>
              <Text style={styles.statLabel}>Subida</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValor}>
                {etapaInfo?.desnivel_neg ? `-${etapaInfo.desnivel_neg} m` : "—"}
              </Text>
              <Text style={styles.statLabel}>Bajada</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() =>
              router.push(
                `/(public)/etapas/${etapaSeleccionada.properties.slug}` as any,
              )
            }
          >
            <Text style={styles.ctaText}>Ver ficha completa</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Modal filtros */}
      <Modal
        visible={mostrarFiltros}
        transparent
        animationType="slide"
        onRequestClose={() => setMostrarFiltros(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMostrarFiltros(false)}
        />
        <View style={styles.filtrosSheet}>
          <View style={styles.filtrosHandle} />
          <Text style={styles.filtrosTitulo}>Filtros del mapa</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.filtrosGrupoTitulo}>Alojamiento</Text>
            <TouchableOpacity
              style={[
                styles.filtroItem,
                filtrosPendientes.albergues && styles.filtroItemActivo,
              ]}
              onPress={() =>
                setFiltrosPendientes((p) => ({ ...p, albergues: !p.albergues }))
              }
            >
              <Text style={styles.filtroItemEmoji}>🏠</Text>
              <Text style={styles.filtroItemLabel}>Albergues</Text>
              <View
                style={[
                  styles.filtroToggle,
                  filtrosPendientes.albergues && styles.filtroToggleActivo,
                ]}
              >
                {filtrosPendientes.albergues && (
                  <Text style={styles.filtroToggleCheck}>✓</Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filtroItem,
                filtrosPendientes.negocios && styles.filtroItemActivo,
              ]}
              onPress={() =>
                setFiltrosPendientes((p) => ({ ...p, negocios: !p.negocios }))
              }
            >
              <Text style={styles.filtroItemEmoji}>🏪</Text>
              <Text style={styles.filtroItemLabel}>Negocios del Camino</Text>
              <View
                style={[
                  styles.filtroToggle,
                  filtrosPendientes.negocios && styles.filtroToggleActivo,
                ]}
              >
                {filtrosPendientes.negocios && (
                  <Text style={styles.filtroToggleCheck}>✓</Text>
                )}
              </View>
            </TouchableOpacity>

            <Text style={[styles.filtrosGrupoTitulo, { marginTop: 16 }]}>
              Puntos de interés
            </Text>
            {GRUPOS_FILTROS.map((grupo) => (
              <TouchableOpacity
                key={grupo.key}
                style={[
                  styles.filtroItem,
                  filtrosPendientes[grupo.key as GrupoKey] &&
                    styles.filtroItemActivo,
                ]}
                onPress={() =>
                  setFiltrosPendientes((p) => ({
                    ...p,
                    [grupo.key]: !p[grupo.key as GrupoKey],
                  }))
                }
              >
                <Text style={styles.filtroItemEmoji}>{grupo.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.filtroItemLabel}>{grupo.label}</Text>
                  <Text style={styles.filtroItemSub}>
                    {grupo.tipos.map((tp) => TIPO_EMOJI[tp] ?? "").join(" ")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.filtroToggle,
                    filtrosPendientes[grupo.key as GrupoKey] &&
                      styles.filtroToggleActivo,
                  ]}
                >
                  {filtrosPendientes[grupo.key as GrupoKey] && (
                    <Text style={styles.filtroToggleCheck}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.aplicarBtn} onPress={aplicarFiltros}>
            <Text style={styles.aplicarBtnTexto}>Aplicar filtros</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a1a" },
  map: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F0E8",
    gap: 16,
  },
  loadingText: { fontSize: 15, color: "#8B6914", marginTop: 8 },
  errorText: { fontSize: 15, color: "#666" },
  retryBtn: {
    backgroundColor: "#C8A96E",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: { color: "#fff", fontWeight: "600" },
  botonesFlotantes: {
    position: "absolute",
    top: 100,
    right: 16,
    gap: 10,
  },
  botonFlotante: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  botonActivo: { backgroundColor: "#F5C842" },
  botonIcono: { fontSize: 20, color: "#333" },
  botonFiltros: {
    position: "absolute",
    bottom: 120,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  botonFiltrosIcono: { fontSize: 16 },
  botonFiltrosTexto: { fontSize: 13, fontWeight: "600", color: "#333" },
  filtroBadge: {
    backgroundColor: "#C8622A",
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  filtroBadgeTexto: { fontSize: 10, color: "#fff", fontWeight: "700" },
  panel: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    backgroundColor: "#FEFCF8",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  panelHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDD",
    alignSelf: "center",
    marginBottom: 16,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  panelEtapaBadge: { flexDirection: "row", alignItems: "center", gap: 8 },
  panelEtapaNum: {
    fontSize: 12,
    fontWeight: "700",
    color: "#C8A96E",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  varianteBadge: {
    backgroundColor: "#E8F4E8",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  varianteText: { fontSize: 10, color: "#2D5016", fontWeight: "600" },
  cerrarBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F0EDE8",
    alignItems: "center",
    justifyContent: "center",
  },
  cerrarText: { fontSize: 12, color: "#666" },
  panelNombre: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
    lineHeight: 22,
  },
  panelRuta: { fontSize: 13, color: "#888", marginBottom: 16 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F0E8",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  stat: { flex: 1, alignItems: "center" },
  statValor: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: { width: 1, height: 32, backgroundColor: "#DDD" },
  ctaBtn: {
    backgroundColor: "#2D5016",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  filtrosSheet: {
    backgroundColor: "#FEFCF8",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
    maxHeight: "75%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  filtrosHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDD",
    alignSelf: "center",
    marginBottom: 16,
  },
  filtrosTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  filtrosGrupoTitulo: {
    fontSize: 11,
    fontWeight: "700",
    color: "#C8A96E",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  filtroItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E8E0D0",
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  filtroItemActivo: {
    borderColor: "#2D5016",
    backgroundColor: "#F0F7EE",
  },
  filtroItemEmoji: { fontSize: 22 },
  filtroItemLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C1F0E",
    flex: 1,
  },
  filtroItemSub: {
    fontSize: 12,
    color: "#8B7355",
    marginTop: 2,
  },
  filtroToggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#DDD",
    alignItems: "center",
    justifyContent: "center",
  },
  filtroToggleActivo: {
    backgroundColor: "#2D5016",
    borderColor: "#2D5016",
  },
  filtroToggleCheck: { fontSize: 12, color: "#fff", fontWeight: "700" },
  aplicarBtn: {
    backgroundColor: "#2D5016",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  aplicarBtnTexto: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
