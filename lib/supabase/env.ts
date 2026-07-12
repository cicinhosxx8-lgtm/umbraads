/**
 * Checa se o Supabase está realmente configurado no ambiente.
 * Trata URL vazia OU inválida (ex.: placeholder "COLAR_AQUI…") como
 * "não configurado", para o app subir antes de você preencher o .env.local.
 */
export function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return /^https?:\/\/.+/i.test(url) && anon.length > 20;
}
