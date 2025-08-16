"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import type { Question, UserNote } from "@/lib/types"
import { Calendar, FileText, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { NotesEditor } from "./notes-editor"

interface NotesModalProps {
  question: Question | null
  isOpen: boolean
  onClose: () => void
}

export function NotesModal({ question, isOpen, onClose }: NotesModalProps) {
  const { toast } = useToast()
  const [notes, setNotes] = useState<UserNote[]>([])
  const [selectedNote, setSelectedNote] = useState<UserNote | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (question && isOpen) {
      fetchNotes()
    }
  }, [question, isOpen])

  const fetchNotes = async () => {
    if (!question) return

    setLoading(true)
    try {
      const response = await fetch(`/api/notes?questionId=${question.id}`)
      const data = await response.json()
      if (response.ok) {
        setNotes(data.notes)
      }
    } catch (error) {
      console.error("Error fetching notes:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNote = (note: UserNote) => {
    if (selectedNote) {
      // Update existing note
      setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)))
    } else {
      // Add new note
      setNotes((prev) => [note, ...prev])
    }
    setSelectedNote(null)
    setIsCreating(false)
  }

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId))
    setSelectedNote(null)
    setIsCreating(false)
  }

  const handleCreateNew = () => {
    setSelectedNote(null)
    setIsCreating(true)
  }

  const handleEditNote = (note: UserNote) => {
    setSelectedNote(note)
    setIsCreating(false)
  }

  const handleBack = () => {
    setSelectedNote(null)
    setIsCreating(false)
  }

  if (!question) return null

  const showEditor = isCreating || selectedNote
  const showNotesList = !showEditor

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {showEditor ? (isCreating ? "Create Note" : "Edit Note") : `Notes for ${question.title}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {showNotesList && (
            <div className="p-6 pt-0">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {notes.length} {notes.length === 1 ? "note" : "notes"} for this question
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Note
                </Button>
              </div>

              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">Loading notes...</div>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No notes yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create your first note for this question to track your thoughts and solutions.
                    </p>
                    <Button onClick={handleCreateNew}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Note
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleEditNote(note)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {note.templateUsed && (
                              <Badge variant="outline" className="text-xs">
                                {note.templateUsed}
                              </Badge>
                            )}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(note.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="prose prose-sm max-w-none line-clamp-3">
                          {note.content.substring(0, 200)}
                          {note.content.length > 200 && "..."}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {showEditor && (
            <ScrollArea className="h-[600px] p-6 pt-0">
              <div className="mb-4">
                <Button variant="ghost" onClick={handleBack}>
                  ← Back to Notes
                </Button>
              </div>
              <NotesEditor
                question={question}
                existingNote={selectedNote || undefined}
                onSave={handleSaveNote}
                onDelete={selectedNote ? handleDeleteNote : undefined}
                onClose={handleBack}
              />
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
