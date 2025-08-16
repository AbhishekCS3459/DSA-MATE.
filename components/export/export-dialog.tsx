"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Presentation, File, Loader2 } from "lucide-react"

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const [exportType, setExportType] = useState<string>("")
  const [exportFormat, setExportFormat] = useState<string>("")
  const [isExporting, setIsExporting] = useState(false)
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(["EASY", "MEDIUM", "HARD"])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [exportLimit, setExportLimit] = useState<string>("50")

  const exportTypes = [
    {
      id: "solved-problems",
      name: "Solved Problems",
      description: "Export all questions you've marked as completed",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: "all-notes",
      name: "All Notes",
      description: "Export all your notes across all questions",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: "interview-prep",
      name: "Interview Prep Packet",
      description: "Customized export for interview preparation",
      icon: <Presentation className="h-5 w-5" />,
    },
  ]

  const exportFormats = [
    {
      id: "pdf",
      name: "PDF",
      description: "Portable Document Format",
      icon: <File className="h-5 w-5 text-red-600" />,
    },
    {
      id: "docx",
      name: "Word Document",
      description: "Microsoft Word format",
      icon: <File className="h-5 w-5 text-blue-600" />,
    },
    {
      id: "pptx",
      name: "PowerPoint",
      description: "Microsoft PowerPoint format",
      icon: <Presentation className="h-5 w-5 text-orange-600" />,
    },
  ]

  const difficulties = ["EASY", "MEDIUM", "HARD"]
  const commonTopics = [
    "Array",
    "String",
    "Hash Table",
    "Dynamic Programming",
    "Binary Search",
    "Two Pointers",
    "Sliding Window",
    "Linked List",
    "Tree",
    "Graph",
  ]

  const handleDifficultyChange = (difficulty: string, checked: boolean) => {
    if (checked) {
      setSelectedDifficulties([...selectedDifficulties, difficulty])
    } else {
      setSelectedDifficulties(selectedDifficulties.filter((d) => d !== difficulty))
    }
  }

  const handleTopicChange = (topic: string, checked: boolean) => {
    if (checked) {
      setSelectedTopics([...selectedTopics, topic])
    } else {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic))
    }
  }

  const handleExport = async () => {
    if (!exportType || !exportFormat) return

    setIsExporting(true)
    try {
      const options: any = {}

      if (exportType === "interview-prep") {
        options.difficulty = selectedDifficulties
        options.topics = selectedTopics
        options.limit = Number.parseInt(exportLimit)
      }

      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: exportType,
          format: exportFormat,
          options,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `dsa-export-${exportType}-${Date.now()}.${exportFormat}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        onClose()
      } else {
        console.error("Export failed")
      }
    } catch (error) {
      console.error("Export error:", error)
    } finally {
      setIsExporting(false)
    }
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Your Data
          </DialogTitle>
          <DialogDescription>Choose what to export and in which format</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">What would you like to export?</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {exportTypes.map((type) => (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-colors ${
                    exportType === type.id ? "ring-2 ring-primary" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setExportType(type.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {type.icon}
                      {type.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs">{type.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          {exportType && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Choose export format</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {exportFormats.map((format) => (
                  <Card
                    key={format.id}
                    className={`cursor-pointer transition-colors ${
                      exportFormat === format.id ? "ring-2 ring-primary" : "hover:bg-muted/50"
                    }`}
                    onClick={() => setExportFormat(format.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {format.icon}
                        {format.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs">{format.description}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Interview Prep Options */}
          {exportType === "interview-prep" && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Customize your interview prep packet</Label>

              {/* Difficulty Selection */}
              <div className="space-y-2">
                <Label className="text-sm">Difficulty Levels</Label>
                <div className="flex flex-wrap gap-2">
                  {difficulties.map((difficulty) => (
                    <div key={difficulty} className="flex items-center space-x-2">
                      <Checkbox
                        id={`diff-${difficulty}`}
                        checked={selectedDifficulties.includes(difficulty)}
                        onCheckedChange={(checked) => handleDifficultyChange(difficulty, checked as boolean)}
                      />
                      <Label htmlFor={`diff-${difficulty}`}>
                        <Badge className={getDifficultyColor(difficulty)}>{difficulty}</Badge>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Topic Selection */}
              <div className="space-y-2">
                <Label className="text-sm">Topics (optional - leave empty for all topics)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {commonTopics.map((topic) => (
                    <div key={topic} className="flex items-center space-x-2">
                      <Checkbox
                        id={`topic-${topic}`}
                        checked={selectedTopics.includes(topic)}
                        onCheckedChange={(checked) => handleTopicChange(topic, checked as boolean)}
                      />
                      <Label htmlFor={`topic-${topic}`} className="text-sm">
                        {topic}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Limit Selection */}
              <div className="space-y-2">
                <Label className="text-sm">Maximum Questions</Label>
                <Select value={exportLimit} onValueChange={setExportLimit}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 questions</SelectItem>
                    <SelectItem value="50">50 questions</SelectItem>
                    <SelectItem value="100">100 questions</SelectItem>
                    <SelectItem value="200">200 questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Export Button */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {exportType && exportFormat && (
                <span>
                  Ready to export {exportType.replace("-", " ")} as {exportFormat.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose} disabled={isExporting}>
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={!exportType || !exportFormat || isExporting}>
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
