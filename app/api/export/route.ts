import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx"
import { jsPDF } from "jspdf"
import { getServerSession } from "next-auth"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { type, format, options } = await request.json()

    if (!type || !format) {
      return NextResponse.json({ error: "Export type and format are required" }, { status: 400 })
    }

    let data: any = {}

    // Fetch data based on export type
    switch (type) {
      case "solved-problems":
        data = await getSolvedProblems((session.user as any).id)
        break
      case "all-notes":
        data = await getAllNotes((session.user as any).id)
        break
      case "selected-notes":
        if (!options?.noteIds) {
          return NextResponse.json({ error: "Note IDs required for selected notes export" }, { status: 400 })
        }
        data = await getSelectedNotes((session.user as any).id, options.noteIds)
        break
      case "interview-prep":
        data = await getInterviewPrepData((session.user as any).id, options)
        break
      default:
        return NextResponse.json({ error: "Invalid export type" }, { status: 400 })
    }

    // Generate export based on format
    let exportData: Buffer
    let contentType: string
    let filename: string

    switch (format) {
      case "pdf":
        exportData = await generatePDF(data, type)
        contentType = "application/pdf"
        filename = `${type}-${Date.now()}.pdf`
        break
      case "docx":
        exportData = await generateDOCX(data, type)
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename = `${type}-${Date.now()}.docx`
        break
      case "pptx":
        exportData = await generatePPTX(data, type)
        contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        filename = `${type}-${Date.now()}.pptx`
        break
      default:
        return NextResponse.json({ error: "Invalid export format" }, { status: 400 })
    }

    return new NextResponse(exportData, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

async function getSolvedProblems(userId: string) {
  return await prisma.question.findMany({
    where: {
      progress: {
        some: {
          userId,
          status: "DONE",
        },
      },
    },
    include: {
      progress: {
        where: { userId },
      },
      notes: {
        where: { userId },
      },
    },
    orderBy: {
      title: "asc",
    },
  })
}

async function getAllNotes(userId: string) {
  return await prisma.userNotes.findMany({
    where: { userId },
    include: {
      question: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  })
}

async function getSelectedNotes(userId: string, noteIds: string[]) {
  return await prisma.userNotes.findMany({
    where: {
      userId,
      id: { in: noteIds },
    },
    include: {
      question: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  })
}

async function getInterviewPrepData(userId: string, options: any) {
  const difficulty = options?.difficulty || ["EASY", "MEDIUM", "HARD"]
  const topics = options?.topics || []

  const where: any = {
    progress: {
      some: {
        userId,
        status: "DONE",
      },
    },
  }

  if (difficulty.length < 3) {
    where.difficulty = { in: difficulty }
  }

  if (topics.length > 0) {
    where.topics = { hasSome: topics }
  }

  return await prisma.question.findMany({
    where,
    include: {
      progress: {
        where: { userId },
      },
      notes: {
        where: { userId },
      },
    },
    orderBy: {
      difficulty: "asc",
    },
    take: options?.limit || 50,
  })
}

async function generatePDF(data: any, type: string): Promise<Buffer> {
  const doc = new jsPDF()
  let yPosition = 20

  // Title
  doc.setFontSize(20)
  doc.text(`CodeCraft - ${type.replace("-", " ").toUpperCase()}`, 20, yPosition)
  yPosition += 20

  // Date
  doc.setFontSize(12)
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition)
  yPosition += 20

  if (type === "solved-problems" || type === "interview-prep") {
    data.forEach((question: any, index: number) => {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      // Question title
      doc.setFontSize(14)
      doc.text(`${index + 1}. ${question.title}`, 20, yPosition)
      yPosition += 10

      // Difficulty and topics
      doc.setFontSize(10)
      doc.text(`Difficulty: ${question.difficulty}`, 25, yPosition)
      yPosition += 7
      doc.text(`Topics: ${question.topics.join(", ")}`, 25, yPosition)
      yPosition += 7

      if (question.link) {
        doc.text(`Link: ${question.link}`, 25, yPosition)
        yPosition += 7
      }

      // Notes if available
      if (question.notes && question.notes.length > 0) {
        doc.text("Notes:", 25, yPosition)
        yPosition += 7
        question.notes.forEach((note: any) => {
          const noteLines = doc.splitTextToSize(note.content.substring(0, 200) + "...", 160)
          noteLines.forEach((line: string) => {
            if (yPosition > 280) {
              doc.addPage()
              yPosition = 20
            }
            doc.text(line, 30, yPosition)
            yPosition += 5
          })
        })
      }

      yPosition += 10
    })
  } else if (type === "all-notes" || type === "selected-notes") {
    data.forEach((note: any, index: number) => {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      // Question title
      doc.setFontSize(14)
      doc.text(`${index + 1}. ${note.question.title}`, 20, yPosition)
      yPosition += 10

      // Note content
      doc.setFontSize(10)
      const noteLines = doc.splitTextToSize(note.content, 160)
      noteLines.forEach((line: string) => {
        if (yPosition > 280) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(line, 25, yPosition)
        yPosition += 5
      })

      yPosition += 10
    })
  }

  return Buffer.from(doc.output("arraybuffer"))
}

async function generateDOCX(data: any, type: string): Promise<Buffer> {
  const children: any[] = []

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `CodeCraft - ${type.replace("-", " ").toUpperCase()}`,
          bold: true,
          size: 32,
        }),
      ],
      heading: HeadingLevel.TITLE,
    }),
  )

  // Date
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated on: ${new Date().toLocaleDateString()}`,
          size: 24,
        }),
      ],
    }),
  )

  children.push(new Paragraph({ text: "" })) // Empty line

  if (type === "solved-problems" || type === "interview-prep") {
    data.forEach((question: any, index: number) => {
      // Question title
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. ${question.title}`,
              bold: true,
              size: 28,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
        }),
      )

      // Details
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Difficulty: ${question.difficulty}`, size: 22 })],
        }),
      )

      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Topics: ${question.topics.join(", ")}`, size: 22 })],
        }),
      )

      if (question.link) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `Link: ${question.link}`, size: 22 })],
          }),
        )
      }

      // Notes
      if (question.notes && question.notes.length > 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "Notes:", bold: true, size: 22 })],
          }),
        )

        question.notes.forEach((note: any) => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: note.content, size: 20 })],
            }),
          )
        })
      }

      children.push(new Paragraph({ text: "" })) // Empty line
    })
  }

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  })

  return await Packer.toBuffer(doc)
}

async function generatePPTX(data: any, type: string): Promise<Buffer> {
  // For now, return a simple text file as PPTX generation is complex
  // In a real implementation, you'd use a library like pptxgenjs
  const content = `CodeCraft - ${type.replace("-", " ").toUpperCase()}\n\nGenerated on: ${new Date().toLocaleDateString()}\n\nPowerPoint export feature coming soon...`
  return Buffer.from(content, "utf-8")
}
