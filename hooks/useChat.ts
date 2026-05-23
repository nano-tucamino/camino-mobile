// 📄 hooks/useChat.ts
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  getMensajes,
  enviarMensaje,
  getTextoMensaje,
  normalizeMensaje,
  Mensaje,
} from "@/lib/chat";
import i18n from "@/lib/i18n";

interface UseChatOptions {
  conversacionId: string | null;
  locale?: string;
}

interface UseChatReturn {
  mensajes: Mensaje[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  enviar: (contenido: string, replyToId?: string) => Promise<void>;
  cargarMas: () => Promise<void>;
  hayMas: boolean;
  getTexto: (mensaje: Mensaje) => string;
}

export function useChat({
  conversacionId,
  locale,
}: UseChatOptions): UseChatReturn {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hayMas, setHayMas] = useState(false);

  const userLocale = locale ?? i18n.language ?? "en";
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const LIMIT = 50;

  // ─── Carga inicial ───────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    if (!conversacionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMensajes(conversacionId, LIMIT);
      setMensajes(data);
      setHayMas(data.length === LIMIT);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [conversacionId]);

  // ─── Cargar más (scroll hacia arriba) ───────────────────────────────────
  const cargarMas = useCallback(async () => {
    if (!conversacionId || !hayMas || mensajes.length === 0) return;
    try {
      const oldest = mensajes[0].created_at;
      const mas = await getMensajes(conversacionId, LIMIT, oldest);
      setMensajes((prev) => [...mas, ...prev]);
      setHayMas(mas.length === LIMIT);
    } catch (e: any) {
      setError(e.message);
    }
  }, [conversacionId, hayMas, mensajes]);

  // ─── Realtime ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversacionId) return;

    cargar();

    const channel = supabase
      .channel(`chat:${conversacionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes",
          filter: `conversacion_id=eq.${conversacionId}`,
        },
        async (payload) => {
          // Esperar a que el webhook de traducción procese
          await new Promise((r) => setTimeout(r, 800));

          // Recargar el mensaje completo con autor y traducciones
          const { data } = await supabase
            .from("mensajes")
            .select(
              `id, conversacion_id, autor_id, contenido, idioma_origen, traducciones,
               created_at, reply_to_id, deleted_at,
               autor:perfiles!autor_id(id, nombre_display, avatar_url, idioma_nativo, nacionalidad)`,
            )
            .eq("id", payload.new.id)
            .single();

          if (data) {
            const mensaje = normalizeMensaje(data as unknown as Mensaje);
            setMensajes((prev) => {
              const existe = prev.find((m) => m.id === mensaje.id);
              if (existe)
                return prev.map((m) => (m.id === mensaje.id ? mensaje : m));
              return [...prev, mensaje];
            });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "mensajes",
          filter: `conversacion_id=eq.${conversacionId}`,
        },
        (payload) => {
          // Llegan las traducciones cuando el webhook las procesa
          setMensajes((prev) =>
            prev.map((m) =>
              m.id === payload.new.id
                ? normalizeMensaje({
                    ...m,
                    ...(payload.new as unknown as Mensaje),
                  })
                : m,
            ),
          );
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversacionId, cargar]);

  // ─── Enviar ──────────────────────────────────────────────────────────────
  const enviar = useCallback(
    async (contenido: string, replyToId?: string) => {
      if (!conversacionId || !contenido.trim()) return;
      setSending(true);
      setError(null);
      try {
        await enviarMensaje(
          conversacionId,
          contenido.trim(),
          userLocale,
          replyToId,
        );
        // El mensaje llega via Realtime — no añadir manualmente para evitar duplicados
      } catch (e: any) {
        setError(e.message);
      } finally {
        setSending(false);
      }
    },
    [conversacionId, userLocale],
  );

  const getTexto = useCallback(
    (mensaje: Mensaje) => getTextoMensaje(mensaje, userLocale),
    [userLocale],
  );

  return {
    mensajes,
    loading,
    sending,
    error,
    enviar,
    cargarMas,
    hayMas,
    getTexto,
  };
}
