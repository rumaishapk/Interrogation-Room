type Tone = "red" | "ink" | "green" | "brass";

const tones: Record<Tone, string> = {
  red: "border-evidence-600 text-evidence-600",
  ink: "border-ink-700 text-ink-700",
  green: "border-moss-600 text-moss-600",
  brass: "border-brass-500 text-brass-300",
};

type Props = {
  children: React.ReactNode;
  tone?: Tone;
  rotate?: number; // degrees
  size?: "sm" | "lg";
  animate?: boolean; // "thump" onto the page (the verdict)
  className?: string;
};

// A rubber stamp: a rough-edged, tilted label in ink.
export default function Stamp({ children, tone = "red", rotate = -6, size = "sm", animate = false, className = "" }: Props) {
  const sizing = size === "lg" ? "border-4 px-5 py-2 text-2xl md:text-4xl" : "border-2 px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-block rounded-sm font-type uppercase tracking-[0.2em] opacity-90 mix-blend-multiply ${sizing} ${tones[tone]} ${animate ? "animate-stamp" : ""} ${className}`}
      style={{ transform: `rotate(${rotate}deg)`, ["--stamp-rotate" as string]: `${rotate}deg` }}
    >
      {children}
    </span>
  );
}
