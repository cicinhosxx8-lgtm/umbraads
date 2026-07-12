/**
 * Tipos do banco (mão-escritos, espelhando supabase/migrations).
 * Depois de aplicar as migrations você pode regenerar com:
 *   npx supabase gen types typescript --project-id <ref> > lib/types/database.ts
 * Mantivemos manual por enquanto para o projeto compilar sem o Supabase CLI.
 */

export type Plano = "free" | "basico" | "pro" | "elite";
export type MonitoradoStatus = "observando" | "validada" | "morta";
export type RastreadoTipo = "pagina" | "keyword";
export type AlertaTipo = "novo_anuncio" | "explosao_variacoes" | "oferta_morta";
export type ApiKeyStatus = "ativa" | "cooldown" | "esgotada";

export interface Preferencias {
  pais_padrao?: string;
  nichos?: string[];
}

type Timestamptz = string;
type DateStr = string;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          plano: Plano;
          plano_expira_em: Timestamptz | null;
          buscas_hoje: number;
          preferencias: Preferencias;
          created_at: Timestamptz;
        };
        Insert: {
          id: string;
          email?: string | null;
          plano?: Plano;
          plano_expira_em?: Timestamptz | null;
          buscas_hoje?: number;
          preferencias?: Preferencias;
          created_at?: Timestamptz;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      ads: {
        Row: {
          id: string;
          ad_archive_id: string;
          page_id: string;
          page_name: string | null;
          tipo_criativo: string | null;
          copy_texto: string | null;
          cta: string | null;
          link_destino: string | null;
          snapshot_url: string | null;
          pais: string;
          nicho: string | null;
          idioma: string | null;
          ativo: boolean;
          data_inicio: DateStr | null;
          dias_ativo: number | null;
          variacoes_ativas: number;
          variacoes_7d_atras: number | null;
          scale_score: number;
          primeiro_visto: Timestamptz;
          ultima_verificacao: Timestamptz;
        };
        Insert: {
          id?: string;
          ad_archive_id: string;
          page_id: string;
          page_name?: string | null;
          tipo_criativo?: string | null;
          copy_texto?: string | null;
          cta?: string | null;
          link_destino?: string | null;
          snapshot_url?: string | null;
          pais?: string;
          nicho?: string | null;
          idioma?: string | null;
          ativo?: boolean;
          data_inicio?: DateStr | null;
          dias_ativo?: number | null;
          variacoes_ativas?: number;
          variacoes_7d_atras?: number | null;
          scale_score?: number;
          primeiro_visto?: Timestamptz;
          ultima_verificacao?: Timestamptz;
        };
        Update: Partial<Database["public"]["Tables"]["ads"]["Insert"]>;
        Relationships: [];
      };
      pages: {
        Row: {
          page_id: string;
          nome: string | null;
          anuncios_ativos: number;
          primeiro_visto: Timestamptz;
          ultima_verificacao: Timestamptz | null;
        };
        Insert: {
          page_id: string;
          nome?: string | null;
          anuncios_ativos?: number;
          primeiro_visto?: Timestamptz;
          ultima_verificacao?: Timestamptz | null;
        };
        Update: Partial<Database["public"]["Tables"]["pages"]["Insert"]>;
        Relationships: [];
      };
      page_snapshots: {
        Row: {
          id: number;
          page_id: string;
          data: DateStr;
          anuncios_ativos: number | null;
        };
        Insert: {
          id?: number;
          page_id: string;
          data: DateStr;
          anuncios_ativos?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["page_snapshots"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "page_snapshots_page_id_fkey";
            columns: ["page_id"];
            referencedRelation: "pages";
            referencedColumns: ["page_id"];
          },
        ];
      };
      monitorados: {
        Row: {
          id: string;
          user_id: string;
          ad_id: string;
          nota: string | null;
          status: MonitoradoStatus;
          criado_em: Timestamptz;
        };
        Insert: {
          id?: string;
          user_id: string;
          ad_id: string;
          nota?: string | null;
          status?: MonitoradoStatus;
          criado_em?: Timestamptz;
        };
        Update: Partial<Database["public"]["Tables"]["monitorados"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "monitorados_ad_id_fkey";
            columns: ["ad_id"];
            referencedRelation: "ads";
            referencedColumns: ["id"];
          },
        ];
      };
      rastreados: {
        Row: {
          id: string;
          user_id: string;
          tipo: RastreadoTipo;
          valor: string;
          ativo: boolean;
          criado_em: Timestamptz;
        };
        Insert: {
          id?: string;
          user_id: string;
          tipo: RastreadoTipo;
          valor: string;
          ativo?: boolean;
          criado_em?: Timestamptz;
        };
        Update: Partial<Database["public"]["Tables"]["rastreados"]["Insert"]>;
        Relationships: [];
      };
      alertas: {
        Row: {
          id: string;
          user_id: string;
          rastreado_id: string | null;
          tipo: AlertaTipo;
          titulo: string | null;
          payload: Record<string, unknown> | null;
          lido: boolean;
          criado_em: Timestamptz;
        };
        Insert: {
          id?: string;
          user_id: string;
          rastreado_id?: string | null;
          tipo: AlertaTipo;
          titulo?: string | null;
          payload?: Record<string, unknown> | null;
          lido?: boolean;
          criado_em?: Timestamptz;
        };
        Update: Partial<Database["public"]["Tables"]["alertas"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "alertas_rastreado_id_fkey";
            columns: ["rastreado_id"];
            referencedRelation: "rastreados";
            referencedColumns: ["id"];
          },
        ];
      };
      api_keys: {
        Row: {
          id: string;
          provedor: string;
          chave: string;
          limite_mensal: number | null;
          uso_atual: number;
          status: ApiKeyStatus;
          cooldown_ate: Timestamptz | null;
          renova_em: DateStr | null;
        };
        Insert: {
          id?: string;
          provedor: string;
          chave: string;
          limite_mensal?: number | null;
          uso_atual?: number;
          status?: ApiKeyStatus;
          cooldown_ate?: Timestamptz | null;
          renova_em?: DateStr | null;
        };
        Update: Partial<Database["public"]["Tables"]["api_keys"]["Insert"]>;
        Relationships: [];
      };
      query_cache: {
        Row: {
          id: string;
          query_hash: string;
          ad_ids: string[] | null;
          atualizado_em: Timestamptz;
        };
        Insert: {
          id?: string;
          query_hash: string;
          ad_ids?: string[] | null;
          atualizado_em?: Timestamptz;
        };
        Update: Partial<Database["public"]["Tables"]["query_cache"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Atalhos úteis para o resto do app.
export type Ad = Database["public"]["Tables"]["ads"]["Row"];
export type Page = Database["public"]["Tables"]["pages"]["Row"];
export type PageSnapshot = Database["public"]["Tables"]["page_snapshots"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Monitorado = Database["public"]["Tables"]["monitorados"]["Row"];
export type Rastreado = Database["public"]["Tables"]["rastreados"]["Row"];
export type Alerta = Database["public"]["Tables"]["alertas"]["Row"];
