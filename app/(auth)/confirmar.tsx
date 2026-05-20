// 📄 app/(auth)/confirmar.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

const C = {
  fondo: "#FAF7F2",
  tinta: "#1C1917",
  tintaSoft: "#6B6560",
  piedra: "#E5E0D8",
  acento: "#C4843A",
  blanco: "#FFFFFF",
} as const;

export default function ConfirmarScreen() {
  const { t } = useTranslation();

  return (
    <View style={s.container}>
      <Text style={s.icon}>📬</Text>
      <Text style={s.titulo}>{t("auth.confirmar.titulo")}</Text>
      <Text style={s.desc}>{t("auth.confirmar.descripcion")}</Text>
      <Text style={s.spam}>{t("auth.confirmar.spam")}</Text>
      <TouchableOpacity
        onPress={() => router.replace("/(auth)/login")}
        style={s.btn}
      >
        <Text style={s.btnText}>{t("auth.confirmar.volver")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.fondo,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  icon: { fontSize: 56, marginBottom: 24 },
  titulo: {
    fontSize: 22,
    fontWeight: "800",
    color: C.tinta,
    marginBottom: 12,
    textAlign: "center",
  },
  desc: {
    fontSize: 14,
    color: C.tintaSoft,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 12,
  },
  spam: {
    fontSize: 12,
    color: C.tintaSoft,
    textAlign: "center",
    marginBottom: 32,
    fontStyle: "italic",
  },
  btn: {
    borderWidth: 1,
    borderColor: C.piedra,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 28,
    backgroundColor: C.blanco,
  },
  btnText: { fontSize: 14, color: C.tinta, fontWeight: "500" },
});
