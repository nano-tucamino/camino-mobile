// 📄 contexts/NavigationContext.tsx
import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import { Animated } from "react-native";
import { usePathname } from "expo-router";

interface NavigationContextValue {
  visible: boolean;
  navAnim: Animated.Value;
  onScroll: () => void;
  hideNav: () => void;
  showNav: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);
const AUTO_HIDE_DELAY = 4000;

export function NavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const navAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleRef = useRef(true);
  const [visible, setVisible] = useState(true);
  const pathname = usePathname();

  const animate = useCallback(
    (toValue: number, cb?: () => void) => {
      Animated.timing(navAnim, {
        toValue,
        duration: 220,
        useNativeDriver: true,
      }).start(cb);
    },
    [navAnim],
  );

  const showNav = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    visibleRef.current = true;
    setVisible(true);
    animate(1);
  }, [animate]);

  const hideNav = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    visibleRef.current = false;
    animate(0, () => setVisible(false));
  }, [animate]);

  const scheduleHide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      visibleRef.current = false;
      animate(0, () => setVisible(false));
    }, AUTO_HIDE_DELAY);
  }, [animate]);

  const onScroll = useCallback(() => {
    if (!visibleRef.current) {
      visibleRef.current = true;
      setVisible(true);
      animate(1);
    }
    scheduleHide();
  }, [animate, scheduleHide]);

  useEffect(() => {
    visibleRef.current = true;
    setVisible(true);
    animate(1);
    scheduleHide();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  return (
    <NavigationContext.Provider
      value={{ visible, navAnim, onScroll, showNav, hideNav }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx)
    throw new Error("useNavigation must be used within NavigationProvider");
  return ctx;
}
