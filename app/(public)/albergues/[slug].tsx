// 📄 app/(public)/albergues/[slug].tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
  Dimensions,
  ActivityIndicator,
  Platform,
  StatusBar,
  Linking,
  FlatList,
  TextInput,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { apiGet } from "@/lib/api";
import {
  useInteractions,
  TipoReaccion,
  Comentario,
  UseInteractionsReturn,
} from "@/hooks/useInteractions";

import i18n from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { getCanalAlbergue, getDmAlbergue } from "@/lib/chat";

const getServicioLabel = (key: string): string => {
  const label = i18n.t(`albergues.servicios_labels.${key}`);
  // Si devuelve la clave es que no la encontró
  return label.includes("albergues.servicios_labels") ? key : label;
};

const { width: SW } = Dimensions.get("window");
const STATUS_BAR_HEIGHT =
  Platform.OS === "ios" ? 50 : (StatusBar.currentHeight ?? 24);

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TipoAlbergue = "municipal" | "privado" | "parroquial" | "asociacion";
type OcupacionAlbergue = "libre" | "casi_lleno" | "completo";

interface AlbergueDetalle {
  id: string;
  slug: string;
  nombre: string;
  localidad: string | null;
  ubicacion: string | null;
  tipo: TipoAlbergue;
  precio_cama: string | null;
  precio_habitacion: string | null;
  precio_desde: number | null;
  telefono: string | null;
  web: string | null;
  tiene_booking: boolean | null;
  capacidad_total: number | null;
  plazas_totales: number | null;
  ocupacion: OcupacionAlbergue;
  descripcion: string | null;
  foto_url: string | null;
  fotos_urls: string[] | null;
  servicios: Record<string, boolean> | null;
  plan: string | null;
  etapas: { numero: number; nombre: string; slug: string } | null;
  coords_lat: number | null;
  coords_lng: number | null;
}

// ─── Colores ──────────────────────────────────────────────────────────────────

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
  amarillo: "#D4A017",
  amarilloSoft: "#FDF6E3",
  blanco: "#FFFFFF",
  fondo2: "#F2EDE6",
} as const;

const LOCALE_FLAGS: Record<string, string> = {
  es: "🇪🇸",
  en: "🇬🇧",
  de: "🇩🇪",
  fr: "🇫🇷",
  it: "🇮🇹",
  pt: "🇵🇹",
  ko: "🇰🇷",
  ja: "🇯🇵",
};

// Fuera del componente — lookup directo sin t()
const SERVICIOS_LABELS: Record<string, string> = {
  wifi: "WiFi",
  cocina: "Cocina",
  cenas: "Cenas",
  desayuno: "Desayuno",
  lavadora: "Lavadora",
  secadora: "Secadora",
  parking_bici: "Parking bici",
  taquillas: "Taquillas",
  aire_acond: "Aire acond.",
  calefaccion: "Calefacción",
  piscina: "Piscina",
  jardin_terraza: "Jardín/Terraza",
  admite_perros: "Admite perros",
  bar: "Bar",
  restaurante: "Restaurante",
  tienda: "Tienda",
  parking: "Parking",
  bici: "Bici",
};

// ─── Utils ────────────────────────────────────────────────────────────────────

function ocupacionColor(o: OcupacionAlbergue) {
  return o === "libre" ? C.verde : o === "casi_lleno" ? C.amarillo : C.rojo;
}
function ocupacionBg(o: OcupacionAlbergue) {
  return o === "libre"
    ? C.verdeSoft
    : o === "casi_lleno"
      ? C.amarilloSoft
      : C.rojoSoft;
}

