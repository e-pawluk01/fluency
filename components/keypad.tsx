"use client";

import React from "react";
import { Delete } from "lucide-react";
import { cn } from "./ui";

export type Key = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "back";
const LAYOUT: (Key | null)[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", null, "0", "back"];

/**
 * On-screen number pad for phones, so the system keyboard never pops up.
 * Fires on touch-down rather than on release, which is noticeably quicker.
 */
export function Keypad({ onKey, className }: { onKey: (k: Key) => void; className?: string }) {
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {LAYOUT.map(k =>
        k === null ? (
          <span key="blank" />
        ) : (
          <button
            key={k}
            type="button"
            aria-label={k === "back" ? "Delete" : k}
            onPointerDown={e => {
              e.preventDefault();
              onKey(k);
            }}
            // Keyboard activation (Enter/Space on a focused key) has no pointer-down.
            onClick={e => {
              if (e.detail === 0) onKey(k);
            }}
            className={cn(
              "h-16 flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]",
              "text-2xl font-medium tabular-nums text-white select-none",
              "transition-colors duration-75 active:bg-white active:text-black active:border-white"
            )}
          >
            {k === "back" ? <Delete className="w-6 h-6" strokeWidth={1.75} /> : k}
          </button>
        )
      )}
    </div>
  );
}
