//C:\Users\ferna\Documents\tucamino\camino-mobile\components\BottomNav.tsx

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useTranslation } from "react-i18next";
import Svg, { Path } from "react-native-svg";
import { useNavigation } from "@/contexts/NavigationContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUnread } from "@/contexts/UnreadContext";

const GOLD = "#D4AF72";
const SOFT = "#999";
const BG = "#FAFAF8";

function IconMapa({ active }: { active: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {active ? (
        <Path
          fill={GOLD}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7l6-3 5.447 2.724A1 1 0 0121 7.618v10.764a1 1 0 01-1.447.894L15 17l-6 3z"
        />
      ) : (
        <Path
          stroke={SOFT}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7l6-3 5.447 2.724A1 1 0 0121 7.618v10.764a1 1 0 01-1.447.894L15 17l-6 3z"
        />
      )}
    </Svg>
  );
}

function IconEtapas({ active }: { active: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {active ? (
        <Path fill={GOLD} d="M13 3l-7 9h6l-1 9 7-9h-6z" />
      ) : (
        <Path
          stroke={SOFT}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 3l-7 9h6l-1 9 7-9h-6z"
        />
      )}
    </Svg>
  );
}

function IconAlbergues({ active }: { active: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {active ? (
        <Path
          fill={GOLD}
          d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5zM9 21v-6h6v6"
        />
      ) : (
        <>
          <Path
            stroke={SOFT}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
          />
          <Path
            stroke={SOFT}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 21v-6h6v6"
          />
        </>
      )}
    </Svg>
  );
}

function IconPerfil({ active }: { active: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {active ? (
        <Path
          fill={GOLD}
          d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
        />
      ) : (
        <>
          <Path
            stroke={SOFT}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
          <Path
            stroke={SOFT}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </>
      )}
    </Svg>
  );
}

function IconMensajes({ active, badge }: { active: boolean; badge: number }) {
  return (
    <View style={{ position: "relative" }}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        {active ? (
          <Path
            fill={GOLD}
            d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"
          />
        ) : (
          <Path
            stroke={SOFT}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"
          />
        )}
      </Svg>
      {badge > 0 && (
        <View style={badgeStyles.dot}>
          <Text style={badgeStyles.text}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      )}
    </View>
  );
}

// Icono Gestión (building / store)
function IconGestion({ active }: { active: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {active ? (
        <Path
          fill={GOLD}
          d="M3 9h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9zM3 9l2-5h14l2 5M9 21v-6h6v6"
        />
      ) : (
        <>
          <Path
            stroke={SOFT}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 9h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"
          />
          <Path
            stroke={SOFT}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 9l2-5h14l2 5"
          />
          <Path
            stroke={SOFT}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 21v-6h6v6"
          />
        </>
      )}
    </Svg>
  );
}

const badgeStyles = StyleSheet.create({
  dot: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#E53E3E",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#FAFAF8",
  },
  text: { color: "#fff", fontSize: 9, fontWeight: "700", lineHeight: 11 },
});

export default function BottomNav() {
  const { t } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const { navAnim, showNav } = useNavigation();
  const { session, perfil } = useAuth();
  const { count: unreadCount } = useUnread();

  const currentTab = (segments as string[])[1] ?? "index";
  const rol = perfil?.rol ?? null;

  const handlePerfil = () => {
    if (session) {
      router.push("/(auth)/perfil");
    } else {
      router.push("/(auth)/login");
    }
  };

  const handleGestion = () => {
    if (rol === "albergue" && perfil?.albergue_id) {
      router.push(`/(private)/gestion/albergue`);
    } else if (rol === "negocio" && perfil?.negocio_id) {
      router.push(`/(private)/gestion/negocio`);
    } else {
      router.push(`/(private)/gestion`);
    }
  };

  // Tab de mensajes — visible para peregrino, albergue y negocio
  const mensajesTab =
    session && rol !== "admin"
      ? [
          {
            key: "mensajes",
            label: t("nav.mensajes"),
            Icon: ({ active }: { active: boolean }) => (
              <IconMensajes active={active} badge={unreadCount} />
            ),
            onPress: () => router.push("/(private)/mensajes"),
          },
        ]
      : [];

  // Tab de gestión — solo albergue y negocio
  const gestionTab =
    session && (rol === "albergue" || rol === "negocio")
      ? [
          {
            key: "gestion",
            label: t("nav.gestion"),
            Icon: IconGestion,
            onPress: handleGestion,
          },
        ]
      : [];

  // Tab de perfil — peregrino y no autenticado; albergue/negocio no lo necesitan (tienen Gestión)
  const perfilTab =
    !session || rol === "peregrino"
      ? [
          {
            key: "perfil",
            label: session ? t("nav.perfil") : t("nav.entrar"),
            Icon: IconPerfil,
            onPress: handlePerfil,
          },
        ]
      : [];

  const tabs = [
    {
      key: "mapa",
      label: t("nav.mapa"),
      Icon: IconMapa,
      onPress: () => router.push("/(public)/mapa"),
    },
    {
      key: "etapas",
      label: t("nav.etapas"),
      Icon: IconEtapas,
      onPress: () => router.push("/(public)/etapas"),
    },
    {
      key: "albergues",
      label: t("nav.albergues"),
      Icon: IconAlbergues,
      onPress: () => router.push("/(public)/albergues"),
    },
    ...mensajesTab,
    ...gestionTab,
    ...perfilTab,
  ];

  const translateY = navAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [120, 0],
  });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { opacity: navAnim, transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity activeOpacity={1} onPress={showNav} style={styles.pill}>
        {tabs.map(({ key, label, Icon, onPress }) => {
          const active = currentTab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <Icon active={active} />
              <Text style={[styles.label, active && styles.labelActive]}>
                {label}
              </Text>
              {active && <View style={styles.dot} />}
            </TouchableOpacity>
          );
        })}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 34,
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 50,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BG,
    borderRadius: 20,
    padding: 6,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    minWidth: 56,
    position: "relative",
  },
  tabActive: { backgroundColor: "rgba(212,175,114,0.12)" },
  label: { fontSize: 10, fontWeight: "500", color: SOFT },
  labelActive: { fontWeight: "600", color: GOLD },
  dot: {
    position: "absolute",
    bottom: 4,
    width: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: GOLD,
    opacity: 0.7,
  },
});
