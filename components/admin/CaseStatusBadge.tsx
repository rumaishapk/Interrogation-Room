import type { CaseStatus } from "@/lib/game/types";
import Stamp from "@/components/ui/Stamp";

const tones = { draft: "ink", published: "green", rejected: "red" } as const;

// A case's status, as a rubber stamp (for use on paper).
export default function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return (
    <Stamp tone={tones[status]} rotate={-3}>
      {status}
    </Stamp>
  );
}
