# SCORECARD — Facebook Pages Scraper2 (ousema.frikha)

- RapidAPI host: `facebook-pages-scraper2.p.rapidapi.com`
- Data do teste: 2026-07-11
- Planos (marketplace): [PREÇO/LIMITES DOS PLANOS — preencher do marketplace]

### Endpoints confirmados (por sondagem)
- `GET /fetch_search_ads_pages   (query*=keyword|page_id, country, active_status, end_cursor?) -> { data{ ads[][], page_info{end_cursor} } }`
- `GET /fetch_archive_ad_details (ad_archive_id*, page_id*, country?)  -> { data{...} }`
- `GET /fetch_search_ads_keywords (query*, country)  -> { data{ page_results[] } }  (typeahead de páginas)`
- `GET /fetch_page_ad_details    (page_id*, country*)  -> só PERFIL da página`
- `GET /get_supported_countries  -> lista de países (240)`

## Testes
- **Teste 1 — Busca BR:** PASSOU — 9 anúncios, 1 marcados BR — Brasil/PT identificável.
- **Teste 2 — Anúncios da página:** PASSOU — Retorna só os anúncios da página (10). Alimenta rastreio e variações.
- **Teste 3 — Detalhe do anúncio:** PASSOU — Endpoint(s) de detalhe retornam payload profundo (advertiser, audience, spend, violations).
- **Teste 4 — Campos obrigatórios:** PASSOU — Todos os campos OBRIGATÓRIOS presentes (★).
- **Teste 5 — Variações/Scale Score:** PASSOU — Melhor: collation_count agrupa anúncios iguais direto.
- **Extra — Autocomplete:** OK — retorna 15 páginas sugeridas (útil pra achar page_id por nome).

## Tabela de campos (Teste 4)
| Campo | Obrig. | Estado | Cobertura | Caminho no JSON |
|---|:---:|---|---|---|
| ad_archive_id | ★ | PRESENTE | 14/14 | `ad.ad_archive_id` |
| page_id | ★ | PRESENTE | 14/14 | `ad.page_id` |
| page_name |  | PRESENTE | 14/14 | `ad.page_name / ad.snapshot.page_name` |
| start_date (dias no ar) | ★ | PRESENTE | 14/14 | `ad.start_date (unix)` |
| status ativo/inativo | ★ | PRESENTE | 14/14 | `ad.is_active` |
| copy (texto) | ★ | PRESENTE | 12/14 | `ad.snapshot.body.text` |
| URL do criativo | ★ | PARCIAL | 5/14 | `snapshot.videos[0].video_hd_url | snapshot.images[0].original_image_url` |
| tipo do criativo |  | PRESENTE | 14/14 | `ad.snapshot.display_format` |
| link de destino |  | PRESENTE | 13/14 | `ad.snapshot.link_url` |
| CTA |  | PRESENTE | 13/14 | `ad.snapshot.cta_text / cta_type` |
| país(es) |  | PRESENTE | 7/14 | `snapshot.country_iso_code / ad.targeted_or_reached_countries` |
| plataformas (FB/IG) |  | PRESENTE | 14/14 | `ad.publisher_platform` |
| variações (collation) |  | PRESENTE | 12/14 | `ad.collation_count / ad.collation_id` |

## Estratégia de variações (Teste 5)
A) collation_count/collation_id direto em cada anúncio  +  B) listar anúncios da página (query=page_id) e contar

## Operacional (Teste 6)
- Latência média: **8641ms**
- Paginação: OK — cursor avança (página 2 trouxe 10/10 novos).
- Rate limit: 5 chamadas seguidas SEM 429.
- Headers de rate limit: `{"x-ratelimit-rapid-free-plans-hard-limit-limit":"500000","x-ratelimit-rapid-free-plans-hard-limit-remaining":"499981","x-ratelimit-rapid-free-plans-hard-limit-reset":"2676004","x-ratelimit-requests-limit":"25","x-ratelimit-requests-remaining":"6","x-ratelimit-requests-reset":"2676004"}`

## VEREDITO: APROVADA COM RESSALVAS
UmbraAds perde/precisa contornar: URL do criativo vem incompleto na busca (5/14) — completar via endpoint de detalhe/refetch

## Mapeamento API → NormalizedAd (rascunho p/ provider-facebook-adlibrary.ts)
```ts
// ad = item da lista de anúncios da busca (/fetch_search_ads_pages)
const normalized: NormalizedAd = {
  ad_archive_id: ad.ad_archive_id,
  page_id: ad.page_id,
  page_name: ad.page_name ?? ad.snapshot.page_name,
  tipo_criativo: ad.snapshot.display_format,  // VIDEO | IMAGE | DCO | DPA
  copy_texto: ad.snapshot.body?.text,
  cta: ad.snapshot.cta_text ?? ad.snapshot.cta_type,
  link_destino: ad.snapshot.link_url,
  snapshot_url: ad.snapshot.videos?.[0]?.video_hd_url ?? ad.snapshot.images?.[0]?.original_image_url,  // às vezes vazio na busca — completar via endpoint de detalhe
  pais: ad.snapshot.country_iso_code ?? ad.targeted_or_reached_countries?.[0],
  ativo: ad.is_active,
  data_inicio: new Date(ad.start_date * 1000),  // start_date é unix epoch (segundos)
  variacoes_ativas: ad.collation_count,  // ou nº de ads da página
};
```