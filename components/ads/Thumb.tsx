import { cn } from "@/lib/utils";
import { proxiedCreative } from "@/lib/format";

/**
 * Área de thumbnail do criativo (serve via /api/creative — proxy estável).
 *  - kind "image": mostra a imagem.
 *  - kind "video": mostra o primeiro frame do vídeo (preload metadata).
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
  const src = proxiedCreative(url);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ background: gradient }}
    >
      {src && kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt ?? ""}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      ) : null}
      {src && kind === "video" ? (
        <video
          src={src}
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
