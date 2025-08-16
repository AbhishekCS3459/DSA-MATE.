"use client"

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ProgressChartsProps {
  difficultyStats: {
    EASY: { total: number; solved: number }
    MEDIUM: { total: number; solved: number }
    HARD: { total: number; solved: number }
  }
  topicStats: Array<{
    topic: string
    total: number
    solved: number
    percentage: number
  }>
}

const DIFFICULTY_COLORS = {
  EASY: "#22c55e",
  MEDIUM: "#f59e0b",
  HARD: "#ef4444",
}

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1"]

export function ProgressCharts({ difficultyStats, topicStats }: ProgressChartsProps) {
  // Prepare difficulty data for pie chart
  const difficultyData = Object.entries(difficultyStats).map(([difficulty, stats]) => ({
    name: difficulty,
    solved: stats.solved,
    total: stats.total,
    percentage: stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0,
  }))

  // Prepare topic data for bar chart (top 8 topics)
  const topTopics = topicStats.slice(0, 8)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Solved: {payload[0].value} / {payload[0].payload.total} ({payload[0].payload.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Solved: {data.solved} / {data.total} ({data.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Difficulty Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Difficulty Breakdown</CardTitle>
          <CardDescription>Your progress across different difficulty levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="solved"
                >
                  {difficultyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={DIFFICULTY_COLORS[entry.name as keyof typeof DIFFICULTY_COLORS]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {difficultyData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: DIFFICULTY_COLORS[entry.name as keyof typeof DIFFICULTY_COLORS] }}
                />
                <span className="text-sm">
                  {entry.name}: {entry.solved}/{entry.total}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Topics */}
      <Card>
        <CardHeader>
          <CardTitle>Top Topics</CardTitle>
          <CardDescription>Your progress in the most practiced topics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topTopics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="topic" angle={-45} textAnchor="end" height={80} fontSize={12} interval={0} />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="solved" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
