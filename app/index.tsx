// 📄 app/index.tsx
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

export default function Landing() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Image
        source={{
          uri: "https://res.cloudinary.com/dazuwnm1k/image/upload/v1774432766/catedrales-santiago_yntkre.webp",
        }}
        style={styles.bgImage}
        resizeMode="cover"
      />

      <View style={styles.overlay} />

      <View style={styles.content}>
        {/* Logo arriba */}
        <View style={styles.header}>
          <Image
            source={require("../assets/logo-blanco.png")}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>Tu Camino</Text>
        </View>

        {/* Título + CTA juntos abajo */}
        <View style={styles.bottom}>
          <View style={styles.titleContainer}>
            <Text style={styles.siente}>{t("landing.siente_el")}</Text>
            <Text style={styles.camino}>{t("landing.camino")}</Text>
          </View>

          <View style={styles.ctaContainer}>
            <Text style={styles.subtitulo}>{t("landing.subtitulo")}</Text>
            <TouchableOpacity
              style={styles.btnDescubre}
              onPress={() => router.replace("/(public)" as any)}
            >
              <Text style={styles.btnDescubreText}>
                {t("landing.descubre")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.linkLogin}>{t("auth.con_cuenta")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1814" },
  bgImage: {
    position: "absolute",
    width,
    height,
  },
  overlay: {
    position: "absolute",
    width,
    height,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 52,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoImg: {
    width: 36,
    height: 36,
  },
  logoText: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  bottom: {
    gap: 20,
  },
  titleContainer: {
    alignItems: "flex-start",
  },
  siente: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 44,
    fontWeight: "700",
    lineHeight: 48,
    letterSpacing: -1.5,
  },
  camino: {
    color: "#D4AF72",
    fontSize: 54,
    fontWeight: "700",
    fontStyle: "italic",
    lineHeight: 58,
    letterSpacing: -2,
  },
  ctaContainer: {
    gap: 16,
  },
  subtitulo: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  btnDescubre: {
    backgroundColor: "#D4AF72",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnDescubreText: {
    color: "#1a1814",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  linkLogin: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
