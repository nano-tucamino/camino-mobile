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

interface NavigationContextValue {
  visible: boolean;
  navAnim: Animated.Value;
  onScroll: () => void;
  hideNav: () => void;
  showNav: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

const AUTO_HIDE_DELAY = 3500; // ms

export function NavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(true);
  const navAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animate = useCallback(
    (toValue: number, callback?: () => void) => {
      Animated.timing(navAnim, {
        toValue,
        duration: 220,
        useNativeDriver: true,
      }).start(callback);
    },
    [navAnim],
  );

  const hideNav = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    animate(0, () => setVisible(false));
  }, [animate]);

  const showNav = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(true);
    animate(1);
  }, [animate]);

  const scheduleHide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      animate(0, () => setVisible(false));
    }, AUTO_HIDE_DELAY);
  }, [animate]);

  const onScroll = useCallback(() => {
    // Al hacer scroll: mostrar si estaba oculto y resetear timer
    if (!visible) {
      setVisible(true);
      animate(1);
    }
    scheduleHide();
  }, [visible, animate, scheduleHide]);

  // Auto-hide inicial al montar
  useEffect(() => {
    scheduleHide();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <NavigationContext.Provider
      value={{ visible, navAnim, onScroll, hideNav, showNav }}
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

