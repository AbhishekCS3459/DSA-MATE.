"use client"

import { PremiumUpgradePrompt } from "@/components/premium/premium-upgrade-prompt"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useQuestionsCache } from "@/hooks/use-questions-cache"
import { useToast } from "@/hooks/use-toast"
import type { Question, QuestionFilters, SortOptions } from "@/lib/types"
import { CheckCircle, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Circle, ExternalLink, FileText, Info, Lock, X, Zap } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { CompanyTags } from "./company-tags"
import { TopicTags } from "./topic-tags"

interface QuestionsTableProps {
  filters: QuestionFilters
  sortOptions: SortOptions
  onNotesClick: (question: Question) => void
}

interface QuestionWithStatus extends Question {
  status: "DONE" | "NOT_DONE"
  notesCount: number
}

export function QuestionsTable({ filters, sortOptions, onNotesClick }: QuestionsTableProps) {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [questions, setQuestions] = useState<QuestionWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [subscription, setSubscription] = useState<any>(null)
  const [premiumRequired, setPremiumRequired] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isPageRestricted, setIsPageRestricted] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(true)
  const [cacheHit, setCacheHit] = useState(false)
  const [isPrefetching, setIsPrefetching] = useState(false)
  const [showCacheStats, setShowCacheStats] = useState(false)
  const [cachePerformance, setCachePerformance] = useState<{ loadTime: number; cacheTime: number } | null>(null)

  // Initialize caching hook
  const {
    getCachedData,
    setCachedData,
    prefetchNextPages,
    clearExpiredCache,
    getCacheStats,
    isInitialized: isCacheInitialized,
    cache,
    generateCacheKey
  } = useQuestionsCache()

  useEffect(() => {
    fetchQuestions()
  }, [filters, sortOptions, currentPage, pageSize])

  // Reset to page 1 when user is not authenticated
  useEffect(() => {
    if (!isAuthenticated && currentPage > 1) {
      setCurrentPage(1)
    }
  }, [isAuthenticated, currentPage])

  // Hide sign-in modal when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setShowSignInModal(false)
    }
  }, [isAuthenticated])

  // Initialize cache warming for common filters
  useEffect(() => {
    if (isCacheInitialized && !loading) {
      // Warm cache with common filter combinations
      const commonFilters = [
        { ...filters, difficulty: "EASY" as const },
        { ...filters, difficulty: "MEDIUM" as const },
        { ...filters, difficulty: "HARD" as const },
        { ...filters, status: "DONE" as const },
        { ...filters, status: "NOT_DONE" as const }
      ]
      
      commonFilters.forEach(filterSet => {
        const key = generateCacheKey(filterSet, sortOptions, 1, pageSize)
        if (!cache[key]) {
          // Prefetch first page for common filter combinations
          setTimeout(() => {
            fetch(`/api/questions?${new URLSearchParams({
              page: "1",
              limit: pageSize.toString(),
              search: filterSet.search || "",
              difficulty: filterSet.difficulty || "",
              topics: filterSet.topics?.join(",") || "",
              companies: filterSet.companies?.join(",") || "",
              status: filterSet.status || "ALL",
              sortField: sortOptions.field,
              sortDirection: sortOptions.direction,
            })}`).then(response => {
              if (response.ok) {
                response.json().then(data => {
                  setCachedData(filterSet, sortOptions, 1, pageSize, {
                    questions: data.questions || [],
                    totalCount: data.totalCount || 0,
                    subscription: data.subscription || null,
                    premiumRequired: data.premiumRequired || false,
                    isAuthenticated: data.isAuthenticated || false,
                    isPageRestricted: data.isPageRestricted || false,
                  })
                })
              }
            }).catch(() => {}) // Silently fail for cache warming
          }, Math.random() * 2000) // Stagger requests
        }
      })
    }
  }, [isCacheInitialized, filters, sortOptions, pageSize, cache, setCachedData, generateCacheKey])

  const fetchQuestions = useCallback(async (forceRefresh = false) => {
    const startTime = performance.now()
    
    try {
      // Check cache first (unless forcing refresh)
      if (!forceRefresh && isCacheInitialized) {
        const cachedData = getCachedData(filters, sortOptions, currentPage, pageSize)
        if (cachedData) {
          const cacheTime = performance.now() - startTime
          setCachePerformance({ loadTime: 0, cacheTime })
          
          setQuestions(cachedData.questions)
          setTotalCount(cachedData.totalCount)
          setSubscription(cachedData.subscription)
          setPremiumRequired(cachedData.premiumRequired)
          setIsAuthenticated(cachedData.isAuthenticated)
          setIsPageRestricted(cachedData.isPageRestricted)
          setCacheHit(true)
          setLoading(false)
          
          // Start prefetching next pages in background
          if (cachedData.totalCount > 0) {
            prefetchNextPages(filters, sortOptions, currentPage, pageSize, cachedData.totalCount)
          }
          
          return
        }
      }

      setLoading(true)
      setCacheHit(false)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
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
        const loadTime = performance.now() - startTime
        
        setQuestions(data.questions || [])
        setTotalCount(data.totalCount || 0)
        setSubscription(data.subscription || null)
        setPremiumRequired(data.premiumRequired || false)
        setIsAuthenticated(data.isAuthenticated || false)
        setIsPageRestricted(data.isPageRestricted || false)
        
        // Cache the data
        if (isCacheInitialized) {
          setCachedData(filters, sortOptions, currentPage, pageSize, {
            questions: data.questions || [],
            totalCount: data.totalCount || 0,
            subscription: data.subscription || null,
            premiumRequired: data.premiumRequired || false,
            isAuthenticated: data.isAuthenticated || false,
            isPageRestricted: data.isPageRestricted || false,
          })
          
          // Start prefetching next pages in background
          if (data.totalCount > 0) {
            prefetchNextPages(filters, sortOptions, currentPage, pageSize, data.totalCount)
          }
        }
        
        // If page is restricted, reset to page 1
        if (data.isPageRestricted) {
          setCurrentPage(1)
        }
      } else {
        throw new Error("Failed to fetch questions")
      }
    } catch (error) {
      console.error("Error fetching questions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [filters, sortOptions, currentPage, pageSize, isCacheInitialized, getCachedData, setCachedData, prefetchNextPages, toast])

  const cleanDisplayData = (data: string[]) => {
    if (!Array.isArray(data)) return []
    return data
      .map(item => {
        if (typeof item !== 'string') return null
        return item.trim().replace(/^["'`]+|["'`]+$/g, '').replace(/["'`]/g, '').trim()
      })
      .filter((item): item is string => item !== null)
      .filter((item, index, arr) => arr.indexOf(item) === index)
      .sort()
  }

  const handlePageSizeChange = (newPageSize: number) => {
    // Restrict non-authenticated users to reasonable page sizes
    if (!isAuthenticated && newPageSize > 25) {
      toast({
        title: "Page size restricted",
        description: "Sign in to access larger page sizes",
        variant: "destructive",
      })
      return
    }
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const updateProgress = async (questionId: string, status: "DONE" | "NOT_DONE") => {
    try {
      const response = await fetch("/api/questions/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId,
          status,
        }),
      })

      if (response.ok) {
        // Update local state
        setQuestions(prev =>
          prev.map(q =>
            q.id === questionId ? { ...q, status } : q
          )
        )

        toast({
          title: "Progress Updated",
          description: `Question marked as ${status === "DONE" ? "completed" : "not completed"}`,
        })
      } else {
        throw new Error("Failed to update progress")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      })
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "HARD":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)
  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalCount)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>

        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Enhanced loading header */}
            <div className="text-center py-8">
              <div className="flex items-center justify-center mb-4">
                <div className="relative skeleton-float">
                  <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
                  <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Preparing your questions...</h3>
              <p className="text-muted-foreground text-sm mb-4">We're gathering the perfect problems for you</p>
              
              {/* Cache status */}
              {isCacheInitialized && (
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-full text-xs text-muted-foreground">
                  <Zap className="h-3 w-3 text-yellow-500" />
                  <span>Intelligent caching enabled</span>
                </div>
              )}
            </div>

            {/* Enhanced skeleton rows with better animations */}
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className={`flex items-center space-x-4 p-4 border rounded-lg skeleton-slide-in skeleton-stagger-${index + 1}`}>
                {/* Question number skeleton with pulse effect */}
                <div className="w-8 h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full skeleton-pulse-glow"></div>
                
                {/* Question title skeleton with staggered animation */}
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-3/4 skeleton-shimmer"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-1/2 skeleton-shimmer"></div>
                </div>
                
                {/* Difficulty skeleton */}
                <div className="w-16 h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full skeleton-shimmer"></div>
                
                {/* Frequency skeleton */}
                <div className="w-20 h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded skeleton-shimmer"></div>
                
                {/* Acceptance rate skeleton */}
                <div className="w-16 h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded skeleton-shimmer"></div>
                
                {/* Status skeleton */}
                <div className="w-20 h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full skeleton-shimmer"></div>
                
                {/* Actions skeleton */}
                <div className="flex space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded skeleton-pulse-glow"></div>
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded skeleton-pulse-glow"></div>
                </div>
              </div>
            ))}
            

            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary to-accent rounded-full skeleton-shimmer relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Premium Upgrade Prompt */}
      {premiumRequired && subscription && (
        <PremiumUpgradePrompt
          currentCount={subscription.maxQuestions}
          maxFreeQuestions={100}
          totalQuestions={subscription.totalQuestions}
        />
      )}

      {/* Sign In Prompt for Non-Authenticated Users */}
      {!isAuthenticated && showSignInModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
          onClick={() => setShowSignInModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="signin-modal-title"
          aria-describedby="signin-modal-description"
        >
          <div className="bg-card border rounded-lg shadow-lg max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 id="signin-modal-title" className="font-semibold text-foreground text-lg">
                    Sign in to access more questions
                  </h3>
                </div>
                <button
                  onClick={() => setShowSignInModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <p id="signin-modal-description" className="text-muted-foreground text-sm mb-6 leading-relaxed">
                You're currently viewing page 1 of {totalCount} questions. Sign in to access all pages and track your progress.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 flex-1">
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="flex-1">
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </div>
              
              <div className="mt-4 text-center">
                <button 
                  onClick={() => setShowSignInModal(false)} 
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Continue browsing (limited)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Questions</CardTitle>
              <CardDescription>
                Showing {startIndex} to {endIndex} of {totalCount} questions
                {subscription && !subscription.canAccessAll && (
                  <span className="text-amber-600 dark:text-amber-400">
                    {" "}(Limited to {subscription.maxQuestions} in free plan)
                  </span>
                )}
                {cacheHit && (
                  <span className="text-green-600 dark:text-green-400 ml-2">
                    <Zap className="h-3 w-3 inline mr-1" />
                    Cached
                    {cachePerformance && (
                      <span className="text-xs ml-1">
                        (saved {Math.round(cachePerformance.loadTime - cachePerformance.cacheTime)}ms)
                      </span>
                    )}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchQuestions(true)}
                disabled={loading}
                className="text-xs"
              >
                Refresh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearExpiredCache}
                disabled={loading}
                className="text-xs text-muted-foreground"
              >
                Clear Cache
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCacheStats(!showCacheStats)}
                className="text-xs text-muted-foreground"
              >
                <Info className="h-3 w-3 mr-1" />
                Cache Info
                {showCacheStats ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </Button>
              <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        {/* Cache Statistics Panel */}
        {showCacheStats && (
          <div className="px-6 py-4 border-b bg-muted/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {(() => {
                const stats = getCacheStats()
                return (
                  <>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-primary">{stats.validEntries}</div>
                      <div className="text-xs text-muted-foreground">Cached Pages</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-accent">{stats.totalEntries}</div>
                      <div className="text-xs text-muted-foreground">Total Entries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">{Math.round((stats.validEntries / Math.max(stats.totalEntries, 1)) * 100)}%</div>
                      <div className="text-xs text-muted-foreground">Cache Hit Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">{Math.round(stats.cacheSize / 1024)}KB</div>
                      <div className="text-xs text-muted-foreground">Cache Size</div>
                    </div>
                  </>
                )
              })()}
            </div>
            <div className="mt-3 text-xs text-muted-foreground text-center">
              Cache expires in 5 minutes • Prefetching next 2 pages • Max 50 entries
            </div>
          </div>
        )}
        
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Topics</TableHead>
                  <TableHead>Companies</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {premiumRequired 
                        ? "Upgrade to premium to access more questions"
                        : "No questions found matching your criteria"
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  questions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateProgress(question.id, question.status === "DONE" ? "NOT_DONE" : "DONE")}
                          disabled={!isAuthenticated}
                          className="p-0 h-auto"
                          title={!isAuthenticated ? "Sign in to track progress" : ""}
                        >
                          {question.status === "DONE" ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {question.title}
                          {question.link && (
                            <a
                              href={question.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TopicTags topics={cleanDisplayData(question.topics)} />
                      </TableCell>
                      <TableCell>
                        <CompanyTags companies={cleanDisplayData(question.companies)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{question.notesCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onNotesClick(question)}
                          disabled={!isAuthenticated}
                          title={!isAuthenticated ? "Sign in to add notes" : ""}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Notes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
                {!isAuthenticated && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                    (Sign in to access all pages)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || !isAuthenticated}
                  title={!isAuthenticated ? "Sign in to access more pages" : ""}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
