import { cn } from "@/lib/utils";

/**
 * Bolinha de status do anúncio (design): emerald = ativo, red = morto.
 * Opcionalmente acompanha um texto ao lado.
 */
export function StatusDot({
  ativo,
  label,
  className,
}: {
  ativo: boolean;
  label?: string;
  className?: string;
}) {
  const dot = (
    <span
      className="inline-block h-[7px] w-[7px] shrink-0 rounded-full"
      style={{ background: ativo ? "#10b981" : "#ef4444" }}
    />
  );

  if (!label) return dot;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[7px] text-[12.5px] text-zinc-400",
        className,
      )}
    >
      {dot}
      {label}
    </span>
  );
}
