// 📄 app.config.js
export default {
  expo: {
    name: "camino-mobile",
    slug: "camino-mobile",
    scheme: "caminomobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
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
        foregroundImage: "./assets/adaptive-icon.png",
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
          locationAlwaysAndWhenInUsePermission:
            "Allow $(PRODUCT_NAME) to access your location even when you are not using the app.",
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
