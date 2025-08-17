import { authOptions } from "@/lib/auth"
import { invalidateQuestionsCache } from "@/lib/cache"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { type NextRequest, NextResponse } from "next/server"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user || !(session.user as any)?.id || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    const { title, difficulty, frequency, acceptanceRate, link, topics, companies } = await request.json()

    // Validate required fields
    if (!title || !difficulty) {
      return NextResponse.json({ error: "Title and difficulty are required" }, { status: 400 })
    }

    // Validate difficulty values
    if (!["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
      return NextResponse.json({ error: "Difficulty must be EASY, MEDIUM, or HARD" }, { status: 400 })
    }

    // Update the question
    const updatedQuestion = await prisma.question.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        difficulty,
        frequency: frequency || null,
        acceptanceRate: acceptanceRate || null,
        link: link || null,
        topics: topics || [],
        companies: companies || [],
        updatedAt: new Date(),
      },
    })

    // Log the change
    await prisma.changeLog.create({
      data: {
        questionId: updatedQuestion.id,
        type: "UPDATED",
        changes: {
          old: {}, // We could fetch old data here if needed
          new: {
            title: updatedQuestion.title,
            difficulty: updatedQuestion.difficulty,
            frequency: updatedQuestion.frequency,
            acceptanceRate: updatedQuestion.acceptanceRate,
            link: updatedQuestion.link,
            topics: updatedQuestion.topics,
            companies: updatedQuestion.companies,
          },
          adminEdit: true,
        },
      },
    })

    // Invalidate questions cache
    invalidateQuestionsCache()

    return NextResponse.json({
      success: true,
      question: updatedQuestion,
    })
  } catch (error) {
    console.error("Error updating question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user || !(session.user as any)?.id || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    // Get the question before deleting for logging
    const question = await prisma.question.findUnique({
      where: { id: params.id },
    })

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // Delete the question
    await prisma.question.delete({
      where: { id: params.id },
    })

    // Log the deletion
    await prisma.changeLog.create({
      data: {
        type: "DELETED",
        changes: {
          deleted: {
            title: question.title,
            difficulty: question.difficulty,
            frequency: question.frequency,
            acceptanceRate: question.acceptanceRate,
            link: question.link,
            topics: question.topics,
            companies: question.companies,
          },
          adminDelete: true,
        },
      },
    })

    // Invalidate questions cache
    invalidateQuestionsCache()

    return NextResponse.json({
      success: true,
      message: "Question deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
