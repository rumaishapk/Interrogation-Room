import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/next-path";
import { buildGoogleAuthUrl, CALLBACK_PATH, newOAuthFlow } from "@/lib/auth/google-oauth";
import { getGoogleConfig, OAUTH_FLOW_COOKIE, OAUTH_FLOW_MAX_AGE } from "@/lib/auth/google";

// Step 1 of "Continue with Google": remember who we sent away, then send them to Google.
export async function GET(request: NextRequest) {
  const config = getGoogleConfig();
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  if (!config) redirect(`/login?error=google_unavailable&next=${encodeURIComponent(next)}`);

  const flow = newOAuthFlow(next);
  const redirectUri = `${request.nextUrl.origin}${CALLBACK_PATH}`;

  (await cookies()).set(OAUTH_FLOW_COOKIE, JSON.stringify(flow), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // must be lax, not strict: Google's redirect back is a cross-site navigation
    path: "/auth/google",
    maxAge: OAUTH_FLOW_MAX_AGE,
  });

  redirect(buildGoogleAuthUrl(flow, config.clientId, redirectUri));
}
