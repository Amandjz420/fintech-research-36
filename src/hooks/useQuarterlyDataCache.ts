import { useState, useEffect, useCallback, useRef } from 'react';
import { GroupedQuarterlyData, apiService } from '@/services/api';

const CACHE_KEY = 'quarterly_data_cache';
const CACHE_TIMESTAMP_KEY = 'quarterly_data_cache_timestamp';
const CACHE_EXPIRY_MS = 20 * 60 * 1000; // 20 minutes

interface CacheState {
  data: GroupedQuarterlyData[];
  timestamp: number;
}

interface UseQuarterlyDataCacheResult {
  data: GroupedQuarterlyData[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export const useQuarterlyDataCache = (filters?: {
  company_id?: number;
  year?: number;
  quarter?: string;
}): UseQuarterlyDataCacheResult => {
  const [data, setData] = useState<GroupedQuarterlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const fetchInProgress = useRef(false);
  const initialized = useRef(false);

  // Generate cache key based on filters - using a stable serialization
  const filterKey = filters 
    ? `_${filters.company_id || ''}_${filters.year || ''}_${filters.quarter || ''}`
    : '';
  const cacheKey = `${CACHE_KEY}${filterKey}`;
  const timestampKey = `${CACHE_TIMESTAMP_KEY}${filterKey}`;

  // Load data from cache
  const loadFromCache = useCallback((): CacheState | null => {
    try {
      const cachedData = localStorage.getItem(cacheKey);
      const cachedTimestamp = localStorage.getItem(timestampKey);
      
      if (cachedData && cachedTimestamp) {
        const parsedData = JSON.parse(cachedData) as GroupedQuarterlyData[];
        const timestamp = parseInt(cachedTimestamp, 10);
        return { data: parsedData, timestamp };
      }
    } catch (e) {
      console.error('Error loading from cache:', e);
    }
    return null;
  }, [cacheKey, timestampKey]);

  // Save data to cache with quota handling
  const saveToCache = useCallback((newData: GroupedQuarterlyData[]) => {
    try {
      const timestamp = Date.now();
      const dataString = JSON.stringify(newData);
      
      // Check estimated size (rough approximation: 2 bytes per char)
      const estimatedSize = dataString.length * 2;
      const MAX_CACHE_SIZE = 4 * 1024 * 1024; // 4MB limit to stay under localStorage quota
      
      if (estimatedSize > MAX_CACHE_SIZE) {
        console.warn(`Data too large for cache (${(estimatedSize / 1024 / 1024).toFixed(2)}MB). Skipping cache.`);
        setLastUpdated(new Date(timestamp));
        return;
      }
      
      // Clear old cache entries if needed
      try {
        localStorage.setItem(cacheKey, dataString);
        localStorage.setItem(timestampKey, timestamp.toString());
        setLastUpdated(new Date(timestamp));
        console.log(`Cached ${newData.length} records successfully`);
      } catch (quotaError) {
        console.warn('LocalStorage quota exceeded, clearing old caches...');
        // Clear all quarterly data caches
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('quarterly_data_cache')) {
            localStorage.removeItem(key);
          }
        });
        // Try again
        try {
          localStorage.setItem(cacheKey, dataString);
          localStorage.setItem(timestampKey, timestamp.toString());
          setLastUpdated(new Date(timestamp));
        } catch (e) {
          console.error('Still unable to cache data after clearing:', e);
        }
      }
    } catch (e) {
      console.error('Error saving to cache:', e);
    }
  }, [cacheKey, timestampKey]);

  // Check if cache is stale
  const isCacheStale = useCallback((timestamp: number): boolean => {
    return Date.now() - timestamp > CACHE_EXPIRY_MS;
  }, []);

  // Fetch fresh data from API
  const fetchFreshData = useCallback(async (isBackground: boolean = false): Promise<GroupedQuarterlyData[]> => {
    if (fetchInProgress.current) {
      return [];
    }

    fetchInProgress.current = true;

    try {
      if (isBackground) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      console.log('Fetching fresh data from API...');
      const freshData = await apiService.getGroupedQuarterlyData(filters);
      console.log('Fresh data received:', freshData.length, 'records');
      
      // Save to cache
      saveToCache(freshData);
      setData(freshData);
      setError(null);
      
      return freshData;
    } catch (e) {
      console.error('Error fetching fresh data:', e);
      const err = e instanceof Error ? e : new Error('Failed to fetch data');
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      fetchInProgress.current = false;
    }
  }, [filters, saveToCache]);

  // Initial load and cache management - only run once per filter change
  useEffect(() => {
    // Reset state when filters change
    if (initialized.current) {
      initialized.current = false;
    }

    const initializeData = async () => {
      if (initialized.current) return;
      initialized.current = true;

      const cached = loadFromCache();
      
      if (cached && cached.data.length > 0) {
        // We have cached data - use it immediately
        console.log('Using cached data from:', new Date(cached.timestamp).toLocaleString());
        setData(cached.data);
        setLastUpdated(new Date(cached.timestamp));
        setIsLoading(false);
        
        // Check if cache is stale and refresh in background
        if (isCacheStale(cached.timestamp)) {
          console.log('Cache is stale (>20 min), refreshing in background...');
          // Small delay to ensure UI renders with cached data first
          setTimeout(() => {
            fetchFreshData(true).catch(e => {
              console.error('Background refresh failed:', e);
            });
          }, 500);
        }
      } else {
        // No cached data - fetch fresh
        console.log('No cache found, fetching fresh data...');
        try {
          await fetchFreshData(false);
        } catch (e) {
          console.error('Initial fetch failed:', e);
        }
      }
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  // Manual refetch function
  const refetch = useCallback(async () => {
    initialized.current = true;
    await fetchFreshData(false);
  }, [fetchFreshData]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refetch,
    lastUpdated
  };
};
