// 📄 camino-mobile/components/albergue/TabHistorico.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://camino-api.onrender.com";

interface DatosPeregrino {
  nombre: string;
  apellidos: string;
  sexo: string;
  fecha_nacimiento: string;
  nacionalidad: string;
  tipo_documento: string;
  numero_documento: string;
  numero_soporte?: string;
  direccion_residencia: string;
  telefono?: string;
}

interface Estancia {
  id: string;
  datos_peregrino: DatosPeregrino;
  fecha_entrada: string;
  fecha_salida: string | null;
  metodo_pago: string | null;
  created_at: string;
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TabHistorico({ token }: { token: string }) {
  const [estancias, setEstancias] = useState<Estancia[]>([]);
  const [loading, setLoading] = useState(true);
  const [cargado, setCargado] = useState(false);

  const [q, setQ] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [expandido, setExpandido] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);

      const res = await fetch(
        `${API_URL}/api/hospitalero/estancias/historico?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      setEstancias(data.estancias ?? []);
      setCargado(true);
    } catch {
      setEstancias([]);
    } finally {
      setLoading(false);
    }
  }, [q, desde, hasta, token]);

  // Carga inicial
  useEffect(() => {
    cargar();
  }, []);

  function limpiar() {
    setQ("");
    setDesde("");
    setHasta("");
  }

  const hayFiltros = q || desde || hasta;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Buscador */}
      <View style={s.searchRow}>
        <TextInput
          style={s.searchInput}
          placeholder="Nombre, apellidos, documento..."
          placeholderTextColor="#C9C0B4"
          value={q}
          onChangeText={setQ}
          returnKeyType="search"
          onSubmitEditing={cargar}
        />
        <TouchableOpacity style={s.btnBuscar} onPress={cargar}>
          <Text style={s.btnBuscarText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros de fecha */}
      <View style={s.fechaRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.fieldLabel}>Desde</Text>
          <TextInput
            style={s.fechaInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#C9C0B4"
            value={desde}
            onChangeText={setDesde}
            keyboardType="numeric"
          />
        </View>
        <View style={{ width: 10 }} />
        <View style={{ flex: 1 }}>
          <Text style={s.fieldLabel}>Hasta</Text>
          <TextInput
            style={s.fechaInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#C9C0B4"
            value={hasta}
            onChangeText={setHasta}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={s.filtrosBtns}>
        <TouchableOpacity style={[s.btnFiltrar, { flex: 1 }]} onPress={cargar}>
          <Text style={s.btnFiltrarText}>Aplicar filtros</Text>
        </TouchableOpacity>
        {hayFiltros && (
          <TouchableOpacity
            style={s.btnLimpiar}
            onPress={() => {
              limpiar();
            }}
          >
            <Text style={s.btnLimpiarText}>✕ Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Resultados */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#C4843A"
          style={{ marginTop: 40 }}
        />
      ) : estancias.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>🐚</Text>
          <Text style={s.emptyText}>Sin resultados</Text>
          <Text style={s.emptySubtext}>
            {hayFiltros
              ? "Prueba con otros filtros."
              : "Aún no hay peregrinos registrados."}
          </Text>
        </View>
      ) : (
        <>
          <Text style={s.totalLabel}>
            {estancias.length} peregrino{estancias.length !== 1 ? "s" : ""}
          </Text>

          {estancias.map((e) => {
            const d = e.datos_peregrino;
            const abierto = expandido === e.id;
            return (
              <TouchableOpacity
                key={e.id}
                style={s.card}
                onPress={() => setExpandido(abierto ? null : e.id)}
                activeOpacity={0.8}
              >
                {/* Cabecera siempre visible */}
                <View style={s.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardNombre}>
                      {d.nombre} {d.apellidos}
                    </Text>
                    <Text style={s.cardSub}>
                      {formatFecha(e.fecha_entrada)} · {d.nacionalidad}
                    </Text>
                  </View>
                  <View style={s.cardRight}>
                    {e.metodo_pago && (
                      <View style={s.pagoBadge}>
                        <Text style={s.pagoBadgeText}>{e.metodo_pago}</Text>
                      </View>
                    )}
                    <Text style={s.chevron}>{abierto ? "▲" : "▼"}</Text>
                  </View>
                </View>

                {/* Detalle expandible */}
                {abierto && (
                  <View style={s.cardDetalle}>
                    {[
                      {
                        label: "Documento",
                        value: `${d.tipo_documento}: ${d.numero_documento}`,
                      },
                      { label: "Nº soporte", value: d.numero_soporte ?? "—" },
                      { label: "Nacimiento", value: d.fecha_nacimiento },
                      { label: "Residencia", value: d.direccion_residencia },
                      { label: "Teléfono", value: d.telefono ?? "—" },
                      { label: "Entrada", value: formatFecha(e.fecha_entrada) },
                      {
                        label: "Salida prev.",
                        value: e.fecha_salida
                          ? formatFecha(e.fecha_salida)
                          : "—",
                      },
                      { label: "Pago", value: e.metodo_pago ?? "—" },
                    ].map((row) => (
                      <View key={row.label} style={s.detalleRow}>
                        <Text style={s.detalleLabel}>{row.label}</Text>
                        <Text style={s.detalleValue}>{row.value}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E0D8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1C1917",
  },
  btnBuscar: {
    backgroundColor: "#C4843A",
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  btnBuscarText: { fontSize: 18 },

  fechaRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B6560",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  fechaInput: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E0D8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#1C1917",
  },

  filtrosBtns: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  btnFiltrar: {
    backgroundColor: "#2C1F0E",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnFiltrarText: { color: "white", fontSize: 13, fontWeight: "600" },
  btnLimpiar: {
    borderWidth: 1,
    borderColor: "#E5E0D8",
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  btnLimpiarText: { fontSize: 13, color: "#6B6560" },

  totalLabel: {
    fontSize: 12,
    color: "#6B6560",
    fontWeight: "600",
    marginBottom: 12,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E0D8",
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardNombre: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1917",
    marginBottom: 2,
  },
  cardSub: { fontSize: 12, color: "#6B6560" },
  cardRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  pagoBadge: {
    backgroundColor: "#F5EBD8",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pagoBadgeText: { fontSize: 11, color: "#C4843A", fontWeight: "600" },
  chevron: { fontSize: 10, color: "#9B9390" },

  cardDetalle: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F2EDE6",
    paddingTop: 12,
    gap: 6,
  },
  detalleRow: {
    flexDirection: "row",
    paddingVertical: 3,
  },
  detalleLabel: { fontSize: 12, color: "#6B6560", width: 90 },
  detalleValue: { fontSize: 12, color: "#1C1917", flex: 1, fontWeight: "500" },

  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyText: {
    fontSize: 14,
    color: "#6B6560",
    fontWeight: "600",
    marginBottom: 6,
  },
  emptySubtext: { fontSize: 13, color: "#9B9390", textAlign: "center" },
});
