import { authOptions } from "@/lib/auth"
import { getCacheStats, invalidateAllCaches } from "@/lib/cache"
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

    const stats = getCacheStats()
    
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error fetching cache stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user || !(session.user as any)?.id || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    invalidateAllCaches()
    
    return NextResponse.json({
      success: true,
      message: "All caches cleared successfully",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error clearing cache:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
