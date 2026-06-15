// 📄 hooks/useInteractions.ts
import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export type EntityType =
  | "etapa"
  | "albergue"
  | "dato_interes"
  | "punto_recorrido"
  | "punto_interes"
  | "etapa_foto";

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
  idioma_origen?: string;
  texto_es?: string | null;
  texto_en?: string | null;
  texto_de?: string | null;
  texto_fr?: string | null;
  texto_it?: string | null;
  texto_pt?: string | null;
  texto_ko?: string | null;
  valoracion: number | null;
  fecha_visita: string | null;
  medio_transporte: string | null;
  parent_id: string | null;
  editado: boolean;
  likes_count: number;
  estado: string;
  created_at: string;
  updated_at: string;
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
  tipo_entidad: string;
  entidad_id: string;
  autor_id: string;
  puntuacion: number;
  aspecto: string | null;
  created_at: string;
}

export interface Reaccion {
  id: string;
  tipo_entidad: string;
  entidad_id: string;
  autor_id: string;
  tipo_reaccion: TipoReaccion;
  created_at: string;
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
    opts?: { parentId?: string; valoracion?: number; fechaVisita?: string },
  ) => Promise<void>;
  editComentario: (id: string, texto: string) => Promise<void>;
  deleteComentario: (id: string) => Promise<void>;
  setValoracion: (puntuacion: number, aspecto?: Aspecto) => Promise<void>;
  toggleReaccion: (tipo: TipoReaccion) => Promise<void>;
  reload: () => Promise<void>;
}

export function useInteractions(
  entityType: EntityType,
  entityId: string,
): UseInteractionsReturn {
  const { user } = useAuth();
  const userId = user?.id;

  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [reacciones, setReacciones] = useState<Reaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<any>(
        `/api/interactions/${entityType}/${entityId}`,
      );

      const raiz: Comentario[] = [];
      const porId: Record<string, Comentario> = {};
      for (const c of data.comentarios ?? []) {
        porId[c.id] = { ...c, respuestas: [] };
      }
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
      // dejamos comentarios/valoraciones/reacciones vacíos si falla
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

  const generales = valoraciones.filter((v) => v.aspecto === "general");
  const resumen: ResumenInteracciones = {
    total_comentarios: comentarios.length,
    total_respuestas: comentarios.reduce(
      (acc, c) => acc + (c.respuestas?.length ?? 0),
      0,
    ),
    media_valoracion:
      generales.length > 0
        ? generales.reduce((acc, v) => acc + v.puntuacion, 0) / generales.length
        : null,
    total_valoraciones: generales.length,
    total_reacciones: reacciones.length,
  };

  const addComentario = async (
    texto: string,
    opts?: { parentId?: string; valoracion?: number; fechaVisita?: string },
  ) => {
    if (!userId) return;
    setSubmitting(true);
    try {
      await apiPost(`/api/interactions/${entityType}/${entityId}/comentarios`, {
        texto,
        parent_id: opts?.parentId ?? null,
        valoracion: opts?.valoracion ?? null,
        fecha_visita: opts?.fechaVisita ?? null,
      });
      await fetchAll();
    } finally {
      setSubmitting(false);
    }
  };

  const editComentario = async (id: string, texto: string) => {
    if (!userId) return;
    setSubmitting(true);
    try {
      await apiPut(`/api/interactions/comentarios/${id}`, { texto });
      await fetchAll();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComentario = async (id: string) => {
    if (!userId) return;
    setSubmitting(true);
    try {
      await apiDelete(`/api/interactions/comentarios/${id}`);
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
      await apiPost(
        `/api/interactions/${entityType}/${entityId}/valoraciones`,
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
      await apiPost(`/api/interactions/${entityType}/${entityId}/reacciones`, {
        tipo_reaccion: tipo,
      });
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
