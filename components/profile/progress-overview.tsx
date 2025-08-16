"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Trophy, Target, FileText, Flame, Calendar, CheckCircle } from "lucide-react"

interface ProgressOverviewProps {
  stats: {
    overall: {
      total: number
      solved: number
      percentage: number
    }
    difficulty: {
      EASY: { total: number; solved: number }
      MEDIUM: { total: number; solved: number }
      HARD: { total: number; solved: number }
    }
    recentActivity: Array<{
      id: string
      updatedAt: string
      question: {
        title: string
        difficulty: string
      }
    }>
    notesCount: number
    currentStreak: number
  }
}

export function ProgressOverview({ stats }: ProgressOverviewProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "HARD":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Solved</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overall.solved}</div>
            <p className="text-xs text-muted-foreground">out of {stats.overall.total} questions</p>
            <Progress value={stats.overall.percentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overall.percentage}%</div>
            <p className="text-xs text-muted-foreground">completion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notes Written</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.notesCount}</div>
            <p className="text-xs text-muted-foreground">total notes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentStreak}</div>
            <p className="text-xs text-muted-foreground">days</p>
          </CardContent>
        </Card>
      </div>

      {/* Difficulty Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progress by Difficulty</CardTitle>
          <CardDescription>Your performance across different difficulty levels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(stats.difficulty).map(([difficulty, data]) => {
            const percentage = data.total > 0 ? Math.round((data.solved / data.total) * 100) : 0
            return (
              <div key={difficulty} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getDifficultyColor(difficulty)}>{difficulty}</Badge>
                    <span className="text-sm font-medium">
                      {data.solved} / {data.total}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">{percentage}%</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Questions you've solved recently</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
              <p className="text-xs text-muted-foreground">Start solving questions to see your progress here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">{activity.question.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={getDifficultyColor(activity.question.difficulty)}>
                    {activity.question.difficulty}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
