"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Edit2, ExternalLink, Save, Search, Shield, Trash2, X } from "lucide-react"
import { useEffect, useState } from "react"

interface Question {
  id: string
  title: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  frequency: number
  acceptanceRate: number
  link: string
  topics: string[]
  companies: string[]
  createdAt: string
  updatedAt: string
}

interface EditableQuestion extends Omit<Question, 'topics' | 'companies'> {
  topics: string
  companies: string
}

export function QuestionsManagement() {
  const { toast } = useToast()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<EditableQuestion | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all")
  const [isAdmin, setIsAdmin] = useState(false) // This should be set based on user role

  // Check if user is admin using session
  useEffect(() => {
    // Since this component is only rendered in the admin page, 
    // we can assume the user is an admin if they can access this page
    setIsAdmin(true)
  }, [])

  // Fetch questions on component mount
  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/questions")
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
      } else {
        throw new Error("Failed to fetch questions")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (question: Question) => {
    setEditingId(question.id)
    setEditingData({
      ...question,
      topics: question.topics.join(", "),
      companies: question.companies.join(", "),
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingData(null)
  }

  const saveQuestion = async () => {
    if (!editingData) return

    try {
      // Validate data
      if (!editingData.title.trim()) {
        toast({
          title: "Validation Error",
          description: "Title is required",
          variant: "destructive",
        })
        return
      }

      if (!editingData.difficulty) {
        toast({
          title: "Validation Error",
          description: "Difficulty is required",
          variant: "destructive",
        })
        return
      }

      // Prepare data for API
      const updateData = {
        ...editingData,
        topics: editingData.topics.split(",").map(t => t.trim()).filter(t => t),
        companies: editingData.companies.split(",").map(c => c.trim()).filter(c => c),
      }

      const response = await fetch(`/api/admin/questions/${editingData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const updatedQuestion = await response.json()
        
        // Update local state
        setQuestions(prev => 
          prev.map(q => 
            q.id === editingData.id 
              ? { ...updatedQuestion, topics: updateData.topics, companies: updateData.companies }
              : q
          )
        )

        toast({
          title: "Success",
          description: "Question updated successfully",
        })

        setEditingId(null)
        setEditingData(null)
      } else {
        throw new Error("Failed to update question")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive",
      })
    }
  }

  const deleteQuestion = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/questions/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setQuestions(prev => prev.filter(q => q.id !== id))
        toast({
          title: "Success",
          description: "Question deleted successfully",
        })
        setDeleteConfirmId(null)
      } else {
        throw new Error("Failed to delete question")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete question",
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

  // Filter questions based on search and difficulty
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesDifficulty = filterDifficulty === "all" || question.difficulty === filterDifficulty
    return matchesSearch && matchesDifficulty
  })

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Questions Management</CardTitle>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Questions Management
          </CardTitle>
          <CardDescription>
            {isAdmin 
              ? "Edit and delete questions. Click on any cell to edit it. Only admins can delete questions."
              : "Click on any cell to edit question details. Only admins can delete questions."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Questions Table */}
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Acceptance Rate</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Topics</TableHead>
                  <TableHead>Companies</TableHead>
                  {isAdmin && <TableHead>Admin Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-muted-foreground">
                      No questions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuestions.map((question) => (
                    <TableRow key={question.id}>
                      {/* Title - Editable for everyone */}
                      <TableCell className="font-medium">
                        {editingId === question.id ? (
                          <Input
                            value={editingData?.title || ""}
                            onChange={(e) => setEditingData(prev => prev ? { ...prev, title: e.target.value } : null)}
                            className="w-full"
                            placeholder="Enter question title"
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                            onClick={() => startEditing(question)}
                            title="Click to edit"
                          >
                            {question.title}
                          </div>
                        )}
                      </TableCell>

                      {/* Difficulty - Editable for everyone */}
                      <TableCell>
                        {editingId === question.id ? (
                          <Select
                            value={editingData?.difficulty || "EASY"}
                            onValueChange={(value) => setEditingData(prev => prev ? { ...prev, difficulty: value as "EASY" | "MEDIUM" | "HARD" } : null)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EASY">EASY</SelectItem>
                              <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                              <SelectItem value="HARD">HARD</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                            onClick={() => startEditing(question)}
                            title="Click to edit"
                          >
                            <Badge className={getDifficultyColor(question.difficulty)}>
                              {question.difficulty}
                            </Badge>
                          </div>
                        )}
                      </TableCell>

                      {/* Frequency - Editable for everyone */}
                      <TableCell>
                        {editingId === question.id ? (
                          <Input
                            type="number"
                            value={editingData?.frequency || 0}
                            onChange={(e) => setEditingData(prev => prev ? { ...prev, frequency: parseFloat(e.target.value) || 0 } : null)}
                            className="w-20"
                            step="0.1"
                            min="0"
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                            onClick={() => startEditing(question)}
                            title="Click to edit"
                          >
                            {question.frequency ? question.frequency.toFixed(1) : 'N/A'}
                          </div>
                        )}
                      </TableCell>

                      {/* Acceptance Rate - Editable for everyone */}
                      <TableCell>
                        {editingId === question.id ? (
                          <Input
                            type="number"
                            value={editingData?.acceptanceRate || 0}
                            onChange={(e) => setEditingData(prev => prev ? { ...prev, acceptanceRate: parseFloat(e.target.value) || 0 } : null)}
                            className="w-20"
                            step="0.1"
                            min="0"
                            max="100"
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                            onClick={() => startEditing(question)}
                            title="Click to edit"
                          >
                            {question.acceptanceRate ? `${question.acceptanceRate.toFixed(1)}%` : 'N/A'}
                          </div>
                        )}
                      </TableCell>

                      {/* Link - Editable for everyone */}
                      <TableCell className="max-w-[200px]">
                        {editingId === question.id ? (
                          <Input
                            value={editingData?.link || ""}
                            onChange={(e) => setEditingData(prev => prev ? { ...prev, link: e.target.value } : null)}
                            className="w-full"
                            placeholder="https://..."
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                            onClick={() => startEditing(question)}
                            title="Click to edit"
                          >
                            <div className="flex items-center gap-2">
                              <a
                                href={question.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 truncate"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {question.link.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                              </a>
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </div>
                        )}
                      </TableCell>

                      {/* Topics - Editable for everyone */}
                      <TableCell className="max-w-[200px]">
                        {editingId === question.id ? (
                          <Textarea
                            value={editingData?.topics || ""}
                            onChange={(e) => setEditingData(prev => prev ? { ...prev, topics: e.target.value } : null)}
                            className="w-full min-h-[60px] text-sm"
                            placeholder="Array, Hash Table, Two Pointers"
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                            onClick={() => startEditing(question)}
                            title="Click to edit"
                          >
                            <div className="flex flex-wrap gap-1">
                              {question.topics.map((topic, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </TableCell>

                      {/* Companies - Editable for everyone */}
                      <TableCell className="max-w-[200px]">
                        {editingId === question.id ? (
                          <Textarea
                            value={editingData?.companies || ""}
                            onChange={(e) => setEditingData(prev => prev ? { ...prev, companies: e.target.value } : null)}
                            className="w-full min-h-[60px] text-sm"
                            placeholder="Google, Amazon, Microsoft"
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                            onClick={() => startEditing(question)}
                            title="Click to edit"
                          >
                            <div className="flex flex-wrap gap-1">
                              {question.companies.map((company, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {company}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </TableCell>

                      {/* Admin Actions - Only visible to admins */}
                      {isAdmin && (
                        <TableCell>
                          {editingId === question.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                onClick={saveQuestion}
                                className="h-8 w-8 p-0"
                                title="Save changes"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                                className="h-8 w-8 p-0"
                                title="Cancel editing"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditing(question)}
                                className="h-8 w-8 p-0"
                                title="Edit question"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteConfirmId(question.id)}
                                className="h-8 w-8 p-0"
                                title="Delete question"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {filteredQuestions.length} of {questions.length} questions
            </span>
            <div className="flex items-center gap-4">
              <span>
                {questions.filter(q => q.difficulty === "EASY").length} Easy • 
                {questions.filter(q => q.difficulty === "MEDIUM").length} Medium • 
                {questions.filter(q => q.difficulty === "HARD").length} Hard
              </span>
              {isAdmin && (
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <Shield className="h-3 w-3" />
                  <span className="text-xs">Admin Mode</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal - Only for admins */}
      {deleteConfirmId && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Delete Question</h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete this question?
                </p>
              </div>
            </div>
            
            <div className="bg-muted p-3 rounded-md mb-4">
              <p className="font-medium">
                {questions.find(q => q.id === deleteConfirmId)?.title}
              </p>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteQuestion(deleteConfirmId)}
              >
                Delete Question
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
