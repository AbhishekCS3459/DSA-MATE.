"use client"

import { PremiumUpgradePrompt } from "@/components/premium/premium-upgrade-prompt"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import type { Question, QuestionFilters, SortOptions } from "@/lib/types"
import { CheckCircle, ChevronLeft, ChevronRight, Circle, ExternalLink, FileText, Lock } from "lucide-react"
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
  const { toast } = useToast()
  const { data: session } = useSession()
  const [questions, setQuestions] = useState<QuestionWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [subscription, setSubscription] = useState<any>(null)
  const [premiumRequired, setPremiumRequired] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isPageRestricted, setIsPageRestricted] = useState(false)

  useEffect(() => {
    fetchQuestions()
  }, [filters, sortOptions, currentPage, pageSize])

  // Reset to page 1 when user is not authenticated
  useEffect(() => {
    if (!isAuthenticated && currentPage > 1) {
      setCurrentPage(1)
    }
  }, [isAuthenticated, currentPage])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: filters.search || "",
        difficulty: filters.difficulty || "",
        topics: filters.topics?.join(",") || "",
        companies: filters.companies?.join(",") || "",
        status: filters.status || "ALL",
        sortField: sortOptions.field,
        sortDirection: sortOptions.direction,
      })

      const response = await fetch(`/api/questions?${params}`)
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
        setTotalCount(data.totalCount || 0)
        setSubscription(data.subscription || null)
        setPremiumRequired(data.premiumRequired || false)
        setIsAuthenticated(data.isAuthenticated || false)
        setIsPageRestricted(data.isPageRestricted || false)
        
        // If page is restricted, reset to page 1
        if (data.isPageRestricted) {
          setCurrentPage(1)
        }
      } else {
        throw new Error("Failed to fetch questions")
      }
    } catch (error) {
      console.error("Error fetching questions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const cleanDisplayData = (data: string[]) => {
    if (!Array.isArray(data)) return []
    return data
      .map(item => {
        if (typeof item !== 'string') return null
        return item.trim().replace(/^["'`]+|["'`]+$/g, '').replace(/["'`]/g, '').trim()
      })
      .filter((item): item is string => item !== null)
      .filter((item, index, arr) => arr.indexOf(item) === index)
      .sort()
  }

  const handlePageSizeChange = (newPageSize: number) => {
    // Restrict non-authenticated users to reasonable page sizes
    if (!isAuthenticated && newPageSize > 25) {
      toast({
        title: "Page size restricted",
        description: "Sign in to access larger page sizes",
        variant: "destructive",
      })
      return
    }
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const updateProgress = async (questionId: string, status: "DONE" | "NOT_DONE") => {
    try {
      const response = await fetch("/api/questions/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId,
          status,
        }),
      })

      if (response.ok) {
        // Update local state
        setQuestions(prev =>
          prev.map(q =>
            q.id === questionId ? { ...q, status } : q
          )
        )

        toast({
          title: "Progress Updated",
          description: `Question marked as ${status === "DONE" ? "completed" : "not completed"}`,
        })
      } else {
        throw new Error("Failed to update progress")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      })
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "HARD":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)
  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalCount)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <CardDescription>Loading questions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Premium Upgrade Prompt */}
      {premiumRequired && subscription && (
        <PremiumUpgradePrompt
          currentCount={subscription.maxQuestions}
          maxFreeQuestions={100}
          totalQuestions={subscription.totalQuestions}
        />
      )}

      {/* Sign In Prompt for Non-Authenticated Users */}
      {!isAuthenticated && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Sign in to access more questions
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
                  You're currently viewing page 1 of {totalCount} questions. Sign in to access all pages and track your progress.
                </p>
                <div className="flex items-center gap-3">
                  <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/auth/signup">Sign Up</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Questions</CardTitle>
              <CardDescription>
                Showing {startIndex} to {endIndex} of {totalCount} questions
                {subscription && !subscription.canAccessAll && (
                  <span className="text-amber-600 dark:text-amber-400">
                    {" "}(Limited to {subscription.maxQuestions} in free plan)
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  {isAuthenticated && (
                    <>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {!isAuthenticated && (
                <span className="text-xs text-muted-foreground">
                  Sign in for more options
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Topics</TableHead>
                  <TableHead>Companies</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {premiumRequired 
                        ? "Upgrade to premium to access more questions"
                        : "No questions found matching your criteria"
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  questions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateProgress(question.id, question.status === "DONE" ? "NOT_DONE" : "DONE")}
                          disabled={!isAuthenticated}
                          className="p-0 h-auto"
                          title={!isAuthenticated ? "Sign in to track progress" : ""}
                        >
                          {question.status === "DONE" ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {question.title}
                          {question.link && (
                            <a
                              href={question.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TopicTags topics={cleanDisplayData(question.topics)} />
                      </TableCell>
                      <TableCell>
                        <CompanyTags companies={cleanDisplayData(question.companies)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{question.notesCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onNotesClick(question)}
                          disabled={!isAuthenticated}
                          title={!isAuthenticated ? "Sign in to add notes" : ""}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Notes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
                {!isAuthenticated && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                    (Sign in to access all pages)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || !isAuthenticated}
                  title={!isAuthenticated ? "Sign in to access more pages" : ""}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
