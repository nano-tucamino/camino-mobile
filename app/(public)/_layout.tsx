// 📄 app/(public)/_layout.tsx
import { View, StyleSheet } from "react-native";
import { Slot } from "expo-router";
import BottomNav from "../../components/BottomNav";

export default function PublicLayout() {
  return (
    <View style={styles.container}>
      <Slot />
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF8",
  },
});
