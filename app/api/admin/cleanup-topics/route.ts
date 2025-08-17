import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

// Improved cleanup function that handles various edge cases
function cleanAndDeduplicateArray(arr: string[]): string[] {
  if (!Array.isArray(arr)) {
    return []
  }
  
  const cleaned = arr
    .map(item => {
      if (typeof item !== 'string') {
        return null
      }
      
      // Remove all types of quotes and extra whitespace
      let cleaned = item
        .trim()
        .replace(/^["'`]+|["'`]+$/g, '') // Remove quotes from start and end
        .replace(/["'`]/g, '') // Remove any remaining quotes
        .trim()
      
      // Handle cases where the item might be a JSON string
      if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
        try {
          const parsed = JSON.parse(cleaned)
          if (Array.isArray(parsed)) {
            return parsed.map(p => String(p).trim()).filter(Boolean)
          }
        } catch (e) {
          // If JSON parsing fails, continue with the cleaned string
        }
      }
      
      return cleaned
    })
    .filter((item): item is string | string[] => item !== null) // Remove null values and type guard
    .flat() // Flatten any nested arrays from JSON parsing
    .filter((item, index, array) => array.indexOf(item) === index) // Remove duplicates
    .sort() // Sort alphabetically for consistency
  
  return cleaned
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user || !(session.user as any)?.id || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    // Get all questions
    const questions = await prisma.question.findMany({
      select: {
        id: true,
        topics: true,
        companies: true,
      },
    })

    let cleanedCount = 0
    const results = []
    let totalTopicsCleaned = 0
    let totalCompaniesCleaned = 0

    for (const question of questions) {
      const originalTopics = [...(question.topics || [])]
      const originalCompanies = [...(question.companies || [])]

      // Clean and deduplicate topics
      const cleanedTopics = cleanAndDeduplicateArray(question.topics || [])
      
      // Clean and deduplicate companies
      const cleanedCompanies = cleanAndDeduplicateArray(question.companies || [])

      // Check if cleaning is needed
      const topicsChanged = JSON.stringify(cleanedTopics) !== JSON.stringify(originalTopics)
      const companiesChanged = JSON.stringify(cleanedCompanies) !== JSON.stringify(originalCompanies)
      
      if (topicsChanged || companiesChanged) {
        // Update the question with cleaned data
        await prisma.question.update({
          where: { id: question.id },
          data: {
            topics: cleanedTopics,
            companies: cleanedCompanies,
            updatedAt: new Date(),
          },
        })

        cleanedCount++
        totalTopicsCleaned += originalTopics.length - cleanedTopics.length
        totalCompaniesCleaned += originalCompanies.length - cleanedCompanies.length
        
        results.push({
          questionId: question.id,
          oldTopics: originalTopics,
          newTopics: cleanedTopics,
          oldCompanies: originalCompanies,
          newCompanies: cleanedCompanies,
        })
      }
    }

    // Also clean up any cached filter data
    // This will be regenerated on next request
    const { invalidateAllCaches } = await import("@/lib/cache")
    invalidateAllCaches()

    return NextResponse.json({
      success: true,
      message: `Cleaned ${cleanedCount} questions. Removed ${totalTopicsCleaned} duplicate/malformed topics and ${totalCompaniesCleaned} duplicate/malformed companies.`,
      cleanedCount,
      totalTopicsCleaned,
      totalCompaniesCleaned,
      results,
    })
  } catch (error) {
    console.error("Error cleaning up topics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
