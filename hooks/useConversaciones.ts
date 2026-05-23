// 📄 hooks/useConversaciones.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  getConversacionesUsuario,
  getMensajes,
  getTextoMensaje,
  Conversacion,
  Mensaje,
} from "@/lib/chat";
import i18n from "@/lib/i18n";

export interface ConversacionConPreview extends Conversacion {
  ultimoMensaje: Mensaje | null;
  ultimoTexto: string;
  noLeidos: number;
  otroParticipante?: {
    id: string;
    nombre_display: string | null;
    avatar_url: string | null;
  } | null;
}

interface UseConversacionesReturn {
  conversaciones: ConversacionConPreview[];
  loading: boolean;
  reload: () => Promise<void>;
}

export function useConversaciones(): UseConversacionesReturn {
  const [conversaciones, setConversaciones] = useState<
    ConversacionConPreview[]
  >([]);
  const [loading, setLoading] = useState(true);
  const locale = i18n.language ?? "en";

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const convs = await getConversacionesUsuario();

      // Para cada conversación cargar último mensaje y participantes DM
      const conPreview = await Promise.all(
        convs.map(async (conv) => {
          // Último mensaje
          let ultimoMensaje: Mensaje | null = null;
          try {
            const msgs = await getMensajes(conv.id, 1);
            ultimoMensaje = msgs[0] ?? null;
          } catch {}

          const ultimoTexto = ultimoMensaje
            ? getTextoMensaje(ultimoMensaje, locale)
            : "";

          // Participante para DMs
          let otroParticipante = null;
          if (conv.tipo === "directo") {
            const { data: sessionData } = await supabase.auth.getSession();
            const userId = sessionData.session?.user?.id;
            if (userId) {
              const { data } = await supabase
                .from("conversacion_participantes")
                .select(
                  "perfil:perfiles!perfil_id(id, nombre_display, avatar_url)",
                )
                .eq("conversacion_id", conv.id)
                .neq("perfil_id", userId)
                .single();
              otroParticipante = (data as any)?.perfil ?? null;
            }
          }

          return {
            ...conv,
            ultimoMensaje,
            ultimoTexto,
            noLeidos: 0, // TODO: implementar con tabla leidos
            otroParticipante,
          } satisfies ConversacionConPreview;
        }),
      );

      // Ordenar por último mensaje más reciente
      conPreview.sort((a, b) => {
        const ta = a.ultimoMensaje?.created_at ?? a.created_at;
        const tb = b.ultimoMensaje?.created_at ?? b.created_at;
        return tb.localeCompare(ta);
      });

      setConversaciones(conPreview);
    } catch (e) {
      console.error("Error cargando conversaciones:", e);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { conversaciones, loading, reload: cargar };
}
