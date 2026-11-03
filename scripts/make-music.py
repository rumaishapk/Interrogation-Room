#!/usr/bin/env python3
"""Generates the game's two original background loops into public/audio/.

    python3 scripts/make-music.py

Everything is synthesised from scratch with plain Python (no samples, no libraries),
so the music is original and has no licence to worry about. Both loops are 48 seconds
and wrap around seamlessly: notes that ring past the end continue at the start.

  home.wav          calm, smoky noir: slow D-minor jazz chords, a soft bass,
                    a few sparse electric-piano notes, rain and vinyl crackle.
  interrogation.wav tense: a low drone, a heartbeat that quickens, a ticking clock,
                    a dissonant pad and lonely low piano notes.

Change the notes below and run it again to rework the music.
"""
import math
import random
import struct
import wave
from pathlib import Path

SR = 22050  # sample rate: small files, plenty for moody background music
SECONDS = 48
OUT = Path(__file__).resolve().parent.parent / "public" / "audio"
TAU = 2 * math.pi


def freq(midi_note: float) -> float:
    return 440.0 * 2 ** ((midi_note - 69) / 12)


class Loop:
    """A mono buffer where anything that runs past the end wraps round to the start."""

    def __init__(self, seconds: int):
        self.n = seconds * SR
        self.buf = [0.0] * self.n

    def add(self, start_sec: float, samples: list[float], gain: float = 1.0) -> None:
        i0, n, buf = int(start_sec * SR), self.n, self.buf
        for k, v in enumerate(samples):
            buf[(i0 + k) % n] += v * gain


# ---------- Sound building blocks ----------

def pad(f: float, dur: float, attack: float, release: float) -> list[float]:
    """A soft sustained tone: two slightly detuned sines plus a quiet octave, slow fade in and out."""
    total = int((dur + release) * SR)
    out = []
    for i in range(total):
        t = i / SR
        env = min(1.0, t / attack)
        env = env * env * (3 - 2 * env)  # smooth S-curve
        if t > dur:
            tail = max(0.0, 1 - (t - dur) / release)
            env *= tail * tail * (3 - 2 * tail)
        out.append(
            env * (math.sin(TAU * f * t) + 0.6 * math.sin(TAU * f * 1.004 * t) + 0.25 * math.sin(TAU * 2 * f * t))
        )
    return out


def pluck(f: float, dur: float, decay: float, harmonics) -> list[float]:
    """A struck note (bass, electric piano): quick attack, exponential fade."""
    total = int(dur * SR)
    out = []
    for i in range(total):
        t = i / SR
        env = math.exp(-t / decay) * min(1.0, t / 0.006)
        out.append(env * sum(a * math.sin(TAU * f * h * t) for h, a in harmonics))
    return out


def thump(dur: float = 0.4, f_start: float = 95, f_end: float = 38) -> list[float]:
    """A heartbeat / kick: a sine that drops quickly in pitch."""
    out, phase = [], 0.0
    for i in range(int(dur * SR)):
        t = i / SR
        f = f_end + (f_start - f_end) * math.exp(-t / 0.035)
        phase += TAU * f / SR
        out.append(math.sin(phase) * math.exp(-t / 0.09))
    return out


def tick(rng: random.Random) -> list[float]:
    """A clock tick: a few milliseconds of bright noise."""
    n = int(0.012 * SR)
    noise = [rng.uniform(-1, 1) for _ in range(n + 1)]
    return [(noise[i + 1] - noise[i]) * math.exp(-i / (0.003 * SR)) for i in range(n)]


def add_texture(loop: Loop, rng: random.Random, rain: float, crackle_per_sec: float, crackle: float) -> None:
    """Steady background hiss (like distant rain) and occasional vinyl pops."""
    low = 0.0
    for i in range(loop.n):
        low += 0.02 * (rng.uniform(-1, 1) - low)  # low-passed noise
        loop.buf[i] += low * rain
    for _ in range(int(crackle_per_sec * SECONDS)):
        i = rng.randrange(loop.n)
        loop.buf[i] += rng.choice((-1, 1)) * crackle * rng.uniform(0.3, 1.0)


# ---------- Finishing: room, softening, saving ----------

def reverb(buf: list[float], wet: float) -> list[float]:
    """A simple room: four echo loops. Run twice round the circle so the tail wraps seamlessly."""
    n = len(buf)
    combs = []
    for delay_sec, feedback in ((0.0297, 0.80), (0.0371, 0.79), (0.0411, 0.78), (0.0437, 0.77)):
        d = int(delay_sec * SR)
        y = [0.0] * n
        for _ in range(2):
            for i in range(n):
                y[i] = buf[i] + feedback * y[i - d]  # negative index wraps round
        combs.append(y)
    return [buf[i] + wet * 0.25 * sum(c[i] for c in combs) for i in range(n)]


def soften(buf: list[float], cutoff_hz: float) -> list[float]:
    """Gently rolls off the harsh high end (a one-pole low-pass filter)."""
    alpha = 1 - math.exp(-TAU * cutoff_hz / SR)
    y, state = [0.0] * len(buf), 0.0
    for _ in range(2):  # second pass starts from where the first ended, so the loop point is smooth
        for i, v in enumerate(buf):
            state += alpha * (v - state)
            y[i] = state
    return y


