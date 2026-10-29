import Link from "next/link";

type Props = {
  href: string;
  label: string; // text on the folder tab, e.g. "Case No. 004"
  tilt?: number;
  children: React.ReactNode;
};

// A manila case folder: a tab on top, a paper body, and a slight lift on hover.
export default function CaseFolder({ href, label, tilt = 0, children }: Props) {
  return (
    <Link
      href={href}
      className="group relative block pt-6 transition duration-200 hover:-translate-y-1 focus-visible:-translate-y-1"
      style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}
    >
      {/* The folder tab */}
      <span className="absolute left-4 top-0 h-7 rounded-t-md bg-paper-300 px-4 pt-1 font-type text-xs uppercase tracking-widest text-ink-700 shadow-[0_-2px_6px_rgb(0_0_0/0.25)]">
        {label}
      </span>
      {/* The folder body */}
      <div className="paper relative h-full rounded-sm rounded-tl-none !bg-paper-200 p-6 transition group-hover:shadow-[0_18px_30px_rgb(0_0_0/0.55)]">
        {/* A paperclip on the edge */}
        <span
          aria-hidden="true"
          className="absolute -top-3 right-8 h-10 w-3.5 rounded-full border-[3px] border-slate-400/80 shadow-sm"
        />
        {children}
      </div>
    </Link>
  );
}
