import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/next-path";
import { startPlayerSession } from "@/lib/auth/player-session";
import { checkGoogleIdToken, CALLBACK_PATH, oauthFlowSchema, sameSecret } from "@/lib/auth/google-oauth";
import {
  exchangeCodeForIdToken,
  findUserIdByGoogleSub,
  getGoogleConfig,
  OAUTH_FLOW_COOKIE,
  startPendingGoogleSignup,
} from "@/lib/auth/google";

const failedUrl = (next: string, reason: string) =>
  `/login?error=${reason}&next=${encodeURIComponent(next)}`;

// Step 2: Google sends the player back here with ?code=...&state=...
export async function GET(request: NextRequest) {
  const config = getGoogleConfig();
  if (!config) redirect(failedUrl("/cases", "google_unavailable"));

  // Read and immediately delete the flow cookie: each login attempt can be finished once.
  const cookieStore = await cookies();
  const raw = cookieStore.get(OAUTH_FLOW_COOKIE)?.value;
  cookieStore.delete({ name: OAUTH_FLOW_COOKIE, path: "/auth/google" });

  let flow;
  try {
    flow = oauthFlowSchema.parse(JSON.parse(raw ?? ""));
  } catch {
    // No cookie (expired, or the player opened this URL directly) or a tampered one.
    redirect(failedUrl("/cases", "google_failed"));
  }
  const next = safeNextPath(flow.next);

  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  // The player pressed "Cancel" at Google (error=access_denied) or Google reported a problem.
  if (params.get("error")) redirect(failedUrl(next, "google_cancelled"));
  // A wrong state means this return wasn't started by this browser: possible forged login.
  if (!code || !state || !sameSecret(state, flow.state)) redirect(failedUrl(next, "google_failed"));

  // Network calls can throw, and redirect() works by throwing, so keep it outside try/catch.
  let destination: string;
  try {
    const redirectUri = `${request.nextUrl.origin}${CALLBACK_PATH}`;
    const idToken = await exchangeCodeForIdToken(code, flow.verifier, redirectUri, config);
    const identity = checkGoogleIdToken(idToken, { clientId: config.clientId, nonce: flow.nonce });
    if (!identity) {
      console.error("Google sign-in rejected: ID token failed checks.");
      destination = failedUrl(next, "google_failed");
    } else {
      const userId = await findUserIdByGoogleSub(identity.sub);
      if (userId) {
        await startPlayerSession(userId);
        destination = next;
      } else {
        await startPendingGoogleSignup(identity.sub, identity.email, next);
        destination = "/signup/google";
      }
    }
  } catch (err) {
    console.error("Google sign-in failed:", err);
    destination = failedUrl(next, "google_failed");
  }
  redirect(destination);
}
