import PushPin from "./PushPin";

type Props = {
  children: React.ReactNode;
  className?: string;
  // A slight tilt (in degrees) makes cards look placed by hand. Keep it within ±3.
  tilt?: number;
  // Decoration at the top: a push pin, a strip of tape, or nothing.
  fastener?: "pin" | "tape" | "none";
  as?: "div" | "article" | "section" | "li";
};

// A sheet of aged paper: the basic surface for case files, notes and forms.
export default function PaperCard({ children, className = "", tilt = 0, fastener = "none", as: Tag = "div" }: Props) {
  return (
    <Tag className={`paper relative rounded-sm ${className}`} style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}>
      {fastener === "pin" && <PushPin className="absolute -top-3 left-1/2 -translate-x-1/2" />}
      {fastener === "tape" && (
        <span
          aria-hidden="true"
          className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-2 bg-paper-50/60 shadow-sm backdrop-blur-[1px]"
        />
      )}
      {children}
    </Tag>
  );
}
