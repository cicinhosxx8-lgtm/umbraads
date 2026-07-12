"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

/** Botão "Copiar" da copy do anúncio (design: vira "✓ Copiado!" por 1.8s). */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard indisponível — ignora */
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className={cn(
        "rounded-lg border px-3.5 py-1.5 text-[12.5px] font-bold transition-all",
        copied
          ? "text-good-soft"
          : "border-line-hover text-zinc-300 hover:text-zinc-100",
      )}
      style={
        copied
          ? {
              background: "rgba(16,185,129,0.14)",
              borderColor: "rgba(16,185,129,0.4)",
            }
          : undefined
      }
    >
      {copied ? "✓ Copiado!" : "Copiar"}
    </button>
  );
}
