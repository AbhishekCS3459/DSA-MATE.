import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { planId, paymentMethod } = await request.json()

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 })
    }

    // Get the selected plan
    const plan = await prisma.premiumPlan.findUnique({
      where: { id: planId }
    })

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Invalid or inactive plan" }, { status: 400 })
    }

    // Calculate subscription dates
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1) // 1 month subscription

    // Create or update subscription
    const subscription = await prisma.subscription.upsert({
      where: {
        userId: (session.user as any).id,
      },
      update: {
        plan: plan.name,
        status: "ACTIVE",
        startDate,
        endDate,
        paymentMethod,
        amount: plan.price,
        currency: plan.currency,
        updatedAt: new Date(),
      },
      create: {
        userId: (session.user as any).id,
        plan: plan.name,
        status: "ACTIVE",
        startDate,
        endDate,
        paymentMethod,
        amount: plan.price,
        currency: plan.currency,
      },
    })

    return NextResponse.json({
      success: true,
      subscription,
      message: `Successfully subscribed to ${plan.name}`,
    })
  } catch (error) {
    console.error("Error subscribing to plan:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
