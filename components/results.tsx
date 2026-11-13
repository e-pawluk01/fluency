"use client";

import React, { useEffect } from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { Answer, formatClock, formatSeconds, missedFacts } from "@/lib/session";
import { cn, FieldLabel, primaryButton, secondaryButton } from "./ui";

export function Results({
  answers,
  planned,
  ended,
  onAgain,
  onSettings,
}: {
  answers: Answer[];
  /** How many questions the run was set up for. */
  planned: number;
  ended: boolean;
  onAgain: () => void;
  onSettings: () => void;
}) {
  const n = answers.length;
  const correct = answers.filter(a => a.correct).length;
  const totalMs = answers.reduce((sum, a) => sum + a.ms, 0);
  const missed = missedFacts(answers);

  // Enter goes again, Esc goes back to settings. A short pause first, so a key
  // still being hammered from the last question doesn't skip straight past.
  useEffect(() => {
    let armed = false;
    const t = setTimeout(() => (armed = true), 600);
    const onKey = (e: KeyboardEvent) => {
      if (!armed) return;
      if (e.key === "Enter") { e.preventDefault(); onAgain(); }
      else if (e.key === "Escape") { e.preventDefault(); onSettings(); }
    };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
  }, [onAgain, onSettings]);

  return (
    <div className="min-h-dvh flex flex-col items-center md:justify-center px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md flex-1 md:flex-none flex flex-col gap-8 animate-rise">
        <header className="flex flex-col gap-2">
          <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/40">
            {ended ? `Ended early · ${n} of ${planned}` : "Done"}
          </span>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-7xl font-light tracking-tight text-white">{correct}</span>
            <span className="text-2xl font-light text-white/30">/ {n}</span>
          </div>
        </header>

        <div className="grid grid-cols-3 border-y border-white/10 divide-x divide-white/10">
          <Stat label="Accuracy" value={n ? `${Math.round((correct / n) * 100)}%` : "–"} />
          <Stat label="Total time" value={formatClock(totalMs)} />
          <Stat label="Per question" value={n ? formatSeconds(totalMs / n) : "–"} />
        </div>

        <section className="flex flex-col gap-3 min-h-0">
          <FieldLabel>{missed.length ? `Missed · ${missed.length}` : "Missed"}</FieldLabel>
          {missed.length === 0 ? (
            <p className="text-sm text-white/50">{n ? "Nothing. Clean run." : "Nothing answered."}</p>
          ) : (
            <ul className="flex flex-col max-h-[40dvh] overflow-y-auto -mx-1 px-1">
              {missed.map(m => (
                <li key={m.q.key} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <span className="text-base tabular-nums text-white">
                    {m.q.left} <span className="text-white/35">×</span> {m.q.right}{" "}
                    <span className="text-white/35">=</span> <span className="font-semibold">{m.q.answer}</span>
                  </span>
                  <span className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold text-white/40 tabular-nums">
                    {m.timedOut > 0 && <span className="px-1.5 py-0.5 rounded border border-white/15">{m.timedOut === m.times ? "Time" : `${m.timedOut} time`}</span>}
                    {m.times > 1 && <span className="text-white/70">×{m.times}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-auto md:mt-2 flex flex-col gap-2">
          <button type="button" onClick={onAgain} className={primaryButton}>
            <RotateCcw className="w-3.5 h-3.5" /> Go again
          </button>
          <button type="button" onClick={onSettings} className={cn(secondaryButton)}>
            <SlidersHorizontal className="w-3.5 h-3.5" /> Settings
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 py-4 px-3 first:pl-0">
      <FieldLabel>{label}</FieldLabel>
      <span className="text-lg font-medium tabular-nums text-white">{value}</span>
    </div>
  );
}
