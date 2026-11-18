import { z } from "zod";
import { passwordFingerprint } from "./review-auth";

const identity = { localId: z.string().min(1).max(128), authUserId: z.string().min(1).max(128), email: z.string().email(), passwordFingerprint: z.string().regex(/^[a-f0-9]{64}$/) };
const principalSchema = z.discriminatedUnion("kind", [
  z.object({ ...identity, kind: z.literal("admin"), adminRole: z.literal("editor") }).strict(),
  z.object({ ...identity, kind: z.literal("member") }).strict(),
]);
const schema = z.object({ version: z.literal(1), environment: z.enum(["staging", "production"]), baseUrl: z.string().url(), principals: z.array(principalSchema).min(1).max(8) }).strict();
export type ManagedPrincipal = z.infer<typeof principalSchema>;
export type ManagedPolicy = z.infer<typeof schema>;
export type ManagedLocalUser = { id: string; email: string; password: string; role?: string | null; isActive?: boolean; status?: string };
export class ManagedAuthUnavailable extends Error { constructor() { super("MANAGED_AUTH_UNAVAILABLE"); } }

export function readManagedPolicy(raw: string | undefined, environment: string | undefined): ManagedPolicy | null {
  if (!raw) return null;
  try {
    const policy = schema.parse(JSON.parse(raw)), url = new URL(policy.baseUrl);
    if (policy.environment !== environment || url.protocol !== "https:" || !url.hostname.includes(".neonauth.") || !url.hostname.endsWith(".neon.tech") || url.username || url.password || url.search || url.hash) throw new ManagedAuthUnavailable();
    for (const field of ["email", "localId", "authUserId"] as const) if (new Set(policy.principals.map(p => p[field])).size !== policy.principals.length) throw new ManagedAuthUnavailable();
    return policy;
  } catch { throw new ManagedAuthUnavailable(); }
}

export async function managedAccessAllowed(principal: ManagedPrincipal, user: ManagedLocalUser, kind: "admin" | "member"): Promise<boolean> {
  if (principal.kind !== kind || principal.localId !== user.id || principal.email !== user.email) return false;
  if (principal.kind === "admin" ? !user.isActive || user.role !== principal.adminRole : user.status !== "approved") return false;
  const fingerprint = await passwordFingerprint(user.password);
  let difference = 0;
  for (let i = 0; i < 64; i++) difference |= fingerprint.charCodeAt(i) ^ principal.passwordFingerprint.charCodeAt(i);
  return difference === 0;
}

export async function verifyManagedPassword(policy: ManagedPolicy, principal: ManagedPrincipal, user: ManagedLocalUser, password: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  if (!await managedAccessAllowed(principal, user, principal.kind) || password.length < 1 || password.length > 128) return false;
  try {
    const response = await fetchImpl(`${policy.baseUrl.replace(/\/$/, "")}/sign-in/email`, {
      method: "POST", redirect: "manual", headers: { "content-type": "application/json", origin: `https://cami-order-system-${policy.environment}.cami-order-system.workers.dev` },
      body: JSON.stringify({ email: principal.email, password }), signal: AbortSignal.timeout(8000),
    });
    if ([400, 401, 403].includes(response.status)) return false;
    if (!response.ok || Number(response.headers.get("content-length")) > 65536) throw new ManagedAuthUnavailable();
    const data = await response.json();
    return data?.user?.id === principal.authUserId && data.user.email === principal.email;
  } catch { throw new ManagedAuthUnavailable(); }
}
