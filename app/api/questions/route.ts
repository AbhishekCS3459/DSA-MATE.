import { authOptions } from "@/lib/auth"
import {
  CACHE_TTL,
  generateQuestionsCacheKey,
  getCachedQuestionsData,
  getCacheHeaders,
  setCachedQuestionsData
} from "@/lib/cache"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { type NextRequest, NextResponse } from "next/server"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const search = searchParams.get("search") || ""
    const difficulty = searchParams.get("difficulty") as "EASY" | "MEDIUM" | "HARD" | null
    const topics = searchParams.get("topics")?.split(",").filter(Boolean) || []
    const companies = searchParams.get("companies")?.split(",").filter(Boolean) || []
    const status = searchParams.get("status") as "DONE" | "NOT_DONE" | "ALL" | null
    const sortField =
      (searchParams.get("sortField") as "title" | "difficulty" | "frequency" | "acceptanceRate") || "title"
    const sortDirection = (searchParams.get("sortDirection") as "asc" | "desc") || "asc"
    let page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    // Restrict non-authenticated users to page 1 only
    if (!session?.user && page > 1) {
      page = 1
    }

    // Check user subscription status
    let maxQuestions = 100 // Default for free users
    let canAccessAll = false
    let subscriptionStatus = null
    
    if (session?.user) {
      try {
        const subscriptionResponse = await fetch(`${request.nextUrl.origin}/api/premium/status`, {
          headers: {
            'Cookie': request.headers.get('cookie') || '',
          },
        })
        
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json()
          maxQuestions = subscriptionData.subscription.maxQuestions
          canAccessAll = subscriptionData.subscription.canAccessAll
          subscriptionStatus = subscriptionData.subscription
        }
      } catch (error) {
        console.error("Error checking subscription status:", error)
        // Continue with free user limits
      }
    }

    // Check if request is cacheable
    const isCacheable = !search && !status && page === 1 && limit <= 100
    const userId = (session?.user as any)?.id
    
    // Generate cache key
    const cacheKey = generateQuestionsCacheKey(searchParams, userId)
    
    // Try to get cached data for cacheable requests
    if (isCacheable) {
      const cachedData = getCachedQuestionsData(cacheKey)
      if (cachedData) {
        return NextResponse.json(cachedData, {
          headers: getCacheHeaders(true, 300) // 5 minutes cache
        })
      }
    }

    // Build where clause
    const where: any = {}

    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      }
    }

    if (difficulty) {
      where.difficulty = difficulty
    }

    if (topics.length > 0) {
      where.topics = {
        hasSome: topics,
      }
    }

    if (companies.length > 0) {
      where.companies = {
        hasSome: companies,
      }
    }

    // Build order by clause
    const orderBy: any = {}
    if (sortField === "difficulty") {
      // Custom ordering for difficulty
      orderBy.difficulty = sortDirection
    } else {
      orderBy[sortField] = sortDirection
    }

    // Fetch questions with pagination
    const questions = await prisma.question.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: userId
        ? {
            progress: {
              where: {
                userId,
              },
            },
            _count: {
              select: {
                notes: {
                  where: {
                    userId,
                  },
                },
              },
            },
          }
        : {
            _count: {
              select: {
                notes: true,
              },
            },
          },
    })

    // Filter by status if specified and user is logged in
    let filteredQuestions = questions
    let totalCount = await prisma.question.count({ where })
    
    if (status && status !== "ALL" && userId) {
      // Get questions with progress for status filtering
      const questionsWithProgress = await prisma.question.findMany({
        where,
        include: {
          progress: {
            where: {
              userId,
            },
          },
          _count: {
            select: {
              notes: {
                where: {
                  userId,
                },
              },
            },
          },
        },
      })
      
      filteredQuestions = questionsWithProgress.filter((question) => {
        const userProgress = question.progress?.[0]
        const currentStatus = userProgress?.status || "NOT_DONE"
        return currentStatus === status
      })
      
      // Update total count for status-filtered results
      totalCount = filteredQuestions.length
    }

    // Apply premium restrictions for free users
    if (!canAccessAll && totalCount > maxQuestions) {
      totalCount = maxQuestions
      
      // If this page would exceed the limit, adjust the results
      if ((page - 1) * limit >= maxQuestions) {
        filteredQuestions = []
      } else if (page * limit > maxQuestions) {
        filteredQuestions = filteredQuestions.slice(0, maxQuestions - (page - 1) * limit)
      }
    }

    // Get unique topics and companies for filter options (with caching)
    let allTopics: string[] = []
    let allCompanies: string[] = []
    
    const filtersCacheKey = 'filters:topics-companies'
    const cachedFilters = getCachedQuestionsData(filtersCacheKey)
    
    if (cachedFilters) {
      allTopics = cachedFilters.topics
      allCompanies = cachedFilters.companies
    } else {
      const allQuestions = await prisma.question.findMany({
        select: {
          topics: true,
          companies: true,
        },
      })

      // Clean and deduplicate topics and companies
      const cleanTopics = (topics: string[]) => {
        if (!Array.isArray(topics)) return []
        return topics
          .map(topic => {
            if (typeof topic !== 'string') return null
            return topic.trim().replace(/^["'`]+|["'`]+$/g, '').replace(/["'`]/g, '').trim()
          })
          .filter((topic): topic is string => topic !== null)
          .filter((topic, index, arr) => arr.indexOf(topic) === index)
      }

      const cleanCompanies = (companies: string[]) => {
        if (!Array.isArray(companies)) return []
        return companies
          .map(company => {
            if (typeof company !== 'string') return null
            return company.trim().replace(/^["'`]+|["'`]+$/g, '').replace(/["'`]/g, '').trim()
          })
          .filter((company): company is string => company !== null)
          .filter((company, index, arr) => arr.indexOf(company) === index)
      }

      // Process all topics and companies
      const allProcessedTopics = allQuestions.flatMap(q => cleanTopics(q.topics || []))
      const allProcessedCompanies = allQuestions.flatMap(q => cleanCompanies(q.companies || []))

      allTopics = [...new Set(allProcessedTopics)].sort()
      allCompanies = [...new Set(allProcessedCompanies)].sort()
      
      // Cache filter options for longer
      setCachedQuestionsData(filtersCacheKey, { topics: allTopics, companies: allCompanies }, CACHE_TTL.FILTERS)
    }

    const responseData = {
      questions: filteredQuestions.map((question) => {
        // Calculate acceptance rate dynamically if not provided
        let calculatedAcceptanceRate = question.acceptanceRate
        if (!calculatedAcceptanceRate && question.frequency) {
          // Use frequency as total applications and estimate accepted applications
          // This is a reasonable approximation for DSA questions
          const totalApplications = question.frequency
          const acceptedApplications = Math.round(totalApplications * 0.35) // Estimate 35% acceptance rate
          calculatedAcceptanceRate = totalApplications > 0 ? (acceptedApplications / totalApplications) * 100 : 0
        }

        return {
          ...question,
          acceptanceRate: calculatedAcceptanceRate,
          status: userId ? ((question as any).progress?.[0]?.status || "NOT_DONE") : "NOT_DONE",
          notesCount: userId ? ((question as any)._count?.notes || 0) : 0,
        }
      }),
      totalCount,
      filters: {
        topics: allTopics,
        companies: allCompanies,
      },
      subscription: subscriptionStatus,
      premiumRequired: !canAccessAll && totalCount > maxQuestions,
      isAuthenticated: !!session?.user,
      isPageRestricted: !session?.user && page > 1,
    }

    // Cache the response data if cacheable
    if (isCacheable) {
      setCachedQuestionsData(cacheKey, responseData, CACHE_TTL.QUESTIONS)
    }

    // Set appropriate cache headers
    const cacheHeaders = getCacheHeaders(isCacheable, isCacheable ? 300 : 60)
    
    return NextResponse.json(responseData, {
      headers: cacheHeaders
    })
  } catch (error) {
    console.error("Error fetching questions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
