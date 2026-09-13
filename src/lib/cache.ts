// ponytail: single-process in-memory cache, lost on restart/multi-instance.
// Upgrade path: CloudBase's own KV/Redis binding, only worth it if zhida's
// 100-calls/day quota becomes the bottleneck during judging.

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export const TTL = {
  SEARCH: 5 * 60 * 1000,
  ICEBREAKER: 60 * 60 * 1000,
};
