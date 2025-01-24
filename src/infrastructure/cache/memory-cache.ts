export class MemoryCache {
  private cache = new Map<string, any>();
  get(key: string): any | null {
    return this.cache.get(key) || null;
  }
  set(key: string, value: any): void {
    this.cache.set(key, value);
  }
  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const memoryCache = new MemoryCache();
