import { cn } from "@/lib/utils";

/**
 * Área de thumbnail do criativo.
 *  - kind "image": mostra a imagem (snapshot_url).
 *  - kind "video": mostra o primeiro frame do vídeo (preload metadata) — leve
 *    o bastante pro grid; o play de verdade é na tela de detalhe.
 *  - kind "none": cai no gradiente por nicho.
 * `children` são os badges sobrepostos (tipo, score, status, play).
 */
export function Thumb({
  gradient,
  url,
  kind = "none",
  alt,
  className,
  children,
}: {
  gradient: string;
  url?: string | null;
  kind?: "video" | "image" | "none";
  alt?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ background: gradient }}
    >
      {url && kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt ?? ""}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      ) : null}
      {url && kind === "video" ? (
        <video
          src={url}
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      {children}
    </div>
  );
}
