// 📄 app/(public)/albergues.tsx
import { View, Text, StyleSheet } from "react-native";

export default function AlberguesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🏠 Albergues</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 18, color: "#666" },
});
