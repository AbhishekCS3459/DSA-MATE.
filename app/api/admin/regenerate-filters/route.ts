import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user || !(session.user as any)?.id || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    // Get all questions to regenerate filters
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

    const allTopics = [...new Set(allProcessedTopics)].sort()
    const allCompanies = [...new Set(allProcessedCompanies)].sort()

    // Clear the filters cache by invalidating it
    const { invalidateAllCaches } = await import("@/lib/cache")
    invalidateAllCaches()

    return NextResponse.json({
      success: true,
      message: "Filters cache regenerated successfully",
      topics: allTopics,
      companies: allCompanies,
      topicsCount: allTopics.length,
      companiesCount: allCompanies.length,
    })
  } catch (error) {
    console.error("Error regenerating filters:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
