// 📄 apps/camino-mobile/app/(auth)/mi-albergue/index.tsx
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://camino-api.onrender.com";
const CLOUDINARY_CLOUD =
  process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD ?? "dazuwnm1k";
const DEFAULT_IMG =
  "https://res.cloudinary.com/dazuwnm1k/image/upload/v1774540777/al-bergue_omsb4p.webp";

// ── Configs ────────────────────────────────────────────────────
const ESTADO_CONFIG = {
  abierto: {
    label: "Abierto",
    emoji: "✅",
    bg: "#E8F5EC",
    color: "#2E7A45",
    border: "#4A7C59",
    sub: "Hay plazas disponibles para peregrinos",
  },
  lleno: {
    label: "Lleno",
    emoji: "🔴",
    bg: "#FEF3DC",
    color: "#8B6300",
    border: "#B8860B",
    sub: "No quedan plazas libres hoy",
  },
  cerrado: {
    label: "Cerrado",
    emoji: "🚫",
    bg: "#FDECEA",
    color: "#8B2020",
    border: "#A33020",
    sub: "El albergue está cerrado temporalmente",
  },
};

const SERVICIOS_CONFIG = [
  { key: "wifi", label: "WiFi", emoji: "📶" },
  { key: "cocina", label: "Cocina", emoji: "🍳" },
  { key: "lavadora", label: "Lavadora", emoji: "🫧" },
  { key: "secadora", label: "Secadora", emoji: "💨" },
  { key: "desayuno", label: "Desayuno", emoji: "☕" },
  { key: "cenas", label: "Cenas", emoji: "🍽️" },
  { key: "parking_bici", label: "Parking bici", emoji: "🚲" },
  { key: "admite_perros", label: "Admite perros", emoji: "🐕" },
  { key: "calefaccion", label: "Calefacción", emoji: "🌡️" },
  { key: "aire_acond", label: "Aire acond.", emoji: "❄️" },
  { key: "taquillas", label: "Taquillas", emoji: "🔒" },
  { key: "jardin_terraza", label: "Jardín/Terraza", emoji: "🌿" },
  { key: "piscina", label: "Piscina", emoji: "🏊" },
];

type TabKey = "estado" | "info" | "servicios" | "fotos" | "cierre";

const TABS: { key: TabKey; label: string }[] = [
  { key: "estado", label: "Estado" },
  { key: "info", label: "Info" },
  { key: "servicios", label: "Servicios" },
  { key: "fotos", label: "Fotos" },
  { key: "cierre", label: "Cierre" },
];

