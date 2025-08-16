import { authOptions } from "@/lib/auth"
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

    if (!questionId) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 })
    }

    // Get the current question's topics
    const currentQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      select: { topics: true },
    })

    if (!currentQuestion) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // Find related questions with overlapping topics
    const relatedQuestions = await prisma.question.findMany({
      where: {
        AND: [
          { id: { not: questionId } }, // Exclude current question
          {
            topics: {
              hasSome: currentQuestion.topics,
            },
          },
        ],
      },
      include: {
        notes: {
          where: {
            userId: (session.user as any).id,
          },
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
      take: 10,
    })

    // Filter to only questions that have notes
    const relatedWithNotes = relatedQuestions.filter((q) => q.notes.length > 0)

    return NextResponse.json({
      related: relatedWithNotes.map((q) => ({
        id: q.id,
        title: q.title,
        difficulty: q.difficulty,
        topics: q.topics,
        notesCount: q.notes.length,
      })),
    })
  } catch (error) {
    console.error("Error fetching related notes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
