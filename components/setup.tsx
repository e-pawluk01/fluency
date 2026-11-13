"use client";

import React, { useEffect, useState } from "react";
import { ALL_TABLES, factsFor } from "@/lib/questions";
import { clampCount, clampTimer, COUNT_PRESETS, Settings, TIMER_PRESETS } from "@/lib/settings";
import { cn, FieldLabel, pill, primaryButton } from "./ui";

export function Setup({
  settings,
  onChange,
  onStart,
}: {
  settings: Settings;
  onChange: (s: Settings) => void;
  onStart: () => void;
}) {
  const { tables, count, timer } = settings;
  const facts = factsFor(tables).length;
  const ready = tables.length > 0;

  const toggle = (t: number) =>
    onChange({ ...settings, tables: tables.includes(t) ? tables.filter(x => x !== t) : [...tables, t].sort((a, b) => a - b) });

  // Enter starts from anywhere on this screen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || !ready) return;
      e.preventDefault();
      (document.activeElement as HTMLElement | null)?.blur();
      onStart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready, onStart]);

  return (
    <div className="min-h-dvh flex flex-col items-center md:justify-center px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md flex-1 md:flex-none flex flex-col gap-8">
        <header className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/40">Fluency</span>
          <h1 className="text-lg font-medium tracking-wider text-white">Times tables</h1>
        </header>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <FieldLabel>Tables</FieldLabel>
            <div className="flex gap-1 -mr-2">
              <TextButton onClick={() => onChange({ ...settings, tables: ALL_TABLES })}>All</TextButton>
              <TextButton onClick={() => onChange({ ...settings, tables: [] })}>Clear</TextButton>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-1.5" role="group" aria-label="Times tables">
            {ALL_TABLES.map(t => (
              <button key={t} type="button" aria-pressed={tables.includes(t)} onClick={() => toggle(t)} className={pill(tables.includes(t))}>
                {t}
              </button>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-white/40 min-h-[2lh]">
            {ready ? (
              <>
                <span className="text-white/70 tabular-nums">{facts} facts</span> in the mix. 7 × 8 and 8 × 7 count as one,
                and every fact comes up once before any repeats.
              </>
            ) : (
              "Pick at least one table."
            )}
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <FieldLabel htmlFor="count-other">Questions</FieldLabel>
          <div className="grid grid-cols-5 gap-1.5">
            {COUNT_PRESETS.map(n => (
              <button key={n} type="button" aria-pressed={count === n} onClick={() => onChange({ ...settings, count: n })} className={pill(count === n)}>
                {n}
              </button>
            ))}
            <OtherField
              id="count-other"
              value={count}
              presets={COUNT_PRESETS}
              clamp={clampCount}
              onCommit={n => onChange({ ...settings, count: n })}
            />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <FieldLabel htmlFor="timer-other">Timer per question</FieldLabel>
          <div className="grid grid-cols-5 gap-1.5">
            {TIMER_PRESETS.map(n => (
              <button key={n} type="button" aria-pressed={timer === n} onClick={() => onChange({ ...settings, timer: n })} className={pill(timer === n)}>
                {n === 0 ? "Off" : `${n}s`}
              </button>
            ))}
            <OtherField
              id="timer-other"
              value={timer}
              presets={TIMER_PRESETS}
              clamp={clampTimer}
              suffix="s"
              onCommit={n => onChange({ ...settings, timer: n })}
            />
          </div>
        </section>

        <button type="button" disabled={!ready} onClick={onStart} className={cn(primaryButton, "mt-auto md:mt-2")}>
          Start · {count} question{count === 1 ? "" : "s"}
          {timer > 0 && (
            <>
              {" · "}
              {timer}
              <span className="normal-case">s</span> each
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function TextButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2 py-1 rounded-md text-[9px] uppercase tracking-widest font-semibold text-white/40 hover:text-white hover:bg-white/10 transition-colors"
    >
      {children}
    </button>
  );
}

/** The "Other" tile: a number field that lights up when it holds a non-preset value. */
function OtherField({
  id,
  value,
  presets,
  clamp,
  suffix,
  onCommit,
}: {
  id: string;
  value: number;
  presets: number[];
  clamp: (n: number) => number;
  suffix?: string;
  onCommit: (n: number) => void;
}) {
  const custom = !presets.includes(value);
  // What's being typed; null when not editing, so a preset tap clears the field.
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (custom ? String(value) : "");
  const on = custom || draft !== null;

  return (
    <label className={cn(pill(on), "relative flex items-center justify-center cursor-text px-1")}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        enterKeyHint="done"
        autoComplete="off"
        placeholder="Other"
        value={shown}
        onFocus={() => setDraft(custom ? String(value) : "")}
        onChange={e => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
          setDraft(digits);
          if (digits) onCommit(clamp(Number(digits)));
        }}
        onBlur={() => setDraft(null)}
        // Hug the digits once there are some, so "7" and its "s" sit centred together.
        style={shown ? { width: `${shown.length + 0.5}ch` } : undefined}
        className={cn(
          "w-full min-w-0 bg-transparent text-center text-base font-semibold tabular-nums outline-none",
          on ? "text-black placeholder:text-black/40" : "text-white/85 placeholder:text-white/40 placeholder:text-sm placeholder:font-semibold"
        )}
      />
      {suffix && shown && <span className={cn("pointer-events-none -ml-1 pr-1 text-sm", on ? "text-black/50" : "text-white/40")}>{suffix}</span>}
    </label>
  );
}
