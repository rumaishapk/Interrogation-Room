// A head-and-shoulders silhouette in a fedora, used when there's no photo.
// Decorative: the caller supplies the accessible name (e.g. the person's name nearby).
export default function Silhouette({ initials, className = "" }: { initials?: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-b from-paper-200 to-paper-300 ${className}`}>
      <svg aria-hidden="true" viewBox="0 0 100 120" className="absolute inset-0 h-full w-full">
        {/* shoulders and coat */}
        <path d="M8 120 C12 88 30 80 50 80 C70 80 88 88 92 120 Z" fill="#4a3a2c" />
        <path d="M42 82 L50 100 L58 82 Z" fill="#e6d3a8" />
        {/* head */}
        <ellipse cx="50" cy="56" rx="17" ry="20" fill="#4a3a2c" />
        {/* fedora */}
        <ellipse cx="50" cy="40" rx="30" ry="6" fill="#2a1f17" />
        <path d="M33 40 C33 22 40 16 50 16 C60 16 67 22 67 40 Z" fill="#2a1f17" />
        <rect x="33" y="33" width="34" height="5" fill="#9e2a2b" />
      </svg>
      {initials && (
        <span className="absolute bottom-1 right-2 font-type text-sm tracking-widest text-paper-50/90">
          {initials}
        </span>
      )}
    </div>
  );
}
