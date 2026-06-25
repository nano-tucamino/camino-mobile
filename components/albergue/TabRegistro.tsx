// 📄 camino-mobile/components/albergue/TabRegistro.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Print from "expo-print";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://camino-api.onrender.com";

// ── Tipos ──────────────────────────────────────────────────────
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
  peregrino_id: string | null;
  datos_peregrino: DatosPeregrino;
  fecha_entrada: string;
  fecha_salida: string | null;
  metodo_pago: string | null;
  created_at: string;
}

const METODOS_PAGO = ["efectivo", "tarjeta", "bizum", "transferencia"];
const HOY = new Date().toISOString().split("T")[0];

// ── Helpers ────────────────────────────────────────────────────
function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sexoLabel(s: string) {
  return s === "M" ? "Hombre" : s === "F" ? "Mujer" : "No especificado";
}

// ── Componente principal ───────────────────────────────────────
export default function TabRegistro({
  token,
  albergueNombre,
}: {
  token: string;
  albergueNombre: string;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [estancias, setEstancias] = useState<Estancia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fecha, setFecha] = useState(HOY);

  // Modal detalle/edición
  const [modalVisible, setModalVisible] = useState(false);
  const [estanciaActual, setEstanciaActual] = useState<Estancia | null>(null);
  const [metodoPago, setMetodoPago] = useState("");
  const [fechaSalida, setFechaSalida] = useState("");

  // Cargar estancias del día
  useEffect(() => {
    cargarEstancias();
  }, [fecha]);

  async function cargarEstancias() {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/hospitalero/estancias?fecha=${fecha}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setEstancias(data.estancias ?? []);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los registros");
    } finally {
      setLoading(false);
    }
  }

  // Escanear QR
  async function handleScan({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    setScannerVisible(false);

    try {
      const datosPeregrino: DatosPeregrino = JSON.parse(data);
      // Validación básica
      if (!datosPeregrino.nombre || !datosPeregrino.numero_documento) {
        Alert.alert(
          "QR inválido",
          "El código escaneado no corresponde a un peregrino de Tu Camino.",
        );
        setScanned(false);
        return;
      }

      // Mostrar modal con datos + confirmación
      setEstanciaActual({
        id: "",
        peregrino_id: null,
        datos_peregrino: datosPeregrino,
        fecha_entrada: HOY,
        fecha_salida: null,
        metodo_pago: null,
        created_at: new Date().toISOString(),
      });
      setMetodoPago("");
      setFechaSalida("");
      setModalVisible(true);
    } catch {
      Alert.alert("QR inválido", "No se pudo leer el código QR.");
      setScanned(false);
    }
  }

  async function guardarEstancia() {
    if (!estanciaActual) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/hospitalero/estancias`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          datos_peregrino: estanciaActual.datos_peregrino,
          fecha_entrada: HOY,
          fecha_salida: fechaSalida || null,
          metodo_pago: metodoPago || null,
        }),
      });
      if (!res.ok) throw new Error();
      setModalVisible(false);
      setScanned(false);
      await cargarEstancias();
    } catch {
      Alert.alert("Error", "No se pudo guardar el registro");
    } finally {
      setSaving(false);
    }
  }

  async function actualizarEstancia(id: string, updates: Partial<Estancia>) {
    try {
      await fetch(`${API_URL}/api/hospitalero/estancias/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      await cargarEstancias();
    } catch {
      Alert.alert("Error", "No se pudo actualizar el registro");
    }
  }

  async function eliminarEstancia(id: string) {
    Alert.alert(
      "Eliminar registro",
      "¿Seguro que quieres eliminar este registro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await fetch(`${API_URL}/api/hospitalero/estancias/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            await cargarEstancias();
          },
        },
      ],
    );
  }

  // Exportar PDF del parte del día
  async function exportarPDF() {
    if (estancias.length === 0) {
      Alert.alert(
        "Sin registros",
        "No hay peregrinos registrados para esta fecha.",
      );
      return;
    }

    const filas = estancias
      .map((e, i) => {
        const d = e.datos_peregrino;
        return `
        <tr style="background:${i % 2 === 0 ? "#fff" : "#f9f6f1"}">
          <td>${i + 1}</td>
          <td><strong>${d.nombre} ${d.apellidos}</strong></td>
          <td>${d.tipo_documento}: ${d.numero_documento}</td>
          <td>${d.nacionalidad}</td>
          <td>${d.fecha_nacimiento}</td>
          <td>${d.direccion_residencia}</td>
          <td>${d.telefono ?? "—"}</td>
          <td>${e.metodo_pago ?? "—"}</td>
          <td>${e.fecha_salida ?? "—"}</td>
        </tr>
      `;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; margin: 24px; color: #1C1917; }
          h1 { font-size: 16px; color: #C4843A; margin-bottom: 4px; }
          h2 { font-size: 13px; color: #6B6560; font-weight: normal; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #2C1F0E; color: white; padding: 8px 6px; text-align: left; font-size: 10px; }
          td { padding: 7px 6px; border-bottom: 1px solid #E5E0D8; vertical-align: top; }
          .aviso { margin-top: 20px; font-size: 10px; color: #9B9390; border-top: 1px solid #E5E0D8; padding-top: 10px; }
        </style>
      </head>
      <body>
        <h1>🏨 ${albergueNombre}</h1>
        <h2>Parte de viajeros — ${formatFecha(fecha)} · ${estancias.length} peregrino${estancias.length !== 1 ? "s" : ""}</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre completo</th>
              <th>Documento</th>
              <th>Nacionalidad</th>
              <th>Nacimiento</th>
              <th>Residencia</th>
              <th>Teléfono</th>
              <th>Pago</th>
              <th>Salida prev.</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
        <p class="aviso">
          Documento de referencia generado por TuCamino · caminosantiago.app<br/>
          El envío oficial a SES.HOSPEDAJES es responsabilidad del albergue.
        </p>
      </body>
      </html>
    `;

    try {
      await Print.printAsync({ html });
    } catch {
      Alert.alert("Error", "No se pudo generar el PDF");
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>
      {/* ── Scanner Modal ── */}
      <Modal
        visible={scannerVisible}
        animationType="slide"
        onRequestClose={() => {
          setScannerVisible(false);
          setScanned(false);
        }}
      >
        <View style={s.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scanned ? undefined : handleScan}
          />
          {/* Marco QR */}
          <View style={s.scannerOverlay}>
            <View style={s.scannerFrame} />
            <Text style={s.scannerHint}>Apunta al QR del peregrino</Text>
          </View>
          <TouchableOpacity
            style={s.scannerClose}
            onPress={() => {
              setScannerVisible(false);
              setScanned(false);
            }}
          >
            <Text style={s.scannerCloseText}>✕ Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Modal datos peregrino ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          setScanned(false);
        }}
      >
        <ScrollView
          style={s.modalContainer}
          contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
        >
          <Text style={s.modalTitulo}>✅ Peregrino escaneado</Text>

          {estanciaActual && (
            <View style={s.datosCard}>
              <Text style={s.datosNombre}>
                {estanciaActual.datos_peregrino.nombre}{" "}
                {estanciaActual.datos_peregrino.apellidos}
              </Text>
              <Text style={s.datosSexo}>
                {sexoLabel(estanciaActual.datos_peregrino.sexo)} ·{" "}
                {estanciaActual.datos_peregrino.nacionalidad}
              </Text>

              {[
                {
                  label: "Nacimiento",
                  value: estanciaActual.datos_peregrino.fecha_nacimiento,
                },
                {
                  label: "Documento",
                  value: `${estanciaActual.datos_peregrino.tipo_documento}: ${estanciaActual.datos_peregrino.numero_documento}`,
                },
                {
                  label: "Nº soporte",
                  value: estanciaActual.datos_peregrino.numero_soporte ?? "—",
                },
                {
                  label: "Residencia",
                  value: estanciaActual.datos_peregrino.direccion_residencia,
                },
                {
                  label: "Teléfono",
                  value: estanciaActual.datos_peregrino.telefono ?? "—",
                },
              ].map((row) => (
                <View key={row.label} style={s.datosRow}>
                  <Text style={s.datosLabel}>{row.label}</Text>
                  <Text style={s.datosValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Método de pago */}
          <Text style={s.seccionLabel}>Método de pago</Text>
          <View style={s.pillsRow}>
            {METODOS_PAGO.map((mp) => (
              <TouchableOpacity
                key={mp}
                onPress={() => setMetodoPago(mp)}
                style={[s.pill, metodoPago === mp && s.pillActive]}
              >
                <Text
                  style={[s.pillText, metodoPago === mp && s.pillTextActive]}
                >
                  {mp.charAt(0).toUpperCase() + mp.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fecha salida */}
          <Text style={[s.seccionLabel, { marginTop: 16 }]}>
            Fecha de salida prevista
          </Text>
          <TextInput
            value={fechaSalida}
            onChangeText={setFechaSalida}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#C9C0B4"
            style={s.input}
            keyboardType="numeric"
          />

          {/* Botones */}
          <TouchableOpacity
            onPress={guardarEstancia}
            disabled={saving}
            style={[s.btnPrimary, saving && { opacity: 0.6 }]}
          >
            <Text style={s.btnPrimaryText}>
              {saving ? "Guardando..." : "✓ Registrar peregrino"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setModalVisible(false);
              setScanned(false);
            }}
            style={s.btnSecondary}
          >
            <Text style={s.btnSecondaryText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      {/* ── Contenido principal ── */}
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Descripción */}
        <View style={s.infoCard}>
          <Text style={s.infoTitulo}>📋 Registro de peregrinos</Text>
          <Text style={s.infoDesc}>
            Escanea el QR de cada peregrino al llegar. Sus datos aparecen al
            instante. Al final del día, exporta el parte para enviarlo a
            SES.HOSPEDAJES.
          </Text>
        </View>

        {/* Selector de fecha + botón escanear */}
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.fieldLabel}>Fecha</Text>
            <TextInput
              value={fecha}
              onChangeText={setFecha}
              style={s.inputFecha}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#C9C0B4"
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity
            style={s.btnEscanear}
            onPress={async () => {
              if (!permission?.granted) {
                const { granted } = await requestPermission();
                if (!granted) {
                  Alert.alert(
                    "Permiso denegado",
                    "Necesitas dar acceso a la cámara.",
                  );
                  return;
                }
              }
              setScanned(false);
              setScannerVisible(true);
            }}
          >
            <Text style={s.btnEscanearText}>📷 Escanear</Text>
          </TouchableOpacity>
        </View>

        {/* Lista peregrinos */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#C4843A"
            style={{ marginTop: 32 }}
          />
        ) : estancias.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🐚</Text>
            <Text style={s.emptyText}>
              Sin peregrinos registrados para esta fecha.
            </Text>
            <Text style={s.emptySubtext}>
              Escanea el QR de los peregrinos al llegar.
            </Text>
          </View>
        ) : (
          <>
            <Text style={s.countLabel}>
              {estancias.length} peregrino{estancias.length !== 1 ? "s" : ""}{" "}
              registrado{estancias.length !== 1 ? "s" : ""}
            </Text>
            {estancias.map((e) => (
              <View key={e.id} style={s.peregrinoCard}>
                <View style={s.peregrinoHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.peregrinoNombre}>
                      {e.datos_peregrino.nombre} {e.datos_peregrino.apellidos}
                    </Text>
                    <Text style={s.peregrinoSub}>
                      {e.datos_peregrino.nacionalidad} ·{" "}
                      {e.datos_peregrino.tipo_documento}{" "}
                      {e.datos_peregrino.numero_documento}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => eliminarEstancia(e.id)}
                    style={s.btnEliminar}
                  >
                    <Text style={{ fontSize: 13, color: "#C0392B" }}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Método de pago inline */}
                <View style={s.pillsRow}>
                  {METODOS_PAGO.map((mp) => (
                    <TouchableOpacity
                      key={mp}
                      onPress={() =>
                        actualizarEstancia(e.id, { metodo_pago: mp } as any)
                      }
                      style={[s.pill, e.metodo_pago === mp && s.pillActive]}
                    >
                      <Text
                        style={[
                          s.pillText,
                          e.metodo_pago === mp && s.pillTextActive,
                        ]}
                      >
                        {mp.charAt(0).toUpperCase() + mp.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={s.peregrinoMeta}>
                  Entrada: {formatFecha(e.fecha_entrada)}
                  {e.fecha_salida
                    ? ` · Salida: ${formatFecha(e.fecha_salida)}`
                    : ""}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Exportar PDF */}
        {estancias.length > 0 && (
          <TouchableOpacity onPress={exportarPDF} style={s.btnPDF}>
            <Text style={s.btnPDFText}>📄 Exportar parte del día</Text>
          </TouchableOpacity>
        )}

        {/* Aviso legal */}
        <View style={s.avisoLegal}>
          <Text style={s.avisoLegalText}>
            🔒 Este registro es solo de referencia. El envío oficial a
            SES.HOSPEDAJES es responsabilidad del albergue.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Estilos ──────────────────────────────────────────────────
const s = StyleSheet.create({
  // Scanner
  scannerContainer: { flex: 1, backgroundColor: "black" },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  scannerFrame: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: "#C4843A",
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  scannerHint: {
    color: "white",
    fontSize: 14,
    marginTop: 24,
    textAlign: "center",
  },
  scannerClose: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  scannerCloseText: { color: "white", fontSize: 15, fontWeight: "600" },

  // Modal datos
  modalContainer: { flex: 1, backgroundColor: "#FAF7F2" },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1917",
    marginBottom: 16,
  },
  datosCard: {
    backgroundColor: "white",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E0D8",
    padding: 16,
    marginBottom: 20,
  },
  datosNombre: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1C1917",
    marginBottom: 2,
  },
  datosSexo: { fontSize: 13, color: "#6B6560", marginBottom: 12 },
  datosRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#F2EDE6",
  },
  datosLabel: { fontSize: 12, color: "#6B6560", width: 90 },
  datosValue: { fontSize: 12, color: "#1C1917", flex: 1, fontWeight: "500" },

  // Info
  infoCard: {
    backgroundColor: "#F5EBD8",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#C4843A",
    padding: 16,
    marginBottom: 20,
  },
  infoTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1917",
    marginBottom: 6,
  },
  infoDesc: { fontSize: 13, color: "#6B6560", lineHeight: 20 },

  // Header row
  headerRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-end",
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B6560",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputFecha: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E0D8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1C1917",
  },
  btnEscanear: {
    backgroundColor: "#C4843A",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  btnEscanearText: { color: "white", fontSize: 14, fontWeight: "600" },

  // Lista
  countLabel: {
    fontSize: 12,
    color: "#6B6560",
    marginBottom: 12,
    fontWeight: "600",
  },
  peregrinoCard: {
    backgroundColor: "white",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E0D8",
    padding: 14,
    marginBottom: 10,
  },
  peregrinoHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  peregrinoNombre: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1917",
    marginBottom: 2,
  },
  peregrinoSub: { fontSize: 12, color: "#6B6560" },
  peregrinoMeta: { fontSize: 11, color: "#9B9390", marginTop: 8 },
  btnEliminar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FDEAEA",
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
  },

  // Pills
  pillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#E5E0D8",
    backgroundColor: "white",
  },
  pillActive: { borderColor: "#C4843A", backgroundColor: "#F5EBD8" },
  pillText: { fontSize: 12, color: "#6B6560" },
  pillTextActive: { color: "#C4843A", fontWeight: "600" },

  // Input
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E0D8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1C1917",
    marginTop: 6,
  },

  // Botones
  btnPrimary: {
    backgroundColor: "#C4843A",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  btnPrimaryText: { color: "white", fontSize: 14, fontWeight: "600" },
  btnSecondary: {
    borderWidth: 1,
    borderColor: "#E5E0D8",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  btnSecondaryText: { fontSize: 14, color: "#6B6560" },
  btnEliminarEstancia: {
    backgroundColor: "#FDEAEA",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    marginTop: 8,
  },

  // PDF
  btnPDF: {
    backgroundColor: "#2C1F0E",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  btnPDFText: { color: "white", fontSize: 14, fontWeight: "600" },

  // Empty
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyText: {
    fontSize: 14,
    color: "#6B6560",
    fontWeight: "600",
    marginBottom: 6,
  },
  emptySubtext: { fontSize: 13, color: "#9B9390", textAlign: "center" },

  // Aviso
  avisoLegal: {
    marginTop: 24,
    padding: 14,
    backgroundColor: "#F2EDE6",
    borderRadius: 10,
  },
  avisoLegalText: { fontSize: 11, color: "#9B9390", lineHeight: 16 },

  // Sección
  seccionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B6560",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
});
