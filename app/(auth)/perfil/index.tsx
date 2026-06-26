// 📄 app/(auth)/perfil/index.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  Modal,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import QRCode from "react-native-qrcode-svg";
import { apiGet, apiPut, apiPost, apiDelete } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_BAR_HEIGHT =
  Platform.OS === "ios" ? 50 : (StatusBar.currentHeight ?? 24);
const SCREEN_WIDTH = Dimensions.get("window").width;

// ─── Colores ──────────────────────────────────────────────────
const C = {
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
  blanco: "#FFFFFF",
  fondo2: "#F2EDE6",
  oscuro: "#2C1F0E",
  oscuro2: "#3D2B1A",
} as const;

// ─── Tipos ────────────────────────────────────────────────────
type TabKey = "perfil" | "camino" | "resenas" | "checkin" | "config";

interface Perfil {
  id: string;
  nombre_display: string | null;
  bio: string | null;
  nacionalidad: string | null;
  pais_residencia: string | null;
  medio_transporte: string | null;
  medio_transporte_otro: string | null;
  modalidad_camino: string | null;
  modo_camino: string | null;
  numero_caminos: number | null;
  idioma_preferido: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface EtapaCompletada {
  id: string;
  etapa_id: string;
  fecha: string | null;
  nota_personal: string | null;
  etapas: {
    numero: number;
    nombre: string;
    slug: string;
    distancia_km: number | null;
  } | null;
}

interface Comentario {
  id: string;
  tipo_entidad: string;
  texto: string;
  valoracion: number | null;
  fecha_visita: string | null;
  created_at: string;
}

interface RegistroViaje {
  nombre: string;
  apellidos: string;
  sexo: string;
  fecha_nacimiento: string;
  nacionalidad: string;
  tipo_documento: string;
  numero_documento: string;
  numero_soporte: string;
  direccion_residencia: string;
  telefono: string;
}

// ─── Constantes ───────────────────────────────────────────────
const TRANSPORTES = [
  { value: "a_pie", icon: "🥾" },
  { value: "bici", icon: "🚲" },
  { value: "otro", icon: "•••" },
];

const MODALIDADES = [
  { value: "solo", labelKey: "solo" },
  { value: "pareja", labelKey: "pareja" },
  { value: "grupo", labelKey: "grupo" },
  { value: "familia", labelKey: "familia" },
  { value: "familia_ninos", labelKey: "familia_ninos" },
];

const MODOS = [
  { value: "continuo", labelKey: "continuo", subKey: "continuo_sub" },
  { value: "etapas_fds", labelKey: "etapas_fds", subKey: "etapas_fds_sub" },
  {
    value: "etapas_sueltas",
    labelKey: "etapas_sueltas",
    subKey: "etapas_sueltas_sub",
  },
];

const IDIOMAS = ["es", "en", "de", "fr", "it", "pt", "ko", "ja"];

const TIPOS_DOCUMENTO = ["DNI", "PASAPORTE", "NIE", "OTRO"];
const SEXOS = [
  { value: "M", labelKey: "sexo_m" },
  { value: "F", labelKey: "sexo_f" },
  { value: "X", labelKey: "sexo_x" },
];

const REGISTRO_VACIO: RegistroViaje = {
  nombre: "",
  apellidos: "",
  sexo: "",
  fecha_nacimiento: "",
  nacionalidad: "",
  tipo_documento: "DNI",
  numero_documento: "",
  numero_soporte: "",
  direccion_residencia: "",
  telefono: "",
};

function ordinalCamino(n: number, t: any): string {
  if (n <= 1) return t("perfil.primera_vez");
  return `${n}º ${t("perfil.camino_label")}`;
}

function registroCompleto(r: RegistroViaje): boolean {
  return !!(
    r.nombre &&
    r.apellidos &&
    r.sexo &&
    r.fecha_nacimiento &&
    r.nacionalidad &&
    r.tipo_documento &&
    r.numero_documento &&
    r.direccion_residencia
  );
}

// ─── Componentes auxiliares ───────────────────────────────────
function EmptyState({ texto }: { texto: string }) {
  return (
    <View
      style={{
        alignItems: "center",
        paddingVertical: 48,
        paddingHorizontal: 20,
      }}
    >
      <Text style={{ fontSize: 32, marginBottom: 12 }}>🐚</Text>
      <Text
        style={{
          fontSize: 13,
          color: C.tintaSoft,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        {texto}
      </Text>
    </View>
  );
}

function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[pillS.base, active && pillS.active]}
    >
      <Text style={[pillS.text, active && pillS.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const pillS = StyleSheet.create({
  base: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.piedra,
    backgroundColor: C.blanco,
  },
  active: { borderColor: C.acento, backgroundColor: C.acentoSoft },
  text: { fontSize: 13, color: C.tintaSoft },
  textActive: { color: C.acento, fontWeight: "600" },
});

// ─── Pantalla principal ───────────────────────────────────────
export default function PerfilScreen() {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [email, setEmail] = useState("");
  const [etapasCompletadas, setEtapasCompletadas] = useState<EtapaCompletada[]>(
    [],
  );
  const [totalEtapas, setTotalEtapas] = useState(34);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("perfil");

  // Perfil form
  const [nombre, setNombre] = useState("");
  const [bio, setBio] = useState("");
  const [nacionalidad, setNacionalidad] = useState("");
  const [paisResidencia, setPaisResidencia] = useState("");
  const [transporte, setTransporte] = useState("a_pie");
  const [transporteOtro, setTransporteOtro] = useState("");
  const [modalidad, setModalidad] = useState("");
  const [modoCamino, setModoCamino] = useState("");
  const [numeroCaminos, setNumeroCaminos] = useState(1);
  const [idioma, setIdioma] = useState(i18n.language ?? "en");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Registro viaje
  const [registro, setRegistro] = useState<RegistroViaje>(REGISTRO_VACIO);
  const [savingRegistro, setSavingRegistro] = useState(false);
  const [erroresRegistro, setErroresRegistro] = useState<
    Partial<Record<keyof RegistroViaje, string>>
  >({});
  const [qrVisible, setQrVisible] = useState(false);

  const TABS: { key: TabKey; label: string }[] = [
    { key: "perfil", label: t("perfil.tabs.perfil") },
    { key: "camino", label: t("perfil.tabs.camino") },
    { key: "resenas", label: t("perfil.tabs.resenas") },
    { key: "checkin", label: t("perfil.tabs.checkin") },
    { key: "config", label: t("perfil.tabs.config") },
  ];

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  async function loadData() {
    try {
      const [perfilRes, etapasRes, comentariosRes, registroRes] =
        await Promise.all([
          apiGet<{ perfil: Perfil; email: string }>("/api/peregrino/perfil"),
          apiGet<{ etapasCompletadas: EtapaCompletada[]; totalEtapas: number }>(
            "/api/peregrino/perfil/etapas",
          ),
          apiGet<{ comentarios: Comentario[] }>(
            "/api/peregrino/perfil/comentarios",
          ),
          apiGet<{ registro: RegistroViaje | null }>("/api/peregrino/registro"),
        ]);

      setPerfil(perfilRes.perfil);
      setEmail(perfilRes.email ?? "");
      setNombre(perfilRes.perfil.nombre_display ?? "");
      setBio(perfilRes.perfil.bio ?? "");
      setNacionalidad(perfilRes.perfil.nacionalidad ?? "");
      setPaisResidencia(perfilRes.perfil.pais_residencia ?? "");
      setTransporte(perfilRes.perfil.medio_transporte ?? "a_pie");
      setTransporteOtro(perfilRes.perfil.medio_transporte_otro ?? "");
      setModalidad(perfilRes.perfil.modalidad_camino ?? "");
      setModoCamino(perfilRes.perfil.modo_camino ?? "");
      setNumeroCaminos(perfilRes.perfil.numero_caminos ?? 1);
      setAvatarUrl(perfilRes.perfil.avatar_url ?? null);
      setEtapasCompletadas(etapasRes.etapasCompletadas ?? []);
      setTotalEtapas(etapasRes.totalEtapas ?? 34);
      setComentarios(comentariosRes.comentarios ?? []);

      const idiomaGuardado = perfilRes.perfil.idioma_preferido ?? "es";
      setIdioma(idiomaGuardado);
      i18n.changeLanguage(idiomaGuardado);

      if (registroRes.registro) {
        setRegistro({ ...REGISTRO_VACIO, ...registroRes.registro });
      } else {
        // Pre-rellenar con datos del perfil
        setRegistro((r) => ({
          ...r,
          nombre: perfilRes.perfil.nombre_display?.split(" ")[0] ?? "",
          nacionalidad: perfilRes.perfil.nacionalidad ?? "",
        }));
      }
    } catch {
      Alert.alert(t("general.error"));
    } finally {
      setLoading(false);
    }
  }

  async function putPerfil(body: Record<string, any>) {
    try {
      await apiPut("/api/peregrino/perfil", body);
      return true;
    } catch {
      return false;
    }
  }

  function showSaved(msg: string) {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(""), 3000);
  }

  async function handleGuardarPerfil() {
    setSaving(true);
    const ok = await putPerfil({
      nombre_display: nombre,
      bio,
      nacionalidad,
      pais_residencia: paisResidencia,
      medio_transporte: transporte,
      medio_transporte_otro: transporteOtro,
      modalidad_camino: modalidad,
      modo_camino: modoCamino,
      numero_caminos: numeroCaminos,
      idioma_preferido: idioma,
    });
    setSaving(false);
    showSaved(ok ? t("perfil.guardar") : t("general.error"));
  }

  async function handleGuardarRegistro() {
    if (!validarRegistro()) return;
    setSavingRegistro(true);
    try {
      await apiPost("/api/peregrino/registro", registro);
      showSaved(t("perfil.checkin.guardado_ok"));
    } catch {
      Alert.alert(t("general.error"));
    } finally {
      setSavingRegistro(false);
    }
  }

  function setReg(field: keyof RegistroViaje, value: string) {
    setRegistro((r) => ({ ...r, [field]: value }));
    if (erroresRegistro[field])
      setErroresRegistro((e) => ({ ...e, [field]: undefined }));
  }

  function validarRegistro(): boolean {
    const e: Partial<Record<keyof RegistroViaje, string>> = {};
    if (!registro.nombre) e.nombre = "Obligatorio";
    if (!registro.apellidos) e.apellidos = "Obligatorio";
    if (!registro.sexo) e.sexo = "Selecciona una opción";
    if (!registro.fecha_nacimiento) e.fecha_nacimiento = "Obligatorio";
    if (!registro.nacionalidad) e.nacionalidad = "Obligatorio";
    if (!registro.numero_documento) e.numero_documento = "Obligatorio";
    if (!registro.direccion_residencia) e.direccion_residencia = "Obligatorio";
    setErroresRegistro(e);
    return Object.keys(e).length === 0;
  }

  const qrData = registroCompleto(registro) ? JSON.stringify(registro) : null;

  async function handlePickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    const formData = new FormData();
    formData.append("file", {
      uri,
      type: "image/jpeg",
      name: "avatar.jpg",
    } as any);
    formData.append(
      "upload_preset",
      process.env.EXPO_PUBLIC_CLOUDINARY_AVATAR_PRESET ?? "avatares_upload",
    );
    formData.append("folder", "avatares");
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData },
      );
      const data = await res.json();
      if (data.secure_url) {
        setAvatarUrl(data.secure_url);
        await putPerfil({ avatar_url: data.secure_url });
        showSaved(t("perfil.foto_actualizada"));
      }
    } catch {
      Alert.alert(t("general.error"));
    }
  }

  async function handleCerrarSesion() {
    Alert.alert(t("perfil.cerrar_sesion"), t("perfil.cerrar_sesion_confirm"), [
      { text: t("general.cancelar"), style: "cancel" },
      {
        text: t("perfil.cerrar_sesion"),
        style: "destructive",
        onPress: () => {},
      },
    ]);
  }

  async function handleGuardarIdioma() {
    const ok = await putPerfil({ idioma_preferido: idioma });
    if (ok) {
      i18n.changeLanguage(idioma);
      showSaved(t("perfil.guardar_idioma"));
    }
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: C.fondo,
        }}
      >
        <ActivityIndicator size="large" color={C.acento} />
      </View>
    );
  }

  if (!perfil) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: C.fondo,
        }}
      >
        <Text style={{ color: C.rojo }}>{t("general.error")}</Text>
      </View>
    );
  }

  const iniciales = (perfil.nombre_display ?? email)
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const pctCamino = Math.round((etapasCompletadas.length / totalEtapas) * 100);

  return (
    <View style={{ flex: 1, backgroundColor: C.fondo }}>
      <StatusBar barStyle="light-content" />

      {/* ── MODAL QR PANTALLA COMPLETA ── */}
      <Modal
        visible={qrVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setQrVisible(false)}
      >
        <View style={s.qrModal}>
          <TouchableOpacity
            style={s.qrModalClose}
            onPress={() => setQrVisible(false)}
          >
            <Text style={{ fontSize: 16, color: C.blanco, fontWeight: "600" }}>
              ✕
            </Text>
          </TouchableOpacity>
          <Text style={s.qrModalNombre}>
            {registro.nombre} {registro.apellidos}
          </Text>
          <Text style={s.qrModalSub}>{t("perfil.checkin.qr_desc")}</Text>
          <View style={s.qrModalBox}>
            {qrData && (
              <QRCode
                value={qrData}
                size={SCREEN_WIDTH * 0.7}
                backgroundColor="white"
              />
            )}
          </View>
          <Text style={s.qrModalAviso}>
            {t("perfil.checkin.aviso_privacidad")}
          </Text>
        </View>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        keyboardShouldPersistTaps="handled"
      >
        {/* ── HEADER ── */}
        <View style={s.header}>
          {savedMsg !== "" && (
            <View style={s.savedBanner}>
              <Text style={s.savedText}>{savedMsg}</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={handlePickAvatar}
            activeOpacity={0.8}
            style={{ marginBottom: 12 }}
          >
            <View style={s.avatarWrap}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={s.avatarImg}
                  resizeMode="cover"
                />
              ) : (
                <Text style={s.avatarIniciales}>{iniciales}</Text>
              )}
              <View style={s.avatarCamara}>
                <Text style={{ fontSize: 10 }}>📷</Text>
              </View>
            </View>
          </TouchableOpacity>
          <Text style={s.headerNombre}>
            {perfil.nombre_display ?? t("perfil.peregrino")}
          </Text>
          {numeroCaminos > 1 && (
            <Text style={s.headerOrdinal}>
              {ordinalCamino(numeroCaminos, t)}
            </Text>
          )}
          <Text style={s.headerEmail}>{email}</Text>
          <View style={s.statsRow}>
            {[
              {
                valor: etapasCompletadas.length,
                label: t("perfil.tabs.camino"),
              },
              { valor: comentarios.length, label: t("perfil.tabs.resenas") },
            ].map((stat) => (
              <View key={stat.label} style={{ alignItems: "center" }}>
                <Text style={s.statValor}>{stat.valor}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── TABS ── */}
        <View style={s.tabsBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[s.tab, activeTab === tab.key && s.tabActive]}
              >
                <Text
                  style={[s.tabText, activeTab === tab.key && s.tabTextActive]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={s.content}>
          {/* ── TAB PERFIL ── */}
          {activeTab === "perfil" && (
            <View style={{ gap: 16 }}>
              <View style={s.card}>
                <Text style={s.fieldLabel}>{t("perfil.nombre")}</Text>
                <TextInput
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder={t("perfil.nombre_placeholder")}
                  placeholderTextColor={C.piedraDark}
                  style={s.input}
                />
                <Text style={[s.fieldLabel, { marginTop: 12 }]}>Bio</Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder={t("perfil.bio_placeholder")}
                  placeholderTextColor={C.piedraDark}
                  multiline
                  numberOfLines={3}
                  style={[s.input, { minHeight: 72, textAlignVertical: "top" }]}
                />
              </View>
              <View style={s.card}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>{t("perfil.nacionalidad")}</Text>
                    <TextInput
                      value={nacionalidad}
                      onChangeText={setNacionalidad}
                      placeholder="España"
                      placeholderTextColor={C.piedraDark}
                      style={s.input}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>
                      {t("perfil.pais_residencia")}
                    </Text>
                    <TextInput
                      value={paisResidencia}
                      onChangeText={setPaisResidencia}
                      placeholder="España"
                      placeholderTextColor={C.piedraDark}
                      style={s.input}
                    />
                  </View>
                </View>
              </View>
              <View style={s.card}>
                <Text style={s.fieldLabel}>{t("perfil.como_haces")}</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                  {TRANSPORTES.map((tr) => (
                    <TouchableOpacity
                      key={tr.value}
                      onPress={() => setTransporte(tr.value)}
                      activeOpacity={0.7}
                      style={[
                        s.transporteBtn,
                        transporte === tr.value && s.transporteBtnActive,
                        { flex: 1 },
                      ]}
                    >
                      <Text style={{ fontSize: 22 }}>{tr.icon}</Text>
                      <Text
                        style={[
                          s.transporteLabel,
                          transporte === tr.value && { color: C.acento },
                        ]}
                      >
                        {t(`perfil.transporte.${tr.value}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {transporte === "otro" && (
                  <TextInput
                    value={transporteOtro}
                    onChangeText={setTransporteOtro}
                    placeholder={t("perfil.transporte_otro_placeholder")}
                    placeholderTextColor={C.piedraDark}
                    style={[s.input, { marginTop: 10 }]}
                  />
                )}
              </View>
              <View style={s.card}>
                <Text style={s.fieldLabel}>{t("perfil.con_quien")}</Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  {MODALIDADES.map((m) => (
                    <Pill
                      key={m.value}
                      label={t(`perfil.modalidad.${m.value}`)}
                      active={modalidad === m.value}
                      onPress={() =>
                        setModalidad(modalidad === m.value ? "" : m.value)
                      }
                    />
                  ))}
                </View>
              </View>
              <View style={s.card}>
                <Text style={s.fieldLabel}>{t("perfil.como_organizas")}</Text>
                <View style={{ gap: 8, marginTop: 8 }}>
                  {MODOS.map((m) => (
                    <TouchableOpacity
                      key={m.value}
                      onPress={() =>
                        setModoCamino(modoCamino === m.value ? "" : m.value)
                      }
                      activeOpacity={0.7}
                      style={[
                        s.modoBtn,
                        modoCamino === m.value && s.modoBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          s.modoLabel,
                          modoCamino === m.value && { color: C.acento },
                        ]}
                      >
                        {t(`perfil.modo.${m.value}`)}
                      </Text>
                      <Text style={s.modoSub}>
                        {t(`perfil.modo.${m.subKey}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={s.card}>
                <Text style={s.fieldLabel}>{t("perfil.cuantas_veces")}</Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 20,
                    marginTop: 10,
                  }}
                >
                  <TouchableOpacity
                    onPress={() =>
                      setNumeroCaminos(Math.max(1, numeroCaminos - 1))
                    }
                    style={s.counterBtn}
                  >
                    <Text style={s.counterBtnText}>−</Text>
                  </TouchableOpacity>
                  <View style={{ alignItems: "center" }}>
                    <Text style={s.counterValor}>{numeroCaminos}</Text>
                    <Text style={s.counterLabel}>
                      {numeroCaminos === 1
                        ? t("perfil.primera_vez")
                        : `${numeroCaminos}º ${t("perfil.camino_label")}`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      setNumeroCaminos(Math.min(20, numeroCaminos + 1))
                    }
                    style={s.counterBtn}
                  >
                    <Text style={s.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleGuardarPerfil}
                disabled={saving}
                style={[s.btnPrimary, saving && { opacity: 0.6 }]}
              >
                <Text style={s.btnPrimaryText}>
                  {saving ? t("perfil.guardando") : t("perfil.guardar")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── TAB CAMINO ── */}
          {activeTab === "camino" && (
            <View style={{ gap: 12 }}>
              <View style={s.card}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 10,
                  }}
                >
                  <Text
                    style={{ fontSize: 14, fontWeight: "600", color: C.tinta }}
                  >
                    {t("perfil.progreso")}
                  </Text>
                  <Text
                    style={{ fontSize: 22, fontWeight: "700", color: C.acento }}
                  >
                    {etapasCompletadas.length}
                    <Text style={{ fontSize: 14, color: C.tintaSoft }}>
                      /{totalEtapas}
                    </Text>
                  </Text>
                </View>
                <View style={s.progressBar}>
                  <View
                    style={[s.progressFill, { width: `${pctCamino}%` as any }]}
                  />
                </View>
                <Text
                  style={{ fontSize: 11, color: C.tintaSoft, marginTop: 6 }}
                >
                  {pctCamino}% {t("perfil.completado")} ·{" "}
                  {totalEtapas - etapasCompletadas.length}{" "}
                  {t("perfil.etapas_restantes")}
                </Text>
              </View>
              {etapasCompletadas.length === 0 ? (
                <EmptyState texto={t("perfil.empty_camino")} />
              ) : (
                etapasCompletadas.map((ec) => (
                  <View key={ec.id} style={s.etapaCard}>
                    <View style={s.etapaCheck}>
                      <Text style={{ fontSize: 16 }}>✓</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.etapaNombre}>
                        {ec.etapas?.nombre ?? `Etapa ${ec.etapa_id}`}
                      </Text>
                      {ec.fecha && (
                        <Text style={s.etapaFecha}>
                          {new Date(ec.fecha).toLocaleDateString(
                            i18n.language,
                            { day: "numeric", month: "long", year: "numeric" },
                          )}
                        </Text>
                      )}
                      {ec.nota_personal && (
                        <Text style={s.etapaNota}>"{ec.nota_personal}"</Text>
                      )}
                    </View>
                    {ec.etapas?.distancia_km && (
                      <Text style={s.etapaKm}>{ec.etapas.distancia_km} km</Text>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          {/* ── TAB RESEÑAS ── */}
          {activeTab === "resenas" && (
            <View style={{ gap: 8 }}>
              {comentarios.length === 0 ? (
                <EmptyState texto={t("perfil.empty_resenas")} />
              ) : (
                comentarios.map((c) => (
                  <View key={c.id} style={s.card}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <Text style={s.resenaTag}>
                        {c.tipo_entidad === "albergue"
                          ? t("nav.albergues")
                          : t("etapa.recorrido")}
                      </Text>
                      {c.valoracion && (
                        <View style={{ flexDirection: "row", gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Text
                              key={i}
                              style={{
                                fontSize: 12,
                                color:
                                  i <= c.valoracion! ? C.acento : C.piedraDark,
                              }}
                            >
                              ★
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                    <Text
                      style={{ fontSize: 13, color: C.tinta, lineHeight: 20 }}
                    >
                      {c.texto}
                    </Text>
                    {c.fecha_visita && (
                      <Text
                        style={{
                          fontSize: 11,
                          color: C.tintaSoft,
                          marginTop: 6,
                        }}
                      >
                        {new Date(c.fecha_visita).toLocaleDateString(
                          i18n.language,
                          { day: "numeric", month: "long", year: "numeric" },
                        )}
                      </Text>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          {/* ── TAB CHECK-IN ── */}
          {activeTab === "checkin" && (
            <View style={{ gap: 16 }}>
              {/* Explicación */}
              <View
                style={[s.card, { borderColor: C.acento, borderWidth: 1.5 }]}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: C.tinta,
                    marginBottom: 8,
                  }}
                >
                  🏨 {t("perfil.checkin.titulo")}
                </Text>
                <Text
                  style={{ fontSize: 13, color: C.tintaSoft, lineHeight: 20 }}
                >
                  {t("perfil.checkin.descripcion")}
                </Text>
              </View>

              {/* QR */}
              {qrData ? (
                <View style={s.card}>
                  <Text style={s.fieldLabel}>{t("perfil.checkin.mi_qr")}</Text>
                  <View style={{ alignItems: "center", paddingVertical: 16 }}>
                    <QRCode value={qrData} size={180} backgroundColor="white" />
                  </View>
                  <Text
                    style={{
                      fontSize: 11,
                      color: C.tintaSoft,
                      textAlign: "center",
                      marginBottom: 12,
                    }}
                  >
                    {t("perfil.checkin.qr_desc")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setQrVisible(true)}
                    style={s.btnSecondary}
                  >
                    <Text style={s.btnSecondaryText}>
                      ⛶ {t("perfil.checkin.agrandar_qr")}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[s.card, { backgroundColor: C.fondo2 }]}>
                  <Text
                    style={{
                      fontSize: 13,
                      color: C.tintaSoft,
                      textAlign: "center",
                      lineHeight: 20,
                    }}
                  >
                    {t("perfil.checkin.qr_incompleto")}
                  </Text>
                </View>
              )}

              {/* ── Sección: Datos personales ── */}
              <Text style={s.seccionLabel}>
                {t("perfil.checkin.seccion_personal")}
              </Text>

              <View style={s.card}>
                <Text style={s.fieldLabel}>{t("perfil.checkin.nombre")} *</Text>
                <TextInput
                  value={registro.nombre}
                  onChangeText={(v) => setReg("nombre", v)}
                  style={[s.input, erroresRegistro.nombre && s.inputError]}
                  placeholderTextColor={C.piedraDark}
                  placeholder={t("perfil.checkin.nombre")}
                />
                {erroresRegistro.nombre && (
                  <Text style={s.fieldError}>{erroresRegistro.nombre}</Text>
                )}

                <Text style={[s.fieldLabel, { marginTop: 12 }]}>
                  {t("perfil.checkin.apellidos")} *
                </Text>
                <TextInput
                  value={registro.apellidos}
                  onChangeText={(v) => setReg("apellidos", v)}
                  style={[s.input, erroresRegistro.apellidos && s.inputError]}
                  placeholderTextColor={C.piedraDark}
                  placeholder={t("perfil.checkin.apellidos")}
                />
                {erroresRegistro.apellidos && (
                  <Text style={s.fieldError}>{erroresRegistro.apellidos}</Text>
                )}

                <Text style={[s.fieldLabel, { marginTop: 12 }]}>
                  {t("perfil.checkin.sexo")} *
                </Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                  {SEXOS.map((sx) => (
                    <TouchableOpacity
                      key={sx.value}
                      onPress={() => setReg("sexo", sx.value)}
                      activeOpacity={0.7}
                      style={[
                        pillS.base,
                        registro.sexo === sx.value && pillS.active,
                        erroresRegistro.sexo &&
                          !registro.sexo && {
                            borderColor: C.rojo,
                            backgroundColor: C.rojoSoft,
                          },
                        {
                          flex: 1,
                          justifyContent: "center",
                          alignItems: "center",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          pillS.text,
                          registro.sexo === sx.value && pillS.textActive,
                        ]}
                      >
                        {t(`perfil.checkin.${sx.labelKey}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {erroresRegistro.sexo && (
                  <Text style={s.fieldError}>{erroresRegistro.sexo}</Text>
                )}

                <Text style={[s.fieldLabel, { marginTop: 12 }]}>
                  {t("perfil.checkin.fecha_nacimiento")} *
                </Text>
                <TextInput
                  value={registro.fecha_nacimiento}
                  onChangeText={(v) => setReg("fecha_nacimiento", v)}
                  style={[
                    s.input,
                    erroresRegistro.fecha_nacimiento && s.inputError,
                  ]}
                  placeholderTextColor={C.piedraDark}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numeric"
                />
                {erroresRegistro.fecha_nacimiento && (
                  <Text style={s.fieldError}>
                    {erroresRegistro.fecha_nacimiento}
                  </Text>
                )}

                <Text style={[s.fieldLabel, { marginTop: 12 }]}>
                  {t("perfil.checkin.nacionalidad")} *
                </Text>
                <TextInput
                  value={registro.nacionalidad}
                  onChangeText={(v) => setReg("nacionalidad", v)}
                  style={[
                    s.input,
                    erroresRegistro.nacionalidad && s.inputError,
                  ]}
                  placeholderTextColor={C.piedraDark}
                  placeholder="España"
                />
                {erroresRegistro.nacionalidad && (
                  <Text style={s.fieldError}>
                    {erroresRegistro.nacionalidad}
                  </Text>
                )}
              </View>

              {/* ── Sección: Documento ── */}
              <Text style={s.seccionLabel}>
                {t("perfil.checkin.seccion_documento")}
              </Text>

              <View style={s.card}>
                <Text style={s.fieldLabel}>
                  {t("perfil.checkin.tipo_documento")} *
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                    marginTop: 6,
                    flexWrap: "wrap",
                  }}
                >
                  {TIPOS_DOCUMENTO.map((td) => (
                    <TouchableOpacity
                      key={td}
                      onPress={() => setReg("tipo_documento", td)}
                      activeOpacity={0.7}
                      style={[
                        pillS.base,
                        registro.tipo_documento === td && pillS.active,
                      ]}
                    >
                      <Text
                        style={[
                          pillS.text,
                          registro.tipo_documento === td && pillS.textActive,
                        ]}
                      >
                        {t(`perfil.checkin.tipo_${td.toLowerCase()}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[s.fieldLabel, { marginTop: 12 }]}>
                  {t("perfil.checkin.numero_documento")} *
                </Text>
                <TextInput
                  value={registro.numero_documento}
                  onChangeText={(v) => setReg("numero_documento", v)}
                  style={[
                    s.input,
                    erroresRegistro.numero_documento && s.inputError,
                  ]}
                  placeholderTextColor={C.piedraDark}
                  placeholder="12345678X"
                  autoCapitalize="characters"
                />
                {erroresRegistro.numero_documento && (
                  <Text style={s.fieldError}>
                    {erroresRegistro.numero_documento}
                  </Text>
                )}

                <Text style={[s.fieldLabel, { marginTop: 12 }]}>
                  {t("perfil.checkin.numero_soporte")}
                </Text>
                <TextInput
                  value={registro.numero_soporte}
                  onChangeText={(v) => setReg("numero_soporte", v)}
                  style={s.input}
                  placeholderTextColor={C.piedraDark}
                  placeholder="AAA123456"
                  autoCapitalize="characters"
                />
                <Text
                  style={{ fontSize: 11, color: C.tintaSoft, marginTop: 4 }}
                >
                  {t("perfil.checkin.numero_soporte_ayuda")}
                </Text>
              </View>

              {/* ── Sección: Contacto ── */}
              <Text style={s.seccionLabel}>
                {t("perfil.checkin.seccion_contacto")}
              </Text>

              <View style={s.card}>
                <Text style={s.fieldLabel}>
                  {t("perfil.checkin.direccion_residencia")} *
                </Text>
                <TextInput
                  value={registro.direccion_residencia}
                  onChangeText={(v) => setReg("direccion_residencia", v)}
                  style={[
                    s.input,
                    { minHeight: 60, textAlignVertical: "top" },
                    erroresRegistro.direccion_residencia && s.inputError,
                  ]}
                  placeholderTextColor={C.piedraDark}
                  placeholder="Calle, número, ciudad, país"
                  multiline
                />
                {erroresRegistro.direccion_residencia && (
                  <Text style={s.fieldError}>
                    {erroresRegistro.direccion_residencia}
                  </Text>
                )}

                <Text style={[s.fieldLabel, { marginTop: 12 }]}>
                  {t("perfil.checkin.telefono")}
                </Text>
                <TextInput
                  value={registro.telefono}
                  onChangeText={(v) => setReg("telefono", v)}
                  style={s.input}
                  placeholderTextColor={C.piedraDark}
                  placeholder="+34 600 000 000"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Aviso privacidad */}
              <View
                style={{ flexDirection: "row", gap: 8, paddingHorizontal: 4 }}
              >
                <Text style={{ fontSize: 11 }}>🔒</Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: C.tintaSoft,
                    lineHeight: 16,
                    flex: 1,
                  }}
                >
                  {t("perfil.checkin.aviso_privacidad")}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleGuardarRegistro}
                disabled={savingRegistro}
                style={[s.btnPrimary, savingRegistro && { opacity: 0.6 }]}
              >
                <Text style={s.btnPrimaryText}>
                  {savingRegistro
                    ? t("perfil.guardando")
                    : t("perfil.checkin.guardar")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── TAB CONFIG ── */}
          {activeTab === "config" && (
            <View style={{ gap: 12 }}>
              <View style={s.card}>
                <Text style={s.fieldLabel}>{t("perfil.idioma_preferido")}</Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginVertical: 12,
                  }}
                >
                  {IDIOMAS.map((id) => (
                    <Pill
                      key={id}
                      label={id.toUpperCase()}
                      active={idioma === id}
                      onPress={() => setIdioma(id)}
                    />
                  ))}
                </View>
                <TouchableOpacity
                  onPress={handleGuardarIdioma}
                  style={s.btnSecondary}
                >
                  <Text style={s.btnSecondaryText}>
                    {t("perfil.guardar_idioma")}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={s.card}>
                <Text style={s.fieldLabel}>{t("perfil.cuenta")}</Text>
                <Text
                  style={{ fontSize: 12, color: C.tintaSoft, marginTop: 8 }}
                >
                  Email
                </Text>
                <Text
                  style={{ fontSize: 14, color: C.tinta, marginBottom: 10 }}
                >
                  {email}
                </Text>
                <Text style={{ fontSize: 12, color: C.tintaSoft }}>
                  {t("perfil.miembro_desde")}
                </Text>
                <Text style={{ fontSize: 14, color: C.tinta }}>
                  {new Date(perfil.created_at).toLocaleDateString(
                    i18n.language,
                    { day: "numeric", month: "long", year: "numeric" },
                  )}
                </Text>
              </View>
              <View style={s.card}>
                <Text style={s.fieldLabel}>{t("perfil.sesion")}</Text>
                <TouchableOpacity
                  onPress={handleCerrarSesion}
                  style={s.btnLogout}
                >
                  <Text style={s.btnLogoutText}>
                    {t("perfil.cerrar_sesion")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────
const s = StyleSheet.create({
  header: {
    backgroundColor: C.oscuro,
    paddingTop: STATUS_BAR_HEIGHT + 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  savedBanner: {
    position: "absolute",
    top: STATUS_BAR_HEIGHT + 8,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  savedText: { fontSize: 12, color: C.blanco, fontWeight: "500" },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.acento,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImg: { width: 72, height: 72 },
  avatarIniciales: { fontSize: 24, fontWeight: "700", color: C.blanco },
  avatarCamara: {
    position: "absolute",
    bottom: 0,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.blanco,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  headerNombre: {
    fontSize: 20,
    fontWeight: "800",
    color: C.blanco,
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  headerOrdinal: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    marginBottom: 4,
  },
  headerEmail: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    marginBottom: 20,
  },
  statsRow: { flexDirection: "row", gap: 36 },
  statValor: {
    fontSize: 20,
    fontWeight: "700",
    color: "#D4A76A",
    textAlign: "center",
  },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 3 },
  tabsBar: {
    backgroundColor: C.blanco,
    borderBottomWidth: 1,
    borderBottomColor: C.piedra,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: C.acento },
  tabText: { fontSize: 13, color: C.tintaSoft },
  tabTextActive: { color: C.acento, fontWeight: "600" },
  content: { padding: 16, maxWidth: 640 },
  card: {
    backgroundColor: C.blanco,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.piedra,
    padding: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: C.tintaSoft,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  seccionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: C.tinta,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: C.piedra,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.tinta,
    backgroundColor: C.blanco,
  },
  transporteBtn: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.piedra,
    backgroundColor: C.blanco,
    alignItems: "center",
    gap: 6,
  },
  transporteBtnActive: { borderColor: C.acento, backgroundColor: C.acentoSoft },
  transporteLabel: { fontSize: 11, fontWeight: "500", color: C.tintaSoft },
  modoBtn: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.piedra,
    backgroundColor: C.blanco,
  },
  modoBtnActive: { borderColor: C.acento, backgroundColor: C.acentoSoft },
  modoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: C.tinta,
    marginBottom: 2,
  },
  modoSub: { fontSize: 11, color: C.tintaSoft },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.piedra,
    backgroundColor: C.blanco,
    justifyContent: "center",
    alignItems: "center",
  },
  counterBtnText: { fontSize: 18, color: C.tinta },
  counterValor: {
    fontSize: 28,
    fontWeight: "700",
    color: C.tinta,
    lineHeight: 32,
  },
  counterLabel: { fontSize: 11, color: C.tintaSoft, marginTop: 2 },
  progressBar: {
    height: 6,
    backgroundColor: C.piedra,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: { height: 6, backgroundColor: C.acento, borderRadius: 3 },
  etapaCard: {
    backgroundColor: C.blanco,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.piedra,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  etapaCheck: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#E8F5EC",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  etapaNombre: {
    fontSize: 14,
    fontWeight: "600",
    color: C.tinta,
    marginBottom: 2,
  },
  etapaFecha: { fontSize: 12, color: C.tintaSoft },
  etapaNota: {
    fontSize: 12,
    color: C.tintaSoft,
    fontStyle: "italic",
    marginTop: 4,
  },
  etapaKm: { fontSize: 12, color: C.tintaSoft, flexShrink: 0 },
  resenaTag: {
    fontSize: 11,
    fontWeight: "600",
    color: C.tintaSoft,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  btnPrimary: {
    backgroundColor: C.acento,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnPrimaryText: { color: C.blanco, fontSize: 14, fontWeight: "600" },
  btnSecondary: {
    borderWidth: 1,
    borderColor: C.acento,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: "flex-start",
  },
  btnSecondaryText: { color: C.acento, fontSize: 13, fontWeight: "600" },
  btnLogout: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FDECEA",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: C.blanco,
  },
  btnLogoutText: { color: C.rojo, fontSize: 14, fontWeight: "500" },
  // QR Modal
  qrModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  qrModalClose: {
    position: "absolute",
    top: 56,
    right: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  qrModalNombre: {
    fontSize: 20,
    fontWeight: "700",
    color: C.blanco,
    marginBottom: 6,
    textAlign: "center",
  },
  qrModalSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 32,
    textAlign: "center",
  },
  qrModalBox: { backgroundColor: C.blanco, borderRadius: 20, padding: 24 },
  qrModalAviso: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    marginTop: 24,
    textAlign: "center",
    lineHeight: 16,
  },
  inputError: {
    borderColor: C.rojo,
    backgroundColor: C.rojoSoft,
  },
  fieldError: {
    fontSize: 11,
    color: C.rojo,
    marginTop: 4,
  },
});
