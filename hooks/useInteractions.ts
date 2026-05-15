// 📄 hooks/useInteractions.ts
import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

export type EntityType =
  | "etapa"
  | "albergue"
  | "dato_interes"
  | "punto_interes";
export type TipoReaccion = "util" | "bonito" | "dificil" | "cuidado";
export type Aspecto =
  | "general"
  | "dificultad"
  | "belleza"
  | "servicios"
  | "limpieza"
  | "atencion";

export interface Comentario {
  id: string;
  tipo_entidad: string;
  entidad_id: string;
  autor_id: string;
  rol_autor: string;
  texto: string;
  texto_en?: string | null;
  texto_de?: string | null;
  texto_fr?: string | null;
  texto_it?: string | null;
  texto_pt?: string | null;
  texto_ko?: string | null;
  valoracion: number | null;
  parent_id: string | null;
  editado: boolean;
  likes_count: number;
  created_at: string;
  autor?: {
    nombre_display: string | null;
    avatar_url: string | null;
    rol: string;
    idioma_nativo: string | null;
  };
  respuestas?: Comentario[];
}

export interface Valoracion {
  id: string;
  autor_id: string;
  puntuacion: number;
  aspecto: string | null;
}

export interface Reaccion {
  id: string;
  autor_id: string;
  tipo_reaccion: TipoReaccion;
}

export interface ResumenInteracciones {
  total_comentarios: number;
  total_respuestas: number;
  media_valoracion: number | null;
  total_valoraciones: number;
  total_reacciones: number;
}

export interface UseInteractionsReturn {
  comentarios: Comentario[];
  valoraciones: Valoracion[];
  reacciones: Reaccion[];
  resumen: ResumenInteracciones;
  miValoracion: Valoracion | null;
  misReacciones: TipoReaccion[];
  loading: boolean;
  submitting: boolean;
  addComentario: (
    texto: string,
    opts?: { parentId?: string; valoracion?: number },
  ) => Promise<void>;
  editComentario: (id: string, texto: string) => Promise<void>;
  deleteComentario: (id: string) => Promise<void>;
  setValoracion: (puntuacion: number, aspecto?: Aspecto) => Promise<void>;
  toggleReaccion: (tipo: TipoReaccion) => Promise<void>;
  reload: () => Promise<void>;
}

async function fetchInteractions(entityType: EntityType, entityId: string) {
  const res = await fetch(
    `${API_URL}/api/interactions/${entityType}/${entityId}`,
  );
  if (!res.ok) throw new Error("Error cargando interacciones");
  return res.json();
}

async function getToken(): Promise<string | null> {
  try {
    const { supabase } = await import("@/lib/supabase");
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function authFetch(url: string, method: string, body?: unknown) {
  const token = await getToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["X-Auth-Token"] = token;
  return fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function useInteractions(
  entityType: EntityType,
  entityId: string,
  userId?: string,
): UseInteractionsReturn {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [reacciones, setReacciones] = useState<Reaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchInteractions(entityType, entityId);

      // Árbol comentarios
      const porId: Record<string, Comentario> = {};
      for (const c of data.comentarios ?? []) {
        porId[c.id] = { ...c, respuestas: [] };
      }
      const raiz: Comentario[] = [];
      for (const c of Object.values(porId)) {
        if (c.parent_id && porId[c.parent_id]) {
          porId[c.parent_id].respuestas!.push(c);
        } else if (!c.parent_id) {
          raiz.push(c);
        }
      }
      setComentarios(raiz);
      setValoraciones(data.valoraciones ?? []);
      setReacciones(data.reacciones ?? []);
    } catch {
      // silencioso — la ficha sigue funcionando sin interacciones
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const miValoracion = userId
    ? (valoraciones.find(
        (v) => v.autor_id === userId && v.aspecto === "general",
      ) ?? null)
    : null;

  const misReacciones: TipoReaccion[] = userId
    ? reacciones
        .filter((r) => r.autor_id === userId)
        .map((r) => r.tipo_reaccion)
    : [];

  const resumen: ResumenInteracciones = {
    total_comentarios: comentarios.length,
    total_respuestas: comentarios.reduce(
      (acc, c) => acc + (c.respuestas?.length ?? 0),
      0,
    ),
    media_valoracion: (() => {
      const generales = valoraciones.filter((v) => v.aspecto === "general");
      if (!generales.length) return null;
      return (
        generales.reduce((acc, v) => acc + v.puntuacion, 0) / generales.length
      );
    })(),
    total_valoraciones: valoraciones.filter((v) => v.aspecto === "general")
      .length,
    total_reacciones: reacciones.length,
  };

  const addComentario = async (
    texto: string,
    opts?: { parentId?: string; valoracion?: number },
  ) => {
    if (!userId) return;
    setSubmitting(true);
    try {
      await authFetch(
        `${API_URL}/api/interactions/${entityType}/${entityId}/comentarios`,
        "POST",
        {
          texto,
          parent_id: opts?.parentId ?? null,
          valoracion: opts?.valoracion ?? null,
        },
      );
      await fetchAll();
    } finally {
      setSubmitting(false);
    }
  };

  const editComentario = async (id: string, texto: string) => {
    if (!userId) return;
    setSubmitting(true);
    try {
      await authFetch(`${API_URL}/api/interactions/comentarios/${id}`, "PUT", {
        texto,
      });
      await fetchAll();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComentario = async (id: string) => {
    if (!userId) return;
    setSubmitting(true);
    try {
      await authFetch(
        `${API_URL}/api/interactions/comentarios/${id}`,
        "DELETE",
      );
      await fetchAll();
    } finally {
      setSubmitting(false);
    }
  };

  const setValoracion = async (
    puntuacion: number,
    aspecto: Aspecto = "general",
  ) => {
    if (!userId) return;
    setSubmitting(true);
    try {
      await authFetch(
        `${API_URL}/api/interactions/${entityType}/${entityId}/valoraciones`,
        "POST",
        {
          puntuacion,
          aspecto,
        },
      );
      await fetchAll();
    } finally {
      setSubmitting(false);
    }
  };

  const toggleReaccion = async (tipo: TipoReaccion) => {
    if (!userId) return;
    setSubmitting(true);
    try {
      await authFetch(
        `${API_URL}/api/interactions/${entityType}/${entityId}/reacciones`,
        "POST",
        {
          tipo_reaccion: tipo,
        },
      );
      await fetchAll();
    } finally {
      setSubmitting(false);
    }
  };

  return {
    comentarios,
    valoraciones,
    reacciones,
    resumen,
    miValoracion,
    misReacciones,
    loading,
    submitting,
    addComentario,
    editComentario,
    deleteComentario,
    setValoracion,
    toggleReaccion,
    reload: fetchAll,
  };
}
