// 📄 contexts/UnreadContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { AppState } from "react-native";
import { supabase } from "@/lib/supabase";

interface UnreadContextType {
  count: number;
  refresh: () => Promise<void>;
}

const UnreadContext = createContext<UnreadContextType>({
  count: 0,
  refresh: async () => {},
});

export function UnreadProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string | null;
}) {
  const [count, setCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setCount(0);
      return;
    }

    const { data: participaciones } = await supabase
      .from("conversacion_participantes")
      .select("conversacion_id, ultimo_leido_at")
      .eq("perfil_id", userId);

    if (!participaciones?.length) {
      setCount(0);
      return;
    }

    let total = 0;
    await Promise.all(
      participaciones.map(async (p) => {
        let query = supabase
          .from("mensajes")
          .select("id", { count: "exact", head: true })
          .eq("conversacion_id", p.conversacion_id)
          .neq("autor_id", userId)
          .is("deleted_at", null);

        if (p.ultimo_leido_at) {
          query = query.gt("created_at", p.ultimo_leido_at);
        }

        const { count } = await query;
        total += count ?? 0;
      }),
    );

    setCount(total);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }

    refresh();

    // Realtime — nuevo mensaje en cualquier conversación
    const topic = `unread-${userId}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes",
        },
        (payload) => {
          if (payload.new.autor_id !== userId) refresh();
        },
      )
      .subscribe();

    channelRef.current = channel;

    // Refrescar al volver a primer plano
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });

    return () => {
      sub.remove();
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [userId, refresh]);

  return (
    <UnreadContext.Provider value={{ count, refresh }}>
      {children}
    </UnreadContext.Provider>
  );
}

export function useUnread() {
  return useContext(UnreadContext);
}
