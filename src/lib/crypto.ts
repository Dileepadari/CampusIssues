/**
 * Password hashing and id generation.
 *
 * PBKDF2-SHA256 via Web Crypto, per-user random salt. This is the same
 * algorithm a server would use; because CampusIssues currently persists to the
 * browser (see DEVDOC.md) the hash lives client-side, so it protects stored
 * passwords from casual inspection rather than from a determined attacker with
 * device access. Swapping the storage layer for a real API keeps this code
 * unchanged - only where the hash is compared moves.
 */

const ITERATIONS = 120_000;
const KEY_LENGTH_BITS = 256;

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function randomSalt(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: fromHex(salt) as unknown as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    KEY_LENGTH_BITS,
  );
  return toHex(bits);
}

/** Length-independent comparison so a wrong password cannot be timed out. */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const actual = await hashPassword(password, salt);
  return constantTimeEqual(actual, expectedHash);
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

const TRACKING_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Human-readable, unambiguous (no O/0, I/1), e.g. CI-7KDQ-2M4X. */
export function newTrackingId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const chars = Array.from(bytes, (b) => TRACKING_ALPHABET[b % TRACKING_ALPHABET.length]);
  return `CI-${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}`;
}

export function newSessionToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(24)).buffer);
}
