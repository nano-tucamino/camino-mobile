// 📄 components/etapa/CanalWidget.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { ChatRoom } from "@/components/chat/ChatRoom";

interface Props {
  canalId: string | null;
  etapaNombre: string;
  color: string;
  visto?: boolean;
  onOpen?: () => void;
  lang: string;
  tieneRecientes?: boolean;
}

const { height: SH } = Dimensions.get("window");
const DRAWER_HEIGHT = SH * 0.75;

export default function CanalWidget({
  canalId,
  etapaNombre,
  color,
  lang,
  visto = false,
  onOpen,
  tieneRecientes = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(DRAWER_HEIGHT)).current;

  const openDrawer = () => {
    setOpen(true);
    if (onOpen) onOpen();
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: DRAWER_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setOpen(false));
  };

  return (
    <>
      {/* FAB */}
      <TouchableOpacity
        onPress={openDrawer}
        style={[s.fab, { backgroundColor: color }]}
        activeOpacity={0.85}
      >
        <Text style={s.fabIcon}>💬</Text>
        {!visto && tieneRecientes && <View style={s.fabBadge} />}
      </TouchableOpacity>

      {/* Drawer */}
      {open && (
        <>
          <TouchableOpacity
            style={s.backdrop}
            onPress={closeDrawer}
            activeOpacity={1}
          />
          <Animated.View
            style={[s.drawer, { transform: [{ translateY: slideAnim }] }]}
          >
            {/* Handle */}
            <View style={s.handle} />

            {/* Header */}
            <View style={s.drawerHeader}>
              <View style={[s.headerDot, { backgroundColor: color }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.drawerTitulo}>Canal de la etapa</Text>
                <Text style={s.drawerSub}>{etapaNombre}</Text>
              </View>
              <TouchableOpacity onPress={closeDrawer} style={s.closeBtn}>
                <Text style={s.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* ChatRoom real */}
            <View style={{ flex: 1 }}>
              <ChatRoom conversacionId={canalId} />
            </View>
          </Animated.View>
        </>
      )}
    </>
  );
}

const s = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 120,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: { fontSize: 22 },
  fabBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#dc2626",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 98,
  },
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: DRAWER_HEIGHT,
    backgroundColor: "#FAF7F2",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 99,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D4C5A9",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBE0",
  },
  headerDot: { width: 3, height: 20, borderRadius: 2 },
  drawerTitulo: { fontSize: 16, fontWeight: "700", color: "#2C1F0E" },
  drawerSub: { fontSize: 12, color: "#8B7355" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0EBE0",
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: { fontSize: 14, color: "#8B7355" },
});
