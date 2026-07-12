import { cn } from "@/lib/utils";

/** Logo "UmbraAds" — "Umbra" em zinc-100 + "Ads" em amber-500. */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-extrabold tracking-[-0.02em] text-zinc-100",
        className,
      )}
    >
      Umbra<span className="text-brand">Ads</span>
    </span>
  );
}
