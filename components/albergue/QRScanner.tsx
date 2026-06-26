// 📄 camino-mobile/components/albergue/QRScanner.tsx
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";

export default function QRScanner({
  onScan,
  onClose,
}: {
  onScan: (data: string) => void;
  onClose: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission().then(({ granted }) => {
        if (!granted) {
          Alert.alert("Permiso denegado", "Necesitas dar acceso a la cámara.");
          onClose();
        }
      });
    }
  }, []);

  return (
    <View style={s.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={({ data }) => onScan(data)}
      />
      <View style={s.overlay}>
        <View style={s.frame} />
        <Text style={s.hint}>Apunta al QR del peregrino</Text>
      </View>
      <TouchableOpacity style={s.close} onPress={onClose}>
        <Text style={s.closeText}>✕ Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  frame: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: "#C4843A",
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  hint: { color: "white", fontSize: 14, marginTop: 24, textAlign: "center" },
  close: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  closeText: { color: "white", fontSize: 15, fontWeight: "600" },
});
