import { authOptions } from "@/lib/auth"
import { invalidateQuestionsCache } from "@/lib/cache"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { type NextRequest, NextResponse } from "next/server"
import Papa from "papaparse"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

interface CSVRow {
  title: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  frequency?: string
  acceptanceRate?: string
  link?: string
  topics?: string
  companies?: string
}

function calculateAcceptanceRate(frequency: number | null, acceptanceRate: string | null): number | null {
  if (acceptanceRate) {
    return Number.parseFloat(acceptanceRate)
  }
  
  if (frequency && frequency > 0) {
    // Estimate acceptance rate based on frequency
    // Higher frequency questions tend to have lower acceptance rates
    if (frequency >= 80) return 25.0 // Very popular questions are usually harder
    if (frequency >= 60) return 35.0 // Popular questions
    if (frequency >= 40) return 45.0 // Medium popularity
    if (frequency >= 20) return 55.0 // Less popular
    return 65.0 // Rare questions are usually easier
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user || !(session.user as any)?.id || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "File must be a CSV" }, { status: 400 })
    }

    // Read and parse CSV
    const text = await file.text()
    const parseResult = Papa.parse<CSVRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim(),
    })

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        {
          error: "CSV parsing failed",
          details: parseResult.errors,
        },
        { status: 400 },
      )
    }

    const rows = parseResult.data
    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: [] as string[],
    }

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      try {
        // Validate required fields
        if (!row.title || row.title.trim() === "") {
          results.errors.push(`Row ${i + 1}: Title is required and cannot be empty`)
          continue
        }

        if (!row.difficulty || row.difficulty.trim() === "") {
          results.errors.push(`Row ${i + 1}: Difficulty is required and cannot be empty`)
          continue
        }

        // Validate difficulty values
        if (!["EASY", "MEDIUM", "HARD"].includes(row.difficulty.toUpperCase())) {
          results.errors.push(`Row ${i + 1}: Difficulty must be EASY, MEDIUM, or HARD`)
          continue
        }

        // Check for empty strings in optional fields (not undefined, but empty)
        if (row.topics !== undefined && row.topics.trim() === "") {
          results.errors.push(`Row ${i + 1}: Topics cannot be empty string (use undefined/null for no topics)`)
          continue
        }

        if (row.companies !== undefined && row.companies.trim() === "") {
          results.errors.push(`Row ${i + 1}: Companies cannot be empty string (use undefined/null for no companies)`)
          continue
        }

        // Parse topics and companies
        const topics = row.topics
          ? row.topics
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : []
        const companies = row.companies
          ? row.companies
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean)
          : []

        // Check if question already exists
        const existingQuestion = await prisma.question.findFirst({
          where: {
            title: {
              equals: row.title.trim(),
              mode: "insensitive",
            },
          },
        })

        if (existingQuestion) {
          // Update existing question with deduplication logic
          const oldData = {
            title: existingQuestion.title,
            difficulty: existingQuestion.difficulty,
            frequency: existingQuestion.frequency,
            acceptanceRate: existingQuestion.acceptanceRate,
            link: existingQuestion.link,
            topics: existingQuestion.topics,
            companies: existingQuestion.companies,
          }

          // Merge topics and companies (append new ones)
          const mergedTopics = [...new Set([...existingQuestion.topics, ...topics])]
          const mergedCompanies = [...new Set([...existingQuestion.companies, ...companies])]

          const frequency = row.frequency ? Number.parseInt(row.frequency) : existingQuestion.frequency
          const calculatedAcceptanceRate = calculateAcceptanceRate(frequency, row.acceptanceRate || null)
          
          const updatedQuestion = await prisma.question.update({
            where: { id: existingQuestion.id },
            data: {
              difficulty: row.difficulty,
              frequency,
              acceptanceRate: calculatedAcceptanceRate || existingQuestion.acceptanceRate,
              link: row.link || existingQuestion.link,
              topics: mergedTopics,
              companies: mergedCompanies,
              updatedAt: new Date(),
            },
          })

          const newData = {
            title: updatedQuestion.title,
            difficulty: updatedQuestion.difficulty,
            frequency: updatedQuestion.frequency,
            acceptanceRate: updatedQuestion.acceptanceRate,
            link: updatedQuestion.link,
            topics: updatedQuestion.topics,
            companies: updatedQuestion.companies,
          }

          // Log the change
          await prisma.changeLog.create({
            data: {
              questionId: existingQuestion.id,
              type: "UPDATED",
              changes: {
                old: oldData,
                new: newData,
                csvRow: i + 1,
              },
            },
          })

          results.updated++
        } else {
          // Create new question
          const frequency = row.frequency ? Number.parseInt(row.frequency) : null
          const calculatedAcceptanceRate = calculateAcceptanceRate(frequency, row.acceptanceRate || null)
          
          const newQuestion = await prisma.question.create({
            data: {
              title: row.title.trim(),
              difficulty: row.difficulty,
              frequency,
              acceptanceRate: calculatedAcceptanceRate,
              link: row.link || null,
              topics,
              companies,
            },
          })

          // Log the change
          await prisma.changeLog.create({
            data: {
              questionId: newQuestion.id,
              type: "NEW",
              changes: {
                new: {
                  title: newQuestion.title,
                  difficulty: newQuestion.difficulty,
                  frequency: newQuestion.frequency,
                  acceptanceRate: newQuestion.acceptanceRate,
                  link: newQuestion.link,
                  topics: newQuestion.topics,
                  companies: newQuestion.companies,
                },
                csvRow: i + 1,
              },
            },
          })

          results.created++
        }

        results.processed++
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error)
        results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    // Invalidate questions cache after successful upload
    if (results.processed > 0) {
      invalidateQuestionsCache()
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${results.processed} rows: ${results.created} created, ${results.updated} updated`,
    })
  } catch (error) {
    console.error("CSV upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
