// 📄 app/(auth)/mi-negocio/index.tsx
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

const DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const SERVICIOS_CONFIG = [
  { key: "menu_del_dia", label: "Menú del día", emoji: "🍽️" },
  { key: "desayunos", label: "Desayunos", emoji: "🥐" },
  { key: "bocadillos", label: "Bocadillos", emoji: "🥖" },
  { key: "terraza", label: "Terraza", emoji: "☀️" },
  { key: "takeaway", label: "Para llevar", emoji: "🥡" },
  { key: "vegano", label: "Opción vegana", emoji: "🌱" },
  { key: "sin_gluten", label: "Sin gluten", emoji: "🌾" },
  { key: "wifi", label: "WiFi", emoji: "📶" },
  { key: "parking", label: "Parking", emoji: "🅿️" },
  { key: "bici_parking", label: "Parking bici", emoji: "🚲" },
  { key: "reservas", label: "Reservas", emoji: "📅" },
  { key: "sello_credencial", label: "Sello credencial", emoji: "⭐" },
  { key: "ingles", label: "English", emoji: "🇬🇧" },
  { key: "aleman", label: "Deutsch", emoji: "🇩🇪" },
  { key: "frances", label: "Français", emoji: "🇫🇷" },
];

type TabKey = "info" | "descripcion" | "horarios" | "servicios" | "fotos";

const TABS: { key: TabKey; label: string }[] = [
  { key: "info", label: "Info" },
  { key: "descripcion", label: "Descripción" },
  { key: "horarios", label: "Horarios" },
  { key: "servicios", label: "Servicios" },
  { key: "fotos", label: "Fotos" },
];

type Horario = { dia_semana: number; apertura: string; cierre: string };
type Foto = {
  id: string;
  url: string;
  es_hero: boolean | null;
  orden: number | null;
};

