"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { QuestionFilters, SortOptions } from "@/lib/types"
import { ArrowUpDown, Filter, RefreshCw, Search, X } from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

interface QuestionsFiltersProps {
  filters: QuestionFilters
  sortOptions: SortOptions
  onFiltersChange: (filters: QuestionFilters) => void
  onSortChange: (sort: SortOptions) => void
}

export function QuestionsFilters({ filters, sortOptions, onFiltersChange, onSortChange }: QuestionsFiltersProps) {
  const { data: session } = useSession()
  const [availableTopics, setAvailableTopics] = useState<string[]>([])
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Fetch available filter options
    fetchFilterOptions()
  }, [])

  // Reset status filter to "ALL" for non-authenticated users
  useEffect(() => {
    if (!session?.user && filters.status !== "ALL") {
      onFiltersChange({ ...filters, status: "ALL" })
    }
  }, [session, filters.status, onFiltersChange])

  // Function to clean topics and companies data
  const cleanFilterData = (data: string[]) => {
    if (!Array.isArray(data)) return []
    
    return data
      .map(item => {
        if (typeof item !== 'string') return null
        
        // Remove quotes and clean the item
        let cleaned = item
          .trim()
          .replace(/^["'`]+|["'`]+$/g, '') // Remove quotes from start and end
          .replace(/["'`]/g, '') // Remove any remaining quotes
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .trim()
        
        // Skip empty or very short items
        if (cleaned.length < 2) return null
        
        return cleaned
      })
      .filter((item): item is string => item !== null && item !== 'undefined')
      .filter((item, index, arr) => arr.indexOf(item) === index) // Remove duplicates
      .sort() // Sort alphabetically
  }

  const fetchFilterOptions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/questions")
      const data = await response.json()
      if (response.ok) {
        // Clean the data before setting it
        const cleanedTopics = cleanFilterData(data.filters.topics)
        const cleanedCompanies = cleanFilterData(data.filters.companies)
        

        setAvailableTopics(cleanedTopics)
        setAvailableCompanies(cleanedCompanies)
      }
    } catch (error) {
      console.error("Error fetching filter options:", error)
    } finally {
      setLoading(false)
    }
  }

  const forceRefreshFilters = async () => {
    try {
      setLoading(true)
      // Force refresh by adding a cache-busting parameter
      const response = await fetch(`/api/questions?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      const data = await response.json()
      if (response.ok) {
        // Clean the data before setting it
        const cleanedTopics = cleanFilterData(data.filters.topics)
        const cleanedCompanies = cleanFilterData(data.filters.companies)
        
        setAvailableTopics(cleanedTopics)
        setAvailableCompanies(cleanedCompanies)
      }
    } catch (error) {
      console.error("Error force refreshing filter options:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value })
  }

  const handleDifficultyChange = (value: string) => {
    onFiltersChange({
      ...filters,
      difficulty: value === "all" ? undefined : (value as "EASY" | "MEDIUM" | "HARD"),
    })
  }

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === "all" ? "ALL" : (value as "DONE" | "NOT_DONE"),
    })
  }

  const handleTopicToggle = (topic: string) => {
    const currentTopics = filters.topics || []
    const newTopics = currentTopics.includes(topic)
      ? currentTopics.filter((t) => t !== topic)
      : [...currentTopics, topic]
    onFiltersChange({ ...filters, topics: newTopics })
  }

  const handleCompanyToggle = (company: string) => {
    const currentCompanies = filters.companies || []
    const newCompanies = currentCompanies.includes(company)
      ? currentCompanies.filter((c) => c !== company)
      : [...currentCompanies, company]
    onFiltersChange({ ...filters, companies: newCompanies })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      difficulty: undefined,
      topics: [],
      companies: [],
      status: "ALL",
    })
  }

  const hasActiveFilters =
    filters.search ||
    filters.difficulty ||
    (filters.topics && filters.topics.length > 0) ||
    (filters.companies && filters.companies.length > 0) ||
    (filters.status && filters.status !== "ALL")

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={filters.search || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Difficulty Filter */}
        <Select value={filters.difficulty || "all"} onValueChange={handleDifficultyChange}>
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

        {/* Status Filter */}
        <div className="relative">
          <Select 
            value={filters.status === "ALL" ? "all" : filters.status || "all"} 
            onValueChange={handleStatusChange}
            disabled={!session?.user}
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder={session?.user ? "Status" : "Sign in for status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="DONE">Completed</SelectItem>
              <SelectItem value="NOT_DONE">Not Done</SelectItem>
            </SelectContent>
          </Select>
          {!session?.user && (
            <div className="absolute -bottom-6 left-0 text-xs text-muted-foreground">
              Sign in to filter by status
            </div>
          )}
        </div>

        {/* Sort Options */}
        <Select
          value={`${sortOptions.field}-${sortOptions.direction}`}
          onValueChange={(value) => {
            const [field, direction] = value.split("-")
            onSortChange({
              field: field as "title" | "difficulty" | "frequency" | "acceptanceRate",
              direction: direction as "asc" | "desc",
            })
          }}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title-asc">Title A-Z</SelectItem>
            <SelectItem value="title-desc">Title Z-A</SelectItem>
            <SelectItem value="difficulty-asc">Difficulty ↑</SelectItem>
            <SelectItem value="difficulty-desc">Difficulty ↓</SelectItem>
            <SelectItem value="frequency-desc">Frequency ↓</SelectItem>
            <SelectItem value="acceptanceRate-desc">Acceptance ↓</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Refresh Filters Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={forceRefreshFilters}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Filters
        </Button>

        {/* Topics Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Topics
              {filters.topics && filters.topics.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.topics.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Select Topics</h4>
                <span className="text-xs text-muted-foreground">
                  {availableTopics.length} available
                </span>
              </div>
              
              {/* Search Topics */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search topics..."
                  className="pl-10"
                  onChange={(e) => {
                    const searchTerm = e.target.value.toLowerCase()
                    const filtered = availableTopics.filter(topic => 
                      topic.toLowerCase().includes(searchTerm)
                    )
                    // You could implement a local search state here if needed
                  }}
                />
              </div>
              
              {availableTopics.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No topics available. Try refreshing the filters.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {availableTopics.map((topic) => (
                    <div key={topic} className="flex items-center space-x-2">
                      <Checkbox
                        id={`topic-${topic}`}
                        checked={filters.topics?.includes(topic) || false}
                        onCheckedChange={() => handleTopicToggle(topic)}
                      />
                      <label
                        htmlFor={`topic-${topic}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 min-w-0"
                        title={topic}
                      >
                        <span className="truncate block">{topic}</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Companies Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Companies
              {filters.companies && filters.companies.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.companies.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Select Companies</h4>
                <span className="text-xs text-muted-foreground">
                  {availableCompanies.length} available
                </span>
              </div>
              {availableCompanies.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No companies available. Try refreshing the filters.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {availableCompanies.map((company) => (
                    <div key={company} className="flex items-center space-x-2">
                      <Checkbox
                        id={`company-${company}`}
                        checked={filters.companies?.includes(company) || false}
                        onCheckedChange={() => handleCompanyToggle(company)}
                      />
                      <label
                        htmlFor={`company-${company}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {company}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.difficulty && (
            <Badge variant="secondary">
              Difficulty: {filters.difficulty}
              <button
                onClick={() => handleDifficultyChange("all")}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.topics?.map((topic) => (
            <Badge key={topic} variant="secondary">
              {topic}
              <button
                onClick={() => handleTopicToggle(topic)}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.companies?.map((company) => (
            <Badge key={company} variant="secondary">
              {company}
              <button
                onClick={() => handleCompanyToggle(company)}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
