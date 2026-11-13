"use client";

import React, { useCallback, useState } from "react";
import { generateQuestions, Question } from "@/lib/questions";
import { loadSettings, saveSettings, Settings } from "@/lib/settings";
import type { Answer } from "@/lib/session";
import { Setup } from "./setup";
import { Drill } from "./drill";
import { Results } from "./results";

type Screen =
  | { kind: "setup" }
  | { kind: "drill"; id: number; questions: Question[] }
  | { kind: "results"; answers: Answer[]; planned: number; ended: boolean };

/** Setup → drill → results, and round again. */
export function Trainer() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [screen, setScreen] = useState<Screen>({ kind: "setup" });

  const change = (s: Settings) => {
    setSettings(s);
    saveSettings(s);
  };

  // A fresh shuffle every time, even when going again with the same settings.
  const start = useCallback(() => {
    setScreen({ kind: "drill", id: Date.now(), questions: generateQuestions(settings.tables, settings.count) });
  }, [settings]);

  const toSetup = useCallback(() => setScreen({ kind: "setup" }), []);

  const finish = useCallback((answers: Answer[], ended: boolean) => {
    setScreen(prev =>
      prev.kind !== "drill" || answers.length === 0
        ? { kind: "setup" }
        : { kind: "results", answers, planned: prev.questions.length, ended }
    );
  }, []);

  if (screen.kind === "drill") return <Drill key={screen.id} questions={screen.questions} timer={settings.timer} onDone={finish} />;
  if (screen.kind === "results")
    return <Results answers={screen.answers} planned={screen.planned} ended={screen.ended} onAgain={start} onSettings={toSetup} />;
  return <Setup settings={settings} onChange={change} onStart={start} />;
}
