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

      // Obtener userId una sola vez fuera del map
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;

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
          if (conv.tipo === "directo" && userId) {
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

          // No leídos reales usando ultimo_leido_at
          let noLeidos = 0;
          if (userId) {
            try {
              const { data: participacion } = await supabase
                .from("conversacion_participantes")
                .select("ultimo_leido_at")
                .eq("conversacion_id", conv.id)
                .eq("perfil_id", userId)
                .single();

              let query = supabase
                .from("mensajes")
                .select("id", { count: "exact", head: true })
                .eq("conversacion_id", conv.id)
                .neq("autor_id", userId)
                .is("deleted_at", null);

              if (participacion?.ultimo_leido_at) {
                query = query.gt("created_at", participacion.ultimo_leido_at);
              }

              const { count } = await query;
              noLeidos = count ?? 0;
            } catch {}
          }

          return {
            ...conv,
            ultimoMensaje,
            ultimoTexto,
            noLeidos,
            otroParticipante,
          } satisfies ConversacionConPreview;
        }),
      );

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