function tiempoRelativo(fecha: string): string {
  const diff = Date.now() - new Date(fecha).getTime();
  const min = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min}m`;
  if (h < 24) return `hace ${h}h`;
  if (d < 7) return `hace ${d}d`;
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── RatingStars ──────────────────────────────────────────────────────────────

function RatingStars({
  value,
  onChange,
  readonly = false,
  size = "md",
  showLabel = false,
}: {
  value: number | null;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const px = size === "sm" ? 14 : size === "lg" ? 26 : 20;
  const LABELS = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];
  const displayed = value ?? 0;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          disabled={readonly}
          onPress={() => onChange?.(n)}
          hitSlop={4}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontSize: px,
              color: n <= displayed ? C.acento : C.piedraDark,
            }}
          >
            ★
          </Text>
        </TouchableOpacity>
      ))}
      {showLabel && displayed > 0 && (
        <Text style={{ fontSize: 13, color: C.tintaSoft, marginLeft: 4 }}>
          {LABELS[displayed]}
          {!readonly && value !== null && (
            <Text style={{ fontSize: 11, color: C.piedraDark }}>
              {" "}
              · toca para cambiar
            </Text>
          )}
        </Text>
      )}
    </View>
  );
}

// ─── ReaccionBar ──────────────────────────────────────────────────────────────

const REACCIONES_DEF: { tipo: TipoReaccion; label: string; icon: string }[] = [
  { tipo: "util", label: "Útil", icon: "👍" },
  { tipo: "bonito", label: "Bonito", icon: "✨" },
  { tipo: "dificil", label: "Difícil", icon: "⚠️" },
  { tipo: "cuidado", label: "Con cuidado", icon: "🧭" },
];

function ReaccionBar({
  reacciones,
  misReacciones,
  onToggle,
  disabled,
}: {
  reacciones: { tipo_reaccion: TipoReaccion }[];
  misReacciones: TipoReaccion[];
  onToggle?: (tipo: TipoReaccion) => void;
  disabled?: boolean;
}) {
  const contar = (tipo: TipoReaccion) =>
    reacciones.filter((r) => r.tipo_reaccion === tipo).length;

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {REACCIONES_DEF.map(({ tipo, label, icon }) => {
        const count = contar(tipo);
        const activa = misReacciones.includes(tipo);
        return (
          <TouchableOpacity
            key={tipo}
            disabled={disabled || !onToggle}
            onPress={() => onToggle?.(tipo)}
            activeOpacity={0.7}
            style={[reaStyles.pill, activa && reaStyles.pillActiva]}
          >
            <Text style={{ fontSize: 14 }}>{icon}</Text>
            <Text style={[reaStyles.label, activa && reaStyles.labelActiva]}>
              {label}
            </Text>
            {count > 0 && (
              <Text style={[reaStyles.count, activa && { color: C.acento }]}>
                {count}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const reaStyles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.piedra,
    backgroundColor: C.blanco,
  },
  pillActiva: { borderColor: C.acento, backgroundColor: C.acentoSoft },
  label: { fontSize: 13, color: C.tintaSoft },
  labelActiva: { color: C.acento, fontWeight: "600" },
  count: { fontSize: 12, color: C.piedraDark, fontWeight: "500" },
});

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  nombre,
  avatarUrl,
  idioma,
}: {
  nombre: string | null;
  avatarUrl: string | null;
  idioma?: string | null;
}) {
  const inicial = (nombre ?? "P")[0].toUpperCase();
  const flag = idioma ? LOCALE_FLAGS[idioma] : null;
  return (
    <View style={{ width: 36, height: 36, position: "relative" }}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={avStyles.img} />
      ) : (
        <View style={avStyles.placeholder}>
          <Text style={avStyles.inicial}>{inicial}</Text>
        </View>
      )}
      {flag && <Text style={avStyles.flag}>{flag}</Text>}
    </View>
  );
}

const avStyles = StyleSheet.create({
  img: { width: 36, height: 36, borderRadius: 18 },
  placeholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.acentoSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  inicial: { fontSize: 15, fontWeight: "600", color: C.acento },
  flag: { position: "absolute", bottom: -2, right: -4, fontSize: 11 },
});

// ─── ComentarioItem ───────────────────────────────────────────────────────────

function ComentarioItem({
  comentario,
  userId,
  interactions,
  nivel = 0,
}: {
  comentario: Comentario;
  userId?: string;
  interactions: UseInteractionsReturn;
  nivel?: number;
}) {
  const [respondiendo, setRespondiendo] = useState(false);
  const [editando, setEditando] = useState(false);
  const [textoResp, setTextoResp] = useState("");
  const [textoEdit, setTextoEdit] = useState(comentario.texto);
  const esMio = userId === comentario.autor_id;
  const nombre = comentario.autor?.nombre_display ?? "Peregrino";

  const handleResponder = async () => {
    if (!textoResp.trim()) return;
    await interactions.addComentario(textoResp.trim(), {
      parentId: comentario.id,
    });
    setTextoResp("");
    setRespondiendo(false);
  };

  const handleEditar = async () => {
    if (!textoEdit.trim()) return;
    await interactions.editComentario(comentario.id, textoEdit.trim());
    setEditando(false);
  };

  const handleEliminar = () => {
    Alert.alert("Eliminar comentario", "¿Seguro que quieres eliminarlo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => interactions.deleteComentario(comentario.id),
      },
    ]);
  };

  return (
    <View style={{ marginLeft: nivel > 0 ? 46 : 0 }}>
      <View style={comStyles.row}>
        <Avatar
          nombre={nombre}
          avatarUrl={comentario.autor?.avatar_url ?? null}
          idioma={comentario.autor?.idioma_nativo}
        />
        <View style={{ flex: 1 }}>
          {/* Meta */}
          <View style={comStyles.meta}>
            <Text style={comStyles.autor}>{nombre}</Text>
            {comentario.rol_autor === "hospitalero" && (
              <View style={comStyles.badgeHosp}>
                <Text style={comStyles.badgeHospText}>Hospitalero</Text>
              </View>
            )}
            {comentario.valoracion && (
              <RatingStars value={comentario.valoracion} readonly size="sm" />
            )}
            <Text style={comStyles.tiempo}>
              {tiempoRelativo(comentario.created_at)}
            </Text>
          </View>

          {/* Texto o editor */}
          {editando ? (
            <View style={{ marginBottom: 8 }}>
              <TextInput
                value={textoEdit}
                onChangeText={setTextoEdit}
                multiline
                style={comStyles.input}
              />
              <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                <TouchableOpacity
                  style={comStyles.btnPrimary}
                  onPress={handleEditar}
                  disabled={interactions.submitting}
                >
                  <Text style={comStyles.btnPrimaryText}>Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={comStyles.btnSecondary}
                  onPress={() => setEditando(false)}
                >
                  <Text style={comStyles.btnSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={comStyles.texto}>{comentario.texto}</Text>
          )}

          {/* Acciones */}
          {!editando && (
            <View style={comStyles.acciones}>
              {userId && nivel === 0 && (
                <TouchableOpacity
                  onPress={() => setRespondiendo(!respondiendo)}
                >
                  <Text style={comStyles.accionText}>Responder</Text>
                </TouchableOpacity>
              )}
              {esMio && (
                <>
                  <TouchableOpacity onPress={() => setEditando(true)}>
                    <Text style={comStyles.accionText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleEliminar}>
                    <Text style={[comStyles.accionText, { color: C.rojo }]}>
                      Eliminar
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Formulario respuesta */}
          {respondiendo && (
            <View style={{ marginTop: 10 }}>
              <TextInput
                value={textoResp}
                onChangeText={setTextoResp}
                placeholder="Tu respuesta..."
                placeholderTextColor={C.piedraDark}
                multiline
                style={comStyles.input}
              />
              <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                <TouchableOpacity
                  style={comStyles.btnPrimary}
                  onPress={handleResponder}
                  disabled={interactions.submitting}
                >
                  <Text style={comStyles.btnPrimaryText}>Responder</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={comStyles.btnSecondary}
                  onPress={() => setRespondiendo(false)}
                >
                  <Text style={comStyles.btnSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Respuestas anidadas */}
      {(comentario.respuestas ?? []).length > 0 && (
        <View style={comStyles.respuestasContainer}>
          {(comentario.respuestas ?? []).map((r) => (
            <ComentarioItem
              key={r.id}
              comentario={r}
              userId={userId}
              interactions={interactions}
              nivel={1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const comStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, marginBottom: 4 },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 4,
  },
  autor: { fontSize: 14, fontWeight: "600", color: C.tinta },
  tiempo: { fontSize: 12, color: C.piedraDark },
  texto: { fontSize: 14, color: C.tinta, lineHeight: 21, marginBottom: 6 },
  acciones: { flexDirection: "row", gap: 14 },
  accionText: { fontSize: 12, color: C.tintaSoft },
  badgeHosp: {
    backgroundColor: "rgba(45,90,60,0.12)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeHospText: { fontSize: 11, color: "#2D5A3C", fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: C.piedra,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: C.tinta,
    backgroundColor: C.blanco,
    minHeight: 72,
    textAlignVertical: "top",
  },
  btnPrimary: {
    backgroundColor: C.acento,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  btnPrimaryText: { color: C.blanco, fontSize: 13, fontWeight: "600" },
  btnSecondary: {
    borderWidth: 1,
    borderColor: C.piedra,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  btnSecondaryText: { color: C.tintaSoft, fontSize: 13 },
  respuestasContainer: {
    marginTop: 8,
    paddingLeft: 46,
    borderLeftWidth: 2,
    borderLeftColor: C.piedra,
  },
});

// ─── Galería ──────────────────────────────────────────────────────────────────

function Galeria({ fotos }: { fotos: string[] }) {
  const [idx, setIdx] = useState(0);
  const flatRef = useRef<FlatList>(null);

  if (!fotos.length) {
    return (
      <View
        style={[
          galStyles.container,
          {
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: C.piedra,
          },
        ]}
      >
        <Text style={{ fontSize: 48 }}>🏠</Text>
      </View>
    );
  }

  return (
    <View style={galStyles.container}>
      <FlatList
        ref={flatRef}
        data={fotos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={galStyles.foto}
            resizeMode="cover"
          />
        )}
        onMomentumScrollEnd={(e) =>
          setIdx(Math.round(e.nativeEvent.contentOffset.x / SW))
        }
      />
      {fotos.length > 1 && (
        <>
          <View style={galStyles.contador}>
            <Text style={galStyles.contadorText}>
              {idx + 1}/{fotos.length}
            </Text>
          </View>
          <View style={galStyles.miniaturas}>
            {fotos.map((f, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  flatRef.current?.scrollToIndex({ index: i, animated: true });
                  setIdx(i);
                }}
              >
                <Image
                  source={{ uri: f }}
                  style={[galStyles.mini, i === idx && galStyles.miniActiva]}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const galStyles = StyleSheet.create({
  container: { width: SW, height: 260 },
  foto: { width: SW, height: 260 },
  contador: {
    position: "absolute",
    top: STATUS_BAR_HEIGHT + 8,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  contadorText: { color: C.blanco, fontSize: 12, fontWeight: "600" },
  miniaturas: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
  },
  mini: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  miniActiva: { borderColor: C.acento },
});

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function AlbergueSlugScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [albergue, setAlbergue] = useState<AlbergueDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const { user, token } = useAuth();
  const userId = user?.id;

  const [puedeContactar, setPuedeContactar] = useState(true);

  useEffect(() => {
    if (!albergue?.id) return;
    fetch(
      `${process.env.EXPO_PUBLIC_API_URL ?? "https://camino-api.onrender.com"}/api/dm-entidad/albergue/${albergue.id}/estado`,
    )
      .then((r) => r.json())
      .then((data) => setPuedeContactar(data.puede_contactar ?? true))
      .catch(() => setPuedeContactar(true)); // en caso de error, mostrar el botón
  }, [albergue?.id]);

  useEffect(() => {
    if (!slug) return;
    apiGet<{ albergue: AlbergueDetalle }>(`/api/albergues/${slug}`)
      .then(({ albergue }) => setAlbergue(albergue))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const interactions = useInteractions("albergue", albergue?.id ?? "");

  const [textoComentario, setTextoComentario] = useState("");
  const [valoracionForm, setValoracionForm] = useState<number | null>(null);
  const [formExpandido, setFormExpandido] = useState(false);

  const handlePublicar = async () => {
    if (!textoComentario.trim()) return;
    await interactions.addComentario(textoComentario.trim(), {
      valoracion: valoracionForm ?? undefined,
    });
    setTextoComentario("");
    setValoracionForm(null);
    setFormExpandido(false);
  };

  if (loading)
    return (
      <View
        style={[
          s.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={C.acento} />
      </View>
    );

  if (error || !albergue)
    return (
      <View
        style={[
          s.container,
          { justifyContent: "center", alignItems: "center", gap: 12 },
        ]}
      >
        <Text style={{ color: C.rojo }}>{t("albergues.errorCarga")}</Text>
        <TouchableOpacity onPress={() => router.back()} style={s.retryBtn}>
          <Text style={s.retryText}>{t("general.volver")}</Text>
        </TouchableOpacity>
      </View>
    );

  const fotos = [
    ...(albergue.foto_url ? [albergue.foto_url] : []),
    ...(Array.isArray(albergue.fotos_urls) ? albergue.fotos_urls : []),
  ].filter(Boolean);

  const descripcion =
    (albergue as any)[`descripcion_${locale}`] ?? albergue.descripcion;
  const ubicacion =
    (albergue as any)[`ubicacion_${locale}`] ?? albergue.ubicacion;

  const isPlus = albergue.plan === "plus" || albergue.plan === "premium";

  const serviciosActivos = albergue.servicios
    ? Object.entries(albergue.servicios)
        .filter(([, v]) => v === true)
        .map(([k]) => {
          const bundle = i18n.getResourceBundle(locale, "common");
          const label = bundle?.albergues?.servicios_labels?.[k];
          return { key: k, label: label ?? k };
        })
    : [];
  const { resumen, comentarios, misReacciones, reacciones, miValoracion } =
    interactions;
  const totalComentarios = resumen.total_comentarios + resumen.total_respuestas;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* Botón volver */}
      <TouchableOpacity
        style={s.backBtn}
        onPress={() => router.back()}
        hitSlop={8}
      >
        <Text style={s.backIcon}>‹</Text>
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        keyboardShouldPersistTaps="handled"
      >
        {/* Galería */}
        <Galeria fotos={fotos} />

        {/* Cabecera */}
        <View style={s.cabecera}>
          {albergue.etapas && (
            <TouchableOpacity
              onPress={() =>
                router.push(`/(public)/etapas/${albergue.etapas!.slug}`)
              }
            >
              <Text style={s.etapaLink}>
                Etapa {albergue.etapas.numero} · {albergue.etapas.nombre}
              </Text>
            </TouchableOpacity>
          )}
          <View style={s.nombreRow}>
            <Text style={s.nombre}>{albergue.nombre}</Text>
            {isPlus && (
              <View style={s.badgePlus}>
                <Text style={s.badgePlusText}>Plus</Text>
              </View>
            )}
          </View>
          <View style={s.metaRow}>
            {albergue.localidad && (
              <Text style={s.localidad}>
                {albergue.localidad}
                {ubicacion ? ` · ${ubicacion}` : ""}
              </Text>
            )}
            <View style={s.tipoPill}>
              <Text style={s.tipoText}>
                {t(`albergues.tipo.${albergue.tipo}`)}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statValor}>
              {albergue.precio_cama ??
                (albergue.precio_desde ? `${albergue.precio_desde}€` : "—")}
            </Text>
            <Text style={s.statLabel}>{t("albergues.porCama")}</Text>
          </View>
          <View style={[s.statBox, s.statBorder]}>
            <Text style={s.statValor}>{albergue.precio_habitacion ?? "—"}</Text>
            <Text style={s.statLabel}>{t("albergues.habitacion")}</Text>
          </View>
          <View
            style={[
              s.statBox,
              s.statBorder,
              { backgroundColor: ocupacionBg(albergue.ocupacion) },
            ]}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            >
              <View
                style={[
                  s.ocupDot,
                  { backgroundColor: ocupacionColor(albergue.ocupacion) },
                ]}
              />
              <Text
                style={[
                  s.statValor,
                  { color: ocupacionColor(albergue.ocupacion), fontSize: 13 },
                ]}
              >
                {t(`albergues.ocupacion.${albergue.ocupacion}`)}
              </Text>
            </View>
            <Text
              style={[
                s.statLabel,
                { color: ocupacionColor(albergue.ocupacion) },
              ]}
            >
              {t("albergues.plazas")}
            </Text>
          </View>
        </View>

        {/* Descripción */}
        {descripcion && (
          <View style={s.seccion}>
            <Text style={s.seccionTitulo}>
              {t("albergues.sobreEsteAlbergue")}
            </Text>
            <Text style={s.descripcion}>{descripcion}</Text>
          </View>
        )}

        {/* Servicios */}
        {/* Servicios */}
        {serviciosActivos.length > 0 && (
          <View style={s.seccion}>
            <Text style={s.seccionTitulo}>{t("albergues.servicios")}</Text>
            <View style={s.serviciosGrid}>
              {serviciosActivos.map((sv) => (
                <View key={sv.key} style={s.servicioPill}>
                  <Text style={s.servicioText}>{sv.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        {/* Contacto */}
        <View style={s.seccion}>
          <Text style={s.seccionTitulo}>{t("albergues.contacto")}</Text>
          <View style={{ gap: 10 }}>
            {/* Canal público */}
            <TouchableOpacity
              style={s.contactoItem}
              activeOpacity={0.7}
              onPress={async () => {
                try {
                  const result = await getCanalAlbergue(albergue.id);
                  router.push(`/(private)/mensajes/${result.id}` as any);
                } catch (e: any) {
                  Alert.alert("Error canal", String(e.message));
                }
              }}
            >
              <View style={[s.contactoIcon, { backgroundColor: "#EAF1F7" }]}>
                <Text style={s.contactoEmoji}>💬</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.contactoTitulo}>
                  {t("albergues.canalAlbergue")}
                </Text>
                <Text style={s.contactoSub}>
                  {t("albergues.canalPublicoDesc")}
                </Text>
              </View>
              <Text style={s.contactoArrow}>›</Text>
            </TouchableOpacity>

            {/* Mensaje privado — solo si puede contactar */}
            {puedeContactar && (
              <TouchableOpacity
                style={[s.contactoItem, s.contactoItemDark]}
                activeOpacity={0.7}
                onPress={async () => {
                  if (!user) {
                    router.push("/(auth)/login" as any);
                    return;
                  }
                  try {
                    const API_URL =
                      process.env.EXPO_PUBLIC_API_URL ??
                      "https://camino-api.onrender.com";
                    const { token } = useAuth(); // ya tienes token en el scope
                    const res = await fetch(
                      `${API_URL}/api/dm-entidad/albergue/${albergue.id}`,
                      {
                        headers: { Authorization: `Bearer ${token}` },
                      },
                    );
                    if (res.status === 403) {
                      // No debería pasar (el botón no aparece) pero por seguridad
                      return;
                    }
                    const data = await res.json();
                    router.push(`/(private)/mensajes/${data.id}` as any);
                  } catch (e: any) {
                    Alert.alert("Error", String(e.message));
                  }
                }}
              >
                <View
                  style={[
                    s.contactoIcon,
                    { backgroundColor: "rgba(255,255,255,0.2)" },
                  ]}
                >
                  <Text style={s.contactoEmoji}>🔒</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.contactoTitulo, { color: C.blanco }]}>
                    {t("albergues.mensajePrivado")}
                  </Text>
                  <Text
                    style={[s.contactoSub, { color: "rgba(255,255,255,0.7)" }]}
                  >
                    {t("albergues.mensajePrivadoDesc")}
                  </Text>
                </View>
                <Text
                  style={[s.contactoArrow, { color: "rgba(255,255,255,0.6)" }]}
                >
                  ›
                </Text>
              </TouchableOpacity>
            )}

            {/* Cómo llegar */}
            {albergue.coords_lat && albergue.coords_lng && (
              <TouchableOpacity
                style={s.contactoItem}
                activeOpacity={0.7}
                onPress={() =>
                  Linking.openURL(
                    `https://www.google.com/maps/dir/?api=1&destination=${albergue.coords_lat},${albergue.coords_lng}&travelmode=walking`,
                  )
                }
              >
                <View style={[s.contactoIcon, { backgroundColor: "#FFF3E0" }]}>
                  <Text style={s.contactoEmoji}>🧭</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.contactoTitulo}>Cómo llegar</Text>
                  <Text style={s.contactoSub}>{albergue.localidad}</Text>
                </View>
                <Text style={s.contactoArrow}>›</Text>
              </TouchableOpacity>
            )}

            {/* Teléfono — restaurar original */}
            {albergue.telefono && (
              <TouchableOpacity
                style={s.contactoItem}
                activeOpacity={0.7}
                onPress={() => Linking.openURL(`tel:${albergue.telefono}`)}
              >
                <View
                  style={[s.contactoIcon, { backgroundColor: C.verdeSoft }]}
                >
                  <Text style={s.contactoEmoji}>📞</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.contactoTitulo}>{albergue.telefono}</Text>
                  <Text style={s.contactoSub}>
                    {t("albergues.llamarWhatsapp")}
                  </Text>
                </View>
                <Text style={s.contactoArrow}>›</Text>
              </TouchableOpacity>
            )}

            {albergue.web && (
              <TouchableOpacity
                style={s.contactoItem}
                activeOpacity={0.7}
                onPress={() => Linking.openURL(albergue.web!)}
              >
                <View style={[s.contactoIcon, { backgroundColor: "#EAF1F7" }]}>
                  <Text style={s.contactoEmoji}>🌐</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.contactoTitulo}>
                    {t("albergues.webOficial")}
                  </Text>
                  <Text style={s.contactoSub} numberOfLines={1}>
                    {albergue.web.replace(/^https?:\/\//, "")}
                  </Text>
                </View>
                <Text style={s.contactoArrow}>›</Text>
              </TouchableOpacity>
            )}

            {albergue.tiene_booking && (
              <TouchableOpacity
                style={s.bookingBtn}
                onPress={() =>
                  Linking.openURL(
                    `https://www.booking.com/search.html?ss=${encodeURIComponent(albergue.nombre)}`,
                  )
                }
              >
                <Text style={s.bookingText}>Reservar en Booking.com</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Valoración global ── */}
        {resumen.media_valoracion !== null && (
          <View style={s.seccion}>
            <View style={s.valoracionGlobal}>
              <View>
                <Text style={s.seccionTituloSm}>Valoración de peregrinos</Text>
                <RatingStars
                  value={Math.round(resumen.media_valoracion)}
                  readonly
                  size="lg"
                />
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={s.mediaNumero}>
                  {resumen.media_valoracion.toFixed(1)}
                </Text>
                <Text style={s.mediaTotal}>
                  {resumen.total_valoraciones} valoración
                  {resumen.total_valoraciones !== 1 ? "es" : ""}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Mi valoración ── */}
        {userId && (
          <View style={s.seccion}>
            <Text style={s.seccionTituloSm}>Tu valoración</Text>
            <RatingStars
              value={miValoracion?.puntuacion ?? null}
              onChange={(v) => interactions.setValoracion(v, "general")}
              size="lg"
              showLabel
            />
          </View>
        )}

        {/* ── Reacciones ── */}
        <View style={s.seccion}>
          <Text style={s.seccionTituloSm}>
            ¿Cómo describirías este albergue?
          </Text>
          <ReaccionBar
            reacciones={reacciones}
            misReacciones={misReacciones}
            onToggle={userId ? interactions.toggleReaccion : undefined}
            disabled={interactions.submitting}
          />
        </View>

        {/* ── Comentarios ── */}
        <View style={s.seccion}>
          <View style={s.comentariosCabecera}>
            <Text style={s.seccionTitulo}>
              Comentarios{totalComentarios > 0 ? ` (${totalComentarios})` : ""}
            </Text>
            {resumen.media_valoracion && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <RatingStars
                  value={Math.round(resumen.media_valoracion)}
                  readonly
                  size="sm"
                />
                <Text style={{ fontSize: 13, color: C.tintaSoft }}>
                  {resumen.media_valoracion.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          {/* Formulario */}
          {userId ? (
            <View style={s.formComentario}>
              <View style={s.formValoracion}>
                <Text style={{ fontSize: 13, color: C.tintaSoft }}>
                  Tu valoración
                </Text>
                <RatingStars
                  value={valoracionForm}
                  onChange={setValoracionForm}
                  size="md"
                />
              </View>
              <TextInput
                value={textoComentario}
                onChangeText={setTextoComentario}
                onFocus={() => setFormExpandido(true)}
                placeholder={t("albergues.comentarioPlaceholder")}
                placeholderTextColor={C.piedraDark}
                multiline
                numberOfLines={formExpandido ? 4 : 2}
                style={[s.formInput, formExpandido && { minHeight: 90 }]}
              />
              {formExpandido && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <TouchableOpacity
                    style={comStyles.btnSecondary}
                    onPress={() => {
                      setFormExpandido(false);
                      setTextoComentario("");
                      setValoracionForm(null);
                    }}
                  >
                    <Text style={comStyles.btnSecondaryText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      comStyles.btnPrimary,
                      !textoComentario.trim() && { opacity: 0.5 },
                    ]}
                    onPress={handlePublicar}
                    disabled={
                      !textoComentario.trim() || interactions.submitting
                    }
                  >
                    <Text style={comStyles.btnPrimaryText}>
                      {interactions.submitting ? "Publicando..." : "Publicar"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              style={s.loginBanner}
            >
              <Text style={s.loginBannerText}>
                <Text style={{ color: C.acento, fontWeight: "600" }}>
                  Inicia sesión
                </Text>{" "}
                para dejar tu opinión
              </Text>
            </TouchableOpacity>
          )}

          {/* Lista comentarios */}
          {interactions.loading ? (
            <ActivityIndicator color={C.acento} style={{ marginTop: 20 }} />
          ) : comentarios.length === 0 ? (
            <Text style={s.sinComentarios}>
              Sé el primero en comentar este albergue
            </Text>
          ) : (
            <View style={{ gap: 20, marginTop: 16 }}>
              {comentarios.map((c) => (
                <ComentarioItem
                  key={c.id}
                  comentario={c}
                  userId={userId}
                  interactions={interactions}
                />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.fondo },
  backBtn: {
    position: "absolute",
    top: STATUS_BAR_HEIGHT + 8,
    left: 12,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    color: C.blanco,
    fontSize: 26,
    fontWeight: "300",
    lineHeight: 30,
    marginLeft: -2,
  },

  cabecera: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4, gap: 6 },
  etapaLink: { fontSize: 13, color: C.acento, fontWeight: "500" },
  nombreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  nombre: {
    fontSize: 24,
    fontWeight: "800",
    color: C.tinta,
    letterSpacing: -0.5,
    flex: 1,
  },
  badgePlus: {
    backgroundColor: C.acento,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgePlusText: { color: C.blanco, fontSize: 11, fontWeight: "700" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  localidad: { fontSize: 14, color: C.tintaSoft, flex: 1 },
  tipoPill: {
    backgroundColor: C.acentoSoft,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tipoText: { fontSize: 12, color: C.acento, fontWeight: "600" },

  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.piedra,
    overflow: "hidden",
    backgroundColor: C.blanco,
  },
  statBox: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 3,
  },
  statBorder: { borderLeftWidth: 1, borderLeftColor: C.piedra },
  statValor: { fontSize: 16, fontWeight: "700", color: C.tinta },
  statLabel: { fontSize: 11, color: C.tintaSoft, textAlign: "center" },
  ocupDot: { width: 8, height: 8, borderRadius: 4 },

  seccion: { marginTop: 24, paddingHorizontal: 16 },
  seccionTitulo: {
    fontSize: 17,
    fontWeight: "700",
    color: C.tinta,
    marginBottom: 12,
  },
  seccionTituloSm: { fontSize: 14, color: C.tintaSoft, marginBottom: 8 },
  descripcion: { fontSize: 15, color: C.tintaSoft, lineHeight: 23 },

  serviciosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  servicioPill: {
    backgroundColor: C.blanco,
    borderWidth: 1,
    borderColor: C.piedra,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  servicioText: { fontSize: 13, color: C.tinta, fontWeight: "500" },

  contactoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.blanco,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.piedra,
    padding: 14,
  },
  contactoItemDark: { backgroundColor: C.acento, borderColor: C.acento },
  contactoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  contactoEmoji: { fontSize: 18 },
  contactoTitulo: { fontSize: 14, fontWeight: "600", color: C.tinta },
  contactoSub: { fontSize: 12, color: C.tintaSoft },
  contactoArrow: { fontSize: 22, color: C.piedraDark },
  bookingBtn: {
    backgroundColor: "#003580",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 2,
  },
  bookingText: { color: C.blanco, fontSize: 15, fontWeight: "700" },

  valoracionGlobal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.fondo2,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.piedra,
  },
  mediaNumero: {
    fontSize: 32,
    fontWeight: "500",
    color: C.acento,
    lineHeight: 36,
  },
  mediaTotal: { fontSize: 12, color: C.tintaSoft, marginTop: 2 },

  comentariosCabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  formComentario: {
    backgroundColor: C.fondo2,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.piedra,
    gap: 10,
    marginBottom: 4,
  },
  formValoracion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  formInput: {
    borderWidth: 1,
    borderColor: C.piedra,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: C.tinta,
    backgroundColor: C.blanco,
    minHeight: 56,
    textAlignVertical: "top",
  },
  loginBanner: {
    backgroundColor: C.fondo2,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: C.piedra,
    alignItems: "center",
    marginBottom: 8,
  },
  loginBannerText: {
    fontSize: 14,
    color: C.tintaSoft,
    textAlign: "center",
    lineHeight: 22,
  },
  sinComentarios: {
    fontSize: 14,
    color: C.piedraDark,
    textAlign: "center",
    paddingVertical: 24,
  },

  retryBtn: {
    backgroundColor: C.acento,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: { color: C.blanco, fontWeight: "600" },
});
