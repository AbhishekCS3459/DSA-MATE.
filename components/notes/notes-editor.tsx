"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { getTemplateById, noteTemplates } from "@/lib/note-templates"
import type { Question, UserNote } from "@/lib/types"
import { ExternalLink, FileText, Save, Trash2, Volume2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"
import { VoiceRecorder } from "./voice-recorder"

interface NotesEditorProps {
  question: Question
  existingNote?: UserNote
  onSave: (note: UserNote) => void
  onDelete?: (noteId: string) => void
  onClose: () => void
}

export function NotesEditor({ question, existingNote, onSave, onDelete, onClose }: NotesEditorProps) {
  const [content, setContent] = useState(existingNote?.content || "")
  const [templateUsed, setTemplateUsed] = useState(existingNote?.templateUsed || "")
  const [voiceNoteUrl, setVoiceNoteUrl] = useState(existingNote?.voiceNoteUrl || "")
  const [isSaving, setIsSaving] = useState(false)
  const [relatedQuestions, setRelatedQuestions] = useState<any[]>([])
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)

  useEffect(() => {
    fetchRelatedQuestions()
  }, [question.id])

  const fetchRelatedQuestions = async () => {
    try {
      const response = await fetch(`/api/notes/related?questionId=${question.id}`)
      const data = await response.json()
      if (response.ok) {
        setRelatedQuestions(data.related)
      }
    } catch (error) {
      console.error("Error fetching related questions:", error)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === "none") {
      setTemplateUsed("")
      return
    }

    const template = getTemplateById(templateId)
    if (template) {
      setContent(template.content)
      setTemplateUsed(templateId)
    }
  }

  const handleSave = async () => {
    if (!content.trim()) return

    setIsSaving(true)
    try {
      const url = existingNote ? `/api/notes/${existingNote.id}` : "/api/notes"
      const method = existingNote ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: question.id,
          content,
          templateUsed: templateUsed || null,
          voiceNoteUrl: voiceNoteUrl || null,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        onSave(data.note)
      }
    } catch (error) {
      console.error("Error saving note:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!existingNote || !onDelete) return

    try {
      const response = await fetch(`/api/notes/${existingNote.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onDelete(existingNote.id)
      }
    } catch (error) {
      console.error("Error deleting note:", error)
    }
  }

  const handleVoiceNoteUploaded = (url: string) => {
    setVoiceNoteUrl(url)
    setShowVoiceRecorder(false)
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

  return (
    <div className="space-y-4">
      {/* Question Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className={getDifficultyColor(question.difficulty)}>{question.difficulty}</Badge>
            <h2 className="text-xl font-semibold">{question.title}</h2>
          </div>
          <div className="flex flex-wrap gap-1">
            {question.topics.map((topic) => (
              <Badge key={topic} variant="secondary" className="text-xs">
                {topic}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {question.link && (
            <Button variant="outline" size="sm" asChild>
              <Link href={question.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-3 space-y-4">
          {/* Template Selector */}
          <div className="flex items-center gap-4">
            <Select value={templateUsed || "none"} onValueChange={handleTemplateSelect}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Choose template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Template</SelectItem>
                {noteTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}>
              <Volume2 className="h-4 w-4 mr-2" />
              Voice Note
            </Button>
          </div>

          {showVoiceRecorder && (
            <VoiceRecorder
              onVoiceNoteUploaded={handleVoiceNoteUploaded}
              noteId={existingNote?.id || `temp-${Date.now()}`}
            />
          )}

          {voiceNoteUrl && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Voice Note</span>
                  <audio controls src={voiceNoteUrl} className="flex-1">
                    Your browser does not support the audio element.
                  </audio>
                  <Button variant="outline" size="sm" onClick={() => setVoiceNoteUrl("")}>
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Editor Tabs */}
          <Tabs defaultValue="write" className="w-full">
            <TabsList>
              <TabsTrigger value="write">Write</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="write" className="space-y-4">
              <Textarea
                placeholder="Write your notes in Markdown..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[400px] font-mono"
              />
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="border rounded-lg p-4 min-h-[400px] prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight, rehypeRaw]}>
                  {content || "*No content to preview*"}
                </ReactMarkdown>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} disabled={!content.trim() || isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : existingNote ? "Update Note" : "Save Note"}
              </Button>
              {existingNote && onDelete && (
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {content.length} characters • {content.split(/\s+/).filter(Boolean).length} words
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Template Info */}
          {templateUsed && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Template Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-medium text-sm">{getTemplateById(templateUsed)?.name}</p>
                  <p className="text-xs text-muted-foreground">{getTemplateById(templateUsed)?.description}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Questions */}
          {relatedQuestions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Related Problems
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {relatedQuestions.map((related) => (
                    <div key={related.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getDifficultyColor(related.difficulty)} variant="outline">
                          {related.difficulty}
                        </Badge>
                        <span className="text-sm font-medium truncate">{related.title}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {related.topics.slice(0, 2).map((topic: string) => (
                          <Badge key={topic} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{related.notesCount} notes</p>
                      <Separator className="my-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Markdown Cheatsheet */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Markdown Cheatsheet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div>
                  <code># Heading</code>
                </div>
                <div>
                  <code>**bold** *italic*</code>
                </div>
                <div>
                  <code>`code`</code>
                </div>
                <div>
                  <code>\`\`\`language</code>
                  <br />
                  <code>code block</code>
                  <br />
                  <code>\`\`\`</code>
                </div>
                <div>
                  <code>- list item</code>
                </div>
                <div>
                  <code>[link](url)</code>
                </div>
                <div>
                  <code>| table | header |</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
