"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Clipboard, FileText, Upload, XCircle } from "lucide-react"
import Papa from "papaparse"
import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"

interface UploadResult {
  success: boolean
  results?: {
    processed: number
    created: number
    updated: number
    errors: string[]
  }
  message?: string
  error?: string
}

interface ValidationError {
  row: number
  column: string
  message: string
}

export function CSVUpload() {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [csvContent, setCsvContent] = useState("")
  const [activeTab, setActiveTab] = useState("upload")
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [showValidationPopup, setShowValidationPopup] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type === "text/csv") {
      setSelectedFile(file)
      setUploadResult(null)
      validateCSVFile(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    multiple: false,
  })

  const validateCSVFile = async (file: File) => {
    try {
      const text = await file.text()
      const parseResult = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.toLowerCase().trim(),
      })

      if (parseResult.errors.length > 0) {
        setValidationErrors([
          {
            row: 0,
            column: "CSV",
            message: `CSV parsing failed: ${parseResult.errors[0].message}`,
          },
        ])
        setShowValidationPopup(true)
        return
      }

      const errors: ValidationError[] = []
      const rows = parseResult.data

      rows.forEach((row: any, index: number) => {
        const rowNumber = index + 1

        // Check required fields
        if (!row.title || row.title.trim() === "") {
          errors.push({
            row: rowNumber,
            column: "title",
            message: "Title is required and cannot be empty",
          })
        }

        if (!row.difficulty || row.difficulty.trim() === "") {
          errors.push({
            row: rowNumber,
            column: "difficulty",
            message: "Difficulty is required and cannot be empty",
          })
        } else if (!["EASY", "MEDIUM", "HARD"].includes(row.difficulty.toUpperCase())) {
          errors.push({
            row: rowNumber,
            column: "difficulty",
            message: "Difficulty must be EASY, MEDIUM, or HARD",
          })
        }

        // Check if topics or companies are empty strings (not undefined, but empty)
        if (row.topics !== undefined && row.topics.trim() === "") {
          errors.push({
            row: rowNumber,
            column: "topics",
            message: "Topics cannot be empty string (use undefined/null for no topics)",
          })
        }

        if (row.companies !== undefined && row.companies.trim() === "") {
          errors.push({
            row: rowNumber,
            column: "companies",
            message: "Companies cannot be empty string (use undefined/null for no companies)",
          })
        }
      })

      if (errors.length > 0) {
        setValidationErrors(errors)
        setShowValidationPopup(true)
      }
    } catch (error) {
      setValidationErrors([
        {
          row: 0,
          column: "File",
          message: "Failed to read CSV file",
        },
      ])
      setShowValidationPopup(true)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return

    // Check if there are validation errors
    if (validationErrors.length > 0) {
      setShowValidationPopup(true)
      return
    }

    setUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      setUploadResult(result)
      
      if (result.success) {
        toast({
          title: "Upload Successful",
          description: result.message,
        })
      } else {
        toast({
          title: "Upload Failed",
          description: result.error || "Failed to upload CSV file",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = "Upload failed. Please try again."
      setUploadResult({
        success: false,
        error: errorMessage,
      })
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handlePasteUpload = async () => {
    if (!csvContent.trim()) return

    // Validate pasted content
    try {
      const parseResult = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.toLowerCase().trim(),
      })

      if (parseResult.errors.length > 0) {
        setValidationErrors([
          {
            row: 0,
            column: "CSV",
            message: `CSV parsing failed: ${parseResult.errors[0].message}`,
          },
        ])
        setShowValidationPopup(true)
        return
      }

      const errors: ValidationError[] = []
      const rows = parseResult.data

      rows.forEach((row: any, index: number) => {
        const rowNumber = index + 1

        // Check required fields
        if (!row.title || row.title.trim() === "") {
          errors.push({
            row: rowNumber,
            column: "title",
            message: "Title is required and cannot be empty",
          })
        }

        if (!row.difficulty || row.difficulty.trim() === "") {
          errors.push({
            row: rowNumber,
            column: "difficulty",
            message: "Difficulty is required and cannot be empty",
          })
        } else if (!["EASY", "MEDIUM", "HARD"].includes(row.difficulty.toUpperCase())) {
          errors.push({
            row: rowNumber,
            column: "difficulty",
            message: "Difficulty must be EASY, MEDIUM, or HARD",
          })
        }

        // Check if topics or companies are empty strings
        if (row.topics !== undefined && row.topics.trim() === "") {
          errors.push({
            row: rowNumber,
            column: "topics",
            message: "Topics cannot be empty string (use undefined/null for no topics)",
          })
        }

        if (row.companies !== undefined && row.companies.trim() === "") {
          errors.push({
            row: rowNumber,
            column: "companies",
            message: "Companies cannot be empty string (use undefined/null for no companies)",
          })
        }
      })

      if (errors.length > 0) {
        setValidationErrors(errors)
        setShowValidationPopup(true)
        return
      }

      setUploading(true)
      setUploadResult(null)

      try {
        // Create a CSV file from the pasted content
        const blob = new Blob([csvContent], { type: "text/csv" })
        const file = new File([blob], "pasted-data.csv", { type: "text/csv" })
        
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()
        setUploadResult(result)
        
        if (result.success) {
          toast({
            title: "Upload Successful",
            description: result.message,
          })
        } else {
          toast({
            title: "Upload Failed",
            description: result.error || "Failed to upload CSV content",
            variant: "destructive",
          })
        }
      } catch (error) {
        const errorMessage = "Upload failed. Please try again."
        setUploadResult({
          success: false,
          error: errorMessage,
        })
        toast({
          title: "Upload Failed",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setUploading(false)
      }
    } catch (error) {
      setValidationErrors([
        {
          row: 0,
          column: "CSV",
          message: "Failed to parse CSV content",
        },
      ])
      setShowValidationPopup(true)
    }
  }

  const clearPaste = () => {
    setCsvContent("")
    setUploadResult(null)
    setValidationErrors([])
  }

  const clearFile = () => {
    setSelectedFile(null)
    setUploadResult(null)
    setValidationErrors([])
  }

  const closeValidationPopup = () => {
    setShowValidationPopup(false)
    setValidationErrors([])
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            CSV Upload
          </CardTitle>
          <CardDescription>
            Upload a CSV file or paste CSV content to import DSA questions. The system will automatically handle duplicates by updating
            existing questions and appending new topics/companies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CSV Format Info */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    <strong>Required CSV format:</strong> title, difficulty, frequency (optional), acceptanceRate (optional),
                    link (optional), topics (comma-separated), companies (comma-separated)
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Important:</strong> Title and difficulty are required. For optional fields, use undefined/null instead of empty strings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Upload vs Paste */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                File Upload
              </TabsTrigger>
              <TabsTrigger value="paste" className="flex items-center gap-2">
                <Clipboard className="h-4 w-4" />
                Paste CSV
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              {/* File Drop Zone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : selectedFile
                      ? "border-green-500 bg-green-50 dark:bg-green-950"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
              >
                <input {...getInputProps()} />
                <div className="space-y-2">
                  {selectedFile ? (
                    <>
                      <FileText className="h-12 w-12 mx-auto text-green-600" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB • Ready to upload
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {isDragActive ? "Drop the CSV file here" : "Drag & drop a CSV file here"}
                        </p>
                        <p className="text-sm text-muted-foreground">or click to select a file</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* File Upload Action Buttons */}
              {selectedFile && (
                <div className="flex items-center gap-2">
                  <Button onClick={handleFileUpload} disabled={uploading} className="flex-1">
                    {uploading ? "Uploading..." : "Upload CSV"}
                  </Button>
                  <Button variant="outline" onClick={clearFile} disabled={uploading}>
                    Clear
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="paste" className="space-y-4">
              {/* CSV Paste Area */}
              <div className="space-y-2">
                <label htmlFor="csv-content" className="text-sm font-medium">
                  Paste your CSV content here:
                </label>
                <Textarea
                  id="csv-content"
                  placeholder="title,difficulty,frequency,acceptanceRate,link,topics,companies&#10;Two Sum,EASY,95,49.2,https://leetcode.com/problems/two-sum/,Array Hash Table,Google Amazon Microsoft"
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              {/* Paste Upload Action Buttons */}
              {csvContent.trim() && (
                <div className="flex items-center gap-2">
                  <Button onClick={handlePasteUpload} disabled={uploading} className="flex-1">
                    {uploading ? "Processing..." : "Process CSV"}
                  </Button>
                  <Button variant="outline" onClick={clearPaste} disabled={uploading}>
                    Clear
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing CSV...</span>
                <span>Please wait</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          )}

          {/* Upload Results */}
          {uploadResult && (
            <div className="space-y-4">
              {uploadResult.success ? (
                <Card className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-2">
                        <p className="font-medium text-green-800 dark:text-green-200">{uploadResult.message}</p>
                        {uploadResult.results && (
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {uploadResult.results.processed} Processed
                            </Badge>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {uploadResult.results.created} Created
                            </Badge>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              {uploadResult.results.updated} Updated
                            </Badge>
                            {uploadResult.results.errors.length > 0 && (
                              <Badge variant="secondary" className="bg-red-100 text-red-800">
                                {uploadResult.results.errors.length} Errors
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-red-500 bg-red-50 dark:bg-red-950">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="text-red-800 dark:text-red-200">{uploadResult.error}</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Error Details */}
              {uploadResult.results?.errors && uploadResult.results.errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Upload Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {uploadResult.results.errors.map((error, index) => (
                        <p key={index} className="text-sm text-red-600 dark:text-red-400">
                          {error}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sample CSV Format */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sample CSV Format</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
            {`title,difficulty,frequency,acceptanceRate,link,topics,companies
Two Sum,EASY,95,49.2,https://leetcode.com/problems/two-sum/,"Array,Hash Table","Google,Amazon,Microsoft"
Add Two Numbers,MEDIUM,85,38.1,https://leetcode.com/problems/add-two-numbers/,"Linked List,Math,Recursion","Amazon,Microsoft,Apple"`}
          </pre>
        </CardContent>
      </Card>

      {/* Validation Error Popup */}
      {showValidationPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-destructive">CSV Validation Errors</h3>
              <Button variant="ghost" size="sm" onClick={closeValidationPopup}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <p className="text-muted-foreground">
                Please fix the following errors in your CSV file before uploading:
              </p>
              
              {validationErrors.map((error, index) => (
                <div key={index} className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {error.row}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-destructive">
                        Row {error.row} - {error.column}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {error.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={closeValidationPopup}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
