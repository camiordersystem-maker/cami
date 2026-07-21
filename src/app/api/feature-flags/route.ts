import { auth } from "@/auth";
import { getFeatureFlagMap } from "@/lib/feature-flags";
import { internalError, ok, unauthorized } from "@/lib/api-response";

// Read-only, any authenticated session (admin or member). Used by client
// components to conditionally show optional-feature UI (buttons, uploads).
export async function GET() {
  const session = await auth();
  if (!session) return unauthorized();

  try {
    const map = await getFeatureFlagMap();
    return ok(map);
  } catch (e) {
    console.error("feature-flags (public) GET error:", e);
    return internalError("取得に失敗しました");
  }
}
