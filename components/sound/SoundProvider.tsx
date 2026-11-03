"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  FADE_STEP,
  MUSIC_VOLUME,
  TICK_MS,
  TRACK_FILES,
  TRACK_NAMES,
  stepToward,
  trackForPath,
  type TrackName,
} from "@/lib/sound/tracks";
import { isClickTarget, playClick } from "./click-sound";
import { setSoundEnabled, useSoundEnabled } from "./sound-preference";

const GESTURES = ["pointerup", "click", "keydown"] as const;

// Lives in the root layout, so the music keeps playing while players move between pages.
export default function SoundProvider() {
  const pathname = usePathname();
  const enabled = useSoundEnabled();
  const track = trackForPath(pathname);

  useMusic(enabled, track);
  useClickSounds(enabled && track !== null);

  if (track === null) return null; // admin pages: silent, no control
  return <SoundToggle enabled={enabled} />;
}

// One listener for the whole site: every button and link clicks, with nothing to add
// to individual buttons. Capture phase, so it also fires when a component stops the click.
function useClickSounds(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const onClick = (event: MouseEvent) => {
      if (isClickTarget(event.target)) playClick();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [active]);
}

// Plays the right track, fading between tracks and in/out when sound is switched.
function useMusic(enabled: boolean, track: TrackName | null) {
  const audios = useRef(new Map<TrackName, HTMLAudioElement>());
  const broken = useRef(new Set<TrackName>()); // files that are missing or can't be decoded

  useEffect(() => {
    const players = audios.current;
    const unusable = broken.current;
    let timer: number | undefined;
    let blocked = false; // the browser refused to play until the player interacts

    // Created only when first needed, so the other track's file isn't downloaded for nothing.
    const playerFor = (name: TrackName) => {
      let audio = players.get(name);
      if (!audio) {
        audio = new Audio(TRACK_FILES[name]);
        audio.loop = true;
        audio.volume = 0;
        audio.addEventListener("error", () => unusable.add(name)); // no file yet: stay silent
        players.set(name, audio);
      }
      return audio;
    };

    const tick = () => {
      let settled = true;
      for (const name of TRACK_NAMES) {
        const shouldPlay = enabled && track === name && !document.hidden && !unusable.has(name) && !blocked;
        const target = shouldPlay ? MUSIC_VOLUME : 0;
        const audio = shouldPlay ? playerFor(name) : players.get(name);
        if (!audio) continue;

        if (shouldPlay && audio.paused) {
          audio.play().catch((err: unknown) => {
            const reason = (err as { name?: string }).name;
            if (reason === "NotAllowedError") waitForGesture();
            // Paused or switched while still loading: not a problem, the next tick tries again.
            else if (reason !== "AbortError") unusable.add(name); // e.g. NotSupportedError: no such file
          });
        }
        audio.volume = document.hidden ? target : stepToward(audio.volume, target, FADE_STEP);
        if (target === 0 && audio.volume === 0 && !audio.paused) audio.pause();
        if (audio.volume !== target || (target === 0 && !audio.paused)) settled = false;
      }
      if (settled) stop();
    };

    const start = () => {
      timer ??= window.setInterval(tick, TICK_MS);
      tick();
    };
    const stop = () => {
      window.clearInterval(timer);
      timer = undefined;
    };

    // A remembered "on" can't start by itself on a fresh page load. Wait for the
    // first tap, click or key press, then begin. (Touch screens count the lifting of the
    // finger, not the touch-down, as permission to play sound.)
    const onGesture = () => {
      blocked = false;
      start();
    };
    const waitForGesture = () => {
      if (blocked) return;
      blocked = true;
      stop();
      for (const type of GESTURES) window.addEventListener(type, onGesture, { once: true });
    };

    start();
    document.addEventListener("visibilitychange", start); // pause in a hidden tab, resume on return
    return () => {
      // Only stop the timer. The audio keeps fading out/in if the next effect carries on.
      stop();
      document.removeEventListener("visibilitychange", start);
      for (const type of GESTURES) window.removeEventListener(type, onGesture);
    };
  }, [enabled, track]);

  // When the whole layout goes away, stop everything.
  useEffect(() => {
    const players = audios.current;
    return () => players.forEach((audio) => audio.pause());
  }, []);
}

// A small brass plate, bottom-left of every player page.
function SoundToggle({ enabled }: { enabled: boolean }) {
  return (
    <button
      type="button"
      onClick={() => {
        setSoundEnabled(!enabled);
        // Switching ON: the global listener isn't active yet, so confirm with a click here.
        // (Switching OFF already clicked through the global listener.)
        if (!enabled) playClick();
      }}
      className={`fixed bottom-4 left-4 z-50 inline-flex items-center gap-2 rounded-sm border px-3 py-2 font-type text-xs uppercase tracking-widest outline-offset-2 transition focus-visible:outline-2 focus-visible:outline-lamp-300 print:hidden ${
        enabled
          ? "border-brass-700 bg-gradient-to-b from-brass-300 to-brass-500 text-walnut-950 shadow-[0_2px_0_#7d5a22,0_8px_18px_rgb(0_0_0/0.45)] hover:from-lamp-300 hover:to-brass-300"
          : "border-brass-500/50 bg-walnut-900/90 text-brass-300/80 shadow-[0_8px_18px_rgb(0_0_0/0.45)] hover:border-brass-500 hover:text-lamp-300"
      }`}
    >
      <SpeakerIcon muted={!enabled} />
      Sound: {enabled ? "On" : "Off"}
    </button>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" />
      {muted ? (
        <path d="m16 9 5 6m0-6-5 6" />
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </>
      )}
    </svg>
  );
}
