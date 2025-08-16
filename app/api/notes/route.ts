import { authOptions } from "@/lib/auth"
import { invalidateQuestionsCache } from "@/lib/cache"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { type NextRequest, NextResponse } from "next/server"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get("questionId")
    const search = searchParams.get("search")

    const where: any = {
      userId: (session.user as any).id,
    }

    if (questionId) {
      where.questionId = questionId
    }

    if (search) {
      where.content = {
        contains: search,
        mode: "insensitive",
      }
    }

    const notes = await prisma.userNotes.findMany({
      where,
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
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error("Error fetching notes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { questionId, content, templateUsed, voiceNoteUrl } = await request.json()

    if (!questionId || !content) {
      return NextResponse.json({ error: "Question ID and content are required" }, { status: 400 })
    }

    const note = await prisma.userNotes.create({
      data: {
        userId: (session.user as any).id,
        questionId,
        content,
        templateUsed,
        voiceNoteUrl,
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

    // Invalidate questions cache since notes count changed
    invalidateQuestionsCache()

    return NextResponse.json({ note })
  } catch (error) {
    console.error("Error creating note:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
