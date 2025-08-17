import { prisma } from "@/lib/prisma"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const plans = await prisma.premiumPlan.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        price: "asc",
      },
    })

    // If no plans exist, create default plans
    if (plans.length === 0) {
      const defaultPlans = [
        {
          name: "Student Plan",
          price: 49.0,
          currency: "INR",
          billingCycle: "MONTHLY",
          features: [
            "Access to all DSA questions",
            "Unlimited notes",
            "Progress tracking",
            "Export functionality",
            "Priority support"
          ],
          maxQuestions: -1, // Unlimited
          description: "Perfect for students preparing for technical interviews"
        },
        {
          name: "Professional Plan",
          price: 99.0,
          currency: "INR",
          billingCycle: "MONTHLY",
          features: [
            "Everything in Student Plan",
            "Advanced analytics",
            "Team collaboration",
            "Custom question sets",
            "API access",
            "Dedicated support"
          ],
          maxQuestions: -1, // Unlimited
          description: "For professionals and teams who need advanced features"
        }
      ]

      for (const plan of defaultPlans) {
        await prisma.premiumPlan.create({
          data: plan
        })
      }

      // Fetch the newly created plans
      const newPlans = await prisma.premiumPlan.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          price: "asc",
        },
      })

      return NextResponse.json({
        success: true,
        plans: newPlans,
      })
    }

    return NextResponse.json({
      success: true,
      plans,
    })
  } catch (error) {
    console.error("Error fetching premium plans:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
