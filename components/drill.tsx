"use client";

import React, { useEffect, useReducer, useRef } from "react";
import { X } from "lucide-react";
import type { Question } from "@/lib/questions";
import type { Answer } from "@/lib/session";
import { Keypad, type Key } from "./keypad";
import { cn } from "./ui";

/** How long a wrong answer stays up before moving on (Enter, Space or a tap skips it). */
const FEEDBACK_MS = 1400;

interface State {
  questions: Question[];
  index: number;
  typed: string;
  /** Set while a wrong (or timed-out) answer is on screen. */
  showing: Answer | null;
  answers: Answer[];
  shownAt: number;
  ended: boolean;
}

type Action =
  | { type: "key"; key: Key; now: number }
  | { type: "timeout"; index: number; now: number }
  | { type: "next"; now: number }
  | { type: "end" };

function reduce(s: State, a: Action): State {
  const q = s.questions[s.index];
  if (!q || s.ended) return s;
  switch (a.type) {
    case "key": {
      if (s.showing) return s;
      if (a.key === "back") return { ...s, typed: s.typed.slice(0, -1) };
      // No answer starts with 0, so a stray 0 is ignored rather than marked wrong.
      if (s.typed === "" && a.key === "0") return s;
      const typed = s.typed + a.key;
      // The answer is checked as soon as it has as many digits as the right one: no Enter needed.
      if (typed.length < String(q.answer).length) return { ...s, typed };
      const answer: Answer = { q, given: typed, correct: Number(typed) === q.answer, timedOut: false, ms: a.now - s.shownAt };
      const answers = [...s.answers, answer];
      if (answer.correct) return { ...s, answers, index: s.index + 1, typed: "", shownAt: a.now };
      return { ...s, answers, typed, showing: answer };
    }
    case "timeout": {
      if (s.showing || a.index !== s.index) return s;
      const answer: Answer = { q, given: s.typed, correct: false, timedOut: true, ms: a.now - s.shownAt };
      return { ...s, answers: [...s.answers, answer], showing: answer };
    }
    case "next":
      if (!s.showing) return s;
      return { ...s, index: s.index + 1, typed: "", showing: null, shownAt: a.now };
    case "end":
      return { ...s, ended: true };
  }
}

export function Drill({
  questions,
  timer,
  onDone,
}: {
  questions: Question[];
  /** Seconds per question; 0 for no timer. */
  timer: number;
  /** Called once, with everything answered. `ended` is true if the run was cut short. */
  onDone: (answers: Answer[], ended: boolean) => void;
}) {
  const [s, dispatch] = useReducer(reduce, questions, qs => ({
    questions: qs,
    index: 0,
    typed: "",
    showing: null,
    answers: [],
    shownAt: performance.now(),
    ended: false,
  }));
  const total = questions.length;
  const finished = s.index >= total || s.ended;

  const reported = useRef(false);
  useEffect(() => {
    if (!finished || reported.current) return;
    reported.current = true;
    onDone(s.answers, s.ended);
  }, [finished, s.answers, s.ended, onDone]);

  // Per-question countdown.
  useEffect(() => {
    if (!timer || s.showing || finished) return;
    const index = s.index;
    const id = setTimeout(() => dispatch({ type: "timeout", index, now: performance.now() }), timer * 1000);
    return () => clearTimeout(id);
  }, [timer, s.index, s.showing, finished]);

  // A miss stays up briefly, then moves on.
  useEffect(() => {
    if (!s.showing) return;
    const id = setTimeout(() => dispatch({ type: "next", now: performance.now() }), FEEDBACK_MS);
    return () => clearTimeout(id);
  }, [s.showing]);

  // Physical keyboard: digits, Backspace, Enter/Space to skip a miss, Esc to end.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) dispatch({ type: "key", key: e.key as Key, now: performance.now() });
      else if (e.key === "Backspace") dispatch({ type: "key", key: "back", now: performance.now() });
      else if (e.key === "Enter" || e.key === " ") dispatch({ type: "next", now: performance.now() });
      else if (e.key === "Escape") dispatch({ type: "end" });
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (finished) return null;

  const q = questions[s.index];
  const miss = s.showing;
  const progress = (s.index + (miss ? 1 : 0)) / total;

  return (
    <div className="h-dvh flex flex-col items-center px-4 pt-[env(safe-area-inset-top)] pb-[max(1rem,env(safe-area-inset-bottom))] select-none touch-manipulation">
      <div className="w-full max-w-md md:max-w-xl flex-1 flex flex-col">
        <header className="h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={() => dispatch({ type: "end" })}
            aria-label="End run"
            className="p-2 -ml-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-xs font-mono tabular-nums text-white/50" aria-live="polite">
            {s.index + 1} <span className="text-white/25">/ {total}</span>
          </span>
          <span className="w-9" />
        </header>
        <div className="h-px bg-white/10" aria-hidden>
          <div className="h-full bg-white transition-[width] duration-300 ease-out" style={{ width: `${progress * 100}%` }} />
        </div>

        <main
          className="flex-1 flex flex-col items-center justify-center gap-5"
          onPointerDown={() => miss && dispatch({ type: "next", now: performance.now() })}
        >
          <div key={`q${s.index}`} className="animate-rise text-[64px] md:text-8xl leading-none font-light tabular-nums tracking-tight text-white">
            {q.left}
            <span className="mx-[0.18em] text-white/35">×</span>
            {q.right}
          </div>

          <div className={cn("h-20 flex items-center justify-center", miss && !miss.timedOut && "animate-shake")}>
            {miss ? (
              <div className="flex items-baseline gap-5">
                {miss.given && (
                  <span className="text-4xl md:text-5xl font-semibold tabular-nums text-white/25 line-through decoration-2">{miss.given}</span>
                )}
                <span className="text-5xl md:text-6xl font-semibold tabular-nums text-white">{q.answer}</span>
              </div>
            ) : (
              <span className="text-5xl md:text-6xl font-semibold tabular-nums text-white flex items-center">
                {s.typed}
                <span className="inline-block w-[3px] h-[0.85em] ml-1 bg-white/60 animate-blink" aria-hidden />
              </span>
            )}
          </div>

          <div className="h-4 text-[9px] uppercase tracking-widest font-bold text-white/40">
            {miss ? (miss.timedOut ? "Time’s up" : "Not quite") : ""}
          </div>

          {timer > 0 && (
            <div className="w-40 h-0.5 rounded-full bg-white/10 overflow-hidden" aria-hidden>
              <div
                key={`t${s.index}`}
                className="h-full bg-white origin-left"
                style={{ animation: `drain ${timer}s linear forwards`, animationPlayState: miss ? "paused" : "running" }}
              />
            </div>
          )}
        </main>

        <Keypad
          className="pointer-fine:hidden"
          onKey={key => dispatch({ type: "key", key, now: performance.now() })}
        />
        <p className="hidden pointer-fine:block pb-6 text-center text-[9px] uppercase tracking-widest font-semibold text-white/25">
          Type the answer · Esc to end
        </p>
      </div>
    </div>
  );
}
