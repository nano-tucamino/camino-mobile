// 📄 app/(private)/mensajes/index.tsx
import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useConversaciones } from "@/hooks/useConversaciones";
import { ConversationItem } from "@/components/chat/ConversationItem";
import { useAuth } from "@/hooks/useAuth";

export default function MensajesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { conversaciones, loading, reload } = useConversaciones();

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Mensajes</Text>
        <Text style={styles.subtitulo}>Cada uno lee en su idioma</Text>
      </View>

      <FlatList
        data={conversaciones}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationItem
            conv={item}
            onPress={() => router.push(`/mensajes/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Text style={styles.emptyIcon}>🌿</Text>
            <Text style={styles.emptyTexto}>
              Todavía no tienes conversaciones.{"\n"}
              Entra en una etapa o un albergue para empezar.
            </Text>
          </View>
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
