/**
 * Question generator for times-table drills.
 *
 * The unit of practice is a *fact*, not a question: 7 × 8 and 8 × 7 are the
 * same fact, so the pool only holds each unordered pair once. Which way round
 * it's shown is picked fresh each time it comes up.
 *
 * Facts are drawn from a shuffled bag: every fact in the pool comes up once
 * before any of them comes up again, so 100 questions over 23 facts is 4 full
 * passes plus part of a fifth, and no fact is asked more than once more than
 * any other.
 *
 * On top of that, each draw avoids (strongest first):
 *   1. A fact asked in the last half-pool of questions. This stops the end of
 *      one pass and the start of the next butting up (… 8 × 7 | 7 × 8 …).
 *   2. The same answer as either of the last two questions (3 × 8 then 4 × 6).
 *   3. A stepping stone from the last question: shares a number and the other
 *      differs by one (7 × 3 then 7 × 4, or 7 × 3 then 8 × 3), where you could
 *      add on instead of recalling.
 * Among the draws that break the fewest of these, one is picked at random.
 */

export const MIN = 1;
export const MAX = 12;
export const ALL_TABLES = Array.from({ length: MAX - MIN + 1 }, (_, i) => MIN + i);

/** An unordered pair, stored low-high: { lo: 7, hi: 8 } is both 7 × 8 and 8 × 7. */
export interface Fact {
  lo: number;
  hi: number;
}

export interface Question {
  /** "7x8", the same whichever way round it's shown. */
  key: string;
  left: number;
  right: number;
  answer: number;
}

/** Returns a float in [0, 1). */
export type Rng = () => number;

/** Uses the browser's (or Node's) cryptographic RNG, not Math.random. */
export const cryptoRng: Rng = () => {
  const buf = new Uint32Array(2);
  globalThis.crypto.getRandomValues(buf);
  // 53 random bits, so floor(rng() * n) has no visible bias for small n.
  return (buf[0] * 2 ** 21 + (buf[1] >>> 11)) / 2 ** 53;
};

const randInt = (n: number, rng: Rng) => Math.floor(rng() * n);

export const factKey = (f: Fact) => `${f.lo}x${f.hi}`;

/** Every distinct fact covered by the chosen tables, each pair once. */
export function factsFor(tables: number[]): Fact[] {
  const seen = new Map<string, Fact>();
  for (const t of tables) {
    for (let m = MIN; m <= MAX; m++) {
      const f = { lo: Math.min(t, m), hi: Math.max(t, m) };
      seen.set(factKey(f), f);
    }
  }
  return [...seen.values()];
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1, rng);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 7 × 3 → 7 × 4 or 7 × 3 → 8 × 3: shares a number, and the other is one off. */
function isStep(prev: Fact, next: Fact): boolean {
  for (const x of [prev.lo, prev.hi]) {
    if (next.lo !== x && next.hi !== x) continue;
    const prevOther = prev.lo === x ? prev.hi : prev.lo;
    const nextOther = next.lo === x ? next.hi : next.lo;
    if (Math.abs(prevOther - nextOther) === 1) return true;
  }
  return false;
}

function penalty(f: Fact, history: Fact[], gap: number): number {
  let p = 0;
  const n = history.length;
  for (let i = Math.max(0, n - gap); i < n; i++) {
    if (history[i].lo === f.lo && history[i].hi === f.hi) { p += 1000; break; }
  }
  const answer = f.lo * f.hi;
  for (let i = Math.max(0, n - 2); i < n; i++) {
    if (history[i].lo * history[i].hi === answer) { p += 100; break; }
  }
  if (n > 0 && isStep(history[n - 1], f)) p += 10;
  return p;
}

/**
 * Builds a run of `count` questions over the chosen tables.
 * `rng` is only swappable so tests can be repeatable.
 */
export function generateQuestions(tables: number[], count: number, rng: Rng = cryptoRng): Question[] {
  const pool = factsFor(tables);
  if (pool.length === 0 || count <= 0) return [];

  // How far back a fact counts as "just asked". Half the pool always leaves
  // something fresh to draw, so this never paints the bag into a corner.
  const gap = Math.floor(pool.length / 2);

  const history: Fact[] = [];
  const questions: Question[] = [];
  let bag: Fact[] = [];

  for (let q = 0; q < count; q++) {
    if (bag.length === 0) bag = shuffle(pool, rng);

    let best = Infinity;
    let ties: number[] = [];
    for (let i = 0; i < bag.length; i++) {
      const p = penalty(bag[i], history, gap);
      if (p < best) { best = p; ties = [i]; }
      else if (p === best) ties.push(i);
    }
    const [fact] = bag.splice(ties[randInt(ties.length, rng)], 1);
    history.push(fact);

    const flip = fact.lo !== fact.hi && rng() < 0.5;
    questions.push({
      key: factKey(fact),
      left: flip ? fact.hi : fact.lo,
      right: flip ? fact.lo : fact.hi,
      answer: fact.lo * fact.hi,
    });
  }
  return questions;
}
