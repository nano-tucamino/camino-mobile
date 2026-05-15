// 📄 app/(public)/albergues/index.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
  StatusBar,
  Pressable,
  Modal,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { apiGet } from "@/lib/api";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TipoAlbergue = "municipal" | "privado" | "parroquial" | "asociacion";
type OcupacionAlbergue = "libre" | "casi_lleno" | "completo";
type PlanAlbergue = "free" | "plus" | null;

interface Albergue {
  id: string;
  slug: string;
  nombre: string;
  localidad: string | null;
  tipo: TipoAlbergue;
  ocupacion: OcupacionAlbergue;
  foto_url: string | null;
  precio_desde: number | null;
  precio_cama: string | null;
  capacidad_total: number | null;
  telefono: string | null;
  tiene_booking: boolean | null;
  plan: PlanAlbergue;
}

interface Etapa {
  id: string;
  numero: number;
  inicio_nombre: string;
  fin_nombre: string;
}

interface AlberguesResponse {
  albergues: Albergue[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const COLORS = {
  fondo: "#FAF7F2",
  tinta: "#1C1917",
  tintaSoft: "#6B6560",
  piedra: "#E5E0D8",
  piedraDark: "#C9C0B4",
  acento: "#C4843A",
  acentoSoft: "#F5EBD8",
  verde: "#5B8C5A",
  verdeSoft: "#EAF2EA",
  rojo: "#C0392B",
  rojoSoft: "#FDEAEA",
  amarillo: "#D4A017",
  amarilloSoft: "#FDF6E3",
  blanco: "#FFFFFF",
  overlay: "rgba(28,25,23,0.5)",
} as const;

const PAGE_SIZE = 30;
const STATUS_BAR_HEIGHT =
  Platform.OS === "ios" ? 50 : (StatusBar.currentHeight ?? 24);

// ─── Utils ────────────────────────────────────────────────────────────────────

function ocupacionColor(o: OcupacionAlbergue) {
  return o === "libre"
    ? COLORS.verde
    : o === "casi_lleno"
      ? COLORS.amarillo
      : COLORS.rojo;
}
function ocupacionBg(o: OcupacionAlbergue) {
  return o === "libre"
    ? COLORS.verdeSoft
    : o === "casi_lleno"
      ? COLORS.amarilloSoft
      : COLORS.rojoSoft;
}

// ─── Modal selector de etapa ──────────────────────────────────────────────────

interface EtapaModalProps {
  visible: boolean;
  etapas: Etapa[];
  seleccionada: Etapa | null;
  onSelect: (etapa: Etapa | null) => void;
  onClose: () => void;
  t: (k: string) => string;
}

function EtapaModal({
  visible,
  etapas,
  seleccionada,
  onSelect,
  onClose,
  t,
}: EtapaModalProps) {
  const [filtro, setFiltro] = useState("");

  const etapasFiltradas =
    filtro.length >= 1
      ? etapas.filter((e) =>
          `${e.numero} ${e.inicio_nombre} ${e.fin_nombre}`
            .toLowerCase()
            .includes(filtro.toLowerCase()),
        )
      : etapas;

  const handleSelect = (etapa: Etapa | null) => {
    onSelect(etapa);
    setFiltro("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={modalStyles.container}>
        {/* Cabecera modal */}
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>
            {t("albergues.seleccionarEtapa")}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Text style={modalStyles.cerrar}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Buscador dentro del modal */}
        <View style={modalStyles.searchContainer}>
          <Text style={modalStyles.searchIcon}>🔍</Text>
          <TextInput
            style={modalStyles.searchInput}
            placeholder={t("albergues.buscarEtapa")}
            placeholderTextColor={COLORS.piedraDark}
            value={filtro}
            onChangeText={setFiltro}
            autoCorrect={false}
            autoCapitalize="none"
            autoFocus
          />
          {filtro.length > 0 && (
            <TouchableOpacity onPress={() => setFiltro("")} hitSlop={8}>
              <Text style={modalStyles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Opción "Todas" */}
        <TouchableOpacity
          style={[
            modalStyles.opcion,
            seleccionada === null && modalStyles.opcionActiva,
          ]}
          onPress={() => handleSelect(null)}
        >
          <Text
            style={[
              modalStyles.opcionTexto,
              seleccionada === null && modalStyles.opcionTextoActivo,
            ]}
          >
            {t("albergues.todasEtapas")}
          </Text>
          {seleccionada === null && (
            <Text style={modalStyles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>

        <View style={modalStyles.divider} />

        {/* Lista etapas */}
        <FlatList
          data={etapasFiltradas}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => {
            const activa = seleccionada?.id === item.id;
            return (
              <TouchableOpacity
                style={[modalStyles.opcion, activa && modalStyles.opcionActiva]}
                onPress={() => handleSelect(item)}
              >
                <View style={modalStyles.opcionRow}>
                  <View style={modalStyles.numeroBadge}>
                    <Text style={modalStyles.numeroText}>{item.numero}</Text>
                  </View>
                  <Text
                    style={[
                      modalStyles.opcionTexto,
                      activa && modalStyles.opcionTextoActivo,
                      { flex: 1 },
                    ]}
                    numberOfLines={2}
                  >
                    {item.inicio_nombre} → {item.fin_nombre}
                  </Text>
                </View>
                {activa && <Text style={modalStyles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fondo,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.piedra,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.tinta,
  },
  cerrar: {
    fontSize: 18,
    color: COLORS.tintaSoft,
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    backgroundColor: COLORS.blanco,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.piedra,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.tinta,
    padding: 0,
  },
  searchClear: {
    fontSize: 13,
    color: COLORS.piedraDark,
    paddingHorizontal: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.piedra,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  opcionActiva: {
    backgroundColor: COLORS.acentoSoft,
  },
  opcionRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  numeroBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.piedra,
    justifyContent: "center",
    alignItems: "center",
  },
  numeroText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.tintaSoft,
  },
  opcionTexto: {
    fontSize: 15,
    color: COLORS.tinta,
  },
  opcionTextoActivo: {
    fontWeight: "600",
    color: COLORS.acento,
  },
  checkmark: {
    fontSize: 16,
    color: COLORS.acento,
    fontWeight: "700",
  },
});

// ─── Card albergue ────────────────────────────────────────────────────────────

interface AlbergueCardProps {
  albergue: Albergue;
  onPress: () => void;
  t: (k: string) => string;
}

function AlbergueCard({ albergue, onPress, t }: AlbergueCardProps) {
  const isPlus = albergue.plan === "plus";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isPlus && styles.cardPlus,
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={styles.cardRow}>
        {/* Punto de ocupación */}
        <View
          style={[
            styles.ocupDot,
            { backgroundColor: ocupacionColor(albergue.ocupacion) },
          ]}
        />

        {/* Info principal */}
        <View style={styles.cardInfo}>
          <View style={styles.cardNameRow}>
            <Text style={styles.cardNombre} numberOfLines={1}>
              {albergue.nombre}
            </Text>
            {isPlus && (
              <View style={styles.badgePlus}>
                <Text style={styles.badgePlusText}>Plus</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardLocalidad} numberOfLines={1}>
            {albergue.localidad ?? "—"}
          </Text>
        </View>

        {/* Precio + flecha */}
        <View style={styles.cardRight}>
          {albergue.precio_desde != null && (
            <Text style={styles.cardPrecio}>{albergue.precio_desde}€</Text>
          )}
          <Text style={styles.cardArrow}>›</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Pantalla ─────────────────────────────────────────────────────────────────

export default function AlberguesScreen() {
  const { t } = useTranslation();

  const [albergues, setAlbergues] = useState<Albergue[]>([]);
  const [total, setTotal] = useState(0);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [etapaSeleccionada, setEtapaSeleccionada] = useState<Etapa | null>(
    null,
  );

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offset = useRef(0);
  const hasMore = useRef(true);

  // Cargar etapas una sola vez
  useEffect(() => {
    apiGet<{ etapas: Etapa[] }>("/api/etapas")
      .then(({ etapas }) => setEtapas(etapas))
      .catch(() => {});
  }, []);

  // Fetch principal — resetea lista
  const fetchAlbergues = useCallback(
    async (search: string, etapa: Etapa | null) => {
      setLoading(true);
      setError(null);
      offset.current = 0;
      hasMore.current = true;

      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: "0",
        });
        if (etapa) params.set("etapa_id", etapa.id);
        if (search.length >= 3) params.set("search", search);

        const res = await apiGet<AlberguesResponse>(`/api/albergues?${params}`);
        setAlbergues(res.albergues);
        setTotal(res.total);
        hasMore.current = res.albergues.length === PAGE_SIZE;
      } catch {
        setError(t("albergues.errorCarga"));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  // Cargar más (infinite scroll)
  const fetchMore = useCallback(async () => {
    if (loadingMore || !hasMore.current || loading) return;
    setLoadingMore(true);

    try {
      const nextOffset = offset.current + PAGE_SIZE;
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(nextOffset),
      });
      if (etapaSeleccionada) params.set("etapa_id", etapaSeleccionada.id);
      if (busqueda.length >= 3) params.set("search", busqueda);

      const res = await apiGet<AlberguesResponse>(`/api/albergues?${params}`);
      setAlbergues((prev) => [...prev, ...res.albergues]);
      offset.current = nextOffset;
      hasMore.current = res.albergues.length === PAGE_SIZE;
    } catch {
      // silencioso en paginación
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, etapaSeleccionada, busqueda]);

  // Cambio de etapa → inmediato
  useEffect(() => {
    fetchAlbergues(busqueda, etapaSeleccionada);
  }, [etapaSeleccionada]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cambio de búsqueda → debounced
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (busqueda.length === 0 || busqueda.length >= 3) {
      searchTimeout.current = setTimeout(() => {
        fetchAlbergues(busqueda, etapaSeleccionada);
      }, 350);
    }
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [busqueda]); // eslint-disable-line react-hooks/exhaustive-deps

  const labelEtapa = etapaSeleccionada
    ? `Etapa ${etapaSeleccionada.numero} · ${etapaSeleccionada.inicio_nombre}`
    : t("albergues.todasEtapas");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.fondo} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("albergues.titulo")}</Text>

        {/* Selector etapa */}
        <TouchableOpacity
          style={styles.etapaSelector}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.etapaSelectorText} numberOfLines={1}>
            {labelEtapa}
          </Text>
          <Text style={styles.etapaSelectorChevron}>⌄</Text>
        </TouchableOpacity>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t("albergues.buscarPlaceholder")}
            placeholderTextColor={COLORS.piedraDark}
            value={busqueda}
            onChangeText={setBusqueda}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda("")} hitSlop={8}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Contador */}
      {!loading && !error && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {total} {t("albergues.resultados")}
          </Text>
          {etapaSeleccionada && (
            <TouchableOpacity
              onPress={() => setEtapaSeleccionada(null)}
              hitSlop={8}
            >
              <Text style={styles.clearFiltro}>
                ✕ {t("albergues.limpiarFiltro")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Error */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchAlbergues(busqueda, etapaSeleccionada)}
          >
            <Text style={styles.retryText}>{t("albergues.reintentar")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista */}
      {!error &&
        (loading ? (
          <View style={styles.initialLoader}>
            <ActivityIndicator size="large" color={COLORS.acento} />
          </View>
        ) : (
          <FlatList
            data={albergues}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <AlbergueCard
                albergue={item}
                onPress={() => router.push(`/(public)/albergues/${item.slug}`)}
                t={t}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={fetchMore}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>
                  {t("albergues.sinResultados")}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {t("albergues.sinResultadosDesc")}
                </Text>
              </View>
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={COLORS.acento} />
                </View>
              ) : null
            }
          />
        ))}

      {/* Modal selector etapa */}
      <EtapaModal
        visible={modalVisible}
        etapas={etapas}
        seleccionada={etapaSeleccionada}
        onSelect={setEtapaSeleccionada}
        onClose={() => setModalVisible(false)}
        t={t}
      />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fondo,
  },
  header: {
    paddingTop: STATUS_BAR_HEIGHT + 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.fondo,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.piedra,
    gap: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.tinta,
    letterSpacing: -0.5,
  },

  // Selector etapa
  etapaSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.blanco,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.piedra,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  etapaSelectorText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.tinta,
    fontWeight: "500",
  },
  etapaSelectorChevron: {
    fontSize: 18,
    color: COLORS.tintaSoft,
    marginLeft: 8,
  },

  // Buscador
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.blanco,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.piedra,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.tinta,
    padding: 0,
  },
  searchClear: {
    fontSize: 13,
    color: COLORS.piedraDark,
    paddingHorizontal: 4,
  },

  // Contador + filtro activo
  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  countText: {
    fontSize: 13,
    color: COLORS.tintaSoft,
  },
  clearFiltro: {
    fontSize: 13,
    color: COLORS.acento,
    fontWeight: "600",
  },

  // Lista
  listContent: {
    paddingBottom: 100,
  },

  // Card — estilo lista compacta como la web
  card: {
    backgroundColor: COLORS.blanco,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.piedra,
  },
  cardPlus: {
    backgroundColor: "#FFFBF5",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.acento,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ocupDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    flexShrink: 0,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardNombre: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.tinta,
  },
  cardLocalidad: {
    fontSize: 13,
    color: COLORS.tintaSoft,
  },
  badgePlus: {
    backgroundColor: COLORS.acento,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePlusText: {
    color: COLORS.blanco,
    fontSize: 10,
    fontWeight: "700",
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  cardPrecio: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.acento,
  },
  cardArrow: {
    fontSize: 20,
    color: COLORS.piedraDark,
    lineHeight: 20,
  },

  // Estados
  initialLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.tinta,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.tintaSoft,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.rojo,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: COLORS.acento,
    borderRadius: 20,
  },
  retryText: {
    color: COLORS.blanco,
    fontWeight: "600",
    fontSize: 14,
  },
});
