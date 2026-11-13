import type { Question } from "./questions";

export interface Answer {
  q: Question;
  /** What was typed (may be partial or empty if the timer ran out). */
  given: string;
  correct: boolean;
  timedOut: boolean;
  /** Time from the question appearing to the answer (or the timer running out). */
  ms: number;
}

export interface Miss {
  q: Question;
  times: number;
  timedOut: number;
}

/** Each missed fact once, most-missed first. 7 × 8 and 8 × 7 are one fact. */
export function missedFacts(answers: Answer[]): Miss[] {
  const byFact = new Map<string, Miss>();
  for (const a of answers) {
    if (a.correct) continue;
    const m = byFact.get(a.q.key) ?? { q: a.q, times: 0, timedOut: 0 };
    m.times++;
    if (a.timedOut) m.timedOut++;
    byFact.set(a.q.key, m);
  }
  return [...byFact.values()].sort((x, y) => y.times - x.times || x.q.answer - y.q.answer);
}

export function formatClock(ms: number) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function formatSeconds(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`;
}
