// 📄 components/etapa/EtapaCheckButton.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { apiPost, apiDelete } from "@/lib/api";

interface Props {
  etapaId: string;
  initialCompletada: boolean;
  color: string;
  lang: string;
}

const LABELS: Record<string, Record<string, string>> = {
  es: {
    marcar: "Marcar como completada",
    completada: "Etapa completada",
    desmarcar: "Desmarcar",
    cuando: "¿Cuándo la hiciste?",
    fecha: "Fecha",
    nota: "Nota personal",
    placeholder: "¿Cómo fue? ¿Algún momento especial?",
    guardar: "Guardar",
    cancelar: "Cancelar",
    guardando: "Guardando...",
  },
  en: {
    marcar: "Mark as completed",
    completada: "Stage completed",
    desmarcar: "Unmark",
    cuando: "When did you do it?",
    fecha: "Date",
    nota: "Personal note",
    placeholder: "How was it? Any special moment?",
    guardar: "Save",
    cancelar: "Cancel",
    guardando: "Saving...",
  },
  de: {
    marcar: "Als abgeschlossen markieren",
    completada: "Etappe abgeschlossen",
    desmarcar: "Markierung aufheben",
    cuando: "Wann hast du es gemacht?",
    fecha: "Datum",
    nota: "Persönliche Notiz",
    placeholder: "Wie war es?",
    guardar: "Speichern",
    cancelar: "Abbrechen",
    guardando: "Speichern...",
  },
  fr: {
    marcar: "Marquer comme terminée",
    completada: "Étape terminée",
    desmarcar: "Démarquer",
    cuando: "Quand l'avez-vous fait?",
    fecha: "Date",
    nota: "Note personnelle",
    placeholder: "Comment était-ce?",
    guardar: "Enregistrer",
    cancelar: "Annuler",
    guardando: "Enregistrement...",
  },
  it: {
    marcar: "Segna come completata",
    completada: "Tappa completata",
    desmarcar: "Deseleziona",
    cuando: "Quando l'hai fatto?",
    fecha: "Data",
    nota: "Nota personale",
    placeholder: "Com'è stato?",
    guardar: "Salva",
    cancelar: "Annulla",
    guardando: "Salvataggio...",
  },
  pt: {
    marcar: "Marcar como concluída",
    completada: "Etapa concluída",
    desmarcar: "Desmarcar",
    cuando: "Quando a fez?",
    fecha: "Data",
    nota: "Nota pessoal",
    placeholder: "Como foi?",
    guardar: "Guardar",
    cancelar: "Cancelar",
    guardando: "A guardar...",
  },
  ko: {
    marcar: "완료로 표시",
    completada: "구간 완료",
    desmarcar: "표시 해제",
    cuando: "언제 했나요?",
    fecha: "날짜",
    nota: "개인 메모",
    placeholder: "어땠나요?",
    guardar: "저장",
    cancelar: "취소",
    guardando: "저장 중...",
  },
  ja: {
    marcar: "完了としてマーク",
    completada: "ステージ完了",
    desmarcar: "マーク解除",
    cuando: "いつ行いましたか？",
    fecha: "日付",
    nota: "個人メモ",
    placeholder: "どうでしたか？",
    guardar: "保存",
    cancelar: "キャンセル",
    guardando: "保存中...",
  },
};

function t(lang: string, key: string): string {
  const l = lang.split("-")[0];
  return LABELS[l]?.[key] ?? LABELS.es[key] ?? key;
}

export default function EtapaCheckButton({
  etapaId,
  initialCompletada,
  color,
  lang,
}: Props) {
  const [completada, setCompletada] = useState(initialCompletada);
  const [showForm, setShowForm] = useState(false);
  const [fecha, setFecha] = useState("");
  const [nota, setNota] = useState("");
  const [loading, setLoading] = useState(false);

  // userId null hasta auth
  const userId: string | null = null;
  if (!userId) return null;

  async function handleMarcar() {
    if (completada) {
      // Desmarcar — optimistic
      setCompletada(false);
      try {
        await apiDelete(`/api/peregrino/perfil/etapas/${etapaId}`);
      } catch {
        setCompletada(true);
      }
      return;
    }
    setShowForm(true);
  }

  async function handleGuardar() {
    setLoading(true);
    try {
      await apiPost(`/api/peregrino/perfil/etapas/${etapaId}`, {
        fecha: fecha || undefined,
        nota: nota || undefined,
      });
      setCompletada(true);
      setShowForm(false);
      setFecha("");
      setNota("");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (completada) {
    return (
      <View style={s.wrapper}>
        <View style={s.completadaRow}>
          <View style={s.checkCircle}>
            <Text style={s.checkIcon}>✓</Text>
          </View>
          <Text style={s.completadaText}>{t(lang, "completada")}</Text>
          <TouchableOpacity onPress={handleMarcar} style={s.desmarcarBtn}>
            <Text style={s.desmarcarText}>{t(lang, "desmarcar")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (showForm) {
    return (
      <View style={s.wrapper}>
        <View style={s.form}>
          <Text style={s.formTitle}>{t(lang, "cuando")}</Text>

          <Text style={s.label}>{t(lang, "fecha")}</Text>
          <TextInput
            style={s.input}
            value={fecha}
            onChangeText={setFecha}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#B4A890"
            keyboardType="numeric"
          />

          <Text style={s.label}>{t(lang, "nota")}</Text>
          <TextInput
            style={[s.input, s.textarea]}
            value={nota}
            onChangeText={setNota}
            placeholder={t(lang, "placeholder")}
            placeholderTextColor="#B4A890"
            multiline
            numberOfLines={3}
          />

          <View style={s.formBtns}>
            <TouchableOpacity
              onPress={() => setShowForm(false)}
              style={s.cancelBtn}
            >
              <Text style={s.cancelText}>{t(lang, "cancelar")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleGuardar}
              disabled={loading}
              style={[
                s.guardarBtn,
                { backgroundColor: "#16a34a", opacity: loading ? 0.7 : 1 },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={s.guardarText}>{t(lang, "guardar")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={s.wrapper}>
      <TouchableOpacity
        onPress={handleMarcar}
        style={[s.marcarBtn, { backgroundColor: color }]}
        activeOpacity={0.85}
      >
        <Text style={s.marcarIcon}>○</Text>
        <Text style={s.marcarText}>{t(lang, "marcar")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    backgroundColor: "white",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBE0",
  },

  // Marcar
  marcarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  marcarIcon: { fontSize: 18, color: "white" },
  marcarText: { fontSize: 15, fontWeight: "700", color: "white" },

  // Completada
  completadaRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
  },
  checkIcon: { fontSize: 18, color: "white", fontWeight: "700" },
  completadaText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#16a34a",
  },
  desmarcarBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  desmarcarText: { fontSize: 12, color: "#16a34a", fontWeight: "600" },

  // Formulario
  form: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#16a34a",
  },
  formTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16a34a",
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B4C2A",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#2C1F0E",
    marginBottom: 12,
  },
  textarea: { height: 80, textAlignVertical: "top" },
  formBtns: { flexDirection: "row", gap: 8, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    alignItems: "center",
  },
  cancelText: { fontSize: 13, color: "#6B4C2A" },
  guardarBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  guardarText: { fontSize: 13, fontWeight: "700", color: "white" },
});