export default function MiAlbergueScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const [albergue, setAlbergue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("estado");

  // Estado
  const [ocupacion, setOcupacion] = useState("abierto");

  // Info
  const [nombre, setNombre] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [web, setWeb] = useState("");
  const [precioCama, setPrecioCama] = useState("");
  const [plazas, setPlazas] = useState("");
  const [descripcion, setDescripcion] = useState("");

  // Servicios
  const [servicios, setServicios] = useState<Record<string, boolean>>(
    SERVICIOS_CONFIG.reduce((acc, s) => ({ ...acc, [s.key]: false }), {}),
  );

  // Fotos
  const [fotos, setFotos] = useState<string[]>([]);
  const [subiendo, setSubiendo] = useState(false);

  // Cierre
  const [cierreDesde, setCierreDesde] = useState("");
  const [cierreHasta, setCierreHasta] = useState("");

  // ── Cargar datos desde Hono ────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/hospitalero/albergue`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const a = data.albergue;
        const s = data.servicios ?? {};
        setAlbergue(a);
        setOcupacion(a.ocupacion ?? "abierto");
        setNombre(a.nombre ?? "");
        setLocalidad(a.localidad ?? "");
        setUbicacion(a.ubicacion ?? "");
        setTelefono(a.telefono ?? "");
        setWeb(a.web ?? "");
        setPrecioCama(a.precio_cama ?? "");
        setPlazas(String(a.plazas_totales ?? ""));
        setDescripcion(a.descripcion ?? "");
        setFotos(a.fotos_urls ?? []);
        setCierreDesde(a.cierre_desde ?? "");
        setCierreHasta(a.cierre_hasta ?? "");
        setServicios(
          SERVICIOS_CONFIG.reduce(
            (acc, sv) => ({
              ...acc,
              [sv.key]: s[sv.key] ?? a.servicios?.[sv.key] ?? false,
            }),
            {},
          ),
        );
      })
      .catch(() => Alert.alert("Error", "No se pudo cargar tu albergue"))
      .finally(() => setLoading(false));
  }, [token]);

  // ── Helper PUT ─────────────────────────────────────────────
  async function apiPut(path: string, body: Record<string, any>) {
    if (!token) return false;
    const res = await fetch(`${API_URL}/api/hospitalero/${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    return res.ok;
  }

  function showSaved(msg: string) {
    setSaved(msg);
    setTimeout(() => setSaved(""), 3000);
  }

  // ── Cambiar estado ─────────────────────────────────────────
  async function cambiarEstado(estado: string) {
    setOcupacion(estado);
    setSaving(true);
    const ok = await apiPut("ocupacion", { ocupacion: estado });
    setSaving(false);
    if (!ok) setOcupacion(albergue.ocupacion);
  }

  // ── Guardar info ───────────────────────────────────────────
  async function guardarInfo() {
    setSaving(true);
    const ok = await apiPut("info", {
      nombre,
      localidad,
      ubicacion,
      telefono,
      web,
      precio_cama: precioCama,
      plazas_totales: plazas ? Number(plazas) : undefined,
      descripcion,
    });
    setSaving(false);
    showSaved(ok ? "Guardado ✓" : "Error al guardar");
  }

  // ── Guardar servicios ──────────────────────────────────────
  async function guardarServicios() {
    setSaving(true);
    const ok = await apiPut("servicios", { servicios });
    setSaving(false);
    showSaved(ok ? "Servicios guardados ✓" : "Error");
  }

  // ── Subir foto a Cloudinary ────────────────────────────────
  async function subirFoto() {
    if (fotos.length >= 25) {
      Alert.alert("Máximo 25 fotos");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (result.canceled) return;

    setSubiendo(true);
    const nuevas: string[] = [];
    for (const asset of result.assets) {
      const fd = new FormData();
      fd.append("file", {
        uri: asset.uri,
        type: "image/jpeg",
        name: "foto.jpg",
      } as any);
      fd.append("upload_preset", "albergues_upload");
      fd.append("folder", "albergues");
      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
          { method: "POST", body: fd },
        );
        const data = await res.json();
        if (data.secure_url) nuevas.push(data.secure_url);
      } catch {}
    }
    const actualizadas = [...fotos, ...nuevas];
    setFotos(actualizadas);
    await apiPut("info", { fotos_urls: actualizadas });
  }

  async function eliminarFoto(url: string) {
    Alert.alert("Eliminar foto", "¿Seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          const actualizadas = fotos.filter((f) => f !== url);
          setFotos(actualizadas);
          await apiPut("info", { fotos_urls: actualizadas });
        },
      },
    ]);
  }

  // ── Guardar cierre ─────────────────────────────────────────
  async function guardarCierre() {
    setSaving(true);
    const ok = await apiPut("info", {
      cierre_desde: cierreDesde || null,
      cierre_hasta: cierreHasta || null,
    });
    setSaving(false);
    showSaved(ok ? "Fechas guardadas ✓" : "Error");
  }

  async function quitarCierre() {
    setCierreDesde("");
    setCierreHasta("");
    await apiPut("info", { cierre_desde: null, cierre_hasta: null });
    showSaved("Cierre eliminado ✓");
  }

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#C8622A" />
      </View>
    );
  }

  if (!albergue) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>No tienes un albergue asignado</Text>
      </View>
    );
  }

  const estadoActual =
    ESTADO_CONFIG[ocupacion as keyof typeof ESTADO_CONFIG] ??
    ESTADO_CONFIG.abierto;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── TOPBAR ──────────────────────────────────────────── */}
      <View style={styles.topbar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.topbarBack}
        >
          <Text style={styles.topbarBackText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topbarTitle} numberOfLines={1}>
          {albergue.nombre}
        </Text>
        {saved ? (
          <Text
            style={[
              styles.savedMsg,
              saved.includes("Error") && styles.savedError,
            ]}
          >
            {saved}
          </Text>
        ) : saving ? (
          <ActivityIndicator size="small" color="#C8622A" />
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* ── HEADER FOTO ─────────────────────────────────────── */}
      <View style={styles.headerFoto}>
        <Image
          source={{ uri: fotos[0] || albergue.foto_url || DEFAULT_IMG }}
          style={styles.headerFotoImg}
        />
        <View style={styles.headerFotoOverlay} />
        <View style={styles.headerFotoInfo}>
          <Text style={styles.headerFotoSub}>
            {albergue.localidad} · {albergue.plazas_totales ?? "—"} plazas
          </Text>
          <View
            style={[styles.estadoBadge, { backgroundColor: estadoActual.bg }]}
          >
            <Text
              style={[styles.estadoBadgeText, { color: estadoActual.color }]}
            >
              {estadoActual.emoji} {estadoActual.label}
            </Text>
          </View>
        </View>
      </View>

      {/* ── TABS ────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsBar}
        contentContainerStyle={styles.tabsContent}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabBtn}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── CONTENIDO ───────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.tabContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─ ESTADO ─ */}
        {activeTab === "estado" && (
          <View>
            <Text style={styles.tabDesc}>
              Los peregrinos ven este estado en tiempo real.
            </Text>
            {(
              Object.entries(ESTADO_CONFIG) as [
                string,
                typeof ESTADO_CONFIG.abierto,
              ][]
            ).map(([key, cfg]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.estadoBtn,
                  ocupacion === key && {
                    borderColor: cfg.border,
                    backgroundColor: cfg.bg,
                  },
                ]}
                onPress={() => cambiarEstado(key)}
                disabled={saving}
              >
                <Text style={styles.estadoBtnEmoji}>{cfg.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.estadoBtnLabel,
                      ocupacion === key && { color: cfg.color },
                    ]}
                  >
                    {cfg.label}
                  </Text>
                  <Text style={styles.estadoBtnSub}>{cfg.sub}</Text>
                </View>
                {ocupacion === key && (
                  <View
                    style={[styles.estadoCheck, { backgroundColor: cfg.color }]}
                  >
                    <Text style={styles.estadoCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            {albergue.updated_ocupacion && (
              <Text style={styles.lastUpdate}>
                Última actualización:{" "}
                {new Date(albergue.updated_ocupacion).toLocaleString("es-ES")}
              </Text>
            )}
          </View>
        )}

        {/* ─ INFO ─ */}
        {activeTab === "info" && (
          <View>
            {[
              { label: "Nombre", value: nombre, set: setNombre, key: "n" },
              {
                label: "Localidad",
                value: localidad,
                set: setLocalidad,
                key: "l",
              },
              {
                label: "Ubicación (ref.)",
                value: ubicacion,
                set: setUbicacion,
                key: "u",
              },
              {
                label: "Teléfono",
                value: telefono,
                set: setTelefono,
                key: "t",
                kbType: "phone-pad" as const,
              },
              {
                label: "Web",
                value: web,
                set: setWeb,
                key: "w",
                kbType: "url" as const,
              },
              {
                label: "Precio cama (€)",
                value: precioCama,
                set: setPrecioCama,
                key: "p",
              },
              {
                label: "Plazas totales",
                value: plazas,
                set: setPlazas,
                key: "pl",
                kbType: "numeric" as const,
              },
            ].map((field) => (
              <View key={field.key} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={field.value}
                  onChangeText={field.set}
                  keyboardType={field.kbType ?? "default"}
                  placeholderTextColor="#C4A882"
                />
              </View>
            ))}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Descripción</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldTextarea]}
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                placeholderTextColor="#C4A882"
              />
            </View>
            <TouchableOpacity
              style={[styles.btnPrimary, saving && styles.btnDisabled]}
              onPress={guardarInfo}
              disabled={saving}
            >
              <Text style={styles.btnPrimaryText}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─ SERVICIOS ─ */}
        {activeTab === "servicios" && (
          <View>
            <View style={styles.serviciosGrid}>
              {SERVICIOS_CONFIG.map((s) => {
                const activo = servicios[s.key];
                return (
                  <TouchableOpacity
                    key={s.key}
                    style={[
                      styles.servicioBtn,
                      activo && styles.servicioBtnActivo,
                    ]}
                    onPress={() =>
                      setServicios((prev) => ({
                        ...prev,
                        [s.key]: !prev[s.key],
                      }))
                    }
                  >
                    <Text style={styles.servicioEmoji}>{s.emoji}</Text>
                    <Text
                      style={[
                        styles.servicioLabel,
                        activo && styles.servicioLabelActivo,
                      ]}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[styles.btnPrimary, saving && styles.btnDisabled]}
              onPress={guardarServicios}
              disabled={saving}
            >
              <Text style={styles.btnPrimaryText}>
                {saving ? "Guardando..." : "Guardar servicios"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─ FOTOS ─ */}
        {activeTab === "fotos" && (
          <View>
            <Text style={styles.tabDesc}>
              Máximo 25 fotos. La primera es la portada.
            </Text>
            <View style={styles.fotosGrid}>
              {fotos.map((url, i) => (
                <View key={url} style={styles.fotoItem}>
                  <Image source={{ uri: url }} style={styles.fotoImg} />
                  <TouchableOpacity
                    style={styles.fotoDelete}
                    onPress={() => eliminarFoto(url)}
                  >
                    <Text style={styles.fotoDeleteText}>✕</Text>
                  </TouchableOpacity>
                  {i === 0 && (
                    <View style={styles.fotoCover}>
                      <Text style={styles.fotoCoverText}>PORTADA</Text>
                    </View>
                  )}
                </View>
              ))}
              {fotos.length < 25 && (
                <TouchableOpacity
                  style={styles.fotoAdd}
                  onPress={subirFoto}
                  disabled={subiendo}
                >
                  {subiendo ? (
                    <ActivityIndicator size="small" color="#C4A882" />
                  ) : (
                    <>
                      <Text style={styles.fotoAddIcon}>+</Text>
                      <Text style={styles.fotoAddText}>Añadir</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.fotosCount}>{fotos.length}/25 fotos</Text>
          </View>
        )}

        {/* ─ CIERRE ─ */}
        {activeTab === "cierre" && (
          <View>
            <Text style={styles.tabDesc}>
              Define el periodo de cierre temporal del albergue.
            </Text>
            <View style={styles.cierreCard}>
              <View style={styles.cierreRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Cierra el</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={cierreDesde}
                    onChangeText={setCierreDesde}
                    placeholder="AAAA-MM-DD"
                    placeholderTextColor="#C4A882"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Reabre el</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={cierreHasta}
                    onChangeText={setCierreHasta}
                    placeholder="AAAA-MM-DD"
                    placeholderTextColor="#C4A882"
                  />
                </View>
              </View>

              {cierreDesde && cierreHasta && (
                <View style={styles.cierrePreview}>
                  <Text style={styles.cierrePreviewText}>
                    Cerrado del{" "}
                    <Text style={{ fontWeight: "700" }}>{cierreDesde}</Text> al{" "}
                    <Text style={{ fontWeight: "700" }}>{cierreHasta}</Text>
                  </Text>
                </View>
              )}

              <View style={styles.cierreBtns}>
                <TouchableOpacity
                  style={[
                    styles.btnPrimary,
                    { flex: 1 },
                    saving && styles.btnDisabled,
                  ]}
                  onPress={guardarCierre}
                  disabled={saving}
                >
                  <Text style={styles.btnPrimaryText}>
                    {saving ? "Guardando..." : "Guardar fechas"}
                  </Text>
                </TouchableOpacity>
                {(cierreDesde || cierreHasta) && (
                  <TouchableOpacity
                    style={styles.btnSecondary}
                    onPress={quitarCierre}
                  >
                    <Text style={styles.btnSecondaryText}>Quitar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF7F2" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF7F2",
  },
  errorText: { fontSize: 15, color: "#8B7355" },

  // Topbar
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E8E0D0",
  },
  topbarBack: { width: 40, alignItems: "flex-start", justifyContent: "center" },
  topbarBackText: { fontSize: 28, color: "#8B7355", lineHeight: 32 },
  topbarTitle: {
    flex: 1,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 15,
    fontWeight: "500",
    color: "#2C1F0E",
  },
  savedMsg: { fontSize: 12, color: "#2E7A45" },
  savedError: { color: "#A33020" },

  // Header foto
  headerFoto: { height: 160, backgroundColor: "#2C1F0E", overflow: "hidden" },
  headerFotoImg: { width: "100%", height: "100%", opacity: 0.6 },
  headerFotoOverlay: {
    ...StyleSheet.absoluteFillObject,
    // background:
    //   "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.7) 100%)",
  },
  headerFotoInfo: { position: "absolute", bottom: 16, left: 20, right: 20 },
  headerFotoSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 6,
  },
  estadoBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  estadoBadgeText: { fontSize: 12, fontWeight: "600" },

  // Tabs
  tabsBar: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E8E0D0",
    maxHeight: 46,
    flexGrow: 0,
  },
  tabsContent: { paddingHorizontal: 4 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 12, alignItems: "center" },
  tabText: { fontSize: 12, fontWeight: "500", color: "#8B7355" },
  tabTextActive: { color: "#C8622A" },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 14,
    right: 14,
    height: 2,
    backgroundColor: "#C8622A",
    borderRadius: 1,
  },

  // Tab content
  tabContent: { padding: 20 },
  tabDesc: { fontSize: 13, color: "#8B7355", marginBottom: 16, lineHeight: 20 },

  // Estado
  estadoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#E8E0D0",
    backgroundColor: "white",
    marginBottom: 10,
  },
  estadoBtnEmoji: { fontSize: 28 },
  estadoBtnLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2C1F0E",
    marginBottom: 2,
  },
  estadoBtnSub: { fontSize: 12, color: "#8B7355" },
  estadoCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  estadoCheckText: { fontSize: 12, color: "white", fontWeight: "700" },
  lastUpdate: {
    fontSize: 11,
    color: "#C4A882",
    textAlign: "center",
    marginTop: 12,
  },

  // Info
  fieldGroup: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B4C2A",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E8E0D0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#2C1F0E",
  },
  fieldTextarea: { height: 110, paddingTop: 10 },

  // Servicios
  serviciosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  servicioBtn: {
    width: "30%",
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E8E0D0",
    backgroundColor: "white",
    alignItems: "center",
  },
  servicioBtnActivo: { borderColor: "#C8622A", backgroundColor: "#FDF0E8" },
  servicioEmoji: { fontSize: 22, marginBottom: 4 },
  servicioLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#8B7355",
    textAlign: "center",
  },
  servicioLabelActivo: { color: "#C8622A" },

  // Fotos
  fotosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  fotoItem: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F5F0E8",
  },
  fotoImg: { width: "100%", height: "100%" },
  fotoDelete: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  fotoDeleteText: { fontSize: 11, color: "white" },
  fotoCover: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "#C8622A",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fotoCoverText: { fontSize: 9, fontWeight: "700", color: "white" },
  fotoAdd: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E8E0D0",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFAF8",
  },
  fotoAddIcon: { fontSize: 24, color: "#C4A882" },
  fotoAddText: { fontSize: 10, color: "#8B7355" },
  fotosCount: { fontSize: 11, color: "#C4A882" },

  // Cierre
  cierreCard: {
    backgroundColor: "white",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8E0D0",
    padding: 20,
  },
  cierreRow: { flexDirection: "row", marginBottom: 16 },
  cierrePreview: {
    backgroundColor: "#FEF3DC",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  cierrePreviewText: { fontSize: 13, color: "#8B6300", lineHeight: 20 },
  cierreBtns: { flexDirection: "row", gap: 10 },

  // Botones
  btnPrimary: {
    backgroundColor: "#C8622A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnPrimaryText: { fontSize: 14, fontWeight: "600", color: "white" },
  btnDisabled: { opacity: 0.6 },
  btnSecondary: {
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E0D0",
    alignItems: "center",
    justifyContent: "center",
  },
  btnSecondaryText: { fontSize: 14, color: "#8B7355" },
});

