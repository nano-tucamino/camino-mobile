import { View, StyleSheet } from "react-native";
import { Slot } from "expo-router";
import BottomNav from "../../components/BottomNav";
import { NavigationProvider } from "../../contexts/NavigationContext";

export default function PublicLayout() {
  return (
    <NavigationProvider>
      <View style={styles.container}>
        <Slot />
        <BottomNav />
      </View>
    </NavigationProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF8",
  },
});

