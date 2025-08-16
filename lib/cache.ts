// Centralized cache management for the DSA Tracker application

// In-memory cache for questions data
const questionsCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  QUESTIONS: 5 * 60 * 1000, // 5 minutes for questions
  FILTERS: 30 * 60 * 1000,  // 30 minutes for filter options
  STATS: 10 * 60 * 1000,    // 10 minutes for stats
  PROFILE: 15 * 60 * 1000,  // 15 minutes for profile data
}

// Cache invalidation functions
export function invalidateQuestionsCache(): void {
  questionsCache.clear()
  console.log('Questions cache invalidated')
}

export function invalidateAllCaches(): void {
  questionsCache.clear()
  console.log('All caches invalidated')
}

// Generate cache key based on query parameters
export function generateQuestionsCacheKey(params: URLSearchParams, userId?: string): string {
  const keyParts = [
    'questions',
    params.get('search') || '',
    params.get('difficulty') || '',
    params.get('topics') || '',
    params.get('companies') || '',
    params.get('status') || '',
    params.get('sortField') || '',
    params.get('sortDirection') || '',
    params.get('page') || '',
    params.get('limit') || '',
    userId || 'anonymous'
  ]
  return keyParts.join('|')
}

// Get cached data if valid
export function getCachedQuestionsData(key: string): any | null {
  const cached = questionsCache.get(key)
  if (!cached) return null
  
  const now = Date.now()
  if (now - cached.timestamp > cached.ttl) {
    questionsCache.delete(key)
    return null
  }
  
  return cached.data
}

// Set cache data
export function setCachedQuestionsData(key: string, data: any, ttl: number = CACHE_TTL.QUESTIONS): void {
  questionsCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  })
}

// Get cache headers based on cacheability
export function getCacheHeaders(isCacheable: boolean, maxAge: number = 300): Record<string, string> {
  if (!isCacheable) {
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }
  
  return {
    'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge * 2}, stale-while-revalidate=${maxAge * 2}`,
    'ETag': `"${Date.now()}"`,
    'Vary': 'Authorization, Accept-Encoding'
  }
}

// Cache statistics
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: questionsCache.size,
    keys: Array.from(questionsCache.keys())
  }
}

// Clear expired cache entries
export function cleanupExpiredCache(): void {
  const now = Date.now()
  let cleaned = 0
  
  for (const [key, value] of questionsCache.entries()) {
    if (now - value.timestamp > value.ttl) {
      questionsCache.delete(key)
      cleaned++
    }
  }
  
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired cache entries`)
  }
}

// Auto-cleanup every 5 minutes - only in browser environment
if (typeof window !== 'undefined' && typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredCache, 5 * 60 * 1000)
}
