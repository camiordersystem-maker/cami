function toBase64(bytes: ArrayBuffer): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  for (const byte of new Uint8Array(bytes)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function constantTimeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;

  for (let i = 0; i < length; i += 1) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }

  return diff === 0;
}

export async function createLineSignature(body: string, channelSecret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(channelSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return toBase64(signed);
}

export async function verifyLineSignature(params: {
  body: string;
  channelSecret: string | undefined;
  signature: string | null;
}): Promise<boolean> {
  if (!params.channelSecret || !params.signature) return false;

  const expected = await createLineSignature(params.body, params.channelSecret);
  return constantTimeEqual(expected, params.signature);
}
