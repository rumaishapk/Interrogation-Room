"use client";
// The player's sound choice, remembered in this browser (localStorage).
// Off by default: browsers block sound until the player interacts anyway, and
// sound that starts by itself annoys people.
import { useSyncExternalStore } from "react";

const KEY = "sound_enabled";
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback); // changed in another tab
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function readEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false; // storage blocked (private mode, strict settings): stay off
  }
}

export function setSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(KEY, enabled ? "1" : "0");
  } catch {
    // Can't remember the choice, but it still works until the page closes. This copy
    // wins over anything still stored, otherwise turning sound off could be ignored.
    memoryFallback = enabled;
  }
  listeners.forEach((callback) => callback());
}

// Only set when writing to localStorage failed. null = nothing to override.
let memoryFallback: boolean | null = null;

// The server always renders "off"; the browser then switches to the saved choice
// without a hydration mismatch.
export function useSoundEnabled(): boolean {
  return useSyncExternalStore(subscribe, () => memoryFallback ?? readEnabled(), () => false);
}
