import { z } from "zod";
import { getCaseAnyStatus, setCaseStatus } from "@/lib/game/case-store";
import { validateCase } from "@/lib/game/validate-case";
import { isAdmin } from "@/lib/auth/admin-session";

// PATCH /api/admin/cases/:caseId  { "status": "published" | "rejected" | "draft" }
// Admin only.

const bodySchema = z.object({ status: z.enum(["draft", "published", "rejected"]) });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  // Checked here as well as in proxy.ts, so this route is safe on its own.
  if (!(await isAdmin())) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  const { caseId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "status must be draft, published or rejected." }, { status: 400 });
  }
  const { status } = parsed.data;

  try {
    const found = await getCaseAnyStatus(caseId);
    if (!found) {
      return Response.json({ error: "Case not found." }, { status: 404 });
    }

    // Check again before players can see it: the case may have been edited in the database
    // since it was generated, or the rules may have changed.
    if (status === "published") {
      const result = validateCase(found.caseDef);
      if (!result.ok) {
        return Response.json(
          { error: "This case can't be published.", errors: result.errors },
          { status: 422 }
        );
      }
    }

    await setCaseStatus(caseId, status);
    return Response.json({ id: caseId, status });
  } catch (err) {
    console.error("Updating case status failed:", err);
    return Response.json({ error: "The database is unavailable right now." }, { status: 503 });
  }
}
