/**
 * Contratos da camada de dados (provider-agnóstica).
 * NormalizedAd espelha as colunas relevantes da tabela `ads` — todo provider
 * deve devolver seus anúncios nesse formato normalizado.
 */
export interface NormalizedAd {
  ad_archive_id: string;
  page_id: string;
  page_name: string | null;
  tipo_criativo: string | null; // VIDEO | IMAGE | DCO | DPA...
  copy_texto: string | null;
  cta: string | null;
  link_destino: string | null;
  snapshot_url: string | null;
  pais: string; // ISO (BR, PT, US...)
  nicho: string | null;
  idioma: string | null;
  ativo: boolean;
  data_inicio: string | null; // YYYY-MM-DD
  dias_ativo: number | null;
  variacoes_ativas: number;
}

/** Filtros aceitos pela busca (mapeados para os params de cada API). */
export interface SearchFiltros {
  query?: string;
  pais?: string; // default BR
  ativo?: "active" | "inactive" | "all";
  cursor?: string;
}

export interface SearchResultado {
  ads: NormalizedAd[];
  nextCursor: string | null;
}

/** Interface que todo adapter de Ad Library implementa. */
export interface AdProvider {
  readonly nome: string;
  searchAds(filtros: SearchFiltros): Promise<SearchResultado>;
  getAd(adArchiveId: string, pageId?: string): Promise<NormalizedAd | null>;
  getPageAds(pageId: string, cursor?: string): Promise<SearchResultado>;
}
