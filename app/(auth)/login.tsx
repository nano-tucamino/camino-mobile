// 📄 app/(auth)/login.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

const C = {
  fondo: "#FAF7F2",
  tinta: "#1C1917",
  tintaSoft: "#6B6560",
  piedra: "#E5E0D8",
  piedraDark: "#C9C0B4",
  acento: "#C4843A",
  acentoSoft: "#F5EBD8",
  blanco: "#FFFFFF",
  rojo: "#C0392B",
  oscuro: "#2C1F0E",
} as const;

type Paso = "email" | "password" | "registro";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  const [paso, setPaso] = useState<Paso>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarPasswordRegistro, setMostrarPasswordRegistro] = useState(false);

  async function handleGoogle() {
    setLoading(true);
    setError("");
    const { error } = await signInWithGoogle();
    if (error) setError(t("auth.login.error_google"));
    setLoading(false);
  }

  async function handleContinuarEmail() {
    if (!email.trim() || !email.includes("@")) {
      setError(t("auth.login.error_email_invalido"));
      return;
    }
    setError("");
    setPaso(modo === "registro" ? "registro" : "password");
  }

  async function handleSubmitPassword() {
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    const { error } = await signInWithEmail(email, password);
    if (error) setError(t("auth.login.error_credenciales"));
    setLoading(false);
  }

  async function handleSubmitRegistro() {
    if (!nombre.trim() || !password.trim()) return;
    if (password.length < 8) {
      setError(t("auth.registro_page.error_password"));
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await signUpWithEmail(email, password, nombre);
    if (error) setError(error.message);
    else router.replace("/(auth)/confirmar");
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.fondo }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / marca */}
        <View style={s.marca}>
          <Image
            source={require("../../assets/logo-azul.png")}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.appName}>Tu Camino</Text>
          <Text style={s.appSub}>{t("hero.subtitulo")}</Text>
        </View>

        <View style={s.card}>
          {/* ── PASO EMAIL ── */}
          {paso === "email" && (
            <>
              <Text style={s.titulo}>
                {modo === "login"
                  ? t("auth.login.titulo_email")
                  : t("auth.registro_page.titulo_paso1")}
              </Text>
              <Text style={s.subtitulo}>
                {modo === "login"
                  ? t("auth.login.subtitulo_email")
                  : t("auth.registro_page.subtitulo_paso1")}
              </Text>

              {/* Google */}
              <TouchableOpacity
                style={s.btnGoogle}
                onPress={handleGoogle}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Image
                  source={require("../../assets/google-icon.png")}
                  style={s.googleIcon}
                  resizeMode="contain"
                />

                <Text style={s.btnGoogleText}>
                  {modo === "login"
                    ? t("auth.login.google")
                    : t("auth.registro_page.google")}
                </Text>
              </TouchableOpacity>

              <View style={s.separador}>
                <View style={s.linea} />
                <Text style={s.oText}>{t("auth.registro_page.o_email")}</Text>
                <View style={s.linea} />
              </View>

              {/* Email */}
              <Text style={s.label}>{t("auth.login.label_email")}</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t("auth.login.placeholder_email")}
                placeholderTextColor={C.piedraDark}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={s.input}
              />

              {error !== "" && <Text style={s.error}>{error}</Text>}

              <TouchableOpacity
                style={[s.btnPrimary, loading && { opacity: 0.6 }]}
                onPress={handleContinuarEmail}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={C.blanco} />
                ) : (
                  <Text style={s.btnPrimaryText}>
                    {t("auth.login.continuar_email")}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Switch modo login/registro — CORREGIDO */}
              <TouchableOpacity
                style={s.switchModo}
                onPress={() => {
                  setModo(modo === "login" ? "registro" : "login");
                  setError("");
                }}
              >
                <Text style={s.switchModoText}>
                  {modo === "login"
                    ? `${t("auth.login.no_cuenta")} `
                    : `${t("auth.registro_page.ya_tienes")} `}
                  <Text style={{ color: C.acento, fontWeight: "600" }}>
                    {modo === "login"
                      ? (t("auth.login.registrate") ?? "Regístrate gratis")
                      : (t("auth.registro_page.inicia_sesion") ??
                        "Inicia sesión")}
                  </Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.saltar}
                onPress={() => router.replace("/(public)")}
              >
                <Text style={s.saltarText}>{t("auth.saltar")}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── PASO PASSWORD (login) ── */}
          {paso === "password" && (
            <>
              <TouchableOpacity
                onPress={() => setPaso("email")}
                style={s.volver}
              >
                <Text style={s.volverText}>{t("auth.login.volver")}</Text>
              </TouchableOpacity>

              <Text style={s.titulo}>{t("auth.login.titulo_password")}</Text>
              <Text style={s.emailMostrado}>{email}</Text>

              <Text style={s.label}>{t("auth.login.label_password")}</Text>
              <View style={s.inputContainer}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t("auth.login.placeholder_password")}
                  placeholderTextColor={C.piedraDark}
                  secureTextEntry={!mostrarPassword}
                  style={s.inputWithIcon}
                />
                <TouchableOpacity
                  onPress={() => setMostrarPassword(!mostrarPassword)}
                  style={s.eyeBtn}
                >
                  <Text style={s.eyeIcon}>{mostrarPassword ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>

              {error !== "" && <Text style={s.error}>{error}</Text>}

              <TouchableOpacity
                style={[s.btnPrimary, loading && { opacity: 0.6 }]}
                onPress={handleSubmitPassword}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={C.blanco} />
                ) : (
                  <Text style={s.btnPrimaryText}>{t("auth.login.entrar")}</Text>
                )}
              </TouchableOpacity>

              {/* Recuperar contraseña */}
              <TouchableOpacity style={s.olvidaste}>
                <Text style={s.olvidasteText}>{t("auth.login.olvidaste")}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── PASO REGISTRO ── */}
          {paso === "registro" && (
            <>
              <TouchableOpacity
                onPress={() => setPaso("email")}
                style={s.volver}
              >
                <Text style={s.volverText}>
                  {t("auth.registro_page.volver")}
                </Text>
              </TouchableOpacity>

              <Text style={s.titulo}>
                {t("auth.registro_page.titulo_paso1")}
              </Text>
              <Text style={s.emailMostrado}>{email}</Text>

              <Text style={s.label}>
                {t("auth.registro_page.label_nombre")}
              </Text>
              <TextInput
                value={nombre}
                onChangeText={setNombre}
                placeholder={t("auth.registro_page.placeholder_nombre")}
                placeholderTextColor={C.piedraDark}
                autoCapitalize="words"
                style={s.input}
              />

              <Text style={[s.label, { marginTop: 12 }]}>
                {t("auth.registro_page.label_password")}
              </Text>
              <View style={s.inputContainer}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t("auth.registro_page.placeholder_password")}
                  placeholderTextColor={C.piedraDark}
                  secureTextEntry={!mostrarPasswordRegistro}
                  style={s.inputWithIcon}
                />
                <TouchableOpacity
                  onPress={() =>
                    setMostrarPasswordRegistro(!mostrarPasswordRegistro)
                  }
                  style={s.eyeBtn}
                >
                  <Text style={s.eyeIcon}>
                    {mostrarPasswordRegistro ? "🙈" : "👁️"}
                  </Text>
                </TouchableOpacity>
              </View>

              {error !== "" && <Text style={s.error}>{error}</Text>}

              <TouchableOpacity
                style={[s.btnPrimary, loading && { opacity: 0.6 }]}
                onPress={handleSubmitRegistro}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={C.blanco} />
                ) : (
                  <Text style={s.btnPrimaryText}>
                    {t("auth.registro_page.comenzar")}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingBottom: 40,
  },
  marca: { alignItems: "center", marginBottom: 32 },
  logo: { width: 56, height: 56, marginBottom: 10 },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    color: C.oscuro,
    letterSpacing: -0.5,
  },
  appSub: { fontSize: 13, color: C.tintaSoft, marginTop: 4 },

  card: {
    backgroundColor: C.blanco,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.piedra,
    padding: 24,
  },
  titulo: { fontSize: 18, fontWeight: "700", color: C.tinta, marginBottom: 6 },
  subtitulo: {
    fontSize: 13,
    color: C.tintaSoft,
    lineHeight: 20,
    marginBottom: 20,
  },
  emailMostrado: {
    fontSize: 13,
    color: C.acento,
    fontWeight: "500",
    marginBottom: 16,
  },

  btnGoogle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: C.piedra,
    borderRadius: 12,
    paddingVertical: 13,
    backgroundColor: C.blanco,
    marginBottom: 16,
  },
  googleIcon: { width: 32, height: 32 },
  btnGoogleText: { fontSize: 14, fontWeight: "500", color: C.tinta },

  separador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  linea: { flex: 1, height: 1, backgroundColor: C.piedra },
  oText: { fontSize: 12, color: C.piedraDark },

  label: {
    fontSize: 11,
    fontWeight: "600",
    color: C.tintaSoft,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: C.piedra,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.tinta,
    backgroundColor: C.blanco,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.piedra,
    borderRadius: 10,
    backgroundColor: C.blanco,
    marginBottom: 16,
  },
  inputWithIcon: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.tinta,
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  eyeIcon: {
    fontSize: 16,
  },

  error: { fontSize: 13, color: C.rojo, marginBottom: 12 },

  btnPrimary: {
    backgroundColor: C.acento,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  btnPrimaryText: { color: C.blanco, fontSize: 15, fontWeight: "700" },

  switchModo: { alignItems: "center", marginTop: 16 },
  switchModoText: { fontSize: 13, color: C.tintaSoft },

  saltar: { alignItems: "center", marginTop: 12 },
  saltarText: { fontSize: 13, color: C.piedraDark },

  volver: { marginBottom: 16 },
  volverText: { fontSize: 13, color: C.acento, fontWeight: "500" },

  olvidaste: { alignItems: "center", marginTop: 12 },
  olvidasteText: { fontSize: 13, color: C.tintaSoft },
});
