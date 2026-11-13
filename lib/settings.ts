import { ALL_TABLES } from "./questions";

export interface Settings {
  /** Which times tables to mix, 1–12. */
  tables: number[];
  /** How many questions in a run. */
  count: number;
  /** Seconds per question; 0 means no timer. */
  timer: number;
}

export const COUNT_PRESETS = [10, 25, 50, 100];
export const TIMER_PRESETS = [0, 3, 5, 10];
export const COUNT_LIMIT = { min: 1, max: 500 };
export const TIMER_LIMIT = { min: 1, max: 60 };

const DEFAULTS: Settings = { tables: ALL_TABLES, count: 25, timer: 0 };
const KEY = "fluency-settings";

const clamp = (n: number, { min, max }: { min: number; max: number }) => Math.min(max, Math.max(min, Math.round(n)));

export function loadSettings(): Settings {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (!raw) return DEFAULTS;
    const tables = Array.isArray(raw.tables) ? ALL_TABLES.filter(t => raw.tables.includes(t)) : DEFAULTS.tables;
    return {
      tables: tables.length ? tables : DEFAULTS.tables,
      count: Number.isFinite(raw.count) ? clamp(raw.count, COUNT_LIMIT) : DEFAULTS.count,
      timer: raw.timer === 0 ? 0 : Number.isFinite(raw.timer) ? clamp(raw.timer, TIMER_LIMIT) : DEFAULTS.timer,
    };
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode etc. — settings just won't stick */
  }
}

export function clampCount(n: number) {
  return clamp(n, COUNT_LIMIT);
}

export function clampTimer(n: number) {
  return clamp(n, TIMER_LIMIT);
}
