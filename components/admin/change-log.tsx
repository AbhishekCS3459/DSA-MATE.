"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, FileText, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"

interface ChangeLogEntry {
  id: string
  questionId?: string
  type: "NEW" | "UPDATED" | "DELETED"
  changes: any
  createdAt: string
  question?: {
    id: string
    title: string
    difficulty: string
  }
}

interface ChangeLogResponse {
  changes: ChangeLogEntry[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function ChangeLog() {
  const [changes, setChanges] = useState<ChangeLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"ALL" | "NEW" | "UPDATED" | "DELETED">("ALL")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  })

  useEffect(() => {
    fetchChanges()
  }, [filter, currentPage])

  const fetchChanges = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      })

      if (filter !== "ALL") {
        params.set("type", filter)
      }

      const response = await fetch(`/api/admin/changes?${params}`)
      const data: ChangeLogResponse = await response.json()

      if (response.ok) {
        setChanges(data.changes)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Error fetching changes:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "NEW":
        return <Plus className="h-4 w-4 text-green-600" />
      case "UPDATED":
        return <Edit className="h-4 w-4 text-yellow-600" />
      case "DELETED":
        return <Trash2 className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "NEW":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "UPDATED":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "DELETED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const renderChangeDiff = (change: ChangeLogEntry) => {
    const { changes } = change

    if (change.type === "NEW") {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-green-600">New Question Created</p>
          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-md">
            <pre className="text-xs overflow-x-auto">{JSON.stringify(changes.new, null, 2)}</pre>
          </div>
          {changes.csvRow && <p className="text-xs text-muted-foreground">From CSV row: {changes.csvRow}</p>}
        </div>
      )
    }

    if (change.type === "UPDATED") {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-yellow-600">Question Updated</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-red-600 mb-1">Before</p>
              <div className="bg-red-50 dark:bg-red-950 p-3 rounded-md">
                <pre className="text-xs overflow-x-auto">{JSON.stringify(changes.old, null, 2)}</pre>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-green-600 mb-1">After</p>
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-md">
                <pre className="text-xs overflow-x-auto">{JSON.stringify(changes.new, null, 2)}</pre>
              </div>
            </div>
          </div>
          {changes.csvRow && <p className="text-xs text-muted-foreground">From CSV row: {changes.csvRow}</p>}
        </div>
      )
    }

    return (
      <div className="bg-muted p-3 rounded-md">
        <pre className="text-xs overflow-x-auto">{JSON.stringify(changes, null, 2)}</pre>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Change Log
          </CardTitle>
          <CardDescription>Track all changes made to questions through CSV uploads and manual edits.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Changes</SelectItem>
                <SelectItem value="NEW">New Questions</SelectItem>
                <SelectItem value="UPDATED">Updated Questions</SelectItem>
                <SelectItem value="DELETED">Deleted Questions</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {pagination.total} total changes • Page {pagination.page} of {pagination.pages}
              </span>
            </div>
          </div>

          <ScrollArea className="h-[600px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading changes...</div>
              </div>
            ) : changes.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No changes found</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {changes.map((change) => (
                  <Card key={change.id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(change.type)}
                          <Badge className={getTypeColor(change.type)}>{change.type}</Badge>
                          {change.question && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{change.question.title}</span>
                              <Badge variant="outline" className="text-xs">
                                {change.question.difficulty}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(change.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>{renderChangeDiff(change)}</CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                disabled={currentPage === pagination.pages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
