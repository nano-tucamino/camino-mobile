// 📄 camino-mobile/components/albergue/DatePicker.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
}

const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function toYMD(date: Date): string {
  return date.toISOString().split("T")[0];
}

function fromYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(ymd: string, n: number): string {
  const d = fromYMD(ymd);
  d.setDate(d.getDate() + n);
  return toYMD(d);
}

export default function DatePicker({ value, onChange, label }: Props) {
  const [open, setOpen] = useState(false);
  const today = toYMD(new Date());
  const tomorrow = addDays(today, 1);
  const dayAfter = addDays(today, 2);
  const minDate = tomorrow; // fecha de salida nunca puede ser hoy

  const initial = value ? fromYMD(value) : fromYMD(tomorrow);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  function select(ymd: string) {
    onChange(ymd);
    setOpen(false);
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  function buildDays() {
    const firstDay = new Date(viewYear, viewMonth, 1);
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = Array(startDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }

  function cellYMD(day: number): string {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const days = buildDays();

  const displayValue = value
    ? fromYMD(value).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const isOtherDay = value && value !== tomorrow && value !== dayAfter;

  return (
    <>
      {label && <Text style={s.fieldLabel}>{label}</Text>}

      <View style={s.shortcuts}>
        <TouchableOpacity
          style={[s.shortcut, value === tomorrow && s.shortcutActive]}
          onPress={() => onChange(tomorrow)}
        >
          <Text
            style={[s.shortcutText, value === tomorrow && s.shortcutTextActive]}
          >
            Mañana
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.shortcut, value === dayAfter && s.shortcutActive]}
          onPress={() => onChange(dayAfter)}
        >
          <Text
            style={[s.shortcutText, value === dayAfter && s.shortcutTextActive]}
          >
            Pasado mañana
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.shortcut,
            s.shortcutCalendar,
            isOtherDay && s.shortcutActive,
          ]}
          onPress={() => {
            const d = value ? fromYMD(value) : fromYMD(tomorrow);
            setViewYear(d.getFullYear());
            setViewMonth(d.getMonth());
            setOpen(true);
          }}
        >
          <Text style={[s.shortcutText, isOtherDay && s.shortcutTextActive]}>
            {isOtherDay ? displayValue! : "📅 Otro día"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <TouchableOpacity activeOpacity={1} style={s.calCard}>
            <View style={s.calHeader}>
              <TouchableOpacity onPress={prevMonth} style={s.navBtn}>
                <Text style={s.navBtnText}>‹</Text>
              </TouchableOpacity>
              <Text style={s.calMes}>
                {MESES[viewMonth]} {viewYear}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={s.navBtn}>
                <Text style={s.navBtnText}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={s.weekRow}>
              {DIAS_SEMANA.map((d) => (
                <Text key={d} style={s.weekLabel}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={s.grid}>
              {days.map((day, i) => {
                if (!day) return <View key={`e${i}`} style={s.cell} />;
                const ymd = cellYMD(day);
                const selected = ymd === value;
                const disabled = ymd < minDate;
                return (
                  <TouchableOpacity
                    key={ymd}
                    style={[
                      s.cell,
                      selected && s.cellSelected,
                      disabled && s.cellDisabled,
                    ]}
                    onPress={() => !disabled && select(ymd)}
                    disabled={disabled}
                  >
                    <Text
                      style={[
                        s.cellText,
                        selected && s.cellTextSelected,
                        disabled && s.cellTextDisabled,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={s.btnCerrar}
              onPress={() => setOpen(false)}
            >
              <Text style={s.btnCerrarText}>Cerrar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B6560",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  shortcuts: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  shortcut: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#E5E0D8",
    backgroundColor: "white",
  },
  shortcutActive: {
    borderColor: "#C4843A",
    backgroundColor: "#F5EBD8",
  },
  shortcutCalendar: {
    flex: 1,
  },
  shortcutText: {
    fontSize: 13,
    color: "#6B6560",
    textAlign: "center",
  },
  shortcutTextActive: {
    color: "#C4843A",
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  calCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 20,
    width: "100%",
    maxWidth: 340,
  },
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  calMes: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1917",
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#F5F0E8",
  },
  navBtnText: {
    fontSize: 22,
    color: "#6B6560",
    lineHeight: 26,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: "#9B9390",
    textTransform: "uppercase",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cellSelected: {
    backgroundColor: "#C4843A",
    borderRadius: 999,
  },
  cellDisabled: {
    opacity: 0.25,
  },
  cellText: {
    fontSize: 14,
    color: "#1C1917",
  },
  cellTextSelected: {
    color: "white",
    fontWeight: "700",
  },
  cellTextDisabled: {
    color: "#9B9390",
  },
  btnCerrar: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E0D8",
    alignItems: "center",
  },
  btnCerrarText: {
    fontSize: 14,
    color: "#6B6560",
  },
});
