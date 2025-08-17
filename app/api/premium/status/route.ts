import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: {
        userId: (session.user as any).id,
      },
    })

    // Get total questions count
    const totalQuestions = await prisma.question.count()
    
    // Determine access level
    let accessLevel = "FREE"
    let maxQuestions = 100
    let isActive = false
    let planName = "Free Plan"
    let endDate = null

    if (subscription && subscription.status === "ACTIVE") {
      const now = new Date()
      if (subscription.endDate > now) {
        accessLevel = subscription.plan
        maxQuestions = -1 // Unlimited
        isActive = true
        planName = subscription.plan
        endDate = subscription.endDate
      }
    }

    return NextResponse.json({
      success: true,
      subscription: {
        accessLevel,
        maxQuestions,
        isActive,
        planName,
        endDate,
        totalQuestions,
        canAccessAll: maxQuestions === -1,
      },
    })
  } catch (error) {
    console.error("Error fetching subscription status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