def save(name: str, buf: list[float]) -> None:
    peak = max(abs(v) for v in buf) or 1.0
    scale = 0.8 / peak
    OUT.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT / name), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(b"".join(struct.pack("<h", int(max(-1.0, min(1.0, v * scale)) * 32767)) for v in buf))
    print(f"wrote {OUT / name}")


# ---------- Track 1: home (calm noir) ----------

def make_home() -> None:
    rng = random.Random(7)
    loop = Loop(SECONDS)
    bar = 4.0  # 60 beats per minute, four beats per bar: 12 bars = 48 seconds

    # (chord notes as MIDI numbers, bass root). Dm7, Bbmaj7, Gm7 and A7(b9): the classic noir sound.
    dm7 = ([50, 53, 57, 60], 38)
    bbmaj7 = ([46, 50, 53, 57], 34)
    gm7 = ([55, 58, 62, 65], 43)
    a7 = ([57, 61, 64, 67, 70], 45)
    bars = [dm7, dm7, bbmaj7, bbmaj7, gm7, a7, dm7, dm7, bbmaj7, a7, gm7, a7]
    scale = [62, 65, 67, 69, 72, 74, 77]  # D F G A C D F: where the piano notes come from
    piano = ((1, 1.0), (2, 0.4), (3, 0.1), (5, 0.05))
    bass_tone = ((1, 1.0), (2, 0.45), (3, 0.2))

    for b, (chord, root) in enumerate(bars):
        start = b * bar
        for note in chord:
            loop.add(start, pad(freq(note), bar, 1.2, 2.0), 0.07)
        loop.add(start, pluck(freq(root), 3.0, 1.0, bass_tone), 0.30)  # beat 1: the root
        loop.add(start + 2.0, pluck(freq(root + 7), 2.5, 0.8, bass_tone), 0.20)  # beat 3: the fifth
        # A few lonely piano notes, never more than two a bar.
        for offset in rng.sample([0.5, 1.5, 2.5, 3.0], k=rng.choice((0, 1, 1, 2))):
            loop.add(start + offset, pluck(freq(rng.choice(scale)), 3.0, 1.5, piano), 0.13)

    add_texture(loop, rng, rain=0.045, crackle_per_sec=6, crackle=0.05)
    save("home.wav", soften(reverb(loop.buf, wet=0.35), cutoff_hz=3500))


# ---------- Track 2: interrogation (tense) ----------

def make_interrogation() -> None:
    rng = random.Random(13)
    loop = Loop(SECONDS)
    beat = 0.75  # 80 beats per minute
    bar = beat * 4  # 16 bars = 48 seconds

    # The low drone runs the whole time. These frequencies fit a whole number of
    # cycles into 48 seconds, so the sound joins up cleanly when the loop restarts.
    for f, gain in ((55.0, 0.30), (55.5, 0.20), (82.5, 0.12), (110.0, 0.10)):
        loop.add(0, [math.sin(TAU * f * i / SR) for i in range(loop.n)], gain)
    # Make the drone swell and fall once every 12 seconds.
    for i in range(loop.n):
        loop.buf[i] *= 0.75 + 0.25 * math.sin(TAU * i / SR / 12.0)

    # A dissonant pad that changes every four bars, with the semitone clash left in on purpose.
    sections = [[57, 58, 60, 64], [57, 60, 63, 66], [56, 59, 60, 64], [57, 58, 60, 64]]
    for s, chord in enumerate(sections):
        for note in chord:
            loop.add(s * 4 * bar, pad(freq(note), 4 * bar, 3.0, 4.0), 0.045)

    # Heartbeat: lub-dub at the start of every bar, doubled in the second half so the pulse quickens.
    for b in range(16):
        starts = [b * bar] + ([b * bar + 1.5] if b >= 8 else [])
        for t in starts:
            loop.add(t, thump(), 0.55)
            loop.add(t + 0.32, thump(0.3, 80, 40), 0.32)

    # A ticking clock on every beat, "tock" a little softer than "tick".
    for k in range(int(SECONDS / beat)):
        loop.add(k * beat, tick(rng), 0.10 if k % 2 == 0 else 0.06)

    # Sparse low piano notes, and one thin high note that rises out of the quiet.
    piano = ((1, 1.0), (2, 0.5), (3, 0.25), (4, 0.12))
    for b, note in ((2, 45), (6, 48), (9, 46), (11, 45), (14, 40)):
        loop.add(b * bar + 0.0, pluck(freq(note), 4.0, 2.2, piano), 0.20)
    loop.add(8 * bar, pad(1318.5, 5 * beat, 4.0, 5.0), 0.012)

    add_texture(loop, rng, rain=0.02, crackle_per_sec=1, crackle=0.03)
    save("interrogation.wav", soften(reverb(loop.buf, wet=0.40), cutoff_hz=4500))


if __name__ == "__main__":
    make_home()
    make_interrogation()
