const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const saltBytes = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(saltBytes);
  const salt = btoa(String.fromCharCode(...saltBytes));

  const hash = await deriveKey(password, saltBytes);
  return { hash, salt };
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const saltBytes = Uint8Array.from(atob(salt), (c) => c.charCodeAt(0));
  const derived = await deriveKey(password, saltBytes);
  return derived === hash;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

// JWT (HS256)

interface JwtPayload {
  sub: string;
  iss: string;
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

function base64url(data: string): string {
  return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlEncode(obj: unknown): string {
  return base64url(JSON.stringify(obj));
}

function base64urlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  return atob(padded);
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return base64url(String.fromCharCode(...new Uint8Array(sig)));
}

export async function signJwt(
  userId: string,
  secret: string,
  options: { issuer: string; ttlSec: number; type: 'access' | 'refresh' },
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64urlEncode({ alg: 'HS256', typ: 'JWT' });
  const payload = base64urlEncode({
    sub: userId,
    iss: options.issuer,
    iat: now,
    exp: now + options.ttlSec,
    type: options.type,
  } satisfies JwtPayload);
  const signature = await hmacSign(`${header}.${payload}`, secret);
  return `${header}.${payload}.${signature}`;
}

export async function verifyJwt(
  token: string,
  secret: string,
  options: { issuer: string; type: 'access' | 'refresh' },
): Promise<JwtPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expected = await hmacSign(`${header}.${payload}`, secret);
  if (signature !== expected) return null;

  try {
    const decoded: JwtPayload = JSON.parse(base64urlDecode(payload!));
    if (decoded.iss !== options.issuer) return null;
    if (decoded.type !== options.type) return null;
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}
