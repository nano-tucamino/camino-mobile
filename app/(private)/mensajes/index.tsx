// 📄 app/(private)/mensajes/index.tsx
import React from "react";
import {
  View,
  Text,
  FlatList,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useConversaciones } from "@/hooks/useConversaciones";
import { ConversationItem } from "@/components/chat/ConversationItem";
import { useAuth } from "@/contexts/AuthContext";

export default function MensajesScreen() {
  const router = useRouter();
  const { user, perfil } = useAuth();
  const { conversaciones, loading, reload } = useConversaciones();

  const rol = perfil?.rol ?? null;
  const esNegocio = rol === "albergue" || rol === "negocio";

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={styles.emptyTitulo}>Mensajes</Text>
        <Text style={styles.emptyTexto}>
          Inicia sesión para ver tus conversaciones con otros peregrinos y
          albergues.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C8A96E" />
      </View>
    );
  }

  // — Separar canal propio del resto —
  const canalPropio = esNegocio
    ? conversaciones.filter((c) => {
        if (rol === "albergue")
          return c.tipo === "albergue" && c.albergue_id === perfil?.albergue_id;
        if (rol === "negocio")
          return c.tipo === "negocio" && c.negocio_id === perfil?.negocio_id;
        return false;
      })
    : [];

  const dmsPersonales = esNegocio
    ? conversaciones.filter((c) => !canalPropio.includes(c))
    : conversaciones;

  // — Render para peregrino: FlatList simple sin cambios —
  if (!esNegocio) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.titulo}>Mensajes</Text>
          <Text style={styles.subtitulo}>Cada uno lee en su idioma</Text>
        </View>
        <FlatList
          data={dmsPersonales}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationItem
              conv={item}
              onPress={() => router.push(`/mensajes/${item.id}`)}
            />
          )}
          ListEmptyComponent={<EmptyList />}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={reload}
              tintColor="#C8A96E"
            />
          }
        />
      </View>
    );
  }

  // — Render para albergue/negocio: SectionList con canal propio destacado —
  const sections = [
    ...(canalPropio.length > 0
      ? [
          {
            key: "canal",
            title:
              rol === "albergue"
                ? "🏠 Canal de tu albergue"
                : "🏪 Canal de tu negocio",
            data: canalPropio,
          },
        ]
      : []),
    { key: "dms", title: "💬 Mensajes privados", data: dmsPersonales },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Mensajes</Text>
        <Text style={styles.subtitulo}>Cada uno lee en su idioma</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitulo}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item, section }) => (
          <ConversationItem
            conv={item}
            onPress={() => router.push(`/mensajes/${item.id}`)}
            destacado={section.key === "canal"}
          />
        )}
        SectionSeparatorComponent={() => (
          <View style={styles.sectionSeparator} />
        )}
        ListEmptyComponent={<EmptyList />}
        renderSectionFooter={({ section }) =>
          section.key === "dms" && dmsPersonales.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyTexto}>
                Aún no tienes mensajes privados.
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={reload}
            tintColor="#C8A96E"
          />
        }
      />
    </View>
  );
}

function EmptyList() {
  return (
    <View style={styles.emptyList}>
      <Text style={styles.emptyIcon}>🌿</Text>
      <Text style={styles.emptyTexto}>
        Todavía no tienes conversaciones.{"\n"}
        Entra en una etapa o un albergue para empezar.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF7F2" },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E0D0",
  },
  titulo: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2C2C2C",
    letterSpacing: -0.5,
  },
  subtitulo: {
    fontSize: 13,
    color: "#C8A96E",
    marginTop: 2,
  },

  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: "#FAF7F2",
  },
  sectionTitulo: {
    fontSize: 12,
    fontWeight: "700",
    color: "#A09080",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionSeparator: {
    height: 8,
    backgroundColor: "#F0EAE0",
  },

  emptySection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitulo: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2C2C2C",
    marginBottom: 8,
  },
  emptyTexto: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 21,
  },
  emptyList: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
});
