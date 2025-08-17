import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { type NextRequest, NextResponse } from "next/server"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: (session.user as any)?.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as any)?.role,
        image: session.user.image,
      },
    })
  } catch (error) {
    console.error("Error fetching user info:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
