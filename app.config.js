// 📄 app.config.js
export default {
  expo: {
    name: "camino-mobile",
    slug: "camino-mobile",
    scheme: "caminomobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon-play-store-512.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icon-play-store-512.png",
        backgroundColor: "#ffffff",
      },
      predictiveBackGestureEnabled: false,
      package: "com.obrasdenivel.caminomobile",
      permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: false,
          data: [{ scheme: "caminomobile" }],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "@sentry/react-native/expo",
        {
          organization: "caminosantiagoapp",
          project: "camino-mobile",
        },
      ],
      "expo-web-browser",
      "@rnmapbox/maps",
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Allow $(PRODUCT_NAME) to use your location to show your position on the Camino map.",
        },
      ],
    ],
    extra: {
      router: {},
      eas: {
        projectId: "dc24e079-46cf-4cdf-890b-5a6dcc1606d1",
      },
    },
  },
};
