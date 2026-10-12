/**
 * Password hashing with PBKDF2-SHA256 (Web Crypto). Hashes are stored in the
 * browser for now; move this to the server together with the accounts store
 * when a backend is added.
 */
const ITERATIONS = 210_000

const toB64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)))
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

async function derive(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"])
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: ITERATIONS }, key, 256)
  return toB64(bits)
}

export async function hashPassword(password: string): Promise<{ passwordHash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return { passwordHash: await derive(password, salt), salt: toB64(salt) }
}

export async function verifyPassword(password: string, account: { passwordHash: string; salt: string }): Promise<boolean> {
  const hash = await derive(password, fromB64(account.salt))
  // constant-time comparison
  if (hash.length !== account.passwordHash.length) return false
  let diff = 0
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ account.passwordHash.charCodeAt(i)
  return diff === 0
}
