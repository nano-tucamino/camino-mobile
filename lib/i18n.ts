// 📄 lib/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import es from "../locales/es/common.json";
import en from "../locales/en/common.json";
import de from "../locales/de/common.json";
import fr from "../locales/fr/common.json";
import it from "../locales/it/common.json";
import pt from "../locales/pt/common.json";
import ko from "../locales/ko/common.json";
import ja from "../locales/ja/common.json";

const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? "en";
const supportedLanguages = ["es", "en", "de", "fr", "it", "pt", "ko", "ja"];
const lng = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : "en";

i18n.use(initReactI18next).init({
  resources: {
    es: { common: es },
    en: { common: en },
    de: { common: de },
    fr: { common: fr },
    it: { common: it },
    pt: { common: pt },
    ko: { common: ko },
    ja: { common: ja },
  },
  lng,
  fallbackLng: "en",
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

export default i18n;

