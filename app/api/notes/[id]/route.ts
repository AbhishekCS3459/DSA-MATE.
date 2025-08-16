import { authOptions } from "@/lib/auth"
import { invalidateQuestionsCache } from "@/lib/cache"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { type NextRequest, NextResponse } from "next/server"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, templateUsed, voiceNoteUrl } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const note = await prisma.userNotes.update({
      where: {
        id: params.id,
        userId: (session.user as any).id, // Ensure user owns the note
      },
      data: {
        content,
        templateUsed,
        voiceNoteUrl,
        updatedAt: new Date(),
      },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            topics: true,
          },
        },
      },
    })

    // Invalidate questions cache since notes were updated
    invalidateQuestionsCache()

    return NextResponse.json({ note })
  } catch (error) {
    console.error("Error updating note:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.userNotes.delete({
      where: {
        id: params.id,
        userId: (session.user as any).id, // Ensure user owns the note
      },
    })

    // Invalidate questions cache since notes were deleted
    invalidateQuestionsCache()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting note:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
