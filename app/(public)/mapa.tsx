// 📄 app/(public)/mapa.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
  ScrollView,
} from "react-native";
import Mapbox, {
  MapView,
  Camera,
  ShapeSource,
  LineLayer,
  UserLocation,
  UserLocationRenderMode,
  UserTrackingMode,
} from "@rnmapbox/maps";
import { useTranslation } from "react-i18next";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://camino-api.onrender.com";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "");

// Coordenadas del Camino Francés — Saint-Jean → Santiago
const CAMINO_BOUNDS = {
  center: [-3.5, 42.6] as [number, number],
  zoom: 6,
};

type EtapaFeature = {
  type: "Feature";
  id: number;
  geometry: { type: "LineString"; coordinates: number[][] };
  properties: {
    etapa_id: number;
    numero: number;
    nombre: string;
    slug: string;
    es_variante: boolean;
    distancia_km: number;
    desnivel_pos: number;
    desnivel_neg: number;
    centro_lat: number;
    centro_lng: number;
    inicio: string | null;
    fin: string | null;
  };
};

type RecorridoGeoJSON = {
  type: "FeatureCollection";
  features: EtapaFeature[];
  meta: { total_etapas: number; total_waypoints: number };
};

type CapasVisibles = {
  albergues: boolean;
  pois: boolean;
  negocios: boolean;
};

