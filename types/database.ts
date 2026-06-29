export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      albergue_gestores: {
        Row: {
          albergue_id: string;
          created_at: string | null;
          perfil_id: string;
          rol_gestor: string;
        };
        Insert: {
          albergue_id: string;
          created_at?: string | null;
          perfil_id: string;
          rol_gestor?: string;
        };
        Update: {
          albergue_id?: string;
          created_at?: string | null;
          perfil_id?: string;
          rol_gestor?: string;
        };
        Relationships: [
          {
            foreignKeyName: "albergue_gestores_albergue_id_fkey";
            columns: ["albergue_id"];
            isOneToOne: false;
            referencedRelation: "albergues";
            referencedColumns: ["id"];
          },
        ];
      };
      albergues: {
        Row: {
          capacidad_total: number | null;
          cierre_desde: string | null;
          cierre_hasta: string | null;
          coords: unknown;
          created_at: string;
          descripcion: string | null;
          descripcion_de: string | null;
          descripcion_en: string | null;
          descripcion_fr: string | null;
          descripcion_it: string | null;
          descripcion_ko: string | null;
          descripcion_pt: string | null;
          etapa_id: string | null;
          foto_url: string | null;
          fotos_urls: string[] | null;
          id: string;
          localidad: string | null;
          nombre: string;
          nombre_de: string | null;
          nombre_en: string | null;
          nombre_fr: string | null;
          nombre_it: string | null;
          nombre_ko: string | null;
          nombre_pt: string | null;
          ocupacion: Database["public"]["Enums"]["ocupacion_albergue"];
          perfil_id: string | null;
          plan: string;
          plan_hasta: string | null;
          plazas_totales: number | null;
          precio_cama: string | null;
          precio_desde: number | null;
          precio_habitacion: string | null;
          servicios: Json;
          slug: string | null;
          stripe_customer_id: string | null;
          stripe_plan: string | null;
          stripe_subscription_id: string | null;
          suscripcion_activa: boolean;
          telefono: string | null;
          tiene_booking: boolean | null;
          tipo: Database["public"]["Enums"]["tipo_albergue"];
          ubicacion: string | null;
          ubicacion_de: string | null;
          ubicacion_en: string | null;
          ubicacion_fr: string | null;
          ubicacion_it: string | null;
          ubicacion_ko: string | null;
          ubicacion_pt: string | null;
          updated_at: string;
          updated_ocupacion: string | null;
          verified_at: string | null;
          visible_en_etapa: boolean;
          web: string | null;
        };
        Insert: {
          capacidad_total?: number | null;
          cierre_desde?: string | null;
          cierre_hasta?: string | null;
          coords?: unknown;
          created_at?: string;
          descripcion?: string | null;
          descripcion_de?: string | null;
          descripcion_en?: string | null;
          descripcion_fr?: string | null;
          descripcion_it?: string | null;
          descripcion_ko?: string | null;
          descripcion_pt?: string | null;
          etapa_id?: string | null;
          foto_url?: string | null;
          fotos_urls?: string[] | null;
          id?: string;
          localidad?: string | null;
          nombre: string;
          nombre_de?: string | null;
          nombre_en?: string | null;
          nombre_fr?: string | null;
          nombre_it?: string | null;
          nombre_ko?: string | null;
          nombre_pt?: string | null;
          ocupacion?: Database["public"]["Enums"]["ocupacion_albergue"];
          perfil_id?: string | null;
          plan?: string;
          plan_hasta?: string | null;
          plazas_totales?: number | null;
          precio_cama?: string | null;
          precio_desde?: number | null;
          precio_habitacion?: string | null;
          servicios?: Json;
          slug?: string | null;
          stripe_customer_id?: string | null;
          stripe_plan?: string | null;
          stripe_subscription_id?: string | null;
          suscripcion_activa?: boolean;
          telefono?: string | null;
          tiene_booking?: boolean | null;
          tipo: Database["public"]["Enums"]["tipo_albergue"];
          ubicacion?: string | null;
          ubicacion_de?: string | null;
          ubicacion_en?: string | null;
          ubicacion_fr?: string | null;
          ubicacion_it?: string | null;
          ubicacion_ko?: string | null;
          ubicacion_pt?: string | null;
          updated_at?: string;
          updated_ocupacion?: string | null;
          verified_at?: string | null;
          visible_en_etapa?: boolean;
          web?: string | null;
        };
        Update: {
          capacidad_total?: number | null;
          cierre_desde?: string | null;
          cierre_hasta?: string | null;
          coords?: unknown;
          created_at?: string;
          descripcion?: string | null;
          descripcion_de?: string | null;
          descripcion_en?: string | null;
          descripcion_fr?: string | null;
          descripcion_it?: string | null;
          descripcion_ko?: string | null;
          descripcion_pt?: string | null;
          etapa_id?: string | null;
          foto_url?: string | null;
          fotos_urls?: string[] | null;
          id?: string;
          localidad?: string | null;
          nombre?: string;
          nombre_de?: string | null;
          nombre_en?: string | null;
          nombre_fr?: string | null;
          nombre_it?: string | null;
          nombre_ko?: string | null;
          nombre_pt?: string | null;
          ocupacion?: Database["public"]["Enums"]["ocupacion_albergue"];
          perfil_id?: string | null;
          plan?: string;
          plan_hasta?: string | null;
          plazas_totales?: number | null;
          precio_cama?: string | null;
          precio_desde?: number | null;
          precio_habitacion?: string | null;
          servicios?: Json;
          slug?: string | null;
          stripe_customer_id?: string | null;
          stripe_plan?: string | null;
          stripe_subscription_id?: string | null;
          suscripcion_activa?: boolean;
          telefono?: string | null;
          tiene_booking?: boolean | null;
          tipo?: Database["public"]["Enums"]["tipo_albergue"];
          ubicacion?: string | null;
          ubicacion_de?: string | null;
          ubicacion_en?: string | null;
          ubicacion_fr?: string | null;
          ubicacion_it?: string | null;
          ubicacion_ko?: string | null;
          ubicacion_pt?: string | null;
          updated_at?: string;
          updated_ocupacion?: string | null;
          verified_at?: string | null;
          visible_en_etapa?: boolean;
          web?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "albergues_etapa_id_fkey";
            columns: ["etapa_id"];
            isOneToOne: false;
            referencedRelation: "etapas";
            referencedColumns: ["id"];
          },
        ];
      };
      albergues_alojamiento: {
        Row: {
          albergue_id: string;
          camas_ind: boolean | null;
          hab_compartida: boolean | null;
          hab_privada: boolean | null;
          id: string;
          literas: boolean | null;
        };
        Insert: {
          albergue_id: string;
          camas_ind?: boolean | null;
          hab_compartida?: boolean | null;
          hab_privada?: boolean | null;
          id?: string;
          literas?: boolean | null;
        };
        Update: {
          albergue_id?: string;
          camas_ind?: boolean | null;
          hab_compartida?: boolean | null;
          hab_privada?: boolean | null;
          id?: string;
          literas?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "albergues_alojamiento_albergue_id_fkey";
            columns: ["albergue_id"];
            isOneToOne: false;
            referencedRelation: "albergues";
            referencedColumns: ["id"];
          },
        ];
      };
      albergues_ocupacion: {
        Row: {
          albergue_id: string;
          estado: Database["public"]["Enums"]["ocupacion_albergue"];
          id: string;
          updated_at: string | null;
        };
        Insert: {
          albergue_id: string;
          estado?: Database["public"]["Enums"]["ocupacion_albergue"];
          id?: string;
          updated_at?: string | null;
        };
        Update: {
          albergue_id?: string;
          estado?: Database["public"]["Enums"]["ocupacion_albergue"];
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "albergues_ocupacion_albergue_id_fkey";
            columns: ["albergue_id"];
            isOneToOne: false;
            referencedRelation: "albergues";
            referencedColumns: ["id"];
          },
        ];
      };
      albergues_precios: {
        Row: {
          albergue_id: string;
          descripcion: string | null;
          id: string;
          precio: number;
          tipo_cama: string;
        };
        Insert: {
          albergue_id: string;
          descripcion?: string | null;
          id?: string;
          precio: number;
          tipo_cama: string;
        };
        Update: {
          albergue_id?: string;
          descripcion?: string | null;
          id?: string;
          precio?: number;
          tipo_cama?: string;
        };
        Relationships: [
          {
            foreignKeyName: "albergues_precios_albergue_id_fkey";
            columns: ["albergue_id"];
            isOneToOne: false;
            referencedRelation: "albergues";
            referencedColumns: ["id"];
          },
        ];
      };
      albergues_servicios: {
        Row: {
          admite_perros: boolean | null;
          aire_acond: boolean | null;
          albergue_id: string;
          calefaccion: boolean | null;
          cenas: boolean | null;
          cocina: boolean | null;
          desayuno: boolean | null;
          id: string;
          jardin_terraza: boolean | null;
          lavadora: boolean | null;
          parking_bici: boolean | null;
          piscina: boolean | null;
          secadora: boolean | null;
          taquillas: boolean | null;
          updated_at: string | null;
          wifi: boolean | null;
        };
        Insert: {
          admite_perros?: boolean | null;
          aire_acond?: boolean | null;
          albergue_id: string;
          calefaccion?: boolean | null;
          cenas?: boolean | null;
          cocina?: boolean | null;
          desayuno?: boolean | null;
          id?: string;
          jardin_terraza?: boolean | null;
          lavadora?: boolean | null;
          parking_bici?: boolean | null;
          piscina?: boolean | null;
          secadora?: boolean | null;
          taquillas?: boolean | null;
          updated_at?: string | null;
          wifi?: boolean | null;
        };
        Update: {
          admite_perros?: boolean | null;
          aire_acond?: boolean | null;
          albergue_id?: string;
          calefaccion?: boolean | null;
          cenas?: boolean | null;
          cocina?: boolean | null;
          desayuno?: boolean | null;
          id?: string;
          jardin_terraza?: boolean | null;
          lavadora?: boolean | null;
          parking_bici?: boolean | null;
          piscina?: boolean | null;
          secadora?: boolean | null;
          taquillas?: boolean | null;
          updated_at?: string | null;
          wifi?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "albergues_servicios_albergue_id_fkey";
            columns: ["albergue_id"];
            isOneToOne: false;
            referencedRelation: "albergues";
            referencedColumns: ["id"];
          },
        ];
      };
      comentarios: {
        Row: {
          autor_id: string;
          created_at: string;
          editado: boolean | null;
          editado_at: string | null;
          entidad_id: string;
          estado: string | null;
          fecha_visita: string | null;
          id: string;
          idioma_origen: string;
          likes_count: number | null;
          medio_transporte: string | null;
          parent_id: string | null;
          rol_autor: string;
          texto: string;
          texto_de: string | null;
          texto_en: string | null;
          texto_es: string | null;
          texto_fr: string | null;
          texto_it: string | null;
          texto_ko: string | null;
          texto_pt: string | null;
          tipo_entidad: string;
          traducido_at: string | null;
          updated_at: string;
          valoracion: number | null;
        };
        Insert: {
          autor_id: string;
          created_at?: string;
          editado?: boolean | null;
          editado_at?: string | null;
          entidad_id: string;
          estado?: string | null;
          fecha_visita?: string | null;
          id?: string;
          idioma_origen?: string;
          likes_count?: number | null;
          medio_transporte?: string | null;
          parent_id?: string | null;
          rol_autor?: string;
          texto: string;
          texto_de?: string | null;
          texto_en?: string | null;
          texto_es?: string | null;
          texto_fr?: string | null;
          texto_it?: string | null;
          texto_ko?: string | null;
          texto_pt?: string | null;
          tipo_entidad: string;
          traducido_at?: string | null;
          updated_at?: string;
          valoracion?: number | null;
        };
        Update: {
          autor_id?: string;
          created_at?: string;
          editado?: boolean | null;
          editado_at?: string | null;
          entidad_id?: string;
          estado?: string | null;
          fecha_visita?: string | null;
          id?: string;
          idioma_origen?: string;
          likes_count?: number | null;
          medio_transporte?: string | null;
          parent_id?: string | null;
          rol_autor?: string;
          texto?: string;
          texto_de?: string | null;
          texto_en?: string | null;
          texto_es?: string | null;
          texto_fr?: string | null;
          texto_it?: string | null;
          texto_ko?: string | null;
          texto_pt?: string | null;
          tipo_entidad?: string;
          traducido_at?: string | null;
          updated_at?: string;
          valoracion?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "comentarios_autor_id_fkey";
            columns: ["autor_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comentarios_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "comentarios";
            referencedColumns: ["id"];
          },
        ];
      };
      conexiones_peregrinos: {
        Row: {
          created_at: string;
          estado: Database["public"]["Enums"]["estado_conexion"];
          etapa_id: string | null;
          id: string;
          perfil_a_id: string;
          perfil_b_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          estado?: Database["public"]["Enums"]["estado_conexion"];
          etapa_id?: string | null;
          id?: string;
          perfil_a_id: string;
          perfil_b_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          estado?: Database["public"]["Enums"]["estado_conexion"];
          etapa_id?: string | null;
          id?: string;
          perfil_a_id?: string;
          perfil_b_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conexiones_peregrinos_etapa_id_fkey";
            columns: ["etapa_id"];
            isOneToOne: false;
            referencedRelation: "etapas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conexiones_peregrinos_perfil_a_id_fkey";
            columns: ["perfil_a_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conexiones_peregrinos_perfil_b_id_fkey";
            columns: ["perfil_b_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      conversacion_participantes: {
        Row: {
          conversacion_id: string;
          joined_at: string;
          notificaciones: boolean;
          perfil_id: string;
          ultimo_leido_at: string | null;
        };
        Insert: {
          conversacion_id: string;
          joined_at?: string;
          notificaciones?: boolean;
          perfil_id: string;
          ultimo_leido_at?: string | null;
        };
        Update: {
          conversacion_id?: string;
          joined_at?: string;
          notificaciones?: boolean;
          perfil_id?: string;
          ultimo_leido_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "conversacion_participantes_conversacion_id_fkey";
            columns: ["conversacion_id"];
            isOneToOne: false;
            referencedRelation: "conversaciones";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversacion_participantes_perfil_id_fkey";
            columns: ["perfil_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      conversaciones: {
        Row: {
          albergue_id: string | null;
          created_at: string;
          etapa_id: string | null;
          id: string;
          negocio_id: string | null;
          nombre: string | null;
          tipo: Database["public"]["Enums"]["tipo_conversacion"];
        };
        Insert: {
          albergue_id?: string | null;
          created_at?: string;
          etapa_id?: string | null;
          id?: string;
          negocio_id?: string | null;
          nombre?: string | null;
          tipo: Database["public"]["Enums"]["tipo_conversacion"];
        };
        Update: {
          albergue_id?: string | null;
          created_at?: string;
          etapa_id?: string | null;
          id?: string;
          negocio_id?: string | null;
          nombre?: string | null;
          tipo?: Database["public"]["Enums"]["tipo_conversacion"];
        };
        Relationships: [
          {
            foreignKeyName: "conversaciones_albergue_id_fkey";
            columns: ["albergue_id"];
            isOneToOne: false;
            referencedRelation: "albergues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversaciones_etapa_id_fkey";
            columns: ["etapa_id"];
            isOneToOne: false;
            referencedRelation: "etapas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversaciones_negocio_id_fkey";
            columns: ["negocio_id"];
            isOneToOne: false;
            referencedRelation: "negocios_camino";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversaciones_negocio_id_fkey";
            columns: ["negocio_id"];
            isOneToOne: false;
            referencedRelation: "negocios_en_etapa";
            referencedColumns: ["id"];
          },
        ];
      };
      conversaciones_contador: {
        Row: {
          entidad_id: string;
          entidad_tipo: string;
          id: string;
          mes: string;
          total: number;
          updated_at: string;
        };
        Insert: {
          entidad_id: string;
          entidad_tipo: string;
          id?: string;
          mes: string;
          total?: number;
          updated_at?: string;
        };
        Update: {
          entidad_id?: string;
          entidad_tipo?: string;
          id?: string;
          mes?: string;
          total?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      datos_interes: {
        Row: {
          autor_id: string | null;
          caduca_en: string | null;
          categoria: string;
          contenido: string;
          contenido_de: string | null;
          contenido_en: string | null;
          contenido_fr: string | null;
          contenido_it: string | null;
          contenido_ko: string | null;
          contenido_pt: string | null;
          created_at: string;
          entidad_id: string;
          foto_public_id: string | null;
          foto_url: string | null;
          fuente: string;
          id: string;
          km_referencia: number | null;
          orden: number | null;
          tipo_entidad: string;
          titulo: string | null;
          titulo_de: string | null;
          titulo_en: string | null;
          titulo_fr: string | null;
          titulo_it: string | null;
          titulo_ko: string | null;
          titulo_pt: string | null;
          updated_at: string;
          validado: boolean;
          votos_util: number;
        };
        Insert: {
          autor_id?: string | null;
          caduca_en?: string | null;
          categoria: string;
          contenido: string;
          contenido_de?: string | null;
          contenido_en?: string | null;
          contenido_fr?: string | null;
          contenido_it?: string | null;
          contenido_ko?: string | null;
          contenido_pt?: string | null;
          created_at?: string;
          entidad_id: string;
          foto_public_id?: string | null;
          foto_url?: string | null;
          fuente?: string;
          id?: string;
          km_referencia?: number | null;
          orden?: number | null;
          tipo_entidad: string;
          titulo?: string | null;
          titulo_de?: string | null;
          titulo_en?: string | null;
          titulo_fr?: string | null;
          titulo_it?: string | null;
          titulo_ko?: string | null;
          titulo_pt?: string | null;
          updated_at?: string;
          validado?: boolean;
          votos_util?: number;
        };
        Update: {
          autor_id?: string | null;
          caduca_en?: string | null;
          categoria?: string;
          contenido?: string;
          contenido_de?: string | null;
          contenido_en?: string | null;
          contenido_fr?: string | null;
          contenido_it?: string | null;
          contenido_ko?: string | null;
          contenido_pt?: string | null;
          created_at?: string;
          entidad_id?: string;
          foto_public_id?: string | null;
          foto_url?: string | null;
          fuente?: string;
          id?: string;
          km_referencia?: number | null;
          orden?: number | null;
          tipo_entidad?: string;
          titulo?: string | null;
          titulo_de?: string | null;
          titulo_en?: string | null;
          titulo_fr?: string | null;
          titulo_it?: string | null;
          titulo_ko?: string | null;
          titulo_pt?: string | null;
          updated_at?: string;
          validado?: boolean;
          votos_util?: number;
        };
        Relationships: [
          {
            foreignKeyName: "datos_interes_autor_id_fkey";
            columns: ["autor_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      etapa_fotos: {
        Row: {
          alt: string | null;
          created_at: string | null;
          es_hero: boolean | null;
          etapa_id: string;
          id: string;
          orden: number | null;
          public_id: string | null;
          subido_por: string | null;
          tipo: string | null;
          updated_at: string | null;
          url: string;
        };
        Insert: {
          alt?: string | null;
          created_at?: string | null;
          es_hero?: boolean | null;
          etapa_id: string;
          id?: string;
          orden?: number | null;
          public_id?: string | null;
          subido_por?: string | null;
          tipo?: string | null;
          updated_at?: string | null;
          url: string;
        };
        Update: {
          alt?: string | null;
          created_at?: string | null;
          es_hero?: boolean | null;
          etapa_id?: string;
          id?: string;
          orden?: number | null;
          public_id?: string | null;
          subido_por?: string | null;
          tipo?: string | null;
          updated_at?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "etapa_fotos_etapa_id_fkey";
            columns: ["etapa_id"];
            isOneToOne: false;
            referencedRelation: "etapas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "etapa_fotos_subido_por_fkey";
            columns: ["subido_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      etapas: {
        Row: {
          created_at: string;
          datos_interes: string | null;
          datos_interes_de: string | null;
          datos_interes_en: string | null;
          datos_interes_fr: string | null;
          datos_interes_it: string | null;
          datos_interes_ko: string | null;
          datos_interes_pt: string | null;
          descripcion: string | null;
          descripcion_corta: string | null;
          descripcion_corta_de: string | null;
          descripcion_corta_en: string | null;
          descripcion_corta_fr: string | null;
          descripcion_corta_it: string | null;
          descripcion_corta_ko: string | null;
          descripcion_corta_pt: string | null;
          descripcion_de: string | null;
          descripcion_en: string | null;
          descripcion_fr: string | null;
          descripcion_it: string | null;
          descripcion_ko: string | null;
          descripcion_pt: string | null;
          desnivel_neg: number;
          desnivel_pos: number;
          dificultad: string | null;
          distancia_km: number;
          es_variante: boolean | null;
          etapa_padre_id: string | null;
          fin_coords: unknown;
          fin_nombre: string;
          fuentes_agua: Json | null;
          id: string;
          inicio_coords: unknown;
          inicio_nombre: string;
          nombre: string;
          nombre_de: string | null;
          nombre_en: string | null;
          nombre_fr: string | null;
          nombre_it: string | null;
          nombre_ko: string | null;
          nombre_pt: string | null;
          nombre_variante: string | null;
          numero: number;
          recorrido: string | null;
          ruta_geojson: Json | null;
          sector: string | null;
          servicios_disponibles: Json | null;
          slug: string | null;
          tiempo_estimado: string | null;
          updated_at: string;
          url_gronze: string | null;
        };
        Insert: {
          created_at?: string;
          datos_interes?: string | null;
          datos_interes_de?: string | null;
          datos_interes_en?: string | null;
          datos_interes_fr?: string | null;
          datos_interes_it?: string | null;
          datos_interes_ko?: string | null;
          datos_interes_pt?: string | null;
          descripcion?: string | null;
          descripcion_corta?: string | null;
          descripcion_corta_de?: string | null;
          descripcion_corta_en?: string | null;
          descripcion_corta_fr?: string | null;
          descripcion_corta_it?: string | null;
          descripcion_corta_ko?: string | null;
          descripcion_corta_pt?: string | null;
          descripcion_de?: string | null;
          descripcion_en?: string | null;
          descripcion_fr?: string | null;
          descripcion_it?: string | null;
          descripcion_ko?: string | null;
          descripcion_pt?: string | null;
          desnivel_neg?: number;
          desnivel_pos?: number;
          dificultad?: string | null;
          distancia_km: number;
          es_variante?: boolean | null;
          etapa_padre_id?: string | null;
          fin_coords?: unknown;
          fin_nombre: string;
          fuentes_agua?: Json | null;
          id?: string;
          inicio_coords?: unknown;
          inicio_nombre: string;
          nombre: string;
          nombre_de?: string | null;
          nombre_en?: string | null;
          nombre_fr?: string | null;
          nombre_it?: string | null;
          nombre_ko?: string | null;
          nombre_pt?: string | null;
          nombre_variante?: string | null;
          numero: number;
          recorrido?: string | null;
          ruta_geojson?: Json | null;
          sector?: string | null;
          servicios_disponibles?: Json | null;
          slug?: string | null;
          tiempo_estimado?: string | null;
          updated_at?: string;
          url_gronze?: string | null;
        };
        Update: {
          created_at?: string;
          datos_interes?: string | null;
          datos_interes_de?: string | null;
          datos_interes_en?: string | null;
          datos_interes_fr?: string | null;
          datos_interes_it?: string | null;
          datos_interes_ko?: string | null;
          datos_interes_pt?: string | null;
          descripcion?: string | null;
          descripcion_corta?: string | null;
          descripcion_corta_de?: string | null;
          descripcion_corta_en?: string | null;
          descripcion_corta_fr?: string | null;
          descripcion_corta_it?: string | null;
          descripcion_corta_ko?: string | null;
          descripcion_corta_pt?: string | null;
          descripcion_de?: string | null;
          descripcion_en?: string | null;
          descripcion_fr?: string | null;
          descripcion_it?: string | null;
          descripcion_ko?: string | null;
          descripcion_pt?: string | null;
          desnivel_neg?: number;
          desnivel_pos?: number;
          dificultad?: string | null;
          distancia_km?: number;
          es_variante?: boolean | null;
          etapa_padre_id?: string | null;
          fin_coords?: unknown;
          fin_nombre?: string;
          fuentes_agua?: Json | null;
          id?: string;
          inicio_coords?: unknown;
          inicio_nombre?: string;
          nombre?: string;
          nombre_de?: string | null;
          nombre_en?: string | null;
          nombre_fr?: string | null;
          nombre_it?: string | null;
          nombre_ko?: string | null;
          nombre_pt?: string | null;
          nombre_variante?: string | null;
          numero?: number;
          recorrido?: string | null;
          ruta_geojson?: Json | null;
          sector?: string | null;
          servicios_disponibles?: Json | null;
          slug?: string | null;
          tiempo_estimado?: string | null;
          updated_at?: string;
          url_gronze?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "etapas_etapa_padre_id_fkey";
            columns: ["etapa_padre_id"];
            isOneToOne: false;
            referencedRelation: "etapas";
            referencedColumns: ["id"];
          },
        ];
      };
      etapas_completadas: {
        Row: {
          created_at: string;
          etapa_id: string;
          fecha: string | null;
          fecha_fin: string | null;
          fecha_inicio: string | null;
          foto_url: string | null;
          id: string;
          medio_transporte: string | null;
          nota: string | null;
          nota_personal: string | null;
          perfil_id: string;
        };
        Insert: {
          created_at?: string;
          etapa_id: string;
          fecha?: string | null;
          fecha_fin?: string | null;
          fecha_inicio?: string | null;
          foto_url?: string | null;
          id?: string;
          medio_transporte?: string | null;
          nota?: string | null;
          nota_personal?: string | null;
          perfil_id: string;
        };
        Update: {
          created_at?: string;
          etapa_id?: string;
          fecha?: string | null;
          fecha_fin?: string | null;
          fecha_inicio?: string | null;
          foto_url?: string | null;
          id?: string;
          medio_transporte?: string | null;
          nota?: string | null;
          nota_personal?: string | null;
          perfil_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "etapas_completadas_etapa_id_fkey";
            columns: ["etapa_id"];
            isOneToOne: false;
            referencedRelation: "etapas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "etapas_completadas_perfil_id_fkey";
            columns: ["perfil_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      etapas_recorrido: {
        Row: {
          coords: unknown;
          created_at: string;
          descripcion_tramo: string | null;
          descripcion_tramo_de: string | null;
          descripcion_tramo_en: string | null;
          descripcion_tramo_fr: string | null;
          descripcion_tramo_it: string | null;
          descripcion_tramo_ko: string | null;
          descripcion_tramo_pt: string | null;
          elevacion: number | null;
          etapa_id: string;
          id: string;
          km_acumulado: number | null;
          lat: number | null;
          lng: number | null;
          localidad: string;
          orden: number;
          tipo: string | null;
        };
        Insert: {
          coords?: unknown;
          created_at?: string;
          descripcion_tramo?: string | null;
          descripcion_tramo_de?: string | null;
          descripcion_tramo_en?: string | null;
          descripcion_tramo_fr?: string | null;
          descripcion_tramo_it?: string | null;
          descripcion_tramo_ko?: string | null;
          descripcion_tramo_pt?: string | null;
          elevacion?: number | null;
          etapa_id: string;
          id?: string;
          km_acumulado?: number | null;
          lat?: number | null;
          lng?: number | null;
          localidad: string;
          orden: number;
          tipo?: string | null;
        };
        Update: {
          coords?: unknown;
          created_at?: string;
          descripcion_tramo?: string | null;
          descripcion_tramo_de?: string | null;
          descripcion_tramo_en?: string | null;
          descripcion_tramo_fr?: string | null;
          descripcion_tramo_it?: string | null;
          descripcion_tramo_ko?: string | null;
          descripcion_tramo_pt?: string | null;
          elevacion?: number | null;
          etapa_id?: string;
          id?: string;
          km_acumulado?: number | null;
          lat?: number | null;
          lng?: number | null;
          localidad?: string;
          orden?: number;
          tipo?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "etapas_recorrido_etapa_id_fkey";
            columns: ["etapa_id"];
            isOneToOne: false;
            referencedRelation: "etapas";
            referencedColumns: ["id"];
          },
        ];
      };
      mensajes: {
        Row: {
          autor_id: string;
          contenido: string;
          conversacion_id: string;
          created_at: string;
          deleted_at: string | null;
          editado_at: string | null;
          id: string;
          idioma_origen: string;
          reply_to_id: string | null;
          traducciones: Json;
        };
        Insert: {
          autor_id: string;
          contenido: string;
          conversacion_id: string;
          created_at?: string;
          deleted_at?: string | null;
          editado_at?: string | null;
          id?: string;
          idioma_origen?: string;
          reply_to_id?: string | null;
          traducciones?: Json;
        };
        Update: {
          autor_id?: string;
          contenido?: string;
          conversacion_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          editado_at?: string | null;
          id?: string;
          idioma_origen?: string;
          reply_to_id?: string | null;
          traducciones?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "mensajes_autor_id_fkey";
            columns: ["autor_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mensajes_conversacion_id_fkey";
            columns: ["conversacion_id"];
            isOneToOne: false;
            referencedRelation: "conversaciones";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mensajes_reply_to_id_fkey";
            columns: ["reply_to_id"];
            isOneToOne: false;
            referencedRelation: "mensajes";
            referencedColumns: ["id"];
          },
        ];
      };
      mensajes_contador: {
        Row: {
          created_at: string;
          entidad_id: string;
          entidad_tipo: string;
          id: string;
          mes: string;
          total: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          entidad_id: string;
          entidad_tipo: string;
          id?: string;
          mes: string;
          total?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          entidad_id?: string;
          entidad_tipo?: string;
          id?: string;
          mes?: string;
          total?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      negocio_gestores: {
        Row: {
          created_at: string | null;
          negocio_id: string;
          perfil_id: string;
          rol_gestor: string;
        };
        Insert: {
          created_at?: string | null;
          negocio_id: string;
          perfil_id: string;
          rol_gestor?: string;
        };
        Update: {
          created_at?: string | null;
          negocio_id?: string;
          perfil_id?: string;
          rol_gestor?: string;
        };
        Relationships: [
          {
            foreignKeyName: "negocio_gestores_negocio_id_fkey";
            columns: ["negocio_id"];
            isOneToOne: false;
            referencedRelation: "negocios_camino";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "negocio_gestores_negocio_id_fkey";
            columns: ["negocio_id"];
            isOneToOne: false;
            referencedRelation: "negocios_en_etapa";
            referencedColumns: ["id"];
          },
        ];
      };
      negocios_camino: {
        Row: {
          activo: boolean;
          categoria: string;
          coords: unknown;
          created_at: string;
          descripcion: string | null;
          descripcion_de: string | null;
          descripcion_en: string | null;
          descripcion_fr: string | null;
          descripcion_it: string | null;
          descripcion_ko: string | null;
          descripcion_pt: string | null;
          direccion: string | null;
          email: string | null;
          foto_public_id: string | null;
          foto_url: string | null;
          id: string;
          lat: number | null;
          lng: number | null;
          nombre: string;
          perfil_id: string | null;
          plan: string;
          plan_hasta: string | null;
          servicios: string[] | null;
          slug: string;
          stripe_customer_id: string | null;
          stripe_plan: string | null;
          stripe_subscription_id: string | null;
          suscripcion_activa: boolean;
          telefono: string | null;
          updated_at: string;
          verificado: boolean;
          verificado_at: string | null;
          visible_en_mapa: boolean | null;
          web: string | null;
          whatsapp: string | null;
        };
        Insert: {
          activo?: boolean;
          categoria: string;
          coords?: unknown;
          created_at?: string;
          descripcion?: string | null;
          descripcion_de?: string | null;
          descripcion_en?: string | null;
          descripcion_fr?: string | null;
          descripcion_it?: string | null;
          descripcion_ko?: string | null;
          descripcion_pt?: string | null;
          direccion?: string | null;
          email?: string | null;
          foto_public_id?: string | null;
          foto_url?: string | null;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          nombre: string;
          perfil_id?: string | null;
          plan?: string;
          plan_hasta?: string | null;
          servicios?: string[] | null;
          slug: string;
          stripe_customer_id?: string | null;
          stripe_plan?: string | null;
          stripe_subscription_id?: string | null;
          suscripcion_activa?: boolean;
          telefono?: string | null;
          updated_at?: string;
          verificado?: boolean;
          verificado_at?: string | null;
          visible_en_mapa?: boolean | null;
          web?: string | null;
          whatsapp?: string | null;
        };
        Update: {
          activo?: boolean;
          categoria?: string;
          coords?: unknown;
          created_at?: string;
          descripcion?: string | null;
          descripcion_de?: string | null;
          descripcion_en?: string | null;
          descripcion_fr?: string | null;
          descripcion_it?: string | null;
          descripcion_ko?: string | null;
          descripcion_pt?: string | null;
          direccion?: string | null;
          email?: string | null;
          foto_public_id?: string | null;
          foto_url?: string | null;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          nombre?: string;
          perfil_id?: string | null;
          plan?: string;
          plan_hasta?: string | null;
          servicios?: string[] | null;
          slug?: string;
          stripe_customer_id?: string | null;
          stripe_plan?: string | null;
          stripe_subscription_id?: string | null;
          suscripcion_activa?: boolean;
          telefono?: string | null;
          updated_at?: string;
          verificado?: boolean;
          verificado_at?: string | null;
          visible_en_mapa?: boolean | null;
          web?: string | null;
          whatsapp?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "negocios_camino_perfil_id_fkey";
            columns: ["perfil_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      negocios_etapas: {
        Row: {
          etapa_id: string;
          km_referencia: number | null;
          negocio_id: string;
        };
        Insert: {
          etapa_id: string;
          km_referencia?: number | null;
          negocio_id: string;
        };
        Update: {
          etapa_id?: string;
          km_referencia?: number | null;
          negocio_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "negocios_etapas_etapa_id_fkey";
            columns: ["etapa_id"];
            isOneToOne: false;
            referencedRelation: "etapas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "negocios_etapas_negocio_id_fkey";
            columns: ["negocio_id"];
            isOneToOne: false;
            referencedRelation: "negocios_camino";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "negocios_etapas_negocio_id_fkey";
            columns: ["negocio_id"];
            isOneToOne: false;
            referencedRelation: "negocios_en_etapa";
            referencedColumns: ["id"];
          },
        ];
      };
      negocios_fotos: {
        Row: {
          alt: string | null;
          created_at: string | null;
          es_hero: boolean | null;
          id: string;
          negocio_id: string;
          orden: number | null;
          public_id: string | null;
          subido_por: string | null;
          url: string;
        };
        Insert: {
          alt?: string | null;
          created_at?: string | null;
          es_hero?: boolean | null;
          id?: string;
          negocio_id: string;
          orden?: number | null;
          public_id?: string | null;
          subido_por?: string | null;
          url: string;
        };
        Update: {
          alt?: string | null;
          created_at?: string | null;
          es_hero?: boolean | null;
          id?: string;
          negocio_id?: string;
          orden?: number | null;
          public_id?: string | null;
          subido_por?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "negocios_fotos_negocio_id_fkey";
            columns: ["negocio_id"];
            isOneToOne: false;
            referencedRelation: "negocios_camino";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "negocios_fotos_negocio_id_fkey";
            columns: ["negocio_id"];
            isOneToOne: false;
            referencedRelation: "negocios_en_etapa";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "negocios_fotos_subido_por_fkey";
            columns: ["subido_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      negocios_horarios: {
        Row: {
          apertura: string | null;
          cerrado: boolean;
          cierre: string | null;
          created_at: string | null;
          dia_semana: number | null;
          id: string;
          negocio_id: string;
          nota: string | null;
          nota_de: string | null;
          nota_en: string | null;
          nota_fr: string | null;
          nota_it: string | null;
          nota_ko: string | null;
          nota_pt: string | null;
          temporada_fin: string | null;
          temporada_inicio: string | null;
          turno: number;
        };
        Insert: {
          apertura?: string | null;
          cerrado?: boolean;
          cierre?: string | null;
          created_at?: string | null;
          dia_semana?: number | null;
          id?: string;
          negocio_id: string;
          nota?: string | null;
          nota_de?: string | null;
          nota_en?: string | null;
          nota_fr?: string | null;
          nota_it?: string | null;
          nota_ko?: string | null;
          nota_pt?: string | null;
          temporada_fin?: string | null;
          temporada_inicio?: string | null;
          turno?: number;
        };
        Update: {
          apertura?: string | null;
          cerrado?: boolean;
          cierre?: string | null;
          created_at?: string | null;
          dia_semana?: number | null;
          id?: string;
          negocio_id?: string;
          nota?: string | null;
          nota_de?: string | null;
          nota_en?: string | null;
          nota_fr?: string | null;
          nota_it?: string | null;
          nota_ko?: string | null;
          nota_pt?: string | null;
          temporada_fin?: string | null;
          temporada_inicio?: string | null;
          turno?: number;
        };
        Relationships: [
          {
            foreignKeyName: "negocios_horarios_negocio_id_fkey";
            columns: ["negocio_id"];
            isOneToOne: false;
            referencedRelation: "negocios_camino";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "negocios_horarios_negocio_id_fkey";
            columns: ["negocio_id"];
            isOneToOne: false;
            referencedRelation: "negocios_en_etapa";
            referencedColumns: ["id"];
          },
        ];
      };
      peregrino_estancias: {
        Row: {
          albergue_id: string;
          created_at: string | null;
          datos_peregrino: Json | null;
          fecha_entrada: string;
          fecha_salida: string | null;
          id: string;
          metodo_pago: string | null;
          peregrino_id: string | null;
        };
        Insert: {
          albergue_id: string;
          created_at?: string | null;
          datos_peregrino?: Json | null;
          fecha_entrada: string;
          fecha_salida?: string | null;
          id?: string;
          metodo_pago?: string | null;
          peregrino_id?: string | null;
        };
        Update: {
          albergue_id?: string;
          created_at?: string | null;
          datos_peregrino?: Json | null;
          fecha_entrada?: string;
          fecha_salida?: string | null;
          id?: string;
          metodo_pago?: string | null;
          peregrino_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "peregrino_estancias_albergue_id_fkey";
            columns: ["albergue_id"];
            isOneToOne: false;
            referencedRelation: "albergues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "peregrino_estancias_peregrino_id_fkey";
            columns: ["peregrino_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      peregrino_registro_oficial: {
        Row: {
          apellidos: string;
          created_at: string | null;
          direccion_residencia: string;
          fecha_nacimiento: string;
          id: string;
          nacionalidad: string;
          nombre: string;
          numero_documento: string;
          numero_soporte: string | null;
          perfil_id: string;
          sexo: string | null;
          telefono: string | null;
          tipo_documento: string;
          updated_at: string | null;
        };
        Insert: {
          apellidos: string;
          created_at?: string | null;
          direccion_residencia: string;
          fecha_nacimiento: string;
          id?: string;
          nacionalidad: string;
          nombre: string;
          numero_documento: string;
          numero_soporte?: string | null;
          perfil_id: string;
          sexo?: string | null;
          telefono?: string | null;
          tipo_documento: string;
          updated_at?: string | null;
        };
        Update: {
          apellidos?: string;
          created_at?: string | null;
          direccion_residencia?: string;
          fecha_nacimiento?: string;
          id?: string;
          nacionalidad?: string;
          nombre?: string;
          numero_documento?: string;
          numero_soporte?: string | null;
          perfil_id?: string;
          sexo?: string | null;
          telefono?: string | null;
          tipo_documento?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "peregrino_registro_oficial_perfil_id_fkey";
            columns: ["perfil_id"];
            isOneToOne: true;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      perfiles: {
        Row: {
          avatar_url: string | null;
          banned: boolean;
          bio: string | null;
          created_at: string;
          etapa_actual_slug: string | null;
          fecha_fin_prevista: string | null;
          fecha_inicio_prevista: string | null;
          id: string;
          idioma_nativo: string;
          idioma_preferido: string | null;
          idiomas_habla: string[];
          medio_transporte: string | null;
          medio_transporte_otro: string | null;
          modalidad_camino: string | null;
          modo_camino: string | null;
          nacionalidad: string | null;
          nombre_display: string;
          numero_caminos: number | null;
          pais_residencia: string | null;
          permite_dm: boolean;
          rol: Database["public"]["Enums"]["rol_usuario"];
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          banned?: boolean;
          bio?: string | null;
          created_at?: string;
          etapa_actual_slug?: string | null;
          fecha_fin_prevista?: string | null;
          fecha_inicio_prevista?: string | null;
          id: string;
          idioma_nativo?: string;
          idioma_preferido?: string | null;
          idiomas_habla?: string[];
          medio_transporte?: string | null;
          medio_transporte_otro?: string | null;
          modalidad_camino?: string | null;
          modo_camino?: string | null;
          nacionalidad?: string | null;
          nombre_display: string;
          numero_caminos?: number | null;
          pais_residencia?: string | null;
          permite_dm?: boolean;
          rol?: Database["public"]["Enums"]["rol_usuario"];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          banned?: boolean;
          bio?: string | null;
          created_at?: string;
          etapa_actual_slug?: string | null;
          fecha_fin_prevista?: string | null;
          fecha_inicio_prevista?: string | null;
          id?: string;
          idioma_nativo?: string;
          idioma_preferido?: string | null;
          idiomas_habla?: string[];
          medio_transporte?: string | null;
          medio_transporte_otro?: string | null;
          modalidad_camino?: string | null;
          modo_camino?: string | null;
          nacionalidad?: string | null;
          nombre_display?: string;
          numero_caminos?: number | null;
          pais_residencia?: string | null;
          permite_dm?: boolean;
          rol?: Database["public"]["Enums"]["rol_usuario"];
          updated_at?: string;
        };
        Relationships: [];
      };
      plan_eventos: {
        Row: {
          admin_id: string | null;
          created_at: string | null;
          entidad_id: string;
          entidad_tipo: string;
          evento: string;
          id: string;
          notas: string | null;
          plan: string | null;
        };
        Insert: {
          admin_id?: string | null;
          created_at?: string | null;
          entidad_id: string;
          entidad_tipo: string;
          evento: string;
          id?: string;
          notas?: string | null;
          plan?: string | null;
        };
        Update: {
          admin_id?: string | null;
          created_at?: string | null;
          entidad_id?: string;
          entidad_tipo?: string;
          evento?: string;
          id?: string;
          notas?: string | null;
          plan?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "plan_eventos_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      poi_fotos: {
        Row: {
          autor_id: string | null;
          created_at: string | null;
          dato_interes_id: string | null;
          descripcion: string | null;
          id: string;
          public_id: string;
          url: string;
        };
        Insert: {
          autor_id?: string | null;
          created_at?: string | null;
          dato_interes_id?: string | null;
          descripcion?: string | null;
          id?: string;
          public_id: string;
          url: string;
        };
        Update: {
          autor_id?: string | null;
          created_at?: string | null;
          dato_interes_id?: string | null;
          descripcion?: string | null;
          id?: string;
          public_id?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "poi_fotos_autor_id_fkey";
            columns: ["autor_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "poi_fotos_dato_interes_id_fkey";
            columns: ["dato_interes_id"];
            isOneToOne: false;
            referencedRelation: "datos_interes";
            referencedColumns: ["id"];
          },
        ];
      };
      puntos_interes: {
        Row: {
          coords: unknown;
          created_at: string;
          descripcion: string | null;
          descripcion_de: string | null;
          descripcion_en: string | null;
          descripcion_fr: string | null;
          descripcion_it: string | null;
          descripcion_ko: string | null;
          descripcion_pt: string | null;
          etapa_id: string;
          foto_public_id: string | null;
          foto_url: string | null;
          id: string;
          km_referencia: number | null;
          nombre: string;
          nombre_de: string | null;
          nombre_en: string | null;
          nombre_fr: string | null;
          nombre_it: string | null;
          nombre_ko: string | null;
          nombre_pt: string | null;
          osm_id: string | null;
          tipo: Database["public"]["Enums"]["tipo_punto_interes"];
          updated_at: string | null;
        };
        Insert: {
          coords?: unknown;
          created_at?: string;
          descripcion?: string | null;
          descripcion_de?: string | null;
          descripcion_en?: string | null;
          descripcion_fr?: string | null;
          descripcion_it?: string | null;
          descripcion_ko?: string | null;
          descripcion_pt?: string | null;
          etapa_id: string;
          foto_public_id?: string | null;
          foto_url?: string | null;
          id?: string;
          km_referencia?: number | null;
          nombre: string;
          nombre_de?: string | null;
          nombre_en?: string | null;
          nombre_fr?: string | null;
          nombre_it?: string | null;
          nombre_ko?: string | null;
          nombre_pt?: string | null;
          osm_id?: string | null;
          tipo: Database["public"]["Enums"]["tipo_punto_interes"];
          updated_at?: string | null;
        };
        Update: {
          coords?: unknown;
          created_at?: string;
          descripcion?: string | null;
          descripcion_de?: string | null;
          descripcion_en?: string | null;
          descripcion_fr?: string | null;
          descripcion_it?: string | null;
          descripcion_ko?: string | null;
          descripcion_pt?: string | null;
          etapa_id?: string;
          foto_public_id?: string | null;
          foto_url?: string | null;
          id?: string;
          km_referencia?: number | null;
          nombre?: string;
          nombre_de?: string | null;
          nombre_en?: string | null;
          nombre_fr?: string | null;
          nombre_it?: string | null;
          nombre_ko?: string | null;
          nombre_pt?: string | null;
          osm_id?: string | null;
          tipo?: Database["public"]["Enums"]["tipo_punto_interes"];
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "puntos_interes_etapa_id_fkey";
            columns: ["etapa_id"];
            isOneToOne: false;
            referencedRelation: "etapas";
            referencedColumns: ["id"];
          },
        ];
      };
      reacciones: {
        Row: {
          autor_id: string;
          created_at: string;
          entidad_id: string;
          id: string;
          tipo_entidad: string;
          tipo_reaccion: string;
        };
        Insert: {
          autor_id: string;
          created_at?: string;
          entidad_id: string;
          id?: string;
          tipo_entidad: string;
          tipo_reaccion: string;
        };
        Update: {
          autor_id?: string;
          created_at?: string;
          entidad_id?: string;
          id?: string;
          tipo_entidad?: string;
          tipo_reaccion?: string;
        };
        Relationships: [];
      };
      reportes: {
        Row: {
          created_at: string | null;
          entidad_id: string;
          id: string;
          motivo: string | null;
          reporter_id: string | null;
          tipo: string;
        };
        Insert: {
          created_at?: string | null;
          entidad_id: string;
          id?: string;
          motivo?: string | null;
          reporter_id?: string | null;
          tipo: string;
        };
        Update: {
          created_at?: string | null;
          entidad_id?: string;
          id?: string;
          motivo?: string | null;
          reporter_id?: string | null;
          tipo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reportes_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      retos_completados: {
        Row: {
          comentario: string | null;
          completado_at: string;
          coords_verificadas: unknown;
          foto_url: string | null;
          id: string;
          perfil_id: string;
          reto_id: string;
        };
        Insert: {
          comentario?: string | null;
          completado_at?: string;
          coords_verificadas?: unknown;
          foto_url?: string | null;
          id?: string;
          perfil_id: string;
          reto_id: string;
        };
        Update: {
          comentario?: string | null;
          completado_at?: string;
          coords_verificadas?: unknown;
          foto_url?: string | null;
          id?: string;
          perfil_id?: string;
          reto_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "retos_completados_perfil_id_fkey";
            columns: ["perfil_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "retos_completados_reto_id_fkey";
            columns: ["reto_id"];
            isOneToOne: false;
            referencedRelation: "retos_geocaching";
            referencedColumns: ["id"];
          },
        ];
      };
      retos_geocaching: {
        Row: {
          activo: boolean;
          coords: unknown;
          creador_id: string;
          created_at: string;
          etapa_id: string;
          id: string;
          pista_texto: string;
          radio_metros: number;
          reportes: number;
          titulo: string;
          updated_at: string;
        };
        Insert: {
          activo?: boolean;
          coords: unknown;
          creador_id: string;
          created_at?: string;
          etapa_id: string;
          id?: string;
          pista_texto: string;
          radio_metros?: number;
          reportes?: number;
          titulo: string;
          updated_at?: string;
        };
        Update: {
          activo?: boolean;
          coords?: unknown;
          creador_id?: string;
          created_at?: string;
          etapa_id?: string;
          id?: string;
          pista_texto?: string;
          radio_metros?: number;
          reportes?: number;
          titulo?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "retos_geocaching_creador_id_fkey";
            columns: ["creador_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "retos_geocaching_etapa_id_fkey";
            columns: ["etapa_id"];
            isOneToOne: false;
            referencedRelation: "etapas";
            referencedColumns: ["id"];
          },
        ];
      };
      valoraciones: {
        Row: {
          aspecto: string | null;
          autor_id: string;
          created_at: string;
          entidad_id: string;
          id: string;
          puntuacion: number;
          tipo_entidad: string;
          updated_at: string;
        };
        Insert: {
          aspecto?: string | null;
          autor_id: string;
          created_at?: string;
          entidad_id: string;
          id?: string;
          puntuacion: number;
          tipo_entidad: string;
          updated_at?: string;
        };
        Update: {
          aspecto?: string | null;
          autor_id?: string;
          created_at?: string;
          entidad_id?: string;
          id?: string;
          puntuacion?: number;
          tipo_entidad?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      negocios_en_etapa: {
        Row: {
          activo: boolean | null;
          categoria: string | null;
          descripcion: string | null;
          descripcion_de: string | null;
          descripcion_en: string | null;
          descripcion_fr: string | null;
          descripcion_it: string | null;
          descripcion_ko: string | null;
          descripcion_pt: string | null;
          etapa_id: string | null;
          foto_url: string | null;
          id: string | null;
          km_referencia: number | null;
          lat: number | null;
          lng: number | null;
          nombre: string | null;
          plan: string | null;
          slug: string | null;
          telefono: string | null;
          verificado: boolean | null;
          web: string | null;
          whatsapp: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "negocios_etapas_etapa_id_fkey";
            columns: ["etapa_id"];
            isOneToOne: false;
            referencedRelation: "etapas";
            referencedColumns: ["id"];
          },
        ];
      };
      puntos_interes_geo: {
        Row: {
          descripcion: string | null;
          etapa_id: string | null;
          id: string | null;
          km_referencia: number | null;
          lat: number | null;
          lng: number | null;
          nombre: string | null;
          tipo: Database["public"]["Enums"]["tipo_punto_interes"] | null;
        };
        Insert: {
          descripcion?: string | null;
          etapa_id?: string | null;
          id?: string | null;
          km_referencia?: number | null;
          lat?: never;
          lng?: never;
          nombre?: string | null;
          tipo?: Database["public"]["Enums"]["tipo_punto_interes"] | null;
        };
        Update: {
          descripcion?: string | null;
          etapa_id?: string | null;
          id?: string | null;
          km_referencia?: number | null;
          lat?: never;
          lng?: never;
          nombre?: string | null;
          tipo?: Database["public"]["Enums"]["tipo_punto_interes"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "puntos_interes_etapa_id_fkey";
            columns: ["etapa_id"];
            isOneToOne: false;
            referencedRelation: "etapas";
            referencedColumns: ["id"];
          },
        ];
      };
      resumen_interacciones: {
        Row: {
          entidad_id: string | null;
          media_valoracion: number | null;
          tipo_entidad: string | null;
          total_comentarios: number | null;
          total_reacciones: number | null;
          total_respuestas: number | null;
          total_valoraciones: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      albergue_coords: {
        Args: { p_slug: string };
        Returns: {
          lat: number;
          lng: number;
        }[];
      };
      albergues_con_coords: {
        Args: { p_etapa_id: string };
        Returns: {
          foto_url: string;
          id: string;
          lat: number;
          lng: number;
          localidad: string;
          nombre: string;
          ocupacion: string;
          plan: string;
          precio_cama: string;
          registrado: boolean;
          slug: string;
          tipo: string;
        }[];
      };
      etapa_mas_cercana: {
        Args: { p_lat: number; p_lng: number };
        Returns: {
          distancia_metros: number;
          etapa_id: string;
        }[];
      };
      extraer_coords_albergue: {
        Args: { p_id: string };
        Returns: {
          lat: number;
          lng: number;
        }[];
      };
      incrementar_contador_conversaciones: {
        Args: { p_entidad_id: string; p_entidad_tipo: string; p_mes: string };
        Returns: undefined;
      };
      negocios_cerca_etapa: {
        Args: { p_etapa_id: string; p_radio_metros?: number };
        Returns: {
          categoria: string;
          foto_url: string;
          id: string;
          lat: number;
          lng: number;
          nombre: string;
          slug: string;
          telefono: string;
          web: string;
        }[];
      };
      puede_ver_pista: {
        Args: { p_reto_id: string; p_user_pos: unknown };
        Returns: boolean;
      };
      unaccent: { Args: { "": string }; Returns: string };
    };
    Enums: {
      estado_conexion: "pendiente" | "aceptada" | "rechazada";
      ocupacion_albergue: "libre" | "casi_lleno" | "completo";
      rol_usuario: "peregrino" | "albergue" | "admin" | "negocio";
      tipo_albergue: "municipal" | "privado" | "parroquial" | "asociacion";
      tipo_conversacion: "directo" | "canal_etapa" | "albergue" | "negocio";
      tipo_punto_interes:
        | "fuente"
        | "iglesia"
        | "monumento"
        | "restaurante"
        | "supermercado"
        | "farmacia"
        | "medico"
        | "mirador"
        | "refugio"
        | "otro"
        | "ermita"
        | "cruceiro"
        | "puente"
        | "yacimiento"
        | "area_descanso"
        | "albergue_rural"
        | "capilla";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      estado_conexion: ["pendiente", "aceptada", "rechazada"],
      ocupacion_albergue: ["libre", "casi_lleno", "completo"],
      rol_usuario: ["peregrino", "albergue", "admin", "negocio"],
      tipo_albergue: ["municipal", "privado", "parroquial", "asociacion"],
      tipo_conversacion: ["directo", "canal_etapa", "albergue", "negocio"],
      tipo_punto_interes: [
        "fuente",
        "iglesia",
        "monumento",
        "restaurante",
        "supermercado",
        "farmacia",
        "medico",
        "mirador",
        "refugio",
        "otro",
        "ermita",
        "cruceiro",
        "puente",
        "yacimiento",
        "area_descanso",
        "albergue_rural",
        "capilla",
      ],
    },
  },
} as const;
