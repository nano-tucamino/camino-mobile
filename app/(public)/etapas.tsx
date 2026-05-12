// 📄 app/(public)/etapas.tsx
import { View, Text, StyleSheet } from "react-native";

export default function EtapasScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>⚡ Etapas</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 18, color: "#666" },
});
