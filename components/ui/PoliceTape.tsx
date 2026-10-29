// A strip of "POLICE LINE — DO NOT CROSS" tape. Decorative only.
export default function PoliceTape({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`police-tape pointer-events-none flex h-9 items-center overflow-hidden whitespace-nowrap shadow-[0_6px_14px_rgb(0_0_0/0.5)] ${className}`}
    >
      <span className="w-full bg-tape-400 py-1 text-center font-display text-sm font-black uppercase tracking-[0.35em] text-walnut-950">
        {"Police line · Do not cross · ".repeat(8)}
      </span>
    </div>
  );
}
