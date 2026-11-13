import React from "react";

export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/** Tiny uppercase section label, as in Task OS. */
export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-[9px] uppercase tracking-widest font-semibold text-white/30">
      {children}
    </label>
  );
}

/** Selectable tile: solid white when on, hairline outline when off. */
export const pill = (on: boolean) =>
  cn(
    "h-12 min-w-0 rounded-lg border text-sm font-semibold tabular-nums transition-colors select-none",
    on ? "bg-white border-white text-black" : "bg-black/40 border-white/10 text-white/85 hover:border-white/25"
  );

export const primaryButton =
  "w-full flex items-center justify-center gap-2 bg-white text-black py-4 rounded-lg text-[11px] uppercase tracking-widest font-bold hover:bg-white/90 transition-all active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none";

export const secondaryButton =
  "w-full flex items-center justify-center gap-2 border border-white/10 text-white/70 py-4 rounded-lg text-[11px] uppercase tracking-widest font-bold hover:text-white hover:border-white/25 transition-colors active:scale-[0.98]";
