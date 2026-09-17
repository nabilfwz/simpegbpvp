interface CacheEntry {
  data: any;
  timestamp: number;
}

// In-memory server-side cache for master data
const serverCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export function getCachedMasterData(key: string): any | null {
  const entry = serverCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

export function setCachedMasterData(key: string, data: any): void {
  serverCache.set(key, { data, timestamp: Date.now() });
}

export function invalidateMasterDataCache(kategori?: string): void {
  if (kategori) {
    for (const key of serverCache.keys()) {
      if (key.startsWith(kategori)) {
        serverCache.delete(key);
      }
    }
  } else {
    serverCache.clear();
  }
}
