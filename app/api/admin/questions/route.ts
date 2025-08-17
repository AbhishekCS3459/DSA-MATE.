import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { type NextRequest, NextResponse } from "next/server"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user || !(session.user as any)?.id || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const search = searchParams.get('search') || ''
    const difficulty = searchParams.get('difficulty') || ''

    // Calculate skip value for pagination
    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { topics: { hasSome: [search] } }
      ]
    }
    
    if (difficulty && difficulty !== 'all') {
      where.difficulty = difficulty
    }

    // Get total count for pagination
    const totalCount = await prisma.question.count({ where })

    // Get questions with pagination and filtering
    const questions = await prisma.question.findMany({
      where,
      orderBy: {
        title: "asc",
      },
      skip,
      take: limit,
    })

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      questions,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit
      }
    })
  } catch (error) {
    console.error("Error fetching questions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