export default function MiNegocioScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const [negocio, setNegocio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("info");

  // Info
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [web, setWeb] = useState("");

  // Descripción multiidioma
  const [descripcionEs, setDescripcionEs] = useState("");
  const [descripcionEn, setDescripcionEn] = useState("");
  const [descripcionDe, setDescripcionDe] = useState("");
  const [descripcionFr, setDescripcionFr] = useState("");
  const [descripcionIt, setDescripcionIt] = useState("");
  const [descripcionPt, setDescripcionPt] = useState("");
  const [descripcionKo, setDescripcionKo] = useState("");

  // Horarios
  const [horarios, setHorarios] = useState<Horario[]>([]);

  // Servicios
  const [servicios, setServicios] = useState<Record<string, boolean>>(
    SERVICIOS_CONFIG.reduce((acc, s) => ({ ...acc, [s.key]: false }), {}),
  );

  // Fotos
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [subiendo, setSubiendo] = useState(false);

  // ── Cargar datos ───────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/negocios/panel/mi-negocio`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const n = data.negocio;
        setNegocio(n);
        setNombre(n.nombre ?? "");
        setDireccion(n.direccion ?? "");
        setTelefono(n.telefono ?? "");
        setWhatsapp(n.whatsapp ?? "");
        setEmail(n.email ?? "");
        setWeb(n.web ?? "");
        setDescripcionEs(n.descripcion ?? "");
        setDescripcionEn(n.descripcion_en ?? "");
        setDescripcionDe(n.descripcion_de ?? "");
        setDescripcionFr(n.descripcion_fr ?? "");
        setDescripcionIt(n.descripcion_it ?? "");
        setDescripcionPt(n.descripcion_pt ?? "");
        setDescripcionKo(n.descripcion_ko ?? "");
        setHorarios(data.horarios ?? []);
        setFotos(data.fotos ?? []);
        setServicios(
          SERVICIOS_CONFIG.reduce(
            (acc, s) => ({
              ...acc,
              [s.key]: (n.servicios ?? []).includes(s.key),
            }),
            {},
          ),
        );
      })
      .catch(() => Alert.alert("Error", "No se pudo cargar tu negocio"))
      .finally(() => setLoading(false));
  }, [token]);

  // ── Helpers ────────────────────────────────────────────────
  async function apiPut(path: string, body: Record<string, any>) {
    if (!token) return false;
    const res = await fetch(`${API_URL}/api/negocios/panel/${path}`, {
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

  // ── Guardar info ───────────────────────────────────────────
  async function guardarInfo() {
    setSaving(true);
    const ok = await apiPut("info", {
      nombre,
      direccion,
      telefono,
      whatsapp,
      email,
      web,
    });
    setSaving(false);
    showSaved(ok ? "Guardado ✓" : "Error al guardar");
  }

  // ── Guardar descripción ────────────────────────────────────
  async function guardarDescripcion() {
    setSaving(true);
    const ok = await apiPut("info", {
      descripcion: descripcionEs,
      descripcion_en: descripcionEn,
      descripcion_de: descripcionDe,
      descripcion_fr: descripcionFr,
      descripcion_it: descripcionIt,
      descripcion_pt: descripcionPt,
      descripcion_ko: descripcionKo,
    });
    setSaving(false);
    showSaved(ok ? "Descripciones guardadas ✓" : "Error al guardar");
  }

  // ── Horarios ───────────────────────────────────────────────
  function toggleDia(dia: number) {
    const existe = horarios.find((h) => h.dia_semana === dia);
    if (existe) {
      setHorarios(horarios.filter((h) => h.dia_semana !== dia));
    } else {
      setHorarios([
        ...horarios,
        { dia_semana: dia, apertura: "09:00", cierre: "20:00" },
      ]);
    }
  }

  function updateHorario(
    dia: number,
    campo: "apertura" | "cierre",
    valor: string,
  ) {
    setHorarios(
      horarios.map((h) =>
        h.dia_semana === dia ? { ...h, [campo]: valor } : h,
      ),
    );
  }

  async function guardarHorarios() {
    setSaving(true);
    const ok = await apiPut("horarios", { horarios });
    setSaving(false);
    showSaved(ok ? "Horarios guardados ✓" : "Error al guardar");
  }

  // ── Servicios ──────────────────────────────────────────────
  async function guardarServicios() {
    setSaving(true);
    const activos = Object.entries(servicios)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const ok = await apiPut("servicios", { servicios: activos });
    setSaving(false);
    showSaved(ok ? "Servicios guardados ✓" : "Error");
  }

  // ── Fotos ──────────────────────────────────────────────────
  async function subirFoto() {
    if (fotos.length >= 10) {
      Alert.alert("Máximo 10 fotos");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (result.canceled) return;

    setSubiendo(true);
    for (const asset of result.assets) {
      const fd = new FormData();
      fd.append("file", {
        uri: asset.uri,
        type: "image/jpeg",
        name: "foto.jpg",
      } as any);
      fd.append("upload_preset", "negocios_upload");
      fd.append("folder", "negocios");
      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
          { method: "POST", body: fd },
        );
        const data = await res.json();
        if (data.secure_url) {
          const r = await fetch(`${API_URL}/api/negocios/panel/fotos`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              url: data.secure_url,
              es_hero: fotos.length === 0,
            }),
          });
          const saved = await r.json();
          if (saved.foto) setFotos((prev) => [...prev, saved.foto]);
        }
      } catch {}
    }
    setSubiendo(false);
  }

  async function eliminarFoto(fotoId: string) {
    Alert.alert("Eliminar foto", "¿Seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await fetch(`${API_URL}/api/negocios/panel/fotos/${fotoId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          setFotos((prev) => prev.filter((f) => f.id !== fotoId));
        },
      },
    ]);
  }

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#C8622A" />
      </View>
    );
  }

  if (!negocio) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <Text style={s.errorText}>No tienes un negocio asignado</Text>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* ── TOPBAR ── */}
      <View style={s.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={s.topbarBack}>
          <Text style={s.topbarBackText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.topbarTitle} numberOfLines={1}>
          {negocio.nombre}
        </Text>
        {saved ? (
          <Text style={[s.savedMsg, saved.includes("Error") && s.savedError]}>
            {saved}
          </Text>
        ) : saving ? (
          <ActivityIndicator size="small" color="#C8622A" />
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* ── HERO ── */}
      {(fotos[0]?.url || negocio.foto_url) && (
        <View style={s.hero}>
          <Image
            source={{ uri: fotos[0]?.url ?? negocio.foto_url }}
            style={s.heroImg}
          />
          <View style={s.heroOverlay} />
          <Text style={s.heroCat}>
            {negocio.categoria?.toUpperCase()} ·{" "}
            {negocio.verificado ? "✓ Verificado" : "Pendiente"}
          </Text>
        </View>
      )}

      {/* ── TABS ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tabsBar}
        contentContainerStyle={s.tabsContent}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={s.tabBtn}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={s.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── CONTENIDO ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          s.tabContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─ INFO ─ */}
        {activeTab === "info" && (
          <View>
            {[
              { label: "Nombre", value: nombre, set: setNombre },
              { label: "Dirección", value: direccion, set: setDireccion },
              {
                label: "Teléfono",
                value: telefono,
                set: setTelefono,
                kb: "phone-pad" as const,
              },
              {
                label: "WhatsApp",
                value: whatsapp,
                set: setWhatsapp,
                kb: "phone-pad" as const,
              },
              {
                label: "Email",
                value: email,
                set: setEmail,
                kb: "email-address" as const,
              },
              { label: "Web", value: web, set: setWeb, kb: "url" as const },
            ].map((f) => (
              <View key={f.label} style={s.fieldGroup}>
                <Text style={s.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={s.fieldInput}
                  value={f.value}
                  onChangeText={f.set}
                  keyboardType={f.kb ?? "default"}
                  placeholderTextColor="#C4A882"
                />
              </View>
            ))}
            <TouchableOpacity
              style={[s.btnPrimary, saving && s.btnDisabled]}
              onPress={guardarInfo}
              disabled={saving}
            >
              <Text style={s.btnPrimaryText}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─ DESCRIPCIÓN ─ */}
        {activeTab === "descripcion" && (
          <View>
            <Text style={s.tabDesc}>
              Describe tu negocio en cada idioma. Los peregrinos verán la
              descripción en su idioma.
            </Text>
            {[
              {
                label: "🇪🇸 Español",
                value: descripcionEs,
                set: setDescripcionEs,
              },
              {
                label: "🇬🇧 English",
                value: descripcionEn,
                set: setDescripcionEn,
              },
              {
                label: "🇩🇪 Deutsch",
                value: descripcionDe,
                set: setDescripcionDe,
              },
              {
                label: "🇫🇷 Français",
                value: descripcionFr,
                set: setDescripcionFr,
              },
              {
                label: "🇮🇹 Italiano",
                value: descripcionIt,
                set: setDescripcionIt,
              },
              {
                label: "🇵🇹 Português",
                value: descripcionPt,
                set: setDescripcionPt,
              },
              {
                label: "🇰🇷 한국어",
                value: descripcionKo,
                set: setDescripcionKo,
              },
            ].map((f) => (
              <View key={f.label} style={s.fieldGroup}>
                <Text style={s.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={[s.fieldInput, s.fieldTextarea]}
                  value={f.value}
                  onChangeText={f.set}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#C4A882"
                  placeholder="Descripción..."
                />
              </View>
            ))}
            <TouchableOpacity
              style={[s.btnPrimary, saving && s.btnDisabled]}
              onPress={guardarDescripcion}
              disabled={saving}
            >
              <Text style={s.btnPrimaryText}>
                {saving ? "Guardando..." : "Guardar descripciones"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─ HORARIOS ─ */}
        {activeTab === "horarios" && (
          <View>
            <Text style={s.tabDesc}>
              Toca un día para activarlo. Los peregrinos verán si estás abierto
              hoy.
            </Text>
            {DIAS.map((dia, i) => {
              const horario = horarios.find((h) => h.dia_semana === i);
              const activo = !!horario;
              return (
                <View key={i} style={s.horarioRow}>
                  <TouchableOpacity
                    style={[s.horarioDiaBtn, activo && s.horarioDiaBtnActivo]}
                    onPress={() => toggleDia(i)}
                  >
                    <Text
                      style={[
                        s.horarioDiaText,
                        activo && s.horarioDiaTextActivo,
                      ]}
                    >
                      {dia}
                    </Text>
                  </TouchableOpacity>
                  {activo && (
                    <View style={s.horarioHoras}>
                      <TextInput
                        style={s.horarioInput}
                        value={horario.apertura}
                        onChangeText={(v) => updateHorario(i, "apertura", v)}
                        placeholder="09:00"
                        placeholderTextColor="#C4A882"
                      />
                      <Text style={s.horarioSep}>–</Text>
                      <TextInput
                        style={s.horarioInput}
                        value={horario.cierre}
                        onChangeText={(v) => updateHorario(i, "cierre", v)}
                        placeholder="20:00"
                        placeholderTextColor="#C4A882"
                      />
                    </View>
                  )}
                </View>
              );
            })}
            <TouchableOpacity
              style={[s.btnPrimary, saving && s.btnDisabled]}
              onPress={guardarHorarios}
              disabled={saving}
            >
              <Text style={s.btnPrimaryText}>
                {saving ? "Guardando..." : "Guardar horarios"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─ SERVICIOS ─ */}
        {activeTab === "servicios" && (
          <View>
            <View style={s.serviciosGrid}>
              {SERVICIOS_CONFIG.map((sv) => {
                const activo = servicios[sv.key];
                return (
                  <TouchableOpacity
                    key={sv.key}
                    style={[s.servicioBtn, activo && s.servicioBtnActivo]}
                    onPress={() =>
                      setServicios((prev) => ({
                        ...prev,
                        [sv.key]: !prev[sv.key],
                      }))
                    }
                  >
                    <Text style={s.servicioEmoji}>{sv.emoji}</Text>
                    <Text
                      style={[s.servicioLabel, activo && s.servicioLabelActivo]}
                    >
                      {sv.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[s.btnPrimary, saving && s.btnDisabled]}
              onPress={guardarServicios}
              disabled={saving}
            >
              <Text style={s.btnPrimaryText}>
                {saving ? "Guardando..." : "Guardar servicios"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─ FOTOS ─ */}
        {activeTab === "fotos" && (
          <View>
            <Text style={s.tabDesc}>
              Máximo 10 fotos. La primera es la portada.
            </Text>
            <View style={s.fotosGrid}>
              {fotos.map((f, i) => (
                <View key={f.id} style={s.fotoItem}>
                  <Image source={{ uri: f.url }} style={s.fotoImg} />
                  <TouchableOpacity
                    style={s.fotoDelete}
                    onPress={() => eliminarFoto(f.id)}
                  >
                    <Text style={s.fotoDeleteText}>✕</Text>
                  </TouchableOpacity>
                  {i === 0 && (
                    <View style={s.fotoCover}>
                      <Text style={s.fotoCoverText}>PORTADA</Text>
                    </View>
                  )}
                </View>
              ))}
              {fotos.length < 10 && (
                <TouchableOpacity
                  style={s.fotoAdd}
                  onPress={subirFoto}
                  disabled={subiendo}
                >
                  {subiendo ? (
                    <ActivityIndicator size="small" color="#C4A882" />
                  ) : (
                    <>
                      <Text style={s.fotoAddIcon}>+</Text>
                      <Text style={s.fotoAddText}>Añadir</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
            <Text style={s.fotosCount}>{fotos.length}/10 fotos</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF7F2" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF7F2",
  },
  errorText: { fontSize: 15, color: "#8B7355" },

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

  hero: { height: 140, backgroundColor: "#2C1F0E", overflow: "hidden" },
  heroImg: { width: "100%", height: "100%", opacity: 0.6 },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  heroCat: {
    position: "absolute",
    bottom: 14,
    left: 20,
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 0.5,
  },

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

  tabContent: { padding: 20 },
  tabDesc: { fontSize: 13, color: "#8B7355", marginBottom: 16, lineHeight: 20 },

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
  fieldTextarea: { height: 100, paddingTop: 10 },

  horarioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  horarioDiaBtn: {
    width: 100,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E8E0D0",
    backgroundColor: "white",
  },
  horarioDiaBtnActivo: { borderColor: "#C8622A", backgroundColor: "#FDF0E8" },
  horarioDiaText: { fontSize: 13, color: "#8B7355", fontWeight: "500" },
  horarioDiaTextActivo: { color: "#C8622A" },
  horarioHoras: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  horarioInput: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E8E0D0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#2C1F0E",
    textAlign: "center",
  },
  horarioSep: { fontSize: 16, color: "#8B7355" },

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

  btnPrimary: {
    backgroundColor: "#C8622A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  btnPrimaryText: { fontSize: 14, fontWeight: "600", color: "white" },
  btnDisabled: { opacity: 0.6 },
});
