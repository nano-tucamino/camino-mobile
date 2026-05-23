// 📄 app/(public)/_layout.tsx
import { View, StyleSheet } from "react-native";
import { Slot } from "expo-router";

export default function PublicLayout() {
  return (
    <View style={styles.container}>
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF8",
  },
});
