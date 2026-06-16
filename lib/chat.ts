// 📄 lib/chat.ts
import { apiGet } from "./api";
import { supabase } from "./supabase";

export interface AutorPerfil {
  id: string;
  nombre_display: string | null;
  avatar_url: string | null;
  idioma_nativo: string | null;
  nacionalidad: string | null;
}

export interface Mensaje {
  id: string;
  conversacion_id: string;
  autor_id: string;
  contenido: string;
  idioma_origen: string;
  traducciones: Record<string, string> | null;
  created_at: string;
  reply_to_id: string | null;
  deleted_at: string | null;
  // Supabase devuelve joins como array — usar normalizeAutor para leer
  autor?: AutorPerfil | AutorPerfil[] | null;
}

export interface Conversacion {
  id: string;
  tipo: "directo" | "canal_etapa" | "albergue" | "negocio";
  negocio_id?: string | null;
  etapa_id: string | null;
  albergue_id: string | null;
  nombre: string | null;
  created_at: string;
  ultimo_mensaje?: Mensaje | null;
}

// ─── Canales ────────────────────────────────────────────────────────────────

export async function getCanalEtapa(etapaId: string): Promise<{ id: string }> {
  return apiGet(`/api/canal-etapa/${etapaId}`);
}

export async function getCanalEtapaBySlug(
  slug: string,
  limit = 50,
): Promise<{ conversacion_id: string; mensajes: Mensaje[]; total: number }> {
  return apiGet(`/api/canal-etapa/slug/${slug}/recientes?limit=${limit}`);
}

export async function getCanalAlbergue(
  albergueId: string,
): Promise<{ id: string }> {
  return apiGet(`/api/canal-albergue/${albergueId}`);
}

export async function getDmAlbergue(
  albergueId: string,
): Promise<{ id: string }> {
  return apiGet(`/api/canal-albergue/${albergueId}/dm`);
}

export async function getDmPeregrino(
  otroUsuarioId: string,
): Promise<{ id: string }> {
  return apiGet(`/api/dm/${otroUsuarioId}`);
}

// ─── Mensajes ────────────────────────────────────────────────────────────────

const MENSAJE_SELECT = `
  id, conversacion_id, autor_id, contenido, idioma_origen, traducciones,
  created_at, reply_to_id, deleted_at,
  autor:perfiles!autor_id(id, nombre_display, avatar_url, idioma_nativo, nacionalidad)
`;

export async function getMensajes(
  conversacionId: string,
  limit = 50,
  before?: string,
): Promise<Mensaje[]> {
  let query = supabase
    .from("mensajes")
    .select(MENSAJE_SELECT)
    .eq("conversacion_id", conversacionId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) query = query.lt("created_at", before);

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as unknown as Mensaje[]).map(normalizeMensaje).reverse();
}

export async function enviarMensaje(
  conversacionId: string,
  contenido: string,
  idiomaOrigen: string,
  replyToId?: string,
): Promise<Mensaje> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error("No autenticado");

  const { data, error } = await supabase
    .from("mensajes")
    .insert({
      conversacion_id: conversacionId,
      autor_id: userId,
      contenido,
      idioma_origen: idiomaOrigen,
      traducciones: {},
      reply_to_id: replyToId ?? null,
    })
    .select(MENSAJE_SELECT)
    .single();

  if (error) throw error;
  return normalizeMensaje(data as unknown as Mensaje);
}

export async function getConversacionesUsuario(): Promise<Conversacion[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from("conversacion_participantes")
    .select(
      `conversacion:conversaciones!conversacion_id(
        id, tipo, etapa_id, albergue_id, nombre, created_at
      )`,
    )
    .eq("perfil_id", userId);

  if (error) throw error;

  return (data ?? [])
    .map((p: any) => p.conversacion)
    .filter(Boolean) as Conversacion[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Supabase devuelve joins como array — normaliza autor a objeto o null */
export function normalizeAutor(
  autor: AutorPerfil | AutorPerfil[] | null | undefined,
): AutorPerfil | null {
  if (!autor) return null;
  if (Array.isArray(autor)) return autor[0] ?? null;
  return autor;
}

/** Normaliza un mensaje crudo de Supabase (autor como array) a Mensaje limpio */
export function normalizeMensaje(raw: Mensaje): Mensaje {
  return { ...raw, autor: normalizeAutor(raw.autor) };
}

/** Devuelve el texto en el idioma del usuario, con fallback al original */
export function getTextoMensaje(mensaje: Mensaje, locale: string): string {
  if (!mensaje.traducciones) return mensaje.contenido;
  return (
    mensaje.traducciones[locale] ??
    mensaje.traducciones[mensaje.idioma_origen] ??
    mensaje.contenido
  );
}
