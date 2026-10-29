// An ornate brass title plate, for big headings.
export default function Plaque({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative inline-block ${className}`}>
      {/* Outer brass frame */}
      <div className="rounded-md bg-gradient-to-b from-brass-300 via-brass-500 to-brass-700 p-[3px] shadow-[0_12px_30px_rgb(0_0_0/0.55)]">
        {/* Inner cream plate */}
        <div className="rounded-[4px] border border-brass-700/50 bg-gradient-to-b from-paper-50 to-paper-200 px-6 py-3 md:px-10 md:py-4">
          {children}
        </div>
      </div>
      {/* Little screws in the corners */}
      {["left-1.5 top-1.5", "right-1.5 top-1.5", "bottom-1.5 left-1.5", "bottom-1.5 right-1.5"].map((pos) => (
        <span
          key={pos}
          aria-hidden="true"
          className={`absolute h-1.5 w-1.5 rounded-full bg-brass-700 shadow-[inset_0_1px_0_#dcb877] ${pos}`}
        />
      ))}
    </div>
  );
}
