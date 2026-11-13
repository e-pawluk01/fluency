// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_TABLES, factsFor, generateQuestions, type Question, type Rng } from "./questions.ts";

/** Small seeded RNG so failures can be reproduced. */
function seeded(seed: number): Rng {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random subsets of the tables, from one table up to all twelve. */
function tableSets(rng: Rng, n: number): number[][] {
  const sets: number[][] = [[1], [7], [12], [7, 8], [3, 4], [2, 4, 6, 8], ALL_TABLES];
  while (sets.length < n) {
    const s = ALL_TABLES.filter(() => rng() < 0.4);
    if (s.length) sets.push(s);
  }
  return sets;
}

const RUNS: { tables: number[]; count: number; seed: number; qs: Question[] }[] = [];
{
  const meta = seeded(42);
  for (const tables of tableSets(meta, 120)) {
    for (const count of [10, 25, 100, 250]) {
      const seed = Math.floor(meta() * 1e9);
      RUNS.push({ tables, count, seed, qs: generateQuestions(tables, count, seeded(seed)) });
    }
  }
}
const label = (r: (typeof RUNS)[number]) => `tables ${r.tables.join(",")} × ${r.count}, seed ${r.seed}`;

test("pool counts 7×8 and 8×7 once", () => {
  assert.equal(factsFor([1]).length, 12);
  assert.equal(factsFor([7, 8]).length, 23); // 24 minus the shared 7×8
  assert.equal(factsFor(ALL_TABLES).length, 78); // 12·13/2
});

test("gives exactly the number of questions asked for, all correct", () => {
  for (const r of RUNS) {
    assert.equal(r.qs.length, r.count, label(r));
    for (const q of r.qs) {
      assert.equal(q.answer, q.left * q.right);
      assert.ok(r.tables.includes(q.left) || r.tables.includes(q.right), `${q.left}×${q.right} not in ${label(r)}`);
    }
  }
});

test("every fact comes up once before any comes up again", () => {
  for (const r of RUNS) {
    const size = factsFor(r.tables).length;
    for (let start = 0; start < r.qs.length; start += size) {
      const pass = r.qs.slice(start, start + size).map(q => q.key);
      assert.equal(new Set(pass).size, pass.length, `repeat inside one pass: ${label(r)}`);
    }
  }
});

test("every fact is asked an even share of times (never 2+ more than another)", () => {
  for (const r of RUNS) {
    const counts = new Map<string, number>();
    for (const q of r.qs) counts.set(q.key, (counts.get(q.key) ?? 0) + 1);
    const size = factsFor(r.tables).length;
    const lo = Math.floor(r.count / size), hi = Math.ceil(r.count / size);
    for (const [key, c] of counts) assert.ok(c >= lo && c <= hi, `${key} asked ${c}× (want ${lo}–${hi}): ${label(r)}`);
  }
});

test("a fact never comes back within half a pool (no 8×7 then 7×8 across passes)", () => {
  let tightest = Infinity;
  for (const r of RUNS) {
    const gap = Math.floor(factsFor(r.tables).length / 2);
    const lastSeen = new Map<string, number>();
    r.qs.forEach((q, i) => {
      const prev = lastSeen.get(q.key);
      if (prev !== undefined) {
        assert.ok(i - prev > gap, `${q.key} again after ${i - prev} (min ${gap + 1}): ${label(r)}`);
        tightest = Math.min(tightest, i - prev);
      }
      lastSeen.set(q.key, i);
    });
  }
  assert.ok(tightest >= 7, `closest repeat was ${tightest} apart`);
});

test("the same answer twice in a row is rare and only forced at the end of a pass", () => {
  let pairs = 0, clashes = 0;
  for (const r of RUNS) {
    for (let i = 1; i < r.qs.length; i++) {
      pairs++;
      if (r.qs[i].answer === r.qs[i - 1].answer) clashes++;
    }
  }
  assert.ok(clashes / pairs < 0.002, `${clashes} of ${pairs} back-to-back answers matched`);
});

test("stepping stones (7×3 then 7×4) are rare where they can be avoided", () => {
  // With many tables there's almost always another choice.
  let pairs = 0, steps = 0;
  for (const r of RUNS.filter(r => r.tables.length >= 4)) {
    for (let i = 1; i < r.qs.length; i++) {
      pairs++;
      const a = r.qs[i - 1], b = r.qs[i];
      const shared = [a.left, a.right].find(x => x === b.left || x === b.right);
      if (shared === undefined) continue;
      const ao = a.left === shared ? a.right : a.left;
      const bo = b.left === shared ? b.right : b.left;
      if (Math.abs(ao - bo) === 1) steps++;
    }
  }
  assert.ok(steps / pairs < 0.01, `${steps} of ${pairs} were stepping stones`);
});

test("which way round a fact is shown is a fair coin", () => {
  let lowFirst = 0, total = 0;
  for (const r of RUNS) {
    for (const q of r.qs) {
      if (q.left === q.right) continue;
      total++;
      if (q.left < q.right) lowFirst++;
    }
  }
  const share = lowFirst / total;
  assert.ok(share > 0.48 && share < 0.52, `low number first ${(share * 100).toFixed(1)}% of the time`);
});

test("default crypto RNG works and differs run to run", () => {
  const a = generateQuestions(ALL_TABLES, 50).map(q => `${q.left}x${q.right}`).join();
  const b = generateQuestions(ALL_TABLES, 50).map(q => `${q.left}x${q.right}`).join();
  assert.notEqual(a, b);
});

test("nothing chosen gives no questions", () => {
  assert.deepEqual(generateQuestions([], 10), []);
  assert.deepEqual(generateQuestions([5], 0), []);
});
