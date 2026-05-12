// 📄 app/index.tsx
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Map from "lucide-react-native/dist/esm/icons/map";
import House from "lucide-react-native/dist/esm/icons/house";
import MessageCircle from "lucide-react-native/dist/esm/icons/message-circle";
import Globe from "lucide-react-native/dist/esm/icons/globe";
import "../lib/i18n";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    ciudad: "Santiago de Compostela",
    image:
      "https://res.cloudinary.com/dazuwnm1k/image/upload/v1774432766/catedrales-santiago_yntkre.webp",
  },
  {
    ciudad: "León",
    image:
      "https://res.cloudinary.com/dazuwnm1k/image/upload/v1774432766/catedrales-leon_lajs32.webp",
  },
  {
    ciudad: "Astorga",
    image:
      "https://res.cloudinary.com/dazuwnm1k/image/upload/v1774711873/astorrrrga_yd1ttq.webp",
  },
];

const FEATURES = [
  { key: "mapa", Icon: Map },
  { key: "albergues", Icon: House },
  { key: "chat", Icon: MessageCircle },
  { key: "comunidad", Icon: Globe },
] as const;

export default function Landing() {
  const { t } = useTranslation();
  const router = useRouter();
  const [actual, setActual] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
      setTimeout(() => setActual((a) => (a + 1) % SLIDES.length), 600);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Animated.Image
        source={{ uri: SLIDES[actual].image }}
        style={[styles.bgImage, { opacity: fadeAnim }]}
        resizeMode="cover"
      />

      <View style={styles.overlay} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("../assets/logo-blanco.png")}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>Tu Camino</Text>
        </View>

        {/* Título */}
        <View style={styles.titleContainer}>
          <Text style={styles.titulo}>{t("landing.titulo")}</Text>
          <Text style={styles.tituloCamino}>{t("landing.camino")}</Text>
          <Animated.Text style={[styles.ciudad, { opacity: fadeAnim }]}>
            {SLIDES[actual].ciudad}
          </Animated.Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {FEATURES.map(({ key, Icon }) => (
            <View key={key} style={styles.featureRow}>
              <Icon size={18} color="#D4AF72" strokeWidth={1.5} />
              <Text style={styles.featureText}>
                {t(`landing.features.${key}`)}
              </Text>
            </View>
          ))}
        </View>

        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === actual && styles.dotActive]}
            />
          ))}
        </View>

        {/* CTAs */}
        <View style={styles.ctas}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.btnPrimaryText}>{t("auth.login")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => router.push("/auth/registro")}
          >
            <Text style={styles.btnSecondaryText}>{t("auth.registro")}</Text>
          </TouchableOpacity>
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
    backgroundColor: "rgba(0,0,0,0.52)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 48,
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
  titleContainer: { gap: 4 },
  titulo: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 48,
    fontWeight: "700",
    lineHeight: 52,
    letterSpacing: -1,
  },
  tituloCamino: {
    color: "#D4AF72",
    fontSize: 56,
    fontWeight: "700",
    fontStyle: "italic",
    lineHeight: 60,
    letterSpacing: -1,
  },
  ciudad: {
    color: "#D4AF72",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginTop: 12,
  },
  features: { gap: 14 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotActive: {
    width: 24,
    backgroundColor: "#D4AF72",
  },
  ctas: { gap: 12 },
  btnPrimary: {
    backgroundColor: "#D4AF72",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnPrimaryText: {
    color: "#1a1814",
    fontSize: 16,
    fontWeight: "700",
  },
  btnSecondary: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  btnSecondaryText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
});
