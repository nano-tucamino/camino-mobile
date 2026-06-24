// 📄 components/etapa/ExperienciasPanel.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import {
  useInteractions,
  TipoReaccion,
  Comentario,
  UseInteractionsReturn,
} from "@/hooks/useInteractions";

const PIEDRA = "#F0EBE0";
const PIEDRA_BG = "#FDF8F0";
const TEXTO = "#2C1F0E";
const TEXTO_SOFT = "#8B7355";
const TEXTO_DESC = "#5C4A32";

const FLAG: Record<string, string> = {
  es: "🇪🇸",
  en: "🇬🇧",
  de: "🇩🇪",
  fr: "🇫🇷",
  it: "🇮🇹",
  pt: "🇵🇹",
  ko: "🇰🇷",
  ja: "🇯🇵",
};

function timeAgo(fecha: string, t: (k: string) => string): string {
  const diff = Date.now() - new Date(fecha).getTime();
  const min = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (min < 1) return "ahora";
  if (min < 60) return `${min}m`;
  if (h < 24) return `${h}h`;
  if (d < 7) return `${d}d`;
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

// ── RATING STARS ──────────────────────────────────────────────
function RatingStars({
  value,
  onChange,
  readonly,
  size = 22,
  showLabel,
  color,
}: {
  value: number | null;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
  showLabel?: boolean;
  color: string;
}) {
  const { t } = useTranslation();
  const LABELS = [
    "",
    t("interactions.rating.malo"),
    t("interactions.rating.regular"),
    t("interactions.rating.bueno"),
    t("interactions.rating.muy_bueno"),
    t("interactions.rating.excelente"),
  ];

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View style={{ flexDirection: "row" }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            disabled={readonly || !onChange}
            onPress={() => onChange?.(n)}
            style={{ padding: 1 }}
          >
            <Text
              style={{
                fontSize: size,
                color: n <= (value ?? 0) ? color : "#E8E0D0",
              }}
            >
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {showLabel && (value ?? 0) > 0 && (
        <Text style={{ fontSize: 12, color: TEXTO_SOFT, marginLeft: 4 }}>
          {LABELS[value ?? 0]}
        </Text>
      )}
    </View>
  );
}

// ── REACCION BAR ──────────────────────────────────────────────
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
  const { t } = useTranslation();
  const OPCIONES: { tipo: TipoReaccion; label: string; icon: string }[] = [
    { tipo: "util", label: t("interactions.reacciones.util"), icon: "👍" },
    { tipo: "bonito", label: t("interactions.reacciones.bonito"), icon: "✨" },
    {
      tipo: "dificil",
      label: t("interactions.reacciones.dificil"),
      icon: "⚠️",
    },
    {
      tipo: "cuidado",
      label: t("interactions.reacciones.cuidado"),
      icon: "🧭",
    },
  ];

  const contar = (tipo: TipoReaccion) =>
    reacciones.filter((r) => r.tipo_reaccion === tipo).length;

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {OPCIONES.map(({ tipo, label, icon }) => {
        const count = contar(tipo);
        const activa = misReacciones.includes(tipo);
        return (
          <TouchableOpacity
            key={tipo}
            disabled={disabled || !onToggle}
            onPress={() => onToggle?.(tipo)}
            style={[
              rs.chip,
              activa && {
                borderColor: "#C8922A",
                backgroundColor: "rgba(200,146,42,0.1)",
              },
            ]}
          >
            <Text style={{ fontSize: 14 }}>{icon}</Text>
            <Text
              style={[
                rs.chipText,
                activa && { color: "#9A6E1A", fontWeight: "600" },
              ]}
            >
              {label}
            </Text>
            {count > 0 && (
              <Text style={[rs.chipCount, activa && { color: "#C8922A" }]}>
                {count}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const rs = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PIEDRA,
    backgroundColor: "white",
  },
  chipText: { fontSize: 13, color: TEXTO_SOFT },
  chipCount: { fontSize: 12, fontWeight: "600", color: TEXTO_SOFT },
});

// ── AVATAR ────────────────────────────────────────────────────
function Avatar({
  nombre,
  avatarUrl,
  idioma,
}: {
  nombre: string | null;
  avatarUrl: string | null;
  idioma?: string | null;
}) {
  const inicial = (nombre ?? "P")[0]?.toUpperCase() ?? "P";
  const flag = idioma ? FLAG[idioma] : null;

  return (
    <View style={{ width: 36, height: 36 }}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={av.img} />
      ) : (
        <View style={av.placeholder}>
          <Text style={av.placeholderText}>{inicial}</Text>
        </View>
      )}
      {flag && (
        <View style={av.flagWrap}>
          <Text style={{ fontSize: 12 }}>{flag}</Text>
        </View>
      )}
    </View>
  );
}

const av = StyleSheet.create({
  img: { width: 36, height: 36, borderRadius: 18 },
  placeholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(200,146,42,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { color: "#9A6E1A", fontWeight: "600", fontSize: 15 },
  flagWrap: { position: "absolute", bottom: -2, right: -4 },
});

// ── COMENTARIO ITEM ───────────────────────────────────────────
function ComentarioItem({
  comentario,
  userId,
  interactions,
  nivel = 0,
  lang,
  color,
}: {
  comentario: Comentario;
  userId?: string;
  interactions: UseInteractionsReturn;
  nivel?: number;
  lang: string;
  color: string;
}) {
  const { t } = useTranslation();
  const [respondiendo, setRespondiendo] = useState(false);
  const [editando, setEditando] = useState(false);
  const [textoResp, setTextoResp] = useState("");
  const [textoEdit, setTextoEdit] = useState(comentario.texto);

  const [reportado, setReportado] = useState(false);

  const handleReportar = async () => {
    if (reportado) return;
    try {
      const { supabase } = await import("@/lib/supabase");
      await supabase.from("reportes").insert({
        reporter_id: userId,
        tipo: "comentario",
        entidad_id: comentario.id,
      });
      setReportado(true);
    } catch (e) {
      console.error("Error al reportar:", e);
    }
  };
  const esMio = userId === comentario.autor_id;
  const nombre = comentario.autor?.nombre_display ?? "Peregrino";

  const l = lang.split("-")[0];
  const idiomaOrigen = comentario.idioma_origen ?? "es";
  const textoLocalizado =
    l === idiomaOrigen
      ? comentario.texto
      : (comentario as any)[`texto_${l}`] || comentario.texto;

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

  return (
    <View style={{ marginLeft: nivel > 0 ? 32 : 0 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Avatar
          nombre={nombre}
          avatarUrl={comentario.autor?.avatar_url ?? null}
          idioma={comentario.autor?.idioma_nativo ?? null}
        />
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: TEXTO }}>
              {nombre}
            </Text>
            {comentario.rol_autor === "hospitalero" && (
              <View style={ci.badgeHosp}>
                <Text style={ci.badgeHospText}>
                  {t("interactions.comentarios.hospitalero")}
                </Text>
              </View>
            )}
            {!!comentario.valoracion && (
              <RatingStars
                value={comentario.valoracion}
                readonly
                size={12}
                color={color}
              />
            )}
            <Text style={{ fontSize: 12, color: TEXTO_SOFT }}>
              {timeAgo(comentario.created_at, t)}
            </Text>
            {comentario.editado && (
              <Text style={{ fontSize: 11, color: TEXTO_SOFT }}>
                ({t("interactions.comentarios.editado")})
              </Text>
            )}
          </View>

          {editando ? (
            <View style={{ marginTop: 6 }}>
              <TextInput
                value={textoEdit}
                onChangeText={setTextoEdit}
                multiline
                autoFocus
                style={ci.textarea}
                scrollEnabled={false}
              />
              <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                <TouchableOpacity
                  style={[ci.btn, { backgroundColor: color }]}
                  onPress={handleEditar}
                  disabled={interactions.submitting}
                >
                  <Text style={ci.btnTextWhite}>
                    {t("interactions.comentarios.guardar")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={ci.btnOutline}
                  onPress={() => setEditando(false)}
                >
                  <Text style={ci.btnTextSoft}>
                    {t("interactions.comentarios.cancelar")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text
              style={{
                fontSize: 14,
                color: TEXTO,
                lineHeight: 21,
                marginTop: 4,
              }}
            >
              {textoLocalizado}
            </Text>
          )}

          {!editando && (
            <View style={{ flexDirection: "row", gap: 14, marginTop: 6 }}>
              {userId && nivel === 0 && (
                <TouchableOpacity onPress={() => setRespondiendo((v) => !v)}>
                  <Text style={ci.action}>
                    {t("interactions.comentarios.responder")}
                  </Text>
                </TouchableOpacity>
              )}
              {esMio && (
                <>
                  <TouchableOpacity onPress={() => setEditando(true)}>
                    <Text style={ci.action}>
                      {t("interactions.comentarios.editar")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => interactions.deleteComentario(comentario.id)}
                  >
                    <Text style={[ci.action, { color: "#c0392b" }]}>
                      {t("interactions.comentarios.eliminar")}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              {!esMio && userId && (
                <TouchableOpacity onPress={handleReportar} disabled={reportado}>
                  <Text
                    style={[
                      ci.action,
                      { color: reportado ? TEXTO_SOFT : "#c0392b" },
                    ]}
                  >
                    {reportado
                      ? "✓ Reportado"
                      : t("interactions.comentarios.reportar")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {respondiendo && (
            <View style={{ marginTop: 8 }}>
              <TextInput
                value={textoResp}
                onChangeText={setTextoResp}
                placeholder={t(
                  "interactions.comentarios.placeholder_respuesta",
                )}
                placeholderTextColor="#A09080"
                multiline
                autoFocus
                scrollEnabled={false}
                style={ci.textarea}
              />
              <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                <TouchableOpacity
                  style={[ci.btn, { backgroundColor: color }]}
                  onPress={handleResponder}
                  disabled={interactions.submitting}
                >
                  <Text style={ci.btnTextWhite}>
                    {t("interactions.comentarios.responder")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={ci.btnOutline}
                  onPress={() => setRespondiendo(false)}
                >
                  <Text style={ci.btnTextSoft}>
                    {t("interactions.comentarios.cancelar")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      {(comentario.respuestas ?? []).length > 0 && (
        <View style={ci.respuestas}>
          {(comentario.respuestas ?? []).map((r) => (
            <View key={r.id} style={{ marginTop: 12 }}>
              <ComentarioItem
                comentario={r}
                userId={userId}
                interactions={interactions}
                nivel={1}
                lang={lang}
                color={color}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const ci = StyleSheet.create({
  badgeHosp: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: "rgba(45,90,60,0.12)",
  },
  badgeHospText: { fontSize: 11, color: "#2D5A3C", fontWeight: "600" },
  textarea: {
    borderWidth: 1,
    borderColor: PIEDRA,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: TEXTO,
    backgroundColor: "white",
    minHeight: 60,
    textAlignVertical: "top",
  },
  btn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  btnOutline: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PIEDRA,
  },
  btnTextWhite: { fontSize: 13, fontWeight: "600", color: "white" },
  btnTextSoft: { fontSize: 13, fontWeight: "600", color: TEXTO_SOFT },
  action: { fontSize: 12, color: TEXTO_SOFT, fontWeight: "500" },
  respuestas: {
    marginTop: 10,
    marginLeft: 18,
    paddingLeft: 14,
    borderLeftWidth: 2,
    borderLeftColor: PIEDRA,
  },
});

// ── PANEL PRINCIPAL ───────────────────────────────────────────
export default function ExperienciasPanel({
  entityId,
  color,
  lang,
}: {
  entityId: string;
  color: string;
  lang: string;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const interactions = useInteractions("etapa", entityId);
  const {
    resumen,
    miValoracion,
    misReacciones,
    comentarios,
    loading,
    submitting,
  } = interactions;

  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState("");
  const [valoracionNueva, setValoracionNueva] = useState<number | null>(null);

  const total = resumen.total_comentarios + resumen.total_respuestas;

  const handlePublicar = async () => {
    if (!texto.trim()) return;
    await interactions.addComentario(texto.trim(), {
      valoracion: valoracionNueva ?? undefined,
    });
    setTexto("");
    setValoracionNueva(null);
  };

  return (
    <View style={ep.wrapper}>
      <TouchableOpacity
        style={ep.header}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={[ep.bar, { backgroundColor: color }]} />
        <Text style={ep.title}>{t("interactions.comentarios.titulo")}</Text>
        {resumen.media_valoracion != null && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <RatingStars
              value={Math.round(resumen.media_valoracion)}
              readonly
              size={14}
              color={color}
            />
            <Text style={ep.extra}>
              {resumen.media_valoracion.toFixed(1)} ·{" "}
              {resumen.total_valoraciones}
            </Text>
          </View>
        )}
        {!open && resumen.media_valoracion == null && total > 0 && (
          <Text style={ep.extra}>{total}</Text>
        )}
        <Text
          style={[ep.chevron, open && { transform: [{ rotate: "90deg" }] }]}
        >
          ›
        </Text>
      </TouchableOpacity>

      {open && (
        <View style={ep.body}>
          {user ? (
            <View style={ep.form}>
              <View style={{ marginBottom: 10 }}>
                <Text style={ep.formLabel}>
                  {miValoracion
                    ? t("interactions.panel.tu_valoracion")
                    : t("interactions.panel.valora_etapa")}
                </Text>
                <RatingStars
                  value={miValoracion?.puntuacion ?? valoracionNueva}
                  onChange={(v) => {
                    if (miValoracion) {
                      interactions.setValoracion(v);
                    } else {
                      setValoracionNueva(v);
                    }
                  }}
                  readonly={submitting}
                  size={26}
                  showLabel
                  color={color}
                />
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={ep.formLabel}>
                  {t("interactions.panel.como_describirias")}
                </Text>
                <ReaccionBar
                  reacciones={interactions.reacciones}
                  misReacciones={misReacciones}
                  onToggle={
                    !submitting ? interactions.toggleReaccion : undefined
                  }
                  disabled={submitting}
                />
              </View>

              <TextInput
                value={texto}
                onChangeText={setTexto}
                placeholder={t("interactions.etapa_placeholder")}
                placeholderTextColor="#A09080"
                multiline
                style={ci.textarea}
              />
              <TouchableOpacity
                style={[
                  ep.publicarBtn,
                  { backgroundColor: texto.trim() ? color : PIEDRA },
                ]}
                onPress={handlePublicar}
                disabled={submitting || !texto.trim()}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={ep.publicarText}>
                    {t("interactions.comentarios.publicar")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={ep.banner}>
              <Text style={ep.bannerText}>
                {t("interactions.panel.banner_texto")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  marginTop: 12,
                  flexWrap: "wrap",
                }}
              >
                <TouchableOpacity
                  style={[ep.bannerBtn, { backgroundColor: color }]}
                  onPress={() => router.push("/(auth)/login" as any)}
                >
                  <Text
                    style={{ color: "white", fontSize: 14, fontWeight: "600" }}
                  >
                    {t("interactions.panel.iniciar_sesion")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[ep.bannerBtnOutline, { borderColor: color }]}
                  onPress={() => router.push("/(auth)/login" as any)}
                >
                  <Text style={{ color, fontSize: 14, fontWeight: "600" }}>
                    {t("interactions.panel.crear_cuenta")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ marginTop: 20 }}>
            {loading ? (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <ActivityIndicator size="small" color={color} />
              </View>
            ) : comentarios.length === 0 ? (
              <Text style={ep.vacioText}>
                {t("interactions.comentarios.primero")}
              </Text>
            ) : (
              <View style={{ gap: 18 }}>
                {comentarios.map((c) => (
                  <ComentarioItem
                    key={c.id}
                    comentario={c}
                    userId={user?.id}
                    interactions={interactions}
                    lang={lang}
                    color={color}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const ep = StyleSheet.create({
  wrapper: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: PIEDRA,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 20,
    paddingBottom: 16,
  },
  bar: { width: 3, height: 18, borderRadius: 2 },
  title: { flex: 1, fontSize: 16, fontWeight: "700", color: TEXTO },
  extra: { fontSize: 12, color: TEXTO_SOFT },
  chevron: { fontSize: 22, color: "#C4A882", lineHeight: 26 },
  body: { paddingHorizontal: 20, paddingBottom: 20 },
  form: {
    backgroundColor: PIEDRA_BG,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0E8D4",
    marginBottom: 8,
  },
  formLabel: { fontSize: 13, color: TEXTO_SOFT, marginBottom: 8 },
  publicarBtn: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  publicarText: { color: "white", fontSize: 14, fontWeight: "700" },
  banner: {
    backgroundColor: PIEDRA_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0E8D4",
    padding: 16,
  },
  bannerText: { fontSize: 14, color: TEXTO_DESC, lineHeight: 21 },
  bannerBtn: { borderRadius: 8, paddingHorizontal: 18, paddingVertical: 9 },
  bannerBtnOutline: {
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  vacioText: {
    fontSize: 14,
    color: TEXTO_SOFT,
    textAlign: "center",
    paddingVertical: 16,
  },
});
