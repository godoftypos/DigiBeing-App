import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

class CacheManager {
    private static instance: CacheManager;
    private readonly CACHE_PREFIX = 'app_cache_';
    
    // Cache duration in milliseconds (5 hours = 5 * 60 * 60 * 1000)
    private readonly DEFAULT_CACHE_DURATION = 5 * 60 * 60 * 1000;

    public static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

    private getCacheKey(key: string): string {
        return `${this.CACHE_PREFIX}${key}`;
    }

    /**
     * Store data in cache with expiration
     */
    async set<T>(key: string, data: T, duration?: number): Promise<void> {
        try {
            const cacheDuration = duration || this.DEFAULT_CACHE_DURATION;
            const timestamp = Date.now();
            const expiresAt = timestamp + cacheDuration;

            const cacheItem: CacheItem<T> = {
                data,
                timestamp,
                expiresAt
            };

            await AsyncStorage.setItem(
                this.getCacheKey(key), 
                JSON.stringify(cacheItem)
            );
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    /**
     * Get data from cache if not expired
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const cachedData = await AsyncStorage.getItem(this.getCacheKey(key));
            
            if (!cachedData) {
                return null;
            }

            const cacheItem: CacheItem<T> = JSON.parse(cachedData);
            const now = Date.now();

            // Check if cache has expired
            if (now > cacheItem.expiresAt) {
                // Cache expired, remove it
                await this.remove(key);
                return null;
            }

            return cacheItem.data;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    /**
     * Remove specific cache item
     */
    async remove(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(this.getCacheKey(key));
        } catch (error) {
            console.error('Cache remove error:', error);
        }
    }

    /**
     * Check if cache exists and is valid
     */
    async has(key: string): Promise<boolean> {
        try {
            const cachedData = await AsyncStorage.getItem(this.getCacheKey(key));
            
            if (!cachedData) {
                return false;
            }

            const cacheItem: CacheItem<any> = JSON.parse(cachedData);
            const now = Date.now();

            return now <= cacheItem.expiresAt;
        } catch (error) {
            console.error('Cache has error:', error);
            return false;
        }
    }

    /**
     * Get cache info (timestamp, expires at)
     */
    async getCacheInfo(key: string): Promise<{ timestamp: number; expiresAt: number; timeLeft: number } | null> {
        try {
            const cachedData = await AsyncStorage.getItem(this.getCacheKey(key));
            
            if (!cachedData) {
                return null;
            }

            const cacheItem: CacheItem<any> = JSON.parse(cachedData);
            const now = Date.now();
            const timeLeft = Math.max(0, cacheItem.expiresAt - now);

            return {
                timestamp: cacheItem.timestamp,
                expiresAt: cacheItem.expiresAt,
                timeLeft
            };
        } catch (error) {
            console.error('Cache info error:', error);
            return null;
        }
    }

    /**
     * Clear all cache
     */
    async clearAll(): Promise<void> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter((key: string) => key.startsWith(this.CACHE_PREFIX));
            await AsyncStorage.multiRemove(cacheKeys);
        } catch (error) {
            console.error('Cache clear all error:', error);
        }
    }

    /**
     * Get cache size and items count
     */
    async getCacheStats(): Promise<{ count: number; keys: string[] }> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter((key: string) => key.startsWith(this.CACHE_PREFIX));
            
            return {
                count: cacheKeys.length,
                keys: cacheKeys.map((key: string) => key.replace(this.CACHE_PREFIX, ''))
            };
        } catch (error) {
            console.error('Cache stats error:', error);
            return { count: 0, keys: [] };
        }
    }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Export helper functions for common operations
export const analyticsCache = {
    get: (timeRange: string) => cacheManager.get(`analytics_${timeRange}`),
    set: (timeRange: string, data: any) => cacheManager.set(`analytics_${timeRange}`, data),
    has: (timeRange: string) => cacheManager.has(`analytics_${timeRange}`),
    remove: (timeRange: string) => cacheManager.remove(`analytics_${timeRange}`),
    getCacheInfo: (timeRange: string) => cacheManager.getCacheInfo(`analytics_${timeRange}`)
};
