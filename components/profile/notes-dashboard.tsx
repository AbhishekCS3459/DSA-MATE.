"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, FileText, Calendar, ExternalLink, Filter } from "lucide-react"
import Link from "next/link"
import type { UserNote } from "@/lib/types"

interface NotesWithQuestion extends UserNote {
  question: {
    id: string
    title: string
    difficulty: string
    topics: string[]
  }
}

export function NotesDashboard() {
  const [notes, setNotes] = useState<NotesWithQuestion[]>([])
  const [filteredNotes, setFilteredNotes] = useState<NotesWithQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [topicFilter, setTopicFilter] = useState<string>("all")
  const [availableTopics, setAvailableTopics] = useState<string[]>([])

  useEffect(() => {
    fetchNotes()
  }, [])

  useEffect(() => {
    filterNotes()
  }, [notes, searchQuery, difficultyFilter, topicFilter])

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/notes")
      const data = await response.json()
      if (response.ok) {
        setNotes(data.notes)
        // Extract unique topics
        const topics = new Set<string>()
        data.notes.forEach((note: NotesWithQuestion) => {
          note.question.topics.forEach((topic: string) => topics.add(topic))
        })
        setAvailableTopics(Array.from(topics).sort())
      }
    } catch (error) {
      console.error("Error fetching notes:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterNotes = () => {
    let filtered = notes

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (note) =>
          note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.question.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Difficulty filter
    if (difficultyFilter !== "all") {
      filtered = filtered.filter((note) => note.question.difficulty === difficultyFilter)
    }

    // Topic filter
    if (topicFilter !== "all") {
      filtered = filtered.filter((note) => note.question.topics.includes(topicFilter))
    }

    setFilteredNotes(filtered)
  }

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

  const clearFilters = () => {
    setSearchQuery("")
    setDifficultyFilter("all")
    setTopicFilter("all")
  }

  const hasActiveFilters = searchQuery || difficultyFilter !== "all" || topicFilter !== "all"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          My Notes
        </CardTitle>
        <CardDescription>All your notes across different questions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes and questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="EASY">Easy</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HARD">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {availableTopics.map((topic) => (
                <SelectItem key={topic} value={topic}>
                  {topic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {/* Notes List */}
        <ScrollArea className="h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading notes...</div>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {hasActiveFilters ? "No notes match your filters" : "No notes yet"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {hasActiveFilters
                  ? "Try adjusting your search criteria"
                  : "Start taking notes on questions to see them here"}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotes.map((note) => (
                <Card key={note.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={getDifficultyColor(note.question.difficulty)}>
                          {note.question.difficulty}
                        </Badge>
                        <h4 className="font-medium">{note.question.title}</h4>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/?question=${note.question.id}`}>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {note.question.topics.slice(0, 3).map((topic) => (
                        <Badge key={topic} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                      {note.question.topics.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{note.question.topics.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="prose prose-sm max-w-none line-clamp-3">
                      {note.content.substring(0, 300)}
                      {note.content.length > 300 && "..."}
                    </div>

                    {note.templateUsed && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          Template: {note.templateUsed}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Summary */}
        {!loading && (
          <div className="text-sm text-muted-foreground text-center">
            Showing {filteredNotes.length} of {notes.length} notes
          </div>
        )}
      </CardContent>
    </Card>
  )
}
