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

    // Get all questions with user progress
    const questionsWithProgress = await prisma.question.findMany({
      include: {
        progress: {
          where: {
            userId: (session.user as any).id,
          },
        },
      },
    })

    // Calculate overall stats
    const totalQuestions = questionsWithProgress.length
    const solvedQuestions = questionsWithProgress.filter(
      (q) => q.progress.length > 0 && q.progress[0].status === "DONE",
    ).length

    // Calculate difficulty breakdown
    const difficultyStats = {
      EASY: { total: 0, solved: 0 },
      MEDIUM: { total: 0, solved: 0 },
      HARD: { total: 0, solved: 0 },
    }

    questionsWithProgress.forEach((question) => {
      difficultyStats[question.difficulty].total++
      if (question.progress.length > 0 && question.progress[0].status === "DONE") {
        difficultyStats[question.difficulty].solved++
      }
    })

    // Calculate topic breakdown
    const topicStats: Record<string, { total: number; solved: number }> = {}

    questionsWithProgress.forEach((question) => {
      question.topics.forEach((topic) => {
        if (!topicStats[topic]) {
          topicStats[topic] = { total: 0, solved: 0 }
        }
        topicStats[topic].total++
        if (question.progress.length > 0 && question.progress[0].status === "DONE") {
          topicStats[topic].solved++
        }
      })
    })

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentProgress = await prisma.userProgress.findMany({
      where: {
        userId: (session.user as any).id,
        updatedAt: {
          gte: thirtyDaysAgo,
        },
        status: "DONE",
      },
      include: {
        question: {
          select: {
            title: true,
            difficulty: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
    })

    // Get notes count
    const notesCount = await prisma.userNotes.count({
      where: {
        userId: (session.user as any).id,
      },
    })

    // Calculate streak (consecutive days with at least one solved question)
    const progressByDate = await prisma.userProgress.findMany({
      where: {
        userId: (session.user as any).id,
        status: "DONE",
      },
      select: {
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    let currentStreak = 0
    const today = new Date()
    const dates = new Set<string>()

    progressByDate.forEach((progress) => {
      const date = progress.updatedAt.toISOString().split("T")[0]
      dates.add(date)
    })

    const sortedDates = Array.from(dates).sort().reverse()
    let checkDate = new Date(today)

    for (const dateStr of sortedDates) {
      const progressDate = new Date(dateStr)
      const diffDays = Math.floor((checkDate.getTime() - progressDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 0 || diffDays === 1) {
        currentStreak++
        checkDate = progressDate
      } else {
        break
      }
    }

    return NextResponse.json({
      overall: {
        total: totalQuestions,
        solved: solvedQuestions,
        percentage: totalQuestions > 0 ? Math.round((solvedQuestions / totalQuestions) * 100) : 0,
      },
      difficulty: difficultyStats,
      topics: Object.entries(topicStats)
        .map(([topic, stats]) => ({
          topic,
          ...stats,
          percentage: stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0,
        }))
        .sort((a, b) => b.solved - a.solved)
        .slice(0, 10), // Top 10 topics
      recentActivity: recentProgress,
      notesCount,
      currentStreak,
    })
  } catch (error) {
    console.error("Error fetching profile stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
