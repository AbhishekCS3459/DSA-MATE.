import type { Question, QuestionFilters, SortOptions } from '@/lib/types'
import { useCallback, useEffect, useRef, useState } from 'react'

interface QuestionWithStatus extends Question {
  status: "DONE" | "NOT_DONE"
  notesCount: number
}

interface CachedData {
  questions: QuestionWithStatus[]
  totalCount: number
  subscription: any
  premiumRequired: boolean
  isAuthenticated: boolean
  isPageRestricted: boolean
  timestamp: number
  filters: QuestionFilters
  sortOptions: SortOptions
  page: number
  pageSize: number
}

interface CacheEntry {
  [key: string]: CachedData
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 50 // Maximum number of cached entries
const PREFETCH_DISTANCE = 2 // Prefetch next 2 pages

export function useQuestionsCache() {
  const [cache, setCache] = useState<CacheEntry>({})
  const [isInitialized, setIsInitialized] = useState(false)
  const prefetchQueue = useRef<Set<string>>(new Set())
  const isPrefetching = useRef(false)

  // Initialize cache from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem('questions-cache')
      if (cached) {
        const parsedCache = JSON.parse(cached) as CacheEntry
        // Filter out expired entries
        const now = Date.now()
        const validEntries = Object.entries(parsedCache).reduce((acc, [key, data]) => {
          if (now - data.timestamp < CACHE_DURATION) {
            acc[key] = data
          }
          return acc
        }, {} as CacheEntry)
        
        setCache(validEntries)
      }
    } catch (error) {
      console.warn('Failed to load questions cache from localStorage:', error)
    } finally {
      setIsInitialized(true)
    }
  }, [])

  // Save cache to localStorage whenever it changes
  useEffect(() => {
    if (!isInitialized) return
    
    try {
      localStorage.setItem('questions-cache', JSON.stringify(cache))
    } catch (error) {
      console.warn('Failed to save questions cache to localStorage:', error)
    }
  }, [cache, isInitialized])

  // Generate cache key
  const generateCacheKey = useCallback((
    filters: QuestionFilters,
    sortOptions: SortOptions,
    page: number,
    pageSize: number
  ): string => {
    return JSON.stringify({
      search: filters.search || '',
      difficulty: filters.difficulty || '',
      topics: filters.topics?.sort() || [],
      companies: filters.companies?.sort() || [],
      status: filters.status || 'ALL',
      sortField: sortOptions.field,
      sortDirection: sortOptions.direction,
      page,
      pageSize
    })
  }, [])

  // Get cached data
  const getCachedData = useCallback((
    filters: QuestionFilters,
    sortOptions: SortOptions,
    page: number,
    pageSize: number
  ): CachedData | null => {
    const key = generateCacheKey(filters, sortOptions, page, pageSize)
    const cached = cache[key]
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached
    }
    
    return null
  }, [cache, generateCacheKey])

  // Set cached data
  const setCachedData = useCallback((
    filters: QuestionFilters,
    sortOptions: SortOptions,
    page: number,
    pageSize: number,
    data: Omit<CachedData, 'timestamp' | 'filters' | 'sortOptions' | 'page' | 'pageSize'>
  ) => {
    const key = generateCacheKey(filters, sortOptions, page, pageSize)
    
    setCache(prevCache => {
      const newCache = { ...prevCache }
      
      // Add new entry
      newCache[key] = {
        ...data,
        timestamp: Date.now(),
        filters,
        sortOptions,
        page,
        pageSize
      }
      
      // Remove oldest entries if cache is too large
      const entries = Object.entries(newCache)
      if (entries.length > MAX_CACHE_SIZE) {
        const sortedEntries = entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
        const toRemove = sortedEntries.slice(0, entries.length - MAX_CACHE_SIZE)
        toRemove.forEach(([key]) => delete newCache[key])
      }
      
      return newCache
    })
  }, [generateCacheKey])

  // Prefetch next pages
  const prefetchNextPages = useCallback(async (
    filters: QuestionFilters,
    sortOptions: SortOptions,
    currentPage: number,
    pageSize: number,
    totalCount: number
  ) => {
    if (isPrefetching.current) return
    
    const totalPages = Math.ceil(totalCount / pageSize)
    const pagesToPrefetch = []
    
    for (let i = 1; i <= PREFETCH_DISTANCE; i++) {
      const nextPage = currentPage + i
      if (nextPage <= totalPages) {
        const key = generateCacheKey(filters, sortOptions, nextPage, pageSize)
        if (!cache[key] && !prefetchQueue.current.has(key)) {
          pagesToPrefetch.push(nextPage)
        }
      }
    }
    
    if (pagesToPrefetch.length === 0) return
    
    isPrefetching.current = true
    
    try {
      await Promise.all(
        pagesToPrefetch.map(async (page) => {
          const key = generateCacheKey(filters, sortOptions, page, pageSize)
          prefetchQueue.current.add(key)
          
          try {
            const params = new URLSearchParams({
              page: page.toString(),
              limit: pageSize.toString(),
              search: filters.search || "",
              difficulty: filters.difficulty || "",
              topics: filters.topics?.join(",") || "",
              companies: filters.companies?.join(",") || "",
              status: filters.status || "ALL",
              sortField: sortOptions.field,
              sortDirection: sortOptions.direction,
            })
            
            const response = await fetch(`/api/questions?${params}`)
            if (response.ok) {
              const data = await response.json()
              setCachedData(filters, sortOptions, page, pageSize, {
                questions: data.questions || [],
                totalCount: data.totalCount || 0,
                subscription: data.subscription || null,
                premiumRequired: data.premiumRequired || false,
                isAuthenticated: data.isAuthenticated || false,
                isPageRestricted: data.isPageRestricted || false,
              })
            }
          } catch (error) {
            console.warn(`Failed to prefetch page ${page}:`, error)
          } finally {
            prefetchQueue.current.delete(key)
          }
        })
      )
    } finally {
      isPrefetching.current = false
    }
  }, [cache, generateCacheKey, setCachedData])

  // Clear expired cache entries
  const clearExpiredCache = useCallback(() => {
    const now = Date.now()
    setCache(prevCache => {
      const newCache = { ...prevCache }
      Object.entries(newCache).forEach(([key, data]) => {
        if (now - data.timestamp >= CACHE_DURATION) {
          delete newCache[key]
        }
      })
      return newCache
    })
  }, [])

  // Clear all cache
  const clearAllCache = useCallback(() => {
    setCache({})
    try {
      localStorage.removeItem('questions-cache')
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error)
    }
  }, [])

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const now = Date.now()
    const totalEntries = Object.keys(cache).length
    const validEntries = Object.values(cache).filter(
      data => now - data.timestamp < CACHE_DURATION
    ).length
    const expiredEntries = totalEntries - validEntries
    
    return {
      totalEntries,
      validEntries,
      expiredEntries,
      cacheSize: JSON.stringify(cache).length,
      maxCacheSize: MAX_CACHE_SIZE,
      cacheDuration: CACHE_DURATION
    }
  }, [cache])

  return {
    getCachedData,
    setCachedData,
    prefetchNextPages,
    clearExpiredCache,
    clearAllCache,
    getCacheStats,
    isInitialized,
    cache,
    generateCacheKey
  }
}
