export function newId(): string {
  return crypto.randomUUID();
}

export function nowMs(): number {
  return Date.now();
}

export function todayKey(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join('');
}

export function computeLevel(carbonSavedG: number): number {
  if (carbonSavedG >= 150_000) return 5;
  if (carbonSavedG >= 80_000) return 4;
  if (carbonSavedG >= 30_000) return 3;
  if (carbonSavedG >= 10_000) return 2;
  return 1;
}
