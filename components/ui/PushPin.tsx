// A red push pin. Decorative only, so screen readers skip it.
export default function PushPin({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`pointer-events-none h-6 w-6 drop-shadow-[0_3px_2px_rgb(0_0_0/0.5)] ${className}`}
    >
      <circle cx="12" cy="11" r="7" fill="#5e1718" />
      <circle cx="12" cy="10" r="7" fill="#9e2a2b" />
      <circle cx="9.5" cy="7.5" r="2.2" fill="#fff" opacity="0.45" />
    </svg>
  );
}
