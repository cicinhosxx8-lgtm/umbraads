import { cn } from "@/lib/utils";

/**
 * Área de thumbnail do criativo. Se houver snapshot_url usa a imagem;
 * senão cai no gradiente por nicho (como no design). `children` são os
 * badges sobrepostos (tipo, score, status).
 */
export function Thumb({
  gradient,
  url,
  alt,
  className,
  children,
}: {
  gradient: string;
  url?: string | null;
  alt?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ background: gradient }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt ?? ""}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      ) : null}
      {children}
    </div>
  );
}
