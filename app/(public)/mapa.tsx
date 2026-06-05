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
  SymbolLayer,
  CircleLayer,
  UserLocation,
  UserLocationRenderMode,
  UserTrackingMode,
} from "@rnmapbox/maps";
import * as Location from "expo-location";
import { useLocalSearchParams, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://camino-api.onrender.com";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "");

const CAMINO_BOUNDS = {
  center: [-3.5, 42.6] as [number, number],
  zoom: 6,
};

type EtapaFeature = {
  type: "Feature";
  properties: { numero: number; slug: string; color: string };
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
    labelKey: "mapa.infraestructura",
    emoji: "🏗️",
    tipos: ["restaurante", "supermercado", "farmacia", "medico"],
    subEmojis: "🍽️ 🛒 💊 🏥",
  },
  {
    key: "descanso",
    labelKey: "mapa.descanso",
    emoji: "💧",
    tipos: ["fuente", "area_descanso", "mirador"],
    subEmojis: "💧 🌿 🔭",
  },
  {
    key: "patrimonio",
    labelKey: "mapa.patrimonio",
    emoji: "⛪",
    tipos: ["iglesia", "capilla", "cruceiro", "monumento", "yacimiento"],
    subEmojis: "⛪ ✝️ 🏛️ 🏺",
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

export default function MapaScreen() {
  const { t } = useTranslation();
  const cameraRef = useRef<Camera>(null);
  const panelAnim = useRef(new Animated.Value(0)).current;
  const filtrosAnim = useRef(new Animated.Value(0)).current;
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
    negocios: true,
    infraestructura: false,
    descanso: false,
    patrimonio: false,
  });
  const [filtrosPendientes, setFiltrosPendientes] =
    useState<FiltrosActivos>(filtros);

  const [albergueSeleccionado, setAlbergueSeleccionado] = useState<{
    nombre: string;
    localidad: string;
    slug: string;
    lat: number;
    lng: number;
  } | null>(null);

  const [poiSeleccionado, setPoiSeleccionado] = useState<{
    nombre: string;
    tipo: string;
    lat: number;
    lng: number;
  } | null>(null);

  // Estado adicional para el modo seguimiento
  const [modoSeguimiento, setModoSeguimiento] = useState(false);
  const headingRef = useRef<number>(0);
  const [headingSmoothed, setHeadingSmoothed] = useState<number>(0);

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
      setModoSeguimiento(true);
      cameraRef.current?.setCamera({
        centerCoordinate: [loc.coords.longitude, loc.coords.latitude],
        zoomLevel: 15,
        animationMode: "flyTo",
        animationDuration: 1000,
      });
    } catch {
      setGpsActivo(true);
    }
  };

  useEffect(() => {
    if (!modoSeguimiento || !permisoGPS) return;
    const sub = Location.watchHeadingAsync((heading) => {
      // Filtro exponencial — α=0.15 suaviza sin lag excesivo
      headingRef.current =
        headingRef.current * 0.85 + heading.trueHeading * 0.15;
      setHeadingSmoothed(headingRef.current);
    });
    return () => {
      sub.then((s) => s.remove());
    };
  }, [modoSeguimiento, permisoGPS]);

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
        if (!res.ok) throw new Error();
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
      if (filtros[grupo.key as GrupoKey]) tipos.push(...grupo.tipos);
    });
    return tipos;
  }, [filtros]);

  useEffect(() => {
    if (!etapaSeleccionada) return;
    const cargar = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/mapa/etapa/${etapaSeleccionada.properties.slug}`,
        );
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
      } catch {}
    };
    cargar();
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
      } catch {}
    },
    [panelAnim],
  );

  const cargarMarcadoresPorZoom = useCallback(
    async (zoom: number, bounds: { ne: number[]; sw: number[] }) => {
      if (zoom < 9 || !recorrido) return;
      const tipos = tiposActivos();
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
      for (const etapa of etapasVisibles) {
        const slug = etapa.properties.slug;
        if (etapasConMarcadores.has(slug)) continue;
        try {
          const res = await fetch(`${API_URL}/api/mapa/etapa/${slug}`);
          if (!res.ok) {
            console.warn("[mapa] Error HTTP cargando etapa", slug, res.status);
            continue;
          }
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
        } catch (err) {
          console.warn("[mapa] Excepción cargando etapa", slug, err);
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

  const abrirFiltros = () => {
    setFiltrosPendientes(filtros);
    setMostrarFiltros(true);
    Animated.spring(filtrosAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const cerrarFiltros = () => {
    Animated.spring(filtrosAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start(() => setMostrarFiltros(false));
  };

  const aplicarFiltros = () => {
    setFiltros(filtrosPendientes);
    setEtapasConMarcadores(new Set());
    setMarcadores(null);
    cerrarFiltros();
  };

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const filtrosTranslateY = filtrosAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  const volverAlCamino = () => {
    setGpsActivo(false);
    cerrarPanel();
    setModoSeguimiento(false);
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
        <Text style={styles.loadingText}>{t("mapa.cargando")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t("mapa.error_carga")}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => setError(false)}
        >
          <Text style={styles.retryText}>{t("mapa.reintentar")}</Text>
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
          followUserLocation={modoSeguimiento}
          followUserMode={
            modoSeguimiento ? UserTrackingMode.FollowWithCourse : undefined
          }
          followZoomLevel={modoSeguimiento ? 15 : undefined}
          followHeading={modoSeguimiento ? headingSmoothed : undefined}
        />
        {gpsActivo && permisoGPS && (
          <UserLocation visible renderMode={UserLocationRenderMode.Native} />
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

        {/* Albergues — 3 niveles: sin registrar (gris), registrado (verde), pro (dorado) */}
        {filtros.albergues && marcadoresAlbergues.features.length > 0 && (
          <ShapeSource
            id="albergues-markers"
            shape={marcadoresAlbergues}
            onPress={(e) => {
              const props = e.features?.[0]?.properties;
              const coords = (e.features?.[0]?.geometry as any)?.coordinates;
              if (props?.slug && coords) {
                setAlbergueSeleccionado({
                  nombre: props.nombre,
                  localidad: props.localidad,
                  slug: props.slug,
                  lng: coords[0],
                  lat: coords[1],
                });
              }
            }}
          >
            {/* Halo dorado para Pro */}
            <CircleLayer
              id="albergues-pro-halo"
              minZoomLevel={9}
              style={{
                circleRadius: 18,
                circleColor: "#F5C842",
                circleOpacity: [
                  "case",
                  ["==", ["get", "plan"], "pro"],
                  0.25,
                  0,
                ] as any,
                circleBlur: 0.5,
              }}
            />
            {/* Círculo de fondo — 3 niveles */}
            <CircleLayer
              id="albergues-circle"
              minZoomLevel={9}
              style={{
                circleRadius: [
                  "case",
                  ["==", ["get", "plan"], "pro"],
                  14,
                  ["==", ["get", "registrado"], true],
                  12,
                  10,
                ] as any,
                circleColor: [
                  "case",
                  ["==", ["get", "plan"], "pro"],
                  "#F5C842",
                  ["==", ["get", "registrado"], true],
                  "#2D5016",
                  "#9CA3AF",
                ] as any,
                circleStrokeWidth: 2,
                circleStrokeColor: "#fff",
                circleOpacity: [
                  "case",
                  ["==", ["get", "plan"], "pro"],
                  1,
                  ["==", ["get", "registrado"], true],
                  0.95,
                  0.5,
                ] as any,
              }}
            />
            {/* Icono casa encima */}
            <SymbolLayer
              id="albergues-icon"
              minZoomLevel={9}
              style={{
                textField: "🏠",
                textSize: [
                  "case",
                  ["==", ["get", "plan"], "pro"],
                  14,
                  12,
                ] as any,
                textAnchor: "center",
                textAllowOverlap: true,
                textIgnorePlacement: true,
              }}
            />
          </ShapeSource>
        )}
        {/* POIs */}
        {marcadoresPois.features.length > 0 && (
          <ShapeSource
            id="pois-markers"
            shape={marcadoresPois}
            onPress={(e) => {
              const props = e.features?.[0]?.properties;
              const coords = (e.features?.[0]?.geometry as any)?.coordinates;
              if (props && coords) {
                setPoiSeleccionado({
                  nombre: props.nombre,
                  tipo: props.tipo,
                  lng: coords[0],
                  lat: coords[1],
                });
              }
            }}
          >
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

        {/* Negocios */}
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

      {/* Botones GPS */}
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
      <TouchableOpacity style={styles.botonFiltros} onPress={abrirFiltros}>
        <Text style={styles.botonFiltrosIcono}>⚙️</Text>
        <Text style={styles.botonFiltrosTexto}>{t("mapa.filtros")}</Text>
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
                {t("mapa.etapa")} {etapaSeleccionada.properties.numero}
              </Text>
              {etapaInfo?.es_variante && (
                <View style={styles.varianteBadge}>
                  <Text style={styles.varianteText}>{t("mapa.variante")}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={cerrarPanel} style={styles.cerrarBtn}>
              <Text style={styles.cerrarText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.panelNombre}>
            {etapaInfo?.nombre ??
              `${t("mapa.etapa")} ${etapaSeleccionada.properties.numero}`}
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
              <Text style={styles.statLabel}>{t("mapa.distancia")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValor}>
                {etapaInfo?.desnivel_pos ? `+${etapaInfo.desnivel_pos} m` : "—"}
              </Text>
              <Text style={styles.statLabel}>{t("mapa.subida")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValor}>
                {etapaInfo?.desnivel_neg ? `-${etapaInfo.desnivel_neg} m` : "—"}
              </Text>
              <Text style={styles.statLabel}>{t("mapa.bajada")}</Text>
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
            <Text style={styles.ctaText}>{t("mapa.ver_ficha")}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {albergueSeleccionado && (
        <View style={styles.popupAlbergue}>
          <TouchableOpacity
            style={styles.popupCerrar}
            onPress={() => setAlbergueSeleccionado(null)}
          >
            <Text style={styles.popupCerrarText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.popupNombre}>{albergueSeleccionado.nombre}</Text>
          <Text style={styles.popupLocalidad}>
            {albergueSeleccionado.localidad}
          </Text>
          <View style={styles.popupBtns}>
            <TouchableOpacity
              style={styles.popupBtnFicha}
              onPress={() => {
                setAlbergueSeleccionado(null);
                router.push(
                  `/(public)/albergues/${albergueSeleccionado.slug}` as any,
                );
              }}
            >
              <Text style={styles.popupBtnFichaText}>
                {t("mapa.ver_ficha")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.popupBtnNav}
              onPress={() => {
                const { lat, lng } = albergueSeleccionado;
                Linking.openURL(
                  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`,
                );
              }}
            >
              <Text style={styles.popupBtnNavText}>🧭 Ir</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {poiSeleccionado && (
        <View style={styles.popupAlbergue}>
          <TouchableOpacity
            style={styles.popupCerrar}
            onPress={() => setPoiSeleccionado(null)}
          >
            <Text style={styles.popupCerrarText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.popupNombre}>{poiSeleccionado.nombre}</Text>
          <Text style={styles.popupLocalidad}>
            {t(`etapa.pois.tipos.${poiSeleccionado.tipo}`) ??
              poiSeleccionado.tipo}
          </Text>
          <TouchableOpacity
            style={[styles.popupBtnNav, { alignSelf: "stretch" }]}
            onPress={() => {
              const { lat, lng } = poiSeleccionado;
              Linking.openURL(
                `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`,
              );
            }}
          >
            <Text style={styles.popupBtnNavText}>🧭 Cómo llegar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom sheet filtros — sin modal intrusivo */}
      {mostrarFiltros && (
        <>
          <TouchableOpacity
            style={styles.filtrosOverlay}
            activeOpacity={1}
            onPress={cerrarFiltros}
          />
          <Animated.View
            style={[
              styles.filtrosSheet,
              { transform: [{ translateY: filtrosTranslateY }] },
            ]}
          >
            <View style={styles.filtrosHandle} />
            <Text style={styles.filtrosTitulo}>{t("mapa.filtros")}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Alojamiento */}
              <Text style={styles.filtrosGrupoTitulo}>
                {t("mapa.alojamiento")}
              </Text>

              <TouchableOpacity
                style={[
                  styles.filtroItem,
                  filtrosPendientes.albergues && styles.filtroItemActivo,
                ]}
                onPress={() =>
                  setFiltrosPendientes((p) => ({
                    ...p,
                    albergues: !p.albergues,
                  }))
                }
              >
                <Text style={styles.filtroItemEmoji}>🏠</Text>
                <Text style={styles.filtroItemLabel}>
                  {t("mapa.albergues")}
                </Text>
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
                <Text style={styles.filtroItemLabel}>{t("mapa.negocios")}</Text>
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

              {/* POIs */}
              <Text style={[styles.filtrosGrupoTitulo, { marginTop: 16 }]}>
                {t("mapa.puntos_interes")}
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
                    <Text style={styles.filtroItemLabel}>
                      {t(grupo.labelKey)}
                    </Text>
                    <Text style={styles.filtroItemSub}>{grupo.subEmojis}</Text>
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

            <TouchableOpacity
              style={styles.aplicarBtn}
              onPress={aplicarFiltros}
            >
              <Text style={styles.aplicarBtnTexto}>{t("mapa.filtros")} ✓</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
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
  filtrosOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  filtrosSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FEFCF8",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
    maxHeight: "55%",
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
  filtroItemActivo: { borderColor: "#2D5016", backgroundColor: "#F0F7EE" },
  filtroItemEmoji: { fontSize: 22 },
  filtroItemLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C1F0E",
    flex: 1,
  },
  filtroItemSub: { fontSize: 12, color: "#8B7355", marginTop: 2 },
  filtroToggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#DDD",
    alignItems: "center",
    justifyContent: "center",
  },
  filtroToggleActivo: { backgroundColor: "#2D5016", borderColor: "#2D5016" },
  filtroToggleCheck: { fontSize: 12, color: "#fff", fontWeight: "700" },
  aplicarBtn: {
    backgroundColor: "#2D5016",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  aplicarBtnTexto: { fontSize: 15, fontWeight: "700", color: "#fff" },

  popupAlbergue: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: "#FEFCF8",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  popupCerrar: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F0EDE8",
    alignItems: "center",
    justifyContent: "center",
  },
  popupCerrarText: { fontSize: 11, color: "#666" },
  popupNombre: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
    paddingRight: 24,
  },
  popupLocalidad: { fontSize: 12, color: "#888", marginBottom: 12 },
  popupBtns: { flexDirection: "row", gap: 8 },
  popupBtnFicha: {
    flex: 1,
    backgroundColor: "#2D5016",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  popupBtnFichaText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  popupBtnNav: {
    backgroundColor: "#F5C842",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  popupBtnNavText: { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
});
