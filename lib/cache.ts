import { Redis } from '@upstash/redis';
import { PipelineResult, CacheKey } from './types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  private redis?: Redis;
  private memoryCache = new Map<string, CacheEntry<any>>();
  private maxMemoryEntries = 100;
  private defaultTtl = 24 * 60 * 60; // 24 часа в секундах

  constructor() {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken) {
      try {
        this.redis = new Redis({
          url: redisUrl,
          token: redisToken,
        });
        console.log('Redis cache initialized');
      } catch (error) {
        console.warn('Failed to initialize Redis cache, falling back to memory cache:', error);
      }
    } else {
      console.log('Redis credentials not provided, using memory cache');
    }
  }

  private generateCacheKey(params: CacheKey): string {
    return `analysis:${params.query}:${params.country}:${params.lang}:${params.device}`;
  }

  async get<T>(params: CacheKey): Promise<T | null> {
    const key = this.generateCacheKey(params);

    // Пробуем Redis сначала
    if (this.redis) {
      try {
        const cached = await this.redis.get<CacheEntry<T>>(key);
        if (cached && this.isValidEntry(cached)) {
          return cached.data;
        }
      } catch (error) {
        console.warn('Redis get error:', error);
      }
    }

    // Fallback на memory cache
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValidEntry(memoryEntry)) {
      return memoryEntry.data;
    }

    return null;
  }

  async set<T>(params: CacheKey, data: T, ttl: number = this.defaultTtl): Promise<void> {
    const key = this.generateCacheKey(params);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000, // Конвертируем в миллисекунды
    };

    // Сохраняем в Redis
    if (this.redis) {
      try {
        await this.redis.setex(key, ttl, entry);
      } catch (error) {
        console.warn('Redis set error:', error);
      }
    }

    // Сохраняем в memory cache
    this.memoryCache.set(key, entry);
    this.cleanupMemoryCache();
  }

  async delete(params: CacheKey): Promise<void> {
    const key = this.generateCacheKey(params);

    if (this.redis) {
      try {
        await this.redis.del(key);
      } catch (error) {
        console.warn('Redis delete error:', error);
      }
    }

    this.memoryCache.delete(key);
  }

  async clear(): Promise<void> {
    if (this.redis) {
      try {
        // Очищаем только наши ключи
        const keys = await this.redis.keys('analysis:*');
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.warn('Redis clear error:', error);
      }
    }

    this.memoryCache.clear();
  }

  private isValidEntry<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private cleanupMemoryCache(): void {
    if (this.memoryCache.size <= this.maxMemoryEntries) {
      return;
    }

    // Удаляем старые записи
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toDelete = entries.slice(0, entries.length - this.maxMemoryEntries);
    toDelete.forEach(([key]) => {
      this.memoryCache.delete(key);
    });
  }

  // Специальные методы для анализа
  async getAnalysisResult(params: CacheKey): Promise<PipelineResult | null> {
    return this.get<PipelineResult>(params);
  }

  async setAnalysisResult(params: CacheKey, result: PipelineResult): Promise<void> {
    return this.set(params, result, this.defaultTtl);
  }

  async invalidateAnalysis(params: CacheKey): Promise<void> {
    return this.delete(params);
  }

  // Методы для отладки
  getCacheStats(): { memoryEntries: number; hasRedis: boolean } {
    return {
      memoryEntries: this.memoryCache.size,
      hasRedis: !!this.redis,
    };
  }

  async getMemoryCacheKeys(): Promise<string[]> {
    return Array.from(this.memoryCache.keys());
  }

  // Методы для управления TTL
  async extendTtl(params: CacheKey, additionalTtl: number): Promise<void> {
    const key = this.generateCacheKey(params);
    const entry = this.memoryCache.get(key);
    
    if (entry) {
      entry.ttl += additionalTtl * 1000;
      this.memoryCache.set(key, entry);
    }

    if (this.redis) {
      try {
        const currentTtl = await this.redis.ttl(key);
        if (currentTtl > 0) {
          await this.redis.expire(key, currentTtl + additionalTtl);
        }
      } catch (error) {
        console.warn('Redis extend TTL error:', error);
      }
    }
  }
}

export const cacheManager = new CacheManager();