export default function MapaScreen() {
  const { t } = useTranslation();
  const cameraRef = useRef<Camera>(null);
  const panelAnim = useRef(new Animated.Value(0)).current;

  const [recorrido, setRecorrido] = useState<RecorridoGeoJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [etapaSeleccionada, setEtapaSeleccionada] =
    useState<EtapaFeature | null>(null);
  const [gpsActivo, setGpsActivo] = useState(false);
  const [capas, setCapas] = useState<CapasVisibles>({
    albergues: true,
    pois: true,
    negocios: false,
  });

  // Cargar trazado completo
  useEffect(() => {
    const cargarRecorrido = async () => {
      try {
        const res = await fetch(`${API_URL}/api/mapa/recorrido-completo`);
        if (!res.ok) throw new Error("Error cargando recorrido");
        const data: RecorridoGeoJSON = await res.json();
        setRecorrido(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    cargarRecorrido();
  }, []);

  // Animar panel inferior
  const mostrarPanel = useCallback(
    (etapa: EtapaFeature) => {
      setEtapaSeleccionada(etapa);
      Animated.spring(panelAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
      // Centrar cámara en la etapa
      cameraRef.current?.setCamera({
        centerCoordinate: [
          etapa.properties.centro_lng,
          etapa.properties.centro_lat,
        ],
        zoomLevel: 9,
        animationDuration: 800,
      });
    },
    [panelAnim],
  );

  const cerrarPanel = useCallback(() => {
    Animated.spring(panelAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start(() => setEtapaSeleccionada(null));
  }, [panelAnim]);

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const toggleCapa = (capa: keyof CapasVisibles) => {
    setCapas((prev) => ({ ...prev, [capa]: !prev[capa] }));
  };

  const centrarEnPosicion = () => {
    setGpsActivo(true);
    // followUserLocation se controla via prop en <Camera>, no en setCamera
    // setGpsActivo(true) hace que Camera re-renderice con followUserLocation={true}
  };

  const volverAlCamino = () => {
    setGpsActivo(false);
    setEtapaSeleccionada(null);
    cerrarPanel();
    cameraRef.current?.setCamera({
      centerCoordinate: CAMINO_BOUNDS.center,
      zoomLevel: CAMINO_BOUNDS.zoom,
      animationDuration: 800,
    });
  };

  // Separar etapas principales de variantes
  const etapasPrincipales =
    recorrido?.features.filter((f) => !f.properties.es_variante) ?? [];
  const variantes =
    recorrido?.features.filter((f) => f.properties.es_variante) ?? [];

  const geojsonPrincipal: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: etapasPrincipales as unknown as GeoJSON.Feature[],
  };

  const geojsonVariantes: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: variantes as unknown as GeoJSON.Feature[],
  };

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
      >
        {gpsActivo ? (
          <Camera
            ref={cameraRef}
            followUserLocation
            followUserMode={UserTrackingMode.Follow}
            zoomLevel={12}
            animationMode="flyTo"
            animationDuration={1000}
          />
        ) : (
          <Camera
            ref={cameraRef}
            centerCoordinate={CAMINO_BOUNDS.center}
            zoomLevel={CAMINO_BOUNDS.zoom}
            animationMode="flyTo"
            animationDuration={1200}
          />
        )}

        {/* GPS del usuario */}
        {gpsActivo && (
          <UserLocation visible renderMode={UserLocationRenderMode.Normal} />
        )}

        {/* Trazado principal — línea amarilla */}
        {etapasPrincipales.length > 0 && (
          <ShapeSource
            id="camino-principal"
            shape={geojsonPrincipal}
            onPress={(e) => {
              const feature = e.features?.[0] as unknown as EtapaFeature;
              if (feature?.properties?.etapa_id) mostrarPanel(feature);
            }}
          >
            {/* Sombra/borde para legibilidad */}
            <LineLayer
              id="camino-principal-borde"
              style={{
                lineColor: "#8B6914",
                lineWidth: 6,
                lineOpacity: 0.4,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            {/* Línea amarilla principal */}
            <LineLayer
              id="camino-principal-linea"
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

        {/* Variantes — línea amarilla punteada más tenue */}
        {variantes.length > 0 && (
          <ShapeSource
            id="camino-variantes"
            shape={geojsonVariantes}
            onPress={(e) => {
              const feature = e.features?.[0] as unknown as EtapaFeature;
              if (feature?.properties?.etapa_id) mostrarPanel(feature);
            }}
          >
            <LineLayer
              id="camino-variantes-linea"
              style={{
                lineColor: "#F5C842",
                lineWidth: 2.5,
                lineOpacity: 0.65,
                lineCap: "round",
                lineJoin: "round",
                lineDasharray: [2, 3],
              }}
            />
          </ShapeSource>
        )}

        {/* Marcador etapa seleccionada */}
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
      </MapView>

      {/* Botones flotantes — esquina superior derecha */}
      <View style={styles.botonesFlotantes}>
        {/* GPS */}
        <TouchableOpacity
          style={[styles.botonFlotante, gpsActivo && styles.botonActivo]}
          onPress={gpsActivo ? volverAlCamino : centrarEnPosicion}
        >
          <Text style={styles.botonIcono}>{gpsActivo ? "⊙" : "◎"}</Text>
        </TouchableOpacity>

        {/* Volver vista completa */}
        <TouchableOpacity style={styles.botonFlotante} onPress={volverAlCamino}>
          <Text style={styles.botonIcono}>⊞</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros de capas — esquina inferior izquierda */}
      <View style={styles.filtrosContainer}>
        <TouchableOpacity
          style={[styles.filtroBtn, capas.albergues && styles.filtroActivo]}
          onPress={() => toggleCapa("albergues")}
        >
          <Text
            style={[
              styles.filtroText,
              capas.albergues && styles.filtroTextoActivo,
            ]}
          >
            Albergues
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filtroBtn, capas.pois && styles.filtroActivo]}
          onPress={() => toggleCapa("pois")}
        >
          <Text
            style={[styles.filtroText, capas.pois && styles.filtroTextoActivo]}
          >
            POIs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filtroBtn, capas.negocios && styles.filtroActivo]}
          onPress={() => toggleCapa("negocios")}
        >
          <Text
            style={[
              styles.filtroText,
              capas.negocios && styles.filtroTextoActivo,
            ]}
          >
            Negocios
          </Text>
        </TouchableOpacity>
      </View>

      {/* Panel inferior — detalle de etapa */}
      {etapaSeleccionada && (
        <Animated.View
          style={[
            styles.panel,
            { transform: [{ translateY: panelTranslateY }] },
          ]}
        >
          {/* Handle */}
          <View style={styles.panelHandle} />

          <View style={styles.panelHeader}>
            <View style={styles.panelEtapaBadge}>
              <Text style={styles.panelEtapaNum}>
                Etapa {etapaSeleccionada.properties.numero}
              </Text>
              {etapaSeleccionada.properties.es_variante && (
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
            {etapaSeleccionada.properties.nombre}
          </Text>

          {(etapaSeleccionada.properties.inicio ||
            etapaSeleccionada.properties.fin) && (
            <Text style={styles.panelRuta}>
              {etapaSeleccionada.properties.inicio} →{" "}
              {etapaSeleccionada.properties.fin}
            </Text>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValor}>
                {etapaSeleccionada.properties.distancia_km
                  ? `${etapaSeleccionada.properties.distancia_km} km`
                  : "—"}
              </Text>
              <Text style={styles.statLabel}>Distancia</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValor}>
                {etapaSeleccionada.properties.desnivel_pos
                  ? `+${etapaSeleccionada.properties.desnivel_pos} m`
                  : "—"}
              </Text>
              <Text style={styles.statLabel}>Subida</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValor}>
                {etapaSeleccionada.properties.desnivel_neg
                  ? `-${etapaSeleccionada.properties.desnivel_neg} m`
                  : "—"}
              </Text>
              <Text style={styles.statLabel}>Bajada</Text>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity style={styles.ctaBtn}>
            <Text style={styles.ctaText}>Ver ficha completa</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F0E8",
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: "#8B6914",
    fontFamily: "System",
    marginTop: 8,
  },
  errorText: {
    fontSize: 15,
    color: "#666",
  },
  retryBtn: {
    backgroundColor: "#C8A96E",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },

  // Botones flotantes
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
  botonActivo: {
    backgroundColor: "#F5C842",
  },
  botonIcono: {
    fontSize: 20,
    color: "#333",
  },

  // Filtros
  filtrosContainer: {
    position: "absolute",
    bottom: 120,
    left: 16,
    flexDirection: "row",
    gap: 8,
  },
  filtroBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  filtroActivo: {
    backgroundColor: "#2D5016",
  },
  filtroText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  filtroTextoActivo: {
    color: "#fff",
  },

  // Panel inferior
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
  panelEtapaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
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
  varianteText: {
    fontSize: 10,
    color: "#2D5016",
    fontWeight: "600",
  },
  cerrarBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F0EDE8",
    alignItems: "center",
    justifyContent: "center",
  },
  cerrarText: {
    fontSize: 12,
    color: "#666",
  },
  panelNombre: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
    lineHeight: 22,
  },
  panelRuta: {
    fontSize: 13,
    color: "#888",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F0E8",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
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
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#DDD",
  },
  ctaBtn: {
    backgroundColor: "#2D5016",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  ctaText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
