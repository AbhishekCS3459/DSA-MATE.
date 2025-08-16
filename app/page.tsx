"use client"

import { UserNav } from "@/components/auth/user-nav"
import { ExportDialog } from "@/components/export/export-dialog"
import { NotesModal } from "@/components/notes/notes-modal"
import { QuestionsFilters } from "@/components/questions/questions-filters"
import { QuestionsTable } from "@/components/questions/questions-table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { Question, QuestionFilters, SortOptions } from "@/lib/types"
import { BookOpen, Download, TrendingUp } from "lucide-react"
import { useState } from "react"

export default function HomePage() {
  const { toast } = useToast()
  const [filters, setFilters] = useState<QuestionFilters>({
    search: "",
    difficulty: undefined,
    topics: [],
    companies: [],
    status: "ALL",
  })

  const [sortOptions, setSortOptions] = useState<SortOptions>({
    field: "title",
    direction: "asc",
  })

  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

  const handleNotesClick = (question: Question) => {
    setSelectedQuestion(question)
    setIsNotesModalOpen(true)
  }

  const handleCloseNotesModal = () => {
    setIsNotesModalOpen(false)
    setSelectedQuestion(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                DSA Mate
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExportDialogOpen(true)}
                className="hidden sm:flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <UserNav />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card-hover bg-card border rounded-lg p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mx-auto mb-3">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-serif font-semibold text-lg mb-1">Practice Problems</h3>
              <p className="text-muted-foreground text-sm">Curated DSA questions</p>
            </div>
            <div className="card-hover bg-card border rounded-lg p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-accent/10 rounded-lg mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-serif font-semibold text-lg mb-1">Track Progress</h3>
              <p className="text-muted-foreground text-sm">Monitor your improvement</p>
            </div>
            <div className="card-hover bg-card border rounded-lg p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mx-auto mb-3">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-serif font-semibold text-lg mb-1">Export Notes</h3>
              <p className="text-muted-foreground text-sm">PDF, Word, PowerPoint</p>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <QuestionsFilters
              filters={filters}
              sortOptions={sortOptions}
              onFiltersChange={setFilters}
              onSortChange={setSortOptions}
            />
          </div>

          <div className="bg-card border rounded-lg overflow-hidden">
            <QuestionsTable filters={filters} sortOptions={sortOptions} onNotesClick={handleNotesClick} />
          </div>
        </div>
      </main>

      {/* Notes Modal */}
      <NotesModal question={selectedQuestion} isOpen={isNotesModalOpen} onClose={handleCloseNotesModal} />

      {/* Export Dialog */}
      <ExportDialog isOpen={isExportDialogOpen} onClose={() => setIsExportDialogOpen(false)} />
    </div>
  )
}
