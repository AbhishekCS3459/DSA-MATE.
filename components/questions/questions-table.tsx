"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import type { Question, QuestionFilters, SortOptions } from "@/lib/types"
import { BookOpen, ChevronLeft, ChevronRight, ExternalLink, FileText, Loader2, RefreshCw } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { CompanyTags } from "./company-tags"
import { TopicTags } from "./topic-tags"
    
interface QuestionsTableProps {
  filters: QuestionFilters
  sortOptions: SortOptions
  onNotesClick: (question: Question) => void
}

interface QuestionWithStatus extends Question {
  status: "DONE" | "NOT_DONE"
  notesCount: number
}

export function QuestionsTable({ filters, sortOptions, onNotesClick }: QuestionsTableProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [questions, setQuestions] = useState<QuestionWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingProgress, setUpdatingProgress] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalQuestions, setTotalQuestions] = useState(0)

  // Function to clean topics and companies data
  const cleanDisplayData = (data: string[]) => {
    if (!Array.isArray(data)) return []
    
    return data
      .map(item => {
        if (typeof item !== 'string') return null
        
        // Remove quotes and clean the item
        let cleaned = item
          .trim()
          .replace(/^["'`]+|["'`]+$/g, '') // Remove quotes from start and end
          .replace(/["'`]/g, '') // Remove any remaining quotes
          .trim()
        
        return cleaned
      })
      .filter((item): item is string => item !== null && item !== 'undefined')
      .filter((item, index, arr) => arr.indexOf(item) === index) // Remove duplicates
  }

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
    fetchQuestions()
  }, [filters, sortOptions])

  useEffect(() => {
    fetchQuestions()
  }, [currentPage, pageSize])

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      if (filters.search) params.set("search", filters.search)
      if (filters.difficulty) params.set("difficulty", filters.difficulty)
      if (filters.topics?.length) params.set("topics", filters.topics.join(","))
      if (filters.companies?.length) params.set("companies", filters.companies.join(","))
      if (filters.status) params.set("status", filters.status)
      params.set("sortField", sortOptions.field)
      params.set("sortDirection", sortOptions.direction)
      params.set("page", currentPage.toString())
      params.set("limit", pageSize.toString())

      const response = await fetch(`/api/questions?${params}`)
      const data = await response.json()

      if (response.ok) {
        setQuestions(data.questions)
        setTotalQuestions(data.totalCount || 0)
      }
    } catch (error) {
      console.error("Error fetching questions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  const updateProgress = async (questionId: string, status: "DONE" | "NOT_DONE") => {
    if (!session) return

    setUpdatingProgress(questionId)
    try {
      const response = await fetch("/api/questions/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questionId, status }),
      })

      if (response.ok) {
        setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, status } : q)))
        toast({
          title: "Progress Updated",
          description: `Question marked as ${status === "DONE" ? "completed" : "not done"}`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update progress. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating progress:", error)
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingProgress(null)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
      case "MEDIUM":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800"
      case "HARD":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-visible">

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {session && <TableHead className="w-12 font-serif font-semibold">Status</TableHead>}
            <TableHead className="font-serif font-semibold">Difficulty</TableHead>
            <TableHead className="font-serif font-semibold">Title</TableHead>
            <TableHead className="font-serif font-semibold">Frequency</TableHead>
            <TableHead className="font-serif font-semibold">Acceptance</TableHead>
            <TableHead className="font-serif font-semibold">Topics</TableHead>
            <TableHead className="font-serif font-semibold">Companies</TableHead>
            <TableHead className="font-serif font-semibold">Link</TableHead>
            <TableHead className="font-serif font-semibold">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={session ? 9 : 8} className="text-center py-12">
                <div className="space-y-3">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground font-medium">No questions found matching your criteria.</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            questions.map((question) => (
              <TableRow key={question.id} className="hover:bg-muted/30 transition-colors">
                {session && (
                  <TableCell>
                    <Checkbox
                      checked={question.status === "DONE"}
                      onCheckedChange={(checked) => updateProgress(question.id, checked ? "DONE" : "NOT_DONE")}
                      disabled={updatingProgress === question.id}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Badge className={`${getDifficultyColor(question.difficulty)} font-medium`}>
                    {question.difficulty}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold text-foreground">{question.title}</TableCell>
                <TableCell className="text-muted-foreground">{question.frequency || "-"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {question.acceptanceRate ? `${question.acceptanceRate}%` : "-"}
                </TableCell>
                <TableCell>
                  <TopicTags topics={cleanDisplayData(question.topics)} maxVisible={3} />
                </TableCell>
                <TableCell>
                  <CompanyTags companies={cleanDisplayData(question.companies)} maxVisible={2} />
                </TableCell>
                <TableCell>
                  {question.link && (
                    <Link href={question.link} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNotesClick(question)}
                    className="flex items-center gap-1 hover:bg-accent/10 hover:text-accent"
                  >
                    <FileText className="h-4 w-4" />
                    {question.notesCount > 0 && (
                      <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded-full">
                        {question.notesCount}
                      </span>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      {totalQuestions > 0 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {((currentPage - 1) * pageSize) + 1} to{" "}
              {Math.min(currentPage * pageSize, totalQuestions)} of {totalQuestions} questions
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pagination Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, Math.ceil(totalQuestions / pageSize)) }, (_, i) => {
                  const page = i + 1
                  if (page === currentPage) {
                    return (
                      <Button key={page} size="sm" variant="default" className="w-8 h-8">
                        {page}
                      </Button>
                    )
                  }
                  return (
                    <Button
                      key={page}
                      size="sm"
                      variant="outline"
                      className="w-8 h-8"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= Math.ceil(totalQuestions / pageSize)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
