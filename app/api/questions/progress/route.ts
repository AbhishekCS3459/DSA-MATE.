import { authOptions } from "@/lib/auth"
import { invalidateQuestionsCache } from "@/lib/cache"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { type NextRequest, NextResponse } from "next/server"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { questionId, status } = await request.json()

    if (!questionId || !status || !["DONE", "NOT_DONE"].includes(status)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Upsert user progress
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_questionId: {
          userId: (session.user as any).id,
          questionId,
        },
      },
      update: {
        status,
        updatedAt: new Date(),
      },
      create: {
        userId: (session.user as any).id,
        questionId,
        status,
      },
    })

    // Invalidate questions cache since user progress changed
    invalidateQuestionsCache()

    return NextResponse.json({ success: true, progress })
  } catch (error) { 
    console.error("Error updating progress:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
