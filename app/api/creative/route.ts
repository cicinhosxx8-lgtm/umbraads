import { type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NAV_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36",
  Accept: "*/*",
  Referer: "https://www.facebook.com/",
};

/** Só deixamos passar hosts da FB CDN (evita virar open-proxy/SSRF). */
function permitido(u: string): boolean {
  try {
    const h = new URL(u).hostname;
    return h.endsWith("fbcdn.net") || h.endsWith("cdninstagram.com");
  } catch {
    return false;
  }
}

/**
 * Proxy de criativos. O navegador pede /api/creative?u=<url da FB CDN>; a
 * Vercel busca (conectividade estável, ao contrário de redes residenciais) e
 * devolve pelo nosso domínio. Repassa Range (pra vídeo) e cacheia imagens.
 */
export async function GET(request: NextRequest) {
  const u = request.nextUrl.searchParams.get("u");
  if (!u || !permitido(u)) {
    return new Response("URL não permitida.", { status: 400 });
  }

  const range = request.headers.get("range");
  let upstream: Response;
  try {
    upstream = await fetch(u, {
      headers: { ...NAV_HEADERS, ...(range ? { Range: range } : {}) },
    });
  } catch {
    return new Response("Falha ao buscar o criativo.", { status: 502 });
  }
  if (!upstream.ok && upstream.status !== 206) {
    return new Response("Criativo indisponível.", { status: 502 });
  }

  const headers = new Headers();
  const ct = upstream.headers.get("content-type") ?? "application/octet-stream";
  headers.set("Content-Type", ct);
  headers.set("Accept-Ranges", "bytes");
  for (const h of ["content-length", "content-range"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  // imagens (resposta completa) cacheiam forte na CDN da Vercel — sobrevive à
  // expiração da URL original. Vídeo com Range não cacheia, mas funciona.
  if (upstream.status === 200 && ct.startsWith("image/")) {
    headers.set("Cache-Control", "public, max-age=86400, s-maxage=2592000, immutable");
  } else {
    headers.set("Cache-Control", "public, max-age=3600");
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
