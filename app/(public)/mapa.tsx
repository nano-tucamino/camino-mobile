// 📄 app/(public)/mapa.tsx
import { View, Text, StyleSheet } from "react-native";

export default function MapaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🗺️ Mapa</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 18, color: "#666" },
});

