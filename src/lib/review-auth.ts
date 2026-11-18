import { z } from "zod";

const policySchema = z.object({
  version: z.literal(1),
  environment: z.enum(["staging", "production"]),
  baseUrl: z.string().url(),
  adminId: z.string().min(1).max(128),
  authUserId: z.string().min(1).max(128),
  email: z.string().email(),
  passwordFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  expiresAt: z.string().datetime(),
}).strict();

export type ReviewAuthPolicy = z.infer<typeof policySchema>;
export type ReviewAdmin = {
  id: string;
  email: string;
  role: string | null;
  isActive: boolean;
  password: string;
};

export class ReviewAuthUnavailable extends Error {
  constructor() { super("REVIEW_AUTH_UNAVAILABLE"); }
}

export function readReviewAuthPolicy(raw: string | undefined, environment: string | undefined): ReviewAuthPolicy | null {
  if (!raw) return null;
  try {
    const policy = policySchema.parse(JSON.parse(raw));
    const url = new URL(policy.baseUrl);
    if (policy.environment !== environment || url.protocol !== "https:" || !url.hostname.endsWith(".neon.tech") || url.username || url.password || url.search || url.hash) {
      throw new ReviewAuthUnavailable();
    }
    return policy;
  } catch { throw new ReviewAuthUnavailable(); }
}

export async function passwordFingerprint(hash: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(hash));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function sameFingerprint(a: string, b: string): boolean {
  if (a.length !== 64 || b.length !== 64) return false;
  let difference = 0;
  for (let i = 0; i < 64; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

export async function reviewAccessAllowed(policy: ReviewAuthPolicy, admin: ReviewAdmin, now = Date.now()): Promise<boolean> {
  return admin.id === policy.adminId && admin.email === policy.email && admin.role === "viewer" && admin.isActive &&
    now < Date.parse(policy.expiresAt) && sameFingerprint(await passwordFingerprint(admin.password), policy.passwordFingerprint);
}

export async function verifyReviewPassword(policy: ReviewAuthPolicy, admin: ReviewAdmin, password: string, fetchImpl: typeof fetch = fetch, now = Date.now()): Promise<boolean> {
  if (!await reviewAccessAllowed(policy, admin, now) || password.length < 1 || password.length > 128) return false;
  try {
    const response = await fetchImpl(`${policy.baseUrl.replace(/\/$/, "")}/sign-in/email`, {
      method: "POST",
      redirect: "manual",
      headers: {
        "content-type": "application/json",
        origin: `https://cami-order-system-${policy.environment}.cami-order-system.workers.dev`,
      },
      body: JSON.stringify({ email: policy.email, password }),
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 400 || response.status === 401 || response.status === 403) return false;
    if (!response.ok || Number(response.headers.get("content-length")) > 65536) throw new ReviewAuthUnavailable();
    const data = await response.json();
    return data?.user?.id === policy.authUserId && data.user.email === policy.email;
  } catch {
    // Never attach upstream errors, request bodies, passwords, or session tokens.
    throw new ReviewAuthUnavailable();
  }
}
